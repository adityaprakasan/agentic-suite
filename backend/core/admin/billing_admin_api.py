"""
Admin Billing API
Handles all administrative billing operations: credits, refunds, transactions, 
plan management, and Stripe subscription linking.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Literal
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from core.auth import require_admin, require_super_admin
from core.billing.credit_manager import credit_manager
from core.billing.config import TIERS, get_tier_by_name, get_tier_by_price_id
from core.services.supabase import DBConnection
from core.utils.logger import logger
from core.utils.cache import Cache
import stripe
from core.utils.config import config

router = APIRouter(prefix="/admin/billing", tags=["admin-billing"])

# ============================================================================
# MODELS
# ============================================================================

class CreditAdjustmentRequest(BaseModel):
    account_id: str
    amount: Decimal = Field(..., description="Amount to add (positive) or remove (negative)")
    reason: str
    is_expiring: bool = Field(True, description="Whether credits expire at end of billing cycle")
    notify_user: bool = True

class RefundRequest(BaseModel):
    account_id: str
    amount: Decimal
    reason: str
    is_expiring: bool = Field(False, description="Refunds typically give non-expiring credits")
    stripe_refund: bool = False
    payment_intent_id: Optional[str] = None

class SetPlanRequest(BaseModel):
    account_id: str
    tier: Literal['tier_basic', 'tier_plus', 'tier_ultra'] = Field(..., description="Target tier")
    reason: str = Field(..., min_length=3, description="Reason for plan change")
    grant_credits: Optional[bool] = Field(None, description="Auto: true for upgrade/new, false for downgrade")
    credit_type: Literal['expiring', 'non_expiring'] = Field('expiring', description="Type of credits to grant")
    billing_period_days: int = Field(30, ge=1, le=365, description="Billing period length")

class LinkSubscriptionRequest(BaseModel):
    account_id: str
    stripe_subscription_id: str = Field(..., description="Stripe subscription ID (sub_xxx)")
    stripe_customer_id: Optional[str] = Field(None, description="Stripe customer ID (cus_xxx) - optional")
    reason: str = Field(..., min_length=3, description="Reason for linking")

class CreateCheckoutLinkRequest(BaseModel):
    account_id: str
    tier: Literal['tier_basic', 'tier_plus', 'tier_ultra'] = Field(..., description="Target tier")
    payer_email: Optional[str] = Field(None, description="Email of the person paying (e.g., boss)")
    return_url: str = Field(..., description="URL to redirect after payment")

# ============================================================================
# CREDIT MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/credits/adjust")
async def adjust_user_credits(
    request: CreditAdjustmentRequest,
    admin: dict = Depends(require_admin)
):
    """Adjust credits for a user (add or remove)."""
    if abs(request.amount) > 1000 and admin.get('role') != 'super_admin':
        raise HTTPException(status_code=403, detail="Adjustments over $1000 require super_admin role")
    
    try:
        if request.amount > 0:
            result = await credit_manager.add_credits(
                account_id=request.account_id,
                amount=request.amount,
                is_expiring=request.is_expiring,
                description=f"Admin adjustment: {request.reason}",
                expires_at=datetime.now(timezone.utc) + timedelta(days=30) if request.is_expiring else None
            )
            if result.get('duplicate_prevented'):
                logger.info(f"[ADMIN] Duplicate credit adjustment prevented for {request.account_id}")
                balance_info = await credit_manager.get_balance(request.account_id)
                return {
                    'success': True,
                    'message': 'Credit adjustment already processed (duplicate prevented)',
                    'new_balance': float(balance_info.get('total', 0)),
                    'adjustment_amount': float(request.amount),
                    'is_expiring': request.is_expiring,
                    'duplicate_prevented': True
                }
            else:
                new_balance = result.get('total_balance', 0)
        else:
            result = await credit_manager.use_credits(
                account_id=request.account_id,
                amount=abs(request.amount),
                description=f"Admin deduction: {request.reason}"
            )
            if not result['success']:
                raise HTTPException(status_code=400, detail=result.get('error', 'Insufficient balance'))
            new_balance = result['new_total']
        
        db = DBConnection()
        client = await db.client
        await client.table('admin_audit_log').insert({
            'admin_account_id': admin['user_id'],
            'action': 'credit_adjustment',
            'target_account_id': request.account_id,
            'details': {
                'amount': float(request.amount),
                'reason': request.reason,
                'is_expiring': request.is_expiring,
                'new_balance': float(new_balance)
            }
        }).execute()
        
        logger.info(f"[ADMIN] Admin {admin['user_id']} adjusted credits for {request.account_id} by {request.amount} (expiring: {request.is_expiring})")
        
        return {
            'success': True,
            'new_balance': float(new_balance),
            'adjustment_amount': float(request.amount),
            'is_expiring': request.is_expiring
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to adjust credits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refund")
async def process_refund(
    request: RefundRequest,
    admin: dict = Depends(require_super_admin)
):
    """Process a refund for a user."""
    result = await credit_manager.add_credits(
        account_id=request.account_id,
        amount=request.amount,
        is_expiring=request.is_expiring,
        description=f"Refund: {request.reason}",
        type='admin_grant'
    )
    
    if result.get('duplicate_prevented'):
        balance_info = await credit_manager.get_balance(request.account_id)
        new_balance = balance_info.get('total_balance', 0)
    else:
        new_balance = result.get('total_balance', 0)
    
    refund_id = None
    if request.stripe_refund and request.payment_intent_id:
        try:
            stripe.api_key = config.STRIPE_SECRET_KEY
            refund = await stripe.Refund.create_async(
                payment_intent=request.payment_intent_id,
                amount=int(request.amount * 100),
                reason='requested_by_customer',
                metadata={'admin_account_id': admin['user_id'], 'reason': request.reason}
            )
            refund_id = refund.id
        except Exception as e:
            logger.error(f"Stripe refund failed: {e}")
    
    logger.info(f"[ADMIN] Admin {admin['user_id']} processed refund of {request.amount} for user {request.account_id} (expiring: {request.is_expiring})")
    
    return {
        'success': True,
        'new_balance': float(new_balance),
        'refund_amount': float(request.amount),
        'stripe_refund_id': refund_id,
        'is_expiring': request.is_expiring
    }

# ============================================================================
# BILLING INFO & TRANSACTIONS ENDPOINTS
# ============================================================================

@router.get("/user/{account_id}/summary")
async def get_user_billing_summary(
    account_id: str,
    admin: dict = Depends(require_admin)
):
    """Get billing summary for a specific user."""
    balance_info = await credit_manager.get_balance(account_id)
    db = DBConnection()
    client = await db.client
    
    transactions_result = await client.from_('credit_ledger').select('*').eq('account_id', account_id).order('created_at', desc=True).limit(20).execute()
    
    subscription_result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('account_id', account_id).order('created', desc=True).limit(1).execute()
    
    subscription = subscription_result.data[0] if subscription_result.data else None
    
    return {
        'account_id': account_id,
        'credit_account': balance_info,
        'subscription': subscription,
        'recent_transactions': transactions_result.data or []
    }

@router.get("/user/{account_id}/transactions")
async def get_user_transactions(
    account_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    type_filter: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    try:
        from core.utils.pagination import PaginationService, PaginationParams
        
        db = DBConnection()
        client = await db.client
        
        pagination_params = PaginationParams(page=page, page_size=page_size)
        
        # Get total count
        count_query = client.from_('credit_ledger').select('*', count='exact').eq('account_id', account_id)
        if type_filter:
            count_query = count_query.eq('type', type_filter)
        count_result = await count_query.execute()
        total_count = count_result.count or 0
        
        # Get paginated transactions
        offset = (pagination_params.page - 1) * pagination_params.page_size
        transactions_query = client.from_('credit_ledger').select('*').eq('account_id', account_id)
        
        if type_filter:
            transactions_query = transactions_query.eq('type', type_filter)
            
        transactions_result = await transactions_query.order('created_at', desc=True).range(
            offset, offset + pagination_params.page_size - 1
        ).execute()
        
        # Format transactions
        transactions = []
        for tx in transactions_result.data or []:
            transactions.append({
                'id': tx.get('id'),
                'created_at': tx.get('created_at'),
                'amount': float(tx.get('amount', 0)),
                'balance_after': float(tx.get('balance_after', 0)),
                'type': tx.get('type'),
                'description': tx.get('description'),
                'is_expiring': tx.get('is_expiring', False),
                'expires_at': tx.get('expires_at'),
                'metadata': tx.get('metadata', {})
            })
        
        return await PaginationService.paginate_with_total_count(
            items=transactions,
            total_count=total_count,
            params=pagination_params
        )
        
    except Exception as e:
        logger.error(f"Failed to get user transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions")

# ============================================================================
# PLAN MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/set-plan")
async def admin_set_user_plan(
    request: SetPlanRequest,
    admin: dict = Depends(require_admin)
):
    """
    Manually set a user's subscription plan.
    
    Use cases:
    - Enterprise onboarding where boss pays separately
    - Upgrading/downgrading users manually
    - Reactivating cancelled accounts
    
    Safeguards:
    - Same tier rejection: Cannot set user to their current tier
    - 24-hour cooldown: Block if credits granted for same tier within 24h
    - Downgrade = no credits: Downgrades only change tier
    - Audit trail: All actions logged
    """
    try:
        # Validate tier exists
        new_tier = get_tier_by_name(request.tier)
        if not new_tier:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {request.tier}")
        
        db = DBConnection()
        client = await db.client
        
        # SAFEGUARD 0: Verify account exists in basejump.accounts
        account_check = await client.schema('basejump').from_('accounts').select('id').eq('id', request.account_id).execute()
        if not account_check.data:
            raise HTTPException(status_code=404, detail=f"Account {request.account_id} not found")
        
        # Get current account state
        account_result = await client.from_('credit_accounts').select(
            'tier, last_grant_date, stripe_subscription_id, balance, expiring_credits, non_expiring_credits'
        ).eq('account_id', request.account_id).execute()
        
        now = datetime.now(timezone.utc)
        current_tier_name = 'none'
        current_tier = TIERS.get('none')
        last_grant_date = None
        has_account = False
        
        if account_result.data and len(account_result.data) > 0:
            has_account = True
            account_data = account_result.data[0]
            # Handle NULL tier - treat as 'none'
            current_tier_name = account_data.get('tier') or 'none'
            current_tier = get_tier_by_name(current_tier_name) or TIERS.get('none')
            last_grant_str = account_data.get('last_grant_date')
            if last_grant_str:
                try:
                    last_grant_date = datetime.fromisoformat(last_grant_str.replace('Z', '+00:00'))
                except:
                    pass
        
        # SAFEGUARD 1: Same tier rejection
        if current_tier_name == request.tier:
            raise HTTPException(
                status_code=400, 
                detail=f"User is already on {new_tier.display_name} plan. Cannot set to the same tier."
            )
        
        # SAFEGUARD 2: 24-hour cooldown check (for same tier re-grants)
        if last_grant_date:
            hours_since_grant = (now - last_grant_date).total_seconds() / 3600
            # Only block if trying to grant to a tier they were recently on
            if hours_since_grant < 24:
                # Check credit ledger for recent grant to this tier
                recent_grants = await client.from_('credit_ledger').select('id, description').eq(
                    'account_id', request.account_id
                ).gte('created_at', (now - timedelta(hours=24)).isoformat()).execute()
                
                for grant in (recent_grants.data or []):
                    desc = grant.get('description', '')
                    if new_tier.display_name in desc or request.tier in desc:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Credits were granted for this tier within the last 24 hours ({hours_since_grant:.1f}h ago). Please wait before granting again."
                        )
        
        # SAFEGUARD 3: Determine if this is an upgrade, downgrade, or new subscription
        current_credits = float(current_tier.monthly_credits) if current_tier else 0
        new_credits = float(new_tier.monthly_credits)
        
        is_upgrade = new_credits > current_credits
        is_new = current_tier_name in ['none', 'free']
        is_downgrade = new_credits < current_credits and not is_new
        
        # Determine whether to grant credits
        should_grant_credits = request.grant_credits
        if should_grant_credits is None:
            # Auto-determine: grant for upgrade or new, not for downgrade
            should_grant_credits = is_upgrade or is_new
        
        # For downgrades, never grant credits regardless of request
        if is_downgrade:
            should_grant_credits = False
        
        # Calculate billing dates
        billing_anchor = now
        next_grant = now + timedelta(days=request.billing_period_days)
        expires_at = next_grant if request.credit_type == 'expiring' else None
        
        credits_granted = Decimal('0')
        
        # IMPORTANT: Create or update the account FIRST, then add credits
        # This ensures add_credits() finds an existing account with correct tier
        if has_account:
            # Update existing account with new tier and billing info
            update_data = {
                'tier': request.tier,
                'billing_cycle_anchor': billing_anchor.isoformat(),
                'next_credit_grant': next_grant.isoformat(),
                'updated_at': now.isoformat()
            }
            if should_grant_credits:
                update_data['last_grant_date'] = now.isoformat()
            await client.from_('credit_accounts').update(update_data).eq('account_id', request.account_id).execute()
        else:
            # Create new credit account with correct tier BEFORE adding credits
            insert_data = {
                'account_id': request.account_id,
                'tier': request.tier,
                'balance': 0,
                'expiring_credits': 0,
                'non_expiring_credits': 0,
                'billing_cycle_anchor': billing_anchor.isoformat(),
                'next_credit_grant': next_grant.isoformat(),
                'last_grant_date': now.isoformat() if should_grant_credits else None
            }
            await client.from_('credit_accounts').insert(insert_data).execute()
        
        # Now grant credits if needed - account definitely exists at this point
        if should_grant_credits:
            credits_granted = new_tier.monthly_credits
            
            credit_result = await credit_manager.add_credits(
                account_id=request.account_id,
                amount=credits_granted,
                is_expiring=(request.credit_type == 'expiring'),
                description=f"Admin plan set: {new_tier.display_name} ({request.reason})",
                expires_at=expires_at,
                type='admin_grant'
            )
            
            if credit_result.get('duplicate_prevented'):
                logger.warning(f"[ADMIN SET PLAN] Duplicate credit grant prevented for {request.account_id}")
        
        # Invalidate caches
        await Cache.invalidate(f"credit_balance:{request.account_id}")
        await Cache.invalidate(f"credit_summary:{request.account_id}")
        await Cache.invalidate(f"subscription_tier:{request.account_id}")
        
        # Log to audit
        try:
            await client.table('admin_audit_log').insert({
                'admin_account_id': admin['user_id'],
                'action': 'set_plan',
                'target_account_id': request.account_id,
                'details': {
                    'previous_tier': current_tier_name,
                    'new_tier': request.tier,
                    'reason': request.reason,
                    'credits_granted': float(credits_granted),
                    'credit_type': request.credit_type,
                    'is_upgrade': is_upgrade,
                    'is_downgrade': is_downgrade,
                    'is_new': is_new
                }
            }).execute()
        except Exception as audit_error:
            logger.warning(f"[ADMIN SET PLAN] Failed to write audit log: {audit_error}")
        
        action_type = "upgraded to" if is_upgrade else ("downgraded to" if is_downgrade else "set to")
        logger.info(f"[ADMIN SET PLAN] Admin {admin['user_id']} {action_type} {request.tier} for {request.account_id}. Credits granted: ${credits_granted}")
        
        # Get updated balance
        balance_info = await credit_manager.get_balance(request.account_id)
        
        return {
            'success': True,
            'message': f"User {action_type} {new_tier.display_name} plan",
            'account_id': request.account_id,
            'previous_tier': current_tier_name,
            'new_tier': request.tier,
            'credits_granted': float(credits_granted),
            'credit_type': request.credit_type if should_grant_credits else None,
            'current_balance': balance_info.get('total', 0),
            'billing_cycle_anchor': billing_anchor.isoformat(),
            'next_credit_grant': next_grant.isoformat(),
            'is_upgrade': is_upgrade,
            'is_downgrade': is_downgrade
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ADMIN SET PLAN] Failed to set plan: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to set plan: {str(e)}")


@router.post("/link-subscription")
async def admin_link_subscription(
    request: LinkSubscriptionRequest,
    admin: dict = Depends(require_admin)
):
    """
    Link an existing Stripe subscription to a user account.
    
    Use cases:
    - Third party (boss) paid via generic payment link
    - Subscription created outside normal flow
    - Reconnecting orphaned subscriptions
    
    Safeguards:
    - Verifies subscription exists in Stripe
    - Same tier = no credits (just links)
    - Higher tier = upgrade with credits
    - Syncs billing dates with Stripe
    """
    try:
        stripe.api_key = config.STRIPE_SECRET_KEY
        
        # Verify subscription exists in Stripe
        try:
            subscription = await stripe.Subscription.retrieve_async(
                request.stripe_subscription_id,
                expand=['items.data.price']
            )
        except stripe.error.InvalidRequestError:
            raise HTTPException(status_code=404, detail=f"Subscription {request.stripe_subscription_id} not found in Stripe")
        
        if subscription.status not in ['active', 'trialing']:
            raise HTTPException(
                status_code=400, 
                detail=f"Subscription status is '{subscription.status}'. Only active or trialing subscriptions can be linked."
            )
        
        # Get tier from subscription price
        price_id = subscription['items']['data'][0]['price']['id'] if subscription.get('items') else None
        if not price_id:
            raise HTTPException(status_code=400, detail="Could not determine price from subscription")
        
        subscription_tier = get_tier_by_price_id(price_id)
        if not subscription_tier:
            raise HTTPException(status_code=400, detail=f"Unknown price ID: {price_id}. This tier is not configured.")
        
        db = DBConnection()
        client = await db.client
        
        # Verify account exists in basejump.accounts
        account_check = await client.schema('basejump').from_('accounts').select('id').eq('id', request.account_id).execute()
        if not account_check.data:
            raise HTTPException(status_code=404, detail=f"Account {request.account_id} not found")
        
        # Get current account state
        account_result = await client.from_('credit_accounts').select(
            'tier, stripe_subscription_id, balance, last_grant_date'
        ).eq('account_id', request.account_id).execute()
        
        current_tier_name = 'none'
        current_tier = TIERS.get('none')
        existing_subscription_id = None
        
        if account_result.data and len(account_result.data) > 0:
            account_data = account_result.data[0]
            # Handle NULL tier - treat as 'none'
            current_tier_name = account_data.get('tier') or 'none'
            current_tier = get_tier_by_name(current_tier_name) or TIERS.get('none')
            existing_subscription_id = account_data.get('stripe_subscription_id')
        
        # Warn if replacing existing subscription
        if existing_subscription_id and existing_subscription_id != request.stripe_subscription_id:
            logger.warning(f"[ADMIN LINK] Replacing subscription {existing_subscription_id} with {request.stripe_subscription_id} for {request.account_id}")
        
        # Determine credit grant
        current_credits = float(current_tier.monthly_credits) if current_tier else 0
        subscription_credits = float(subscription_tier.monthly_credits)
        
        is_same_tier = current_tier_name == subscription_tier.name
        is_upgrade = subscription_credits > current_credits and not is_same_tier
        
        credits_granted = Decimal('0')
        now = datetime.now(timezone.utc)
        
        # ALWAYS link Stripe customer (from request or subscription) for renewals to work
        customer_id = request.stripe_customer_id or subscription.get('customer')
        if customer_id:
            # Check if customer already linked
            existing_customer = await client.schema('basejump').from_('billing_customers').select(
                'id, account_id'
            ).eq('id', customer_id).execute()
            
            if existing_customer.data:
                if existing_customer.data[0]['account_id'] != request.account_id:
                    # Customer linked to different account - this is a problem
                    raise HTTPException(
                        status_code=400,
                        detail=f"Customer {customer_id} is already linked to a different account"
                    )
            else:
                # Create new customer link - CRITICAL for renewal webhooks to work
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': customer_id,
                    'account_id': request.account_id,
                    'email': subscription.get('customer_email') or None,
                    'active': True,
                    'provider': 'stripe'
                }).execute()
                logger.info(f"[ADMIN LINK] Created billing_customers entry for {customer_id} -> {request.account_id}")
        
        # Calculate billing dates from Stripe subscription
        billing_anchor = datetime.fromtimestamp(subscription['current_period_start'], tz=timezone.utc)
        next_grant = datetime.fromtimestamp(subscription['current_period_end'], tz=timezone.utc)
        
        # IMPORTANT: Create or update the account FIRST, then add credits
        # This ensures add_credits() finds an existing account
        update_data = {
            'tier': subscription_tier.name,
            'stripe_subscription_id': request.stripe_subscription_id,
            'billing_cycle_anchor': billing_anchor.isoformat(),
            'next_credit_grant': next_grant.isoformat(),
            'updated_at': now.isoformat()
        }
        
        if is_upgrade:
            update_data['last_grant_date'] = now.isoformat()
        
        if account_result.data:
            await client.from_('credit_accounts').update(update_data).eq('account_id', request.account_id).execute()
        else:
            # Create new credit account BEFORE adding credits
            insert_data = {
                'account_id': request.account_id,
                **update_data,
                'balance': 0,
                'expiring_credits': 0,
                'non_expiring_credits': 0
            }
            await client.from_('credit_accounts').insert(insert_data).execute()
        
        # Now grant credits if this is an upgrade - account definitely exists at this point
        if is_upgrade:
            credits_granted = subscription_tier.monthly_credits
            expires_at = next_grant
            
            await credit_manager.add_credits(
                account_id=request.account_id,
                amount=credits_granted,
                is_expiring=True,
                description=f"Admin link: Upgrade to {subscription_tier.display_name} ({request.reason})",
                expires_at=expires_at,
                type='admin_grant'
            )
        
        # Invalidate caches
        await Cache.invalidate(f"credit_balance:{request.account_id}")
        await Cache.invalidate(f"credit_summary:{request.account_id}")
        await Cache.invalidate(f"subscription_tier:{request.account_id}")
        
        # Log to audit
        try:
            await client.table('admin_audit_log').insert({
                'admin_account_id': admin['user_id'],
                'action': 'link_subscription',
                'target_account_id': request.account_id,
                'details': {
                    'stripe_subscription_id': request.stripe_subscription_id,
                    'stripe_customer_id': customer_id,
                    'previous_tier': current_tier_name,
                    'subscription_tier': subscription_tier.name,
                    'reason': request.reason,
                    'credits_granted': float(credits_granted),
                    'is_upgrade': is_upgrade,
                    'is_same_tier': is_same_tier,
                    'previous_subscription_id': existing_subscription_id
                }
            }).execute()
        except Exception as audit_error:
            logger.warning(f"[ADMIN LINK] Failed to write audit log: {audit_error}")
        
        logger.info(f"[ADMIN LINK] Admin {admin['user_id']} linked subscription {request.stripe_subscription_id} to {request.account_id}. Tier: {subscription_tier.name}, Credits: ${credits_granted}")
        
        balance_info = await credit_manager.get_balance(request.account_id)
        
        return {
            'success': True,
            'message': f"Subscription linked successfully" + (f" - Upgraded to {subscription_tier.display_name}" if is_upgrade else " - No credits granted (same tier)"),
            'account_id': request.account_id,
            'stripe_subscription_id': request.stripe_subscription_id,
            'stripe_customer_id': customer_id,  # Return the actual customer ID that was linked
            'previous_tier': current_tier_name,
            'subscription_tier': subscription_tier.name,
            'credits_granted': float(credits_granted),
            'current_balance': balance_info.get('total', 0),
            'billing_cycle_anchor': billing_anchor.isoformat(),
            'next_credit_grant': next_grant.isoformat(),
            'is_upgrade': is_upgrade,
            'is_same_tier': is_same_tier
        }
        
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        logger.error(f"[ADMIN LINK] Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"[ADMIN LINK] Failed to link subscription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to link subscription: {str(e)}")


@router.post("/create-checkout-link")
async def admin_create_checkout_link(
    request: CreateCheckoutLinkRequest,
    admin: dict = Depends(require_admin)
):
    """
    Create a Stripe checkout link for third-party payment.
    
    The link will have the account_id in metadata, so when the payer completes
    checkout, the webhooks will automatically link the subscription to the user.
    
    Use cases:
    - Boss paying for employee's subscription
    - Company paying for team member
    - Any third-party payment scenario
    """
    try:
        stripe.api_key = config.STRIPE_SECRET_KEY
        
        # Validate tier exists
        tier = get_tier_by_name(request.tier)
        if not tier:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {request.tier}")
        
        if not tier.price_ids:
            raise HTTPException(status_code=400, detail=f"No price configured for tier: {request.tier}")
        
        # Use the first (monthly) price ID
        price_id = tier.price_ids[0]
        
        db = DBConnection()
        client = await db.client
        
        # Verify account exists
        account_result = await client.schema('basejump').from_('accounts').select('id').eq('id', request.account_id).execute()
        if not account_result.data:
            raise HTTPException(status_code=404, detail=f"Account {request.account_id} not found")
        
        # Create checkout session
        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{'price': price_id, 'quantity': 1}],
            'mode': 'subscription',
            'success_url': request.return_url + ('?' if '?' not in request.return_url else '&') + 'checkout=success',
            'cancel_url': request.return_url + ('?' if '?' not in request.return_url else '&') + 'checkout=cancelled',
            'subscription_data': {
                'metadata': {
                    'account_id': request.account_id,
                    'account_type': 'personal',
                    'admin_created': 'true',
                    'admin_id': admin['user_id'],
                    'third_party_payment': 'true'
                }
            },
            'metadata': {
                'account_id': request.account_id,
                'admin_created': 'true'
            }
        }
        
        # Add customer email if provided (pre-fills checkout form)
        if request.payer_email:
            session_params['customer_email'] = request.payer_email
        
        session = await stripe.checkout.Session.create_async(**session_params)
        
        # Log to audit
        try:
            await client.table('admin_audit_log').insert({
                'admin_account_id': admin['user_id'],
                'action': 'create_checkout_link',
                'target_account_id': request.account_id,
                'details': {
                    'tier': request.tier,
                    'price_id': price_id,
                    'payer_email': request.payer_email,
                    'checkout_session_id': session.id
                }
            }).execute()
        except Exception as audit_error:
            logger.warning(f"[ADMIN CHECKOUT] Failed to write audit log: {audit_error}")
        
        logger.info(f"[ADMIN CHECKOUT] Admin {admin['user_id']} created checkout link for {request.account_id} ({tier.display_name})")
        
        return {
            'success': True,
            'checkout_url': session.url,
            'checkout_session_id': session.id,
            'account_id': request.account_id,
            'tier': request.tier,
            'tier_display_name': tier.display_name,
            'monthly_credits': float(tier.monthly_credits),
            'payer_email': request.payer_email,
            'expires_at': datetime.fromtimestamp(session.expires_at, tz=timezone.utc).isoformat() if session.expires_at else None
        }
        
    except HTTPException:
        raise
    except stripe.error.StripeError as e:
        logger.error(f"[ADMIN CHECKOUT] Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"[ADMIN CHECKOUT] Failed to create checkout link: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create checkout link: {str(e)}")


@router.get("/tiers")
async def get_available_tiers(
    admin: dict = Depends(require_admin)
):
    """Get list of available tiers for admin plan management."""
    available_tiers = []
    for tier_name in ['tier_basic', 'tier_plus', 'tier_ultra']:
        tier = TIERS.get(tier_name)
        if tier:
            available_tiers.append({
                'name': tier.name,
                'display_name': tier.display_name,
                'monthly_credits': float(tier.monthly_credits),
                'project_limit': tier.project_limit,
                'can_purchase_credits': tier.can_purchase_credits
            })
    return {'tiers': available_tiers}

