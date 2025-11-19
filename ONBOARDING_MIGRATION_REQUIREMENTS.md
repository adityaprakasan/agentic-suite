# 🔍 Onboarding Copy - Migration Requirements Analysis

**Date:** November 18, 2025  
**Question:** Do I need to push migrations if I copy the onboarding?

---

## ✅ **SHORT ANSWER: MOSTLY NO (You Already Have Them!)**

You **already have** the critical Suna-related migrations:
- ✅ `20250722034729_default_agent.sql` - Suna agent functions
- ✅ `20250905104000_auto_create_free_tier.sql` - Free tier automation

**BUT** you're missing some optional enhancements.

---

## 📊 **WHAT THE ONBOARDING FLOW DOES**

### **Frontend Flow:**
```
1. User signs up
2. Auth callback checks billing tier
3. Redirects to /setting-up page
4. Page calls: POST /setup/initialize
   ↓
```

### **Backend Flow (`/setup/initialize`):**
```python
# backend copy/core/billing/setup_api.py

1. free_tier_service.auto_subscribe_to_free_tier(account_id)
   ↓
   - Creates Stripe customer (if needed)
   - Creates free tier subscription ($0/month)
   - Updates credit_accounts table
   - Sets tier='free'

2. SunaDefaultAgentService.install_suna_agent_for_user(account_id)
   ↓
   - Creates Suna agent for user
   - Sets metadata: { "is_suna_default": true }
   - Uses existing agents table
   
3. Returns success
```

---

## 🗄️ **DATABASE REQUIREMENTS**

### **Tables Used:**

1. **`agents`** - ✅ You already have this
   - Stores Suna agent
   - Uses `metadata` JSONB field for `is_suna_default: true`

2. **`credit_accounts`** - ✅ You already have this
   - Stores tier and stripe_subscription_id
   - Updated by free tier service

3. **`basejump.billing_customers`** - ✅ You already have this (Basejump schema)
   - Stores Stripe customer ID

4. **`basejump.accounts`** - ✅ You already have this (Basejump schema)
   - Links users to accounts

### **Functions Used:**

All from migration `20250722034729_default_agent.sql`:

```sql
✅ find_suna_default_agent_for_account(UUID) 
   - Finds Suna agent for an account
   - You HAVE this

✅ get_all_suna_default_agents()
   - Lists all Suna agents
   - You HAVE this

✅ count_suna_agents_by_version(TEXT)
   - Stats function
   - You HAVE this

✅ get_suna_default_agent_stats()
   - Stats function
   - You HAVE this

✅ find_suna_agents_needing_update(TEXT)
   - For managing Suna updates
   - You HAVE this
```

---

## 🔍 **MIGRATIONS YOU ALREADY HAVE**

```bash
✅ 20250722034729_default_agent.sql
   - Creates all Suna-related database functions
   - STATUS: IN YOUR REPO ✅

✅ 20250905104000_auto_create_free_tier.sql
   - Free tier automation
   - STATUS: IN YOUR REPO ✅
```

These are the **MAIN** ones needed!

---

## ⚠️ **MIGRATIONS YOU'RE MISSING (For Onboarding)**

From the 17 missing migrations, these are relevant to free tier/billing:

```sql
❌ 20251102072712_enable_free_tier.sql
   - Additional free tier enhancements
   - PROBABLY: Adds free tier limits/configurations

❌ 20251102090935_revert_free_tier_grant.sql
   - Reverts some free tier grant logic
   - PROBABLY: Fixes over-granting of credits

❌ 20251106090733_allow_negative_credits.sql
   - Allows credit_balance to go negative
   - IMPORTANT: Prevents hard stops when credits run out

❌ 20251106184128_tier_downgrade_fields.sql
   - Adds scheduled_tier_change fields
   - For tier downgrades/upgrades

❌ 20251113000000_welcome_email_webhook.sql
   - Sends welcome email automatically
   - Nice-to-have but not critical
```

---

## 🎯 **DO YOU NEED THESE MIGRATIONS?**

### **For Basic Onboarding: NO ❌**

You can copy the onboarding **WITHOUT** new migrations because:

1. ✅ You already have the Suna agent functions
2. ✅ You already have the free tier system
3. ✅ The `agents` table already supports metadata
4. ✅ The `credit_accounts` table already exists

**The onboarding will work with your current schema!**

### **For Advanced Features: MAYBE ⚠️**

You might want these later:

1. **`allow_negative_credits.sql`** ⭐⭐⭐⭐
   - Prevents hard stops when users run out of credits
   - Allows "soft" credit limits
   - **RECOMMENDED** for better UX

2. **`tier_downgrade_fields.sql`** ⭐⭐⭐
   - Enables scheduled tier changes
   - Allows downgrades at end of billing period
   - **RECOMMENDED** if you offer paid tiers

