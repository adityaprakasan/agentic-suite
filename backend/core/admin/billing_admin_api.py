"""
Admin Billing API
Handles all administrative billing operations: credits, refunds, transactions.
User search has been moved to admin_api.py as it's user-focused, not billing-focused.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from core.auth import require_admin, require_super_admin
from core.billing.credit_manager import credit_manager
from core.services.supabase import DBConnection
from core.utils.logger import logger
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

class SetTierRequest(BaseModel):
    account_id: str
    tier_name: str = Field(..., description="Tier name: tier_basic, tier_plus, or tier_ultra")
    grant_credits: bool = Field(True, description="Whether to grant monthly credits for this tier")
    reason: str = Field(..., description="Reason for manual tier change")

class GenerateCustomerLinkRequest(BaseModel):
    account_id: str
    price_id: Optional[str] = Field(None, description="Stripe price ID (if not provided, uses tier_name)")
    tier_name: Optional[str] = Field(None, description="Tier name to get price_id from")
    success_url: Optional[str] = Field(None, description="Success redirect URL")
    cancel_url: Optional[str] = Field(None, description="Cancel redirect URL")

class LinkSubscriptionRequest(BaseModel):
    account_id: str
    stripe_subscription_id: str = Field(..., description="Stripe subscription ID (sub_xxx)")
    skip_credit_grant: bool = Field(False, description="Skip granting credits if already granted manually")

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
# TIER MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/set-tier")
async def set_user_tier(
    request: SetTierRequest,
    admin: dict = Depends(require_admin)
):
    """
    Manually set a user's subscription tier.
    Used for manual onboarding when payment is pending or special cases.
    """
    try:
        from core.billing.config import TIERS
        from core.utils.cache import Cache
        
        # Validate tier
        tier = TIERS.get(request.tier_name)
        if not tier:
            available_tiers = [k for k in TIERS.keys() if k not in ['none', 'free']]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid tier '{request.tier_name}'. Available: {available_tiers}"
            )
        
        db = DBConnection()
        client = await db.client
        
        # Note: credit_accounts.account_id actually references auth.users(id), not basejump.accounts(id)
        # We need to get the primary_owner_user_id from the basejump.accounts table
        account_result = await client.schema('basejump').from_('accounts').select('primary_owner_user_id').eq('id', request.account_id).execute()
        
        if not account_result.data:
            raise HTTPException(status_code=404, detail="Account not found")
        
        user_id = account_result.data[0]['primary_owner_user_id']
        
        # Check if credit account exists (using user_id, not account_id)
        credit_check = await client.from_('credit_accounts').select('account_id, tier, balance').eq('account_id', user_id).execute()
        
        old_tier = credit_check.data[0]['tier'] if credit_check.data else 'none'
        old_balance = credit_check.data[0]['balance'] if credit_check.data else 0
        
        # Update or create credit account with new tier
        if credit_check.data:
            await client.from_('credit_accounts').update({
                'tier': request.tier_name,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('account_id', user_id).execute()
        else:
            await client.from_('credit_accounts').insert({
                'account_id': user_id,  # This is actually the user_id from auth.users
                'tier': request.tier_name,
                'balance': 0,
                'expiring_credits': 0,
                'non_expiring_credits': 0,
                'trial_status': 'none',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).execute()
        
        new_balance = old_balance
        credits_granted = Decimal('0')
        
        # Grant credits if requested (credit_manager expects account_id which is basejump.accounts.id)
        if request.grant_credits and tier.monthly_credits > 0:
            result = await credit_manager.add_credits(
                account_id=request.account_id,  # credit_manager will handle the user_id lookup
                amount=tier.monthly_credits,
                is_expiring=True,
                description=f"Admin tier grant: {tier.display_name} - {request.reason}",
                expires_at=datetime.now(timezone.utc) + timedelta(days=30),
                type='admin_grant'
            )
            new_balance = result.get('total_balance', old_balance)
            credits_granted = tier.monthly_credits
        
        # Create audit log (table is admin_actions_log, not admin_audit_log)
        await client.table('admin_actions_log').insert({
            'admin_user_id': admin['user_id'],
            'action_type': 'set_tier',
            'target_user_id': user_id,
            'details': {
                'account_id': request.account_id,
                'old_tier': old_tier,
                'new_tier': request.tier_name,
                'credits_granted': float(credits_granted),
                'new_balance': float(new_balance),
                'reason': request.reason
            }
        }).execute()
        
        # Invalidate caches
        await Cache.invalidate(f"subscription_tier:{request.account_id}")
        await Cache.invalidate(f"credit_balance:{request.account_id}")
        await Cache.invalidate(f"credit_summary:{request.account_id}")
        
        logger.info(f"[ADMIN] Admin {admin['user_id']} set tier for {request.account_id}: {old_tier} -> {request.tier_name}, credits: {credits_granted}")
        
        return {
            'success': True,
            'account_id': request.account_id,
            'old_tier': old_tier,
            'new_tier': request.tier_name,
            'tier_display_name': tier.display_name,
            'credits_granted': float(credits_granted),
            'new_balance': float(new_balance),
            'monthly_credits': float(tier.monthly_credits)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to set tier: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-customer-link")
async def generate_customer_payment_link(
    request: GenerateCustomerLinkRequest,
    admin: dict = Depends(require_admin)
):
    """
    Generate a customer-specific Stripe checkout link.
    When the customer pays via this link, the webhook automatically links the subscription.
    """
    try:
        from core.billing.subscription_service import SubscriptionService
        from core.billing.config import TIERS
        
        subscription_service = SubscriptionService()
        
        # Determine price_id
        price_id = request.price_id
        if not price_id and request.tier_name:
            tier = TIERS.get(request.tier_name)
            if not tier or not tier.price_ids:
                raise HTTPException(status_code=400, detail=f"Invalid tier or no price_id found for tier: {request.tier_name}")
            price_id = tier.price_ids[0]  # Use first price_id (monthly by default)
        
        if not price_id:
            raise HTTPException(status_code=400, detail="Must provide either price_id or tier_name")
        
        # Default URLs if not provided (use SUPABASE_URL as base if FRONTEND_URL not available)
        frontend_url = getattr(config, 'FRONTEND_URL', None) or config.SUPABASE_URL.replace('supabase.co', 'vercel.app')
        success_url = request.success_url or f"{frontend_url}/billing?success=true"
        cancel_url = request.cancel_url or f"{frontend_url}/billing?canceled=true"
        
        # Create checkout session
        checkout_session = await subscription_service.create_checkout_session(
            account_id=request.account_id,
            price_id=price_id,
            success_url=success_url,
            cancel_url=cancel_url
        )
        
        db = DBConnection()
        client = await db.client
        
        # Create audit log (table is admin_actions_log, not admin_audit_log)
        await client.table('admin_actions_log').insert({
            'admin_user_id': admin['user_id'],
            'action_type': 'generate_customer_link',
            'target_user_id': request.account_id,
            'details': {
                'price_id': price_id,
                'checkout_session_id': checkout_session.get('session_id'),
                'tier_name': request.tier_name
            }
        }).execute()
        
        logger.info(f"[ADMIN] Admin {admin['user_id']} generated customer link for {request.account_id}, price_id: {price_id}")
        
        return {
            'success': True,
            'checkout_url': checkout_session.get('url'),
            'session_id': checkout_session.get('session_id'),
            'account_id': request.account_id,
            'price_id': price_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate customer link: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/link-subscription")
async def link_stripe_subscription(
    request: LinkSubscriptionRequest,
    admin: dict = Depends(require_admin)
):
    """
    Manually link an existing Stripe subscription to a user account.
    Use this when someone paid via a generic link and you need to associate it with their account.
    """
    try:
        from core.billing.config import get_tier_by_price_id
        from core.utils.cache import Cache
        
        stripe.api_key = config.STRIPE_SECRET_KEY
        
        # Fetch subscription from Stripe
        try:
            subscription = await stripe.Subscription.retrieve_async(
                request.stripe_subscription_id,
                expand=['items.data.price', 'customer']
            )
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Stripe subscription not found: {str(e)}")
        
        # Validate subscription status
        if subscription.status not in ['active', 'trialing']:
            raise HTTPException(
                status_code=400, 
                detail=f"Subscription status is '{subscription.status}'. Can only link 'active' or 'trialing' subscriptions."
            )
        
        # Get price_id and determine tier
        if not subscription.items or not subscription.items.data:
            raise HTTPException(status_code=400, detail="Subscription has no items/price")
        
        price_id = subscription.items.data[0].price.id
        tier_info = get_tier_by_price_id(price_id)
        
        if not tier_info:
            raise HTTPException(status_code=400, detail=f"Could not determine tier from price_id: {price_id}")
        
        db = DBConnection()
        client = await db.client
        
        # Get the primary_owner_user_id from the basejump.accounts table
        account_result = await client.schema('basejump').from_('accounts').select('primary_owner_user_id').eq('id', request.account_id).execute()
        
        if not account_result.data:
            raise HTTPException(status_code=404, detail="Account not found")
        
        user_id = account_result.data[0]['primary_owner_user_id']
        
        # Get or create billing customer
        customer_id = subscription.customer if isinstance(subscription.customer, str) else subscription.customer.id
        
        customer_check = await client.schema('basejump').from_('billing_customers').select('*').eq('id', customer_id).execute()
        
        if not customer_check.data:
            # Create billing customer entry
            customer_email = subscription.customer.email if hasattr(subscription.customer, 'email') else None
            await client.schema('basejump').from_('billing_customers').insert({
                'id': customer_id,
                'account_id': request.account_id,  # This correctly references basejump.accounts(id)
                'email': customer_email,
                'active': True,
                'provider': 'stripe'
            }).execute()
        else:
            # Update to link to this account if different
            await client.schema('basejump').from_('billing_customers').update({
                'account_id': request.account_id
            }).eq('id', customer_id).execute()
        
        # Update credit_accounts (remember: credit_accounts.account_id actually references auth.users)
        billing_anchor = datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc)
        next_grant = datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc)
        
        credit_check = await client.from_('credit_accounts').select('*').eq('account_id', user_id).execute()
        
        update_data = {
            'tier': tier_info.name,
            'stripe_subscription_id': subscription.id,
            'billing_cycle_anchor': billing_anchor.isoformat(),
            'next_credit_grant': next_grant.isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        if credit_check.data:
            await client.from_('credit_accounts').update(update_data).eq('account_id', user_id).execute()
        else:
            update_data['account_id'] = user_id  # This is auth.users(id), not basejump.accounts(id)
            update_data['balance'] = 0
            update_data['expiring_credits'] = 0
            update_data['non_expiring_credits'] = 0
            update_data['trial_status'] = 'trialing' if subscription.status == 'trialing' else 'none'
            update_data['created_at'] = datetime.now(timezone.utc).isoformat()
            await client.from_('credit_accounts').insert(update_data).execute()
        
        # Create or update billing_subscriptions
        billing_sub_data = {
            'id': subscription.id,
            'account_id': request.account_id,
            'billing_customer_id': customer_id,
            'status': subscription.status,
            'price_id': price_id,
            'plan_name': tier_info.display_name,
            'quantity': subscription.items.data[0].quantity if subscription.items.data else 1,
            'cancel_at_period_end': subscription.cancel_at_period_end,
            'current_period_start': billing_anchor,
            'current_period_end': next_grant,
            'created': billing_anchor
        }
        
        sub_check = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('id', subscription.id).execute()
        
        if sub_check.data:
            await client.schema('basejump').from_('billing_subscriptions').update(billing_sub_data).eq('id', subscription.id).execute()
        else:
            await client.schema('basejump').from_('billing_subscriptions').insert(billing_sub_data).execute()
        
        # Grant credits if not skipped (credit_manager expects basejump.accounts.id)
        credits_granted = Decimal('0')
        new_balance = 0
        
        if not request.skip_credit_grant and tier_info.monthly_credits > 0:
            result = await credit_manager.add_credits(
                account_id=request.account_id,  # credit_manager will handle the user_id lookup
                amount=tier_info.monthly_credits,
                is_expiring=True,
                description=f"Subscription linked: {tier_info.display_name}",
                expires_at=next_grant,
                type='tier_grant'
            )
            credits_granted = tier_info.monthly_credits
            new_balance = result.get('total_balance', 0)
        else:
            balance_info = await credit_manager.get_balance(request.account_id)  # credit_manager handles lookup
            new_balance = balance_info.get('total', 0)
        
        # Create audit log (table is admin_actions_log, not admin_audit_log)
        await client.table('admin_actions_log').insert({
            'admin_user_id': admin['user_id'],
            'action_type': 'link_subscription',
            'target_user_id': user_id,
            'details': {
                'account_id': request.account_id,
                'subscription_id': subscription.id,
                'customer_id': customer_id,
                'tier': tier_info.name,
                'price_id': price_id,
                'status': subscription.status,
                'credits_granted': float(credits_granted)
            }
        }).execute()
        
        # Invalidate caches
        await Cache.invalidate(f"subscription_tier:{request.account_id}")
        await Cache.invalidate(f"credit_balance:{request.account_id}")
        await Cache.invalidate(f"credit_summary:{request.account_id}")
        
        logger.info(f"[ADMIN] Admin {admin['user_id']} linked subscription {subscription.id} to account {request.account_id}")
        
        return {
            'success': True,
            'account_id': request.account_id,
            'subscription_id': subscription.id,
            'customer_id': customer_id,
            'tier': tier_info.name,
            'tier_display_name': tier_info.display_name,
            'status': subscription.status,
            'credits_granted': float(credits_granted),
            'new_balance': float(new_balance),
            'current_period_end': next_grant.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to link subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


