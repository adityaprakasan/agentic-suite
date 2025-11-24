# 🔧 Critical Fix: Account ID vs User ID Issue

## ❗ Problem Identified

The `credit_accounts` table has a confusing schema where the column is named `account_id` but it actually references `auth.users(id)`, **NOT** `basejump.accounts(id)`.

### The Schema Confusion:

```sql
-- credit_accounts table (ACTUAL schema)
CREATE TABLE credit_accounts (
    account_id UUID PRIMARY KEY REFERENCES auth.users(id),  -- ⚠️ CONFUSING NAME
    tier VARCHAR(50),
    balance DECIMAL(12, 4),
    ...
);

-- But billing_customers and billing_subscriptions (CORRECT schema)
CREATE TABLE basejump.billing_customers (
    account_id UUID REFERENCES basejump.accounts(id),  -- ✅ CORRECT
    ...
);
```

### Why This Happened:

1. **Originally:** Column was named `user_id` and referenced `auth.users(id)` ✅
2. **Migration 20250908082546:** Renamed `user_id` → `account_id` ✅
3. **Migration 20250908104135:** Updated foreign key constraint BUT still referenced `auth.users(id)` ❌
4. **Result:** Column named `account_id` but points to wrong table 🐛

---

## ✅ Solution Applied

Updated all three admin endpoints to:

1. **Get the user_id first** from `basejump.accounts.primary_owner_user_id`
2. **Use user_id** when querying/updating `credit_accounts` table
3. **Use account_id** when working with other tables (`billing_customers`, `billing_subscriptions`)
4. **Let credit_manager** handle the account_id → user_id conversion internally

### Code Changes:

#### Before (BROKEN):
```python
# This was trying to use basejump.accounts.id directly
credit_check = await client.from_('credit_accounts').select('*').eq('account_id', request.account_id).execute()
```

#### After (FIXED):
```python
# Get the user_id from basejump.accounts first
account_result = await client.schema('basejump').from_('accounts').select('primary_owner_user_id').eq('id', request.account_id).execute()
user_id = account_result.data[0]['primary_owner_user_id']

# Use user_id when working with credit_accounts
credit_check = await client.from_('credit_accounts').select('*').eq('account_id', user_id).execute()
```

---

## 🎯 Affected Endpoints

All three endpoints have been fixed:

### 1. `/admin/billing/set-tier`
- ✅ Now gets `primary_owner_user_id` from `basejump.accounts`
- ✅ Uses `user_id` when querying/updating `credit_accounts`
- ✅ Properly validates account exists

### 2. `/admin/billing/generate-customer-link`
- ✅ Uses existing `SubscriptionService.create_checkout_session` 
- ✅ That service already handles the account_id → user_id mapping correctly
- ✅ No changes needed (was already working)

### 3. `/admin/billing/link-subscription`
- ✅ Now gets `primary_owner_user_id` from `basejump.accounts`
- ✅ Uses `user_id` when querying/updating `credit_accounts`
- ✅ Uses `account_id` correctly for `billing_customers` and `billing_subscriptions`

---

## 📊 Table Relationships (Clarified)

```
basejump.accounts
├── id (UUID) ────────────────┐
│                              │
├── primary_owner_user_id ────┼─────┐
│        │                     │     │
│        │                     │     │
│        ↓                     ↓     ↓
│   auth.users           billing_  billing_
│        │               customers subscriptions
│        │               (refs      (refs
│        │               accounts)  accounts)
│        │
│        ↓
│   credit_accounts
│   (account_id refs auth.users) ⚠️
```

**Key Insight:** 
- `credit_accounts.account_id` = `auth.users.id`
- `billing_customers.account_id` = `basejump.accounts.id`
- `billing_subscriptions.account_id` = `basejump.accounts.id`

They're **different tables** despite the same column name! 🎭

---

## 🧪 Testing After Fix

To verify the fix works:

```bash
# 1. Test set-tier endpoint
curl -X POST https://your-api.com/admin/billing/set-tier \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "<basejump.accounts.id>",
    "tier_name": "tier_ultra",
    "grant_credits": true,
    "reason": "Test fix"
  }'

# Should return 200 OK with tier update details

# 2. Check database
SELECT 
  a.id as account_id,
  a.primary_owner_user_id as user_id,
  ca.tier,
  ca.balance
FROM basejump.accounts a
LEFT JOIN credit_accounts ca ON ca.account_id = a.primary_owner_user_id
WHERE a.id = '<account_id>';

# Should show the updated tier
```

---

## 🔮 Future Recommendation

To prevent future confusion, consider a migration to:

1. **Option A:** Rename `credit_accounts.account_id` → `credit_accounts.user_id` 
   - Pro: Clearer naming
   - Con: Breaking change, need to update all code

2. **Option B:** Add comment/documentation to schema
   - Pro: No code changes
   - Con: Still confusing

3. **Option C:** Migrate foreign key to reference `basejump.accounts(id)`
   - Pro: Consistent with other tables
   - Con: Requires data migration and code updates

For now, the current fix handles the discrepancy correctly with comments in the code.

---

## 📝 Key Takeaways

1. ⚠️ **Column names can be misleading** - always check the actual foreign key constraint
2. ✅ **Migration history matters** - understand what was changed and why
3. 🔍 **Test with real data** - schema issues often only surface in production
4. 📖 **Document quirks** - add comments explaining non-obvious relationships
5. 🧪 **Verify assumptions** - don't assume `account_id` always means the same thing

---

## ✅ Status

**Fixed:** All three admin endpoints now correctly handle the account_id vs user_id distinction
**Tested:** Code compiles successfully
**Ready:** Deploy and test with actual user data

---

**Issue Resolved:** November 24, 2025
**Root Cause:** Schema migration left confusing column naming
**Solution:** Explicit user_id lookup from basejump.accounts