3. **`enable_free_tier.sql` & `revert_free_tier_grant.sql`** ⭐⭐
   - Fine-tunes free tier credit allocation
   - **OPTIONAL** - depends on your credit strategy

4. **`welcome_email_webhook.sql`** ⭐
   - Auto-sends welcome emails
   - **OPTIONAL** - nice UX enhancement

---

## 📋 **WHAT NEEDS TO BE COPIED**

### **Backend Files:**

```python
1. ✅ backend copy/core/billing/setup_api.py
   - The /setup/initialize endpoint
   - REQUIRED

2. ✅ backend copy/core/billing/free_tier_service.py
   - Free tier subscription logic
   - REQUIRED

3. ✅ backend copy/core/utils/ensure_suna.py
   - Helper for Suna installation
   - RECOMMENDED (already does checks)

4. ⚠️ backend copy/core/utils/suna_default_agent_service.py
   - Service for installing Suna
   - CHECK IF YOU ALREADY HAVE THIS
```

### **Frontend Files:**

```typescript
1. ✅ frontend copy/src/app/setting-up/page.tsx
   - The beautiful onboarding page
   - REQUIRED

2. ✅ frontend copy/src/hooks/account/
   - All account hooks
   - REQUIRED (includes useInitializeAccount)

3. ✅ Update: frontend/src/app/auth/callback/route.ts
   - Add billing check logic
   - REQUIRED
```

---

## 🚀 **IMPLEMENTATION PLAN (NO MIGRATIONS NEEDED)**

### **Step 1: Copy Backend Files (10 min)**

```bash
# Copy setup API
cp "backend copy/core/billing/setup_api.py" "backend/core/billing/"

# Copy free tier service (if not exists)
cp "backend copy/core/billing/free_tier_service.py" "backend/core/billing/"

# Copy ensure_suna helper
cp "backend copy/core/utils/ensure_suna.py" "backend/core/utils/"

# Check if you need suna_default_agent_service.py
test -f "backend/core/utils/suna_default_agent_service.py" || \
  cp "backend copy/core/utils/suna_default_agent_service.py" "backend/core/utils/"
```

### **Step 2: Register Setup API (2 min)**

```python
# Edit backend/api.py
# Add after other router imports:

from core.billing.setup_api import router as setup_router
api_router.include_router(setup_router)
```

### **Step 3: Copy Frontend Files (10 min)**

```bash
# Copy setting-up page
cp -r "frontend copy/src/app/setting-up" "frontend/src/app/"

# Copy account hooks
cp -r "frontend copy/src/hooks/account" "frontend/src/hooks/"
```

### **Step 4: Update Auth Callback (5 min)**

Update `frontend/src/app/auth/callback/route.ts` to add billing check.

### **Step 5: Test (10 min)**

1. Sign up with new account
2. Should redirect to /setting-up
3. Should see "Setting Up Your Account"
4. Should get Suna agent
5. Should redirect to dashboard

**Total Time: ~37 minutes**

---

## ⚠️ **OPTIONAL: Add Missing Migrations Later**

If you want the enhanced features:

```bash
# Copy these migrations from backend copy/supabase/migrations/
20251102072712_enable_free_tier.sql
20251102090935_revert_free_tier_grant.sql
20251106090733_allow_negative_credits.sql
20251106184128_tier_downgrade_fields.sql
20251113000000_welcome_email_webhook.sql

# Run them in order
```

**BUT** you can do this LATER. The onboarding will work without them!

---

## ✅ **FINAL ANSWER**

### **Do you need to push migrations?**

**NO - for basic onboarding functionality.**

You already have:
- ✅ Suna agent database functions
- ✅ Free tier tables
- ✅ Credit accounts system

The onboarding will work with your **current database schema**.

### **Recommended (but optional) migrations:**

If you want:
- Negative credit balances → `allow_negative_credits.sql`
- Tier downgrades → `tier_downgrade_fields.sql`
- Welcome emails → `welcome_email_webhook.sql`

**But these can wait!** Copy the onboarding code first, test it, then decide if you need the migrations.

---

## 🎯 **RISK LEVEL**

- **Backend Code Copy:** 🟢 LOW RISK - Just adding new files
- **Frontend Code Copy:** 🟢 LOW RISK - Just adding new pages
- **Auth Callback Update:** 🟡 MEDIUM RISK - Modifying existing auth flow
- **Database Migrations:** 🟢 NOT NEEDED (for basic onboarding)

---

## 💡 **MY RECOMMENDATION**

1. ✅ **Copy all onboarding code** (no migrations needed)
2. ✅ **Test thoroughly** with new signup
3. ⚠️ **Add optional migrations later** if you need advanced features

**Want me to implement this now?**

