from typing import Dict, Optional
import stripe
from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger
from .config import FREE_TIER_INITIAL_CREDITS
from core.billing.credit_manager import CreditManager

class FreeTierService:
    def __init__(self):
        self.stripe = stripe
        
    async def auto_subscribe_to_free_tier(self, account_id: str, email: Optional[str] = None) -> Dict:
        db = DBConnection()
        client = await db.client
        
        try:
            logger.info(f"[FREE TIER] Auto-subscribing user {account_id} to free tier")
            
            existing_sub = await client.from_('credit_accounts').select(
                'stripe_subscription_id, tier, balance'
            ).eq('account_id', account_id).execute()
            
            # If user already has subscription, check if they need credits
            if existing_sub.data and len(existing_sub.data) > 0:
                if existing_sub.data[0].get('stripe_subscription_id'):
                    current_balance = existing_sub.data[0].get('balance', 0)
                    # Grant credits if balance is low (existing users who had 0 credits)
                    if current_balance < FREE_TIER_INITIAL_CREDITS:
                        logger.info(f"[FREE TIER] User {account_id} already has subscription but low balance ({current_balance}), granting credits")
                        credit_manager = CreditManager()
                        await credit_manager.add_credits(
                            account_id=account_id,
                            amount=FREE_TIER_INITIAL_CREDITS,
                            is_expiring=True,
                            description='Welcome to Adentic! Free tier initial credits',
                            type='tier_grant'
                        )
                        return {
                            'success': True,
                            'subscription_id': existing_sub.data[0].get('stripe_subscription_id'),
                            'message': 'Credits granted to existing subscription'
                        }
                    else:
                        logger.info(f"[FREE TIER] User {account_id} already has subscription with sufficient credits, skipping")
                        return {'success': False, 'message': 'Already subscribed'}
            
            customer_result = await client.schema('basejump').from_('billing_customers').select(
                'id'
            ).eq('account_id', account_id).execute()
            
            stripe_customer_id = customer_result.data[0]['id'] if customer_result.data and len(customer_result.data) > 0 else None
            
            if not email:
                account_result = await client.schema('basejump').from_('accounts').select(
                    'primary_owner_user_id'
                ).eq('id', account_id).execute()
                
                if account_result.data and len(account_result.data) > 0:
                    user_id = account_result.data[0]['primary_owner_user_id']
                    try:
                        user_result = await client.auth.admin.get_user_by_id(user_id)
                        email = user_result.user.email if user_result and user_result.user else None
                    except:
                        pass
                    
                    if not email:
                        try:
                            email_result = await client.rpc('get_user_email', {'user_id': user_id}).execute()
                            if email_result.data:
                                email = email_result.data
                        except:
                            pass
            
            if not email:
                logger.error(f"[FREE TIER] Could not get email for account {account_id}")
                return {'success': False, 'error': 'Email not found'}
            
            if not stripe_customer_id:
                logger.info(f"[FREE TIER] Creating Stripe customer for {account_id}")
                customer = await self.stripe.Customer.create_async(
                    email=email,
                    metadata={'account_id': account_id},
                    invoice_settings={
                        'default_payment_method': None
                    }
                )
                stripe_customer_id = customer.id
                
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': stripe_customer_id,
                    'account_id': account_id,
                    'email': email
                }).execute()
            
            logger.info(f"[FREE TIER] Creating $0/month subscription for {account_id}")
            subscription = await self.stripe.Subscription.create_async(
                customer=stripe_customer_id,
                items=[{'price': config.STRIPE_FREE_TIER_ID}],
                collection_method='charge_automatically',
                days_until_due=None,
                metadata={
                    'account_id': account_id,
                    'tier': 'free'
                }
            )
            
            # Update credit account with subscription info
            credit_account = await client.from_('credit_accounts').select(
                'balance, account_id'
            ).eq('account_id', account_id).execute()
            
            await client.from_('credit_accounts').update({
                'tier': 'free',
                'stripe_subscription_id': subscription.id
            }).eq('account_id', account_id).execute()
            
            # Grant initial credits if user has 0 or very low balance
            if credit_account.data and len(credit_account.data) > 0:
                current_balance = credit_account.data[0].get('balance', 0)
                if current_balance < FREE_TIER_INITIAL_CREDITS:
                    logger.info(f"[FREE TIER] Granting {FREE_TIER_INITIAL_CREDITS} initial credits to {account_id} (current balance: {current_balance})")
                    credit_manager = CreditManager()
                    await credit_manager.add_credits(
                        account_id=account_id,
                        amount=FREE_TIER_INITIAL_CREDITS,
                        is_expiring=True,
                        description='Welcome to Adentic! Free tier initial credits',
                        type='tier_grant'
                    )
            else:
                # Credit account doesn't exist, create it with initial credits
                logger.info(f"[FREE TIER] Creating credit account with {FREE_TIER_INITIAL_CREDITS} initial credits for {account_id}")
                credit_manager = CreditManager()
                await credit_manager.add_credits(
                    account_id=account_id,
                    amount=FREE_TIER_INITIAL_CREDITS,
                    is_expiring=True,
                    description='Welcome to Adentic! Free tier initial credits',
                    type='tier_grant'
                )
            
            logger.info(f"[FREE TIER] ✅ Successfully created free tier subscription {subscription.id} for {account_id}")
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'customer_id': stripe_customer_id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"[FREE TIER] Stripe error for {account_id}: {e}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"[FREE TIER] Error auto-subscribing {account_id}: {e}")
            return {'success': False, 'error': str(e)}

free_tier_service = FreeTierService()

