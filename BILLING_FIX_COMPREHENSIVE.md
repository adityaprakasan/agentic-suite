# COMPREHENSIVE BILLING FIX - ROOT CAUSE ANALYSIS

## Problem Summary
Billing fails with: `'NoneType' object has no attribute 'get'`

## Root Cause Chain

### 1. `credit_manager.use_credits()` returns None
**Location:** `backend/core/billing/credit_manager.py` lines 279-311

**Bug:** No try-except wrapper around database operations:
```python
# Line 279-299: Database operations without error handling
await client.from_('credit_accounts').update({...}).execute()  # Can fail!
await client.from_('credit_ledger').insert({...}).execute()    # Can fail!
await Cache.invalidate(...)                                    # Can fail!

return {...}  # Never reached if exception occurs
```

**If any operation fails:**
- Exception bubbles up
- Function implicitly returns None
- Calling code crashes

### 2. `billing_integration.deduct_usage()` doesn't check for None
**Location:** `backend/core/billing/billing_integration.py` line 90

```python
result = await credit_manager.use_credits(...)  # Returns None on exception!

if result.get('success'):  # ← CRASHES: NoneType.get() fails!
```

### 3. `thread_manager._handle_billing()` crashes
**Location:** `backend/core/agentpress/thread_manager.py` line 166

```python
if deduct_result.get('success'):  # ← CRASHES: NoneType.get() fails!
```

## THE COMPLETE FIX (3 Files)

### Fix 1: credit_manager.py (CRITICAL)
Wrap database operations in try-except:

```python
# Around line 279-311
try:
    await client.from_('credit_accounts').update({
        'expiring_credits': float(new_expiring),
        'non_expiring_credits': float(new_non_expiring),
        'balance': float(new_total),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }).eq('account_id', account_id).execute()
    
    await client.from_('credit_ledger').insert({
        'account_id': account_id,
        'amount': float(-amount),
        'balance_after': float(new_total),
        'type': 'usage',
        'description': description,
        'reference_id': thread_id or message_id,
        'metadata': {
            'thread_id': thread_id,
            'message_id': message_id,
            'from_expiring': float(amount_from_expiring),
            'from_non_expiring': float(amount_from_non_expiring)
        }
    }).execute()
    
    await Cache.invalidate(f"credit_balance:{account_id}")
    
    return {
        'success': True,
        'amount_deducted': float(amount),
        'from_expiring': float(amount_from_expiring),
        'from_non_expiring': float(amount_from_non_expiring),
        'new_expiring': float(new_expiring),
        'new_non_expiring': float(new_non_expiring),
        'new_total': float(new_total)
    }
except Exception as e:
    logger.error(f"[CREDIT_MANAGER] Database error during credit deduction: {e}", exc_info=True)
    return {
        'success': False,
        'error': f'Database error: {str(e)}',
        'required': float(amount),
        'available': float(current_total)
    }
```

### Fix 2: billing_integration.py (DEFENSIVE)
Add None check after calling credit_manager:

```python
# Around line 82-94
result = await credit_manager.use_credits(
    account_id=account_id,
    amount=cost,
    description=f"{model} usage",
    thread_id=None,
    message_id=message_id
)

# DEFENSIVE: Check for None
if result is None:
    logger.critical(f"🚨 credit_manager.use_credits returned None for account {account_id}!")
    return {
        'success': False,
        'cost': float(cost),
        'error': 'Credit manager returned None - database error likely'
    }

if result.get('success'):
    logger.info(f"[BILLING] Successfully deducted ${cost:.6f}...")
else:
    logger.error(f"[BILLING] Failed to deduct credits...")

return {
    'success': result.get('success', False),
    'cost': float(cost),
    'new_balance': result.get('new_total', 0),
    'from_expiring': result.get('from_expiring', 0),
    'from_non_expiring': result.get('from_non_expiring', 0),
    'transaction_id': result.get('transaction_id')
}
```

### Fix 3: thread_manager.py (DEFENSIVE)
Add None check after billing_integration:

```python
# Around line 156-169
deduct_result = await billing_integration.deduct_usage(...)

# DEFENSIVE: Check for None
if deduct_result is None:
    logger.error(f"billing_integration.deduct_usage returned None!")
    return

if deduct_result.get('success'):
    logger.info(f"Successfully deducted ${deduct_result.get('cost', 0):.6f}")
else:
    logger.error(f"Failed to deduct credits: {deduct_result}")
```

## WHY THIS HAPPENS

Most likely: The database operations at lines 279-299 are throwing exceptions because:
1. **Database connection issue** (network timeout, connection pool exhausted)
2. **Constraint violation** (missing foreign key, invalid data)
3. **Permissions issue** (SERVICE_ROLE_KEY doesn't have INSERT permission)
4. **Race condition** (concurrent updates)

## WHAT TO CHECK IN SUPABASE

```sql
-- Check if atomic_use_credits function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'atomic_use_credits';

-- Check credit_ledger structure
\d credit_ledger

-- Check recent errors (if RLS is enabled, might block inserts)
SELECT * FROM credit_ledger 
WHERE account_id = '0eea7b93-8553-403d-8356-ae1032a316cb'
ORDER BY created_at DESC 
LIMIT 5;
```

## THE MINIMAL FIX

Just add try-except in credit_manager.py around the database operations.
That's it. That's the root cause.

All my other fixes were addressing different symptoms.

