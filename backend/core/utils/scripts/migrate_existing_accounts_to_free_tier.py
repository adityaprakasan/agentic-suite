"""
Script to migrate existing accounts to free tier with initial credits.

This script:
1. Finds all accounts without active subscriptions
2. Creates free tier Stripe subscriptions for them
3. Grants initial free tier credits ($2.00)
4. Installs default Adentic agent if missing

Run with: uv run python -m core.utils.scripts.migrate_existing_accounts_to_free_tier
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_path))

from core.utils.db import DBConnection
from core.billing.free_tier_service import FreeTierService
from core.utils.suna_default_agent_service import SunaDefaultAgentService
from core.billing.config import FREE_TIER_INITIAL_CREDITS
from core.utils.logger import logger
from datetime import datetime, timezone
from decimal import Decimal

async def migrate_accounts():
    """Migrate existing accounts to free tier"""
    db = DBConnection()
    client = await db.client
    
    free_tier_service = FreeTierService()
    agent_service = SunaDefaultAgentService(db)
    
    # Find all personal accounts
    accounts_result = await client.schema('basejump').from_('accounts').select(
        'id, primary_owner_user_id, created_at'
    ).eq('personal_account', True).execute()
    
    if not accounts_result.data:
        logger.info("No personal accounts found")
        return
    
    logger.info(f"Found {len(accounts_result.data)} personal accounts to check")
    
    migrated_count = 0
    skipped_count = 0
    error_count = 0
    
    for account in accounts_result.data:
        account_id = account['id']
        user_id = account['primary_owner_user_id']
        
        try:
            # Check if account already has a subscription
            credit_account_result = await client.from_('credit_accounts').select(
                'tier, stripe_subscription_id, balance'
            ).eq('account_id', account_id).maybe_single().execute()
            
            credit_account = credit_account_result.data if credit_account_result.data else None
            
            # Skip if already has active subscription
            if credit_account and credit_account.get('stripe_subscription_id'):
                logger.debug(f"Account {account_id} already has subscription, skipping")
                skipped_count += 1
                continue
            
            # Check if already has free tier
            if credit_account and credit_account.get('tier') == 'free' and credit_account.get('stripe_subscription_id'):
                logger.debug(f"Account {account_id} already on free tier, skipping")
                skipped_count += 1
                continue
            
            logger.info(f"Migrating account {account_id} to free tier...")
            
            # Get user email for Stripe
            try:
                user_result = await client.auth.admin.get_user_by_id(user_id)
                email = user_result.user.email if user_result and user_result.user else None
            except Exception as e:
                logger.warning(f"Could not get email for user {user_id}: {e}")
                email = None
            
            # Create free tier subscription
            subscription_result = await free_tier_service.auto_subscribe_to_free_tier(account_id, email)
            
            if not subscription_result.get('success'):
                logger.warning(f"Failed to create free tier subscription for {account_id}: {subscription_result.get('message')}")
                error_count += 1
                continue
            
            # Grant initial credits if account doesn't have them
            if not credit_account or Decimal(str(credit_account.get('balance', 0))) < FREE_TIER_INITIAL_CREDITS:
                logger.info(f"Granting initial credits to account {account_id}")
                
                # Get current balance
                current_balance = Decimal('0.00')
                if credit_account:
                    current_balance = Decimal(str(credit_account.get('balance', 0)))
                
                new_balance = current_balance + FREE_TIER_INITIAL_CREDITS
                
                # Update or create credit account
                if credit_account:
                    await client.from_('credit_accounts').update({
                        'balance': str(new_balance),
                        'tier': 'free'
                    }).eq('account_id', account_id).execute()
                else:
                    # Create credit account if it doesn't exist
                    await client.from_('credit_accounts').insert({
                        'account_id': account_id,
                        'balance': str(new_balance),
                        'tier': 'free',
                        'last_grant_date': datetime.now(timezone.utc).isoformat()
                    }).execute()
                
                # Add ledger entry
                await client.from_('credit_ledger').insert({
                    'account_id': account_id,
                    'amount': str(FREE_TIER_INITIAL_CREDITS),
                    'balance_after': str(new_balance),
                    'type': 'tier_grant',
                    'description': 'Welcome to Adentic! Free tier initial credits (migrated)',
                    'created_at': account.get('created_at', datetime.now(timezone.utc).isoformat())
                }).execute()
            
            # Install default agent if missing
            try:
                default_agent = await client.table('agents').select('agent_id').eq(
                    'account_id', account_id
                ).eq('is_default', True).maybe_single().execute()
                
                if not default_agent.data:
                    logger.info(f"Installing default Adentic agent for account {account_id}")
                    await agent_service.install_suna_agent_for_user(account_id)
            except Exception as e:
                logger.warning(f"Could not install default agent for {account_id}: {e}")
            
            migrated_count += 1
            logger.info(f"✅ Successfully migrated account {account_id}")
            
        except Exception as e:
            logger.error(f"❌ Error migrating account {account_id}: {e}", exc_info=True)
            error_count += 1
    
    logger.info("=" * 60)
    logger.info(f"Migration complete!")
    logger.info(f"  ✅ Migrated: {migrated_count}")
    logger.info(f"  ⏭️  Skipped: {skipped_count}")
    logger.info(f"  ❌ Errors: {error_count}")
    logger.info("=" * 60)

if __name__ == "__main__":
    asyncio.run(migrate_accounts())

