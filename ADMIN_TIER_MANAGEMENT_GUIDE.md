# Admin Tier Management Guide

## 🎉 Feature Complete!

You now have a complete admin portal for managing user subscription tiers without needing SQL. This guide shows you exactly how to onboard your user today and handle the boss's payment when it arrives.

---

## 📋 Quick Start: Onboarding Your User Today

### Step 1: Find the User in Admin Portal

1. Navigate to `/admin/billing` in your browser
2. Search for the user's email in the search bar
3. Click on their row to open the user details dialog

### Step 2: Set Them to Ultra Plan

1. In the user details dialog, click the **"Admin Actions"** tab
2. Find the **"Set Subscription Tier"** card (first card)
3. Fill in the form:
   - **Current Tier**: Shows their current tier
   - **New Tier**: Select **"Ultra - $499/month"**
   - **Grant Monthly Credits**: ✅ Keep this checked (gives them $499 credits immediately)
   - **Reason**: Type: `"Manual onboarding - boss paying within 1 week"`
4. Click **"Update Tier"** button
5. ✅ **Done!** She now has Ultra plan access with $499 credits

---

## 💳 When Boss Pays: Two Options

### Option A: Generate Customer-Specific Link (RECOMMENDED)

This is the cleanest approach. Do this NOW before the boss pays:

1. Go back to the user's details dialog → **"Admin Actions"** tab
2. Find the **"Generate Customer Payment Link"** card (second card)
3. Select **"Ultra - $499/month"**
4. Click **"Generate Payment Link"**
5. Copy the generated link using the copy button
6. **Send THIS new link to the boss** (replaces the generic link you sent)

**What happens when boss pays:**
- Stripe webhook automatically links the subscription to her account ✅
- No manual work needed ✅
- Future renewals handled automatically ✅

---

### Option B: Link Existing Subscription Manually

If the boss already paid via the generic link:

1. Go to your **Stripe Dashboard**
2. Find the new subscription under Recent Subscriptions or search by boss's email
3. Copy the **Subscription ID** (starts with `sub_`)
4. Go to user details dialog → **"Admin Actions"** tab
5. Find the **"Link Existing Subscription"** card (third card)
6. Paste the subscription ID
7. Click **"Link Subscription"**
8. ✅ **Done!** Subscription is now linked to her account

---

## 🔍 What Each Card Does

### 1️⃣ Set Subscription Tier

**Purpose:** Manually assign a tier to a user

**Use Cases:**
- Manual onboarding when payment is pending
- Special arrangements or exceptions
- Testing or demo accounts
- Fixing tier mismatches

**What It Does:**
- Updates `credit_accounts.tier` in database
- Optionally grants monthly credits
- Creates audit log entry
- Invalidates caches

### 2️⃣ Generate Customer Payment Link

**Purpose:** Create a payment link pre-linked to the user's account

**Use Cases:**
- Boss/manager paying for employee
- Third-party payer scenarios
- Custom payment arrangements

**Benefits:**
- Webhook automatically links subscription ✅
- Zero manual work when they pay ✅
- Completely reliable ✅

**What It Does:**
- Gets or creates Stripe customer for account
- Generates Stripe Checkout session
- Returns shareable payment URL
- When paid, webhook handles everything automatically

### 3️⃣ Link Existing Subscription

**Purpose:** Connect an existing Stripe subscription to a user account

**Use Cases:**
- Someone paid via generic link
- Subscription was created outside the app
- Need to fix incorrect account linkage
- Migration scenarios

**What It Does:**
- Fetches subscription from Stripe API
- Validates it's active/trialing
- Determines tier from price_id
- Updates database records
- Optionally grants credits

---

## 🔐 Technical Details

### Backend Endpoints

All endpoints require admin authentication:

**POST `/admin/billing/set-tier`**
```json
{
  "account_id": "uuid",
  "tier_name": "tier_ultra",
  "grant_credits": true,
  "reason": "Manual onboarding"
}
```

**POST `/admin/billing/generate-customer-link`**
```json
{
  "account_id": "uuid",
  "tier_name": "tier_ultra"
}
```

**POST `/admin/billing/link-subscription`**
```json
{
  "account_id": "uuid",
  "stripe_subscription_id": "sub_xxxxx",
  "skip_credit_grant": false
}
```

### Database Changes

When you set a tier or link subscription, the system updates:

1. **`credit_accounts` table:**
   - `tier` → New tier name
   - `balance` → Updated with credits (if granted)
   - `stripe_subscription_id` → Linked subscription (if applicable)
   - `billing_cycle_anchor` → Next billing date
   - `next_credit_grant` → When credits renew

2. **`credit_ledger` table:**
   - New entry for granted credits

3. **`basejump.billing_customers` table:**
   - Creates/updates customer record

4. **`basejump.billing_subscriptions` table:**
   - Creates/updates subscription record (when linking)

5. **`admin_audit_log` table:**
   - Records who did what and why

### Audit Trail

Every action is logged with:
- Admin user ID
- Target account ID
- Action type (set_tier, generate_customer_link, link_subscription)
- Timestamp
- Details (old/new tier, amounts, IDs, reason)

---

## 🎯 Your Specific Use Case

For your situation:

**Today:**
```
✅ Set her to Ultra tier
✅ Grant $499 credits
✅ She can start using the platform
```

**This Week (before boss pays):**
```
✅ Generate customer-specific link
✅ Send new link to boss
✅ When boss pays → automatic linkage
```

**Alternative (if boss already paid):**
```
✅ Get subscription ID from Stripe
✅ Use "Link Existing Subscription" 
✅ Manual linkage complete
```

---

## 💡 Tips & Best Practices

1. **Always provide a reason** when setting tiers manually - helps with auditing

2. **Prefer customer-specific links** over generic links - prevents linkage issues

3. **Check current tier** before setting new one - shown in the UI

4. **Grant credits checked by default** - uncheck if already granted separately

5. **Subscription IDs start with `sub_`** - validation checks this

6. **Future renewals are automatic** once subscription is linked

---

## 🐛 Troubleshooting

### "Invalid tier" error
- Make sure you're using: `tier_basic`, `tier_plus`, or `tier_ultra`
- These are the current active tiers

### "Subscription not found" error
- Check the subscription ID is correct
- Verify it exists in your Stripe dashboard
- Ensure you copied the full ID

### "Subscription status is 'canceled'" error
- Can only link active or trialing subscriptions
- Check subscription status in Stripe

### Credits not showing up
- Check if "Grant Monthly Credits" was checked
- View transactions tab to see credit history
- Refresh the page

### Link not working
- Generated links expire after 24 hours
- Generate a new one if needed
- Check success_url and cancel_url if customized

---

## 📊 Monitoring

After any action, you can verify:

1. **User Details → Overview Tab**
   - See updated tier badge
   - Check credit balance

2. **User Details → Transactions Tab**
   - View credit grant entries
   - See ledger history

3. **Stripe Dashboard**
   - Check subscription is linked to correct customer
   - Verify billing cycle dates

---

## 🚀 Next Steps

1. **Onboard your user now** using the "Set Subscription Tier" feature
2. **Generate customer-specific link** and send to boss
3. **When boss pays**, webhook handles everything automatically
4. **Use this for all future** similar situations - no SQL needed!

---

## 📞 Support

If you encounter issues:
- Check the audit logs in your database
- Review the backend logs for error details
- Verify Stripe webhook is working
- Test with a Stripe test mode subscription first

---

**Built with ❤️ for hassle-free user onboarding**

