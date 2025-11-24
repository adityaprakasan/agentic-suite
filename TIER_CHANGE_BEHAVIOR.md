# Tier Change Behavior - Complete Guide

## Question: What happens when you set one tier, then change to another?

### TL;DR: ✅ Tier changes work correctly. Credits are granted appropriately.

---

## Scenarios & Behavior

### Scenario 1: Set tier for the first time
**Example:** User has no tier → Set to "Ultra"

**What happens:**
1. ✅ `credit_accounts.tier` → `"tier_ultra"`
2. ✅ Grants 2000 Ultra credits (if `grant_credits=true`)
3. ✅ User balance = $20.00
4. ✅ User can start using platform immediately

**UI:** Shows "✅ TIER CHANGE" confirmation with clear message

---

### Scenario 2: Change from one tier to another (Legitimate)
**Example:** User on "Basic" ($5/mo) → Change to "Ultra" ($20/mo)

**What happens:**
1. ✅ `credit_accounts.tier` changes from `"tier_basic"` → `"tier_ultra"`
2. ✅ Grants 2000 Ultra credits (if `grant_credits=true`)
3. ✅ User balance = old_balance + $20.00
4. ✅ **Does NOT remove old Basic credits** (user keeps what they had)

**UI:** Shows confirmation dialog:
```
✅ TIER CHANGE:

Current tier: Basic
New tier: Ultra

This will:
1. Update tier from Basic to Ultra
2. Grant credits for Ultra

Continue?
```

**Backend logic:**
```python
if old_tier == request.tier_name:
    # Same tier - check for duplicates
else:
    # Tier is CHANGING - this is legitimate, allow it
    logger.info(f"Tier change detected: {old_tier} -> {request.tier_name}")
```

**Result:** User gets new tier + credits. Old credits remain. ✅

---

### Scenario 3: Set same tier again (Duplicate - BLOCKED)
**Example:** User on "Ultra" → Try to set "Ultra" again within 10 minutes

**What happens:**
1. ⚠️ Frontend shows warning dialog:
```
⚠️ DUPLICATE WARNING:

User is already on "Ultra".

If you click "OK", they will get ANOTHER set of credits 
on top of their existing balance.

This is usually NOT what you want unless you're manually 
adding a bonus.

Options:
- Click "Cancel" and uncheck "Grant Credits"
- Click "OK" ONLY if you intentionally want to add duplicate credits

Continue?
```

2. ⚠️ Backend checks recent admin actions (last 10 minutes)
3. ❌ If same tier + credits were granted recently → **BLOCKED**
4. ❌ Error: "Tier 'tier_ultra' with credits was already set X minutes ago"

**Result:** Prevents accidental double-clicks and duplicate credit grants ✅

---

### Scenario 4: Set same tier again (After 10 minutes)
**Example:** User on "Ultra" → Set "Ultra" again after 11 minutes

**What happens:**
1. ✅ Allowed (time window expired)
2. ✅ Grants another 2000 credits
3. ✅ User balance = old_balance + $20.00
4. ⚠️ This is intentional (e.g., manual bonus, correction, etc.)

**Use case:** Admin wants to manually add a bonus or correct an issue

---

## Credit Lifecycle

### What happens to existing credits when you change tiers?

**Answer:** Credits are **NEVER removed** when changing tiers. They accumulate.

**Example flow:**
1. User starts with $0
2. Set to Basic (500 credits) → Balance: $5.00
3. Change to Plus (1000 credits) → Balance: $15.00 ($5 + $10)
4. Change to Ultra (2000 credits) → Balance: $35.00 ($15 + $20)

**Why?** 
- Credits are already "purchased" (even if manually granted)
- Removing them would be confusing and unfair
- Expiring credits will naturally expire in 30 days
- If you need to remove credits, use the "Adjust Credits" endpoint with a negative amount

---

## What about recurring subscriptions?

### Manual tier setting is NOT a subscription
When you use "Set Tier", you are:
- ✅ Setting the tier in `credit_accounts.tier`
- ✅ Granting credits ONCE (if enabled)
- ❌ NOT creating a recurring Stripe subscription
- ❌ NOT charging the user's card

### To create a recurring subscription:
You need to either:
1. **Generate Payment Link** (Step 2) and have customer pay
2. **Link Existing Subscription** (Alternative) if they already paid via Stripe

When they pay via Stripe:
- Webhook receives `checkout.session.completed`
- Automatically creates/updates `billing_subscriptions` record
- Automatically grants credits monthly via `subscription.updated` webhook
- Tier is kept in sync automatically

---

## Common Questions

### Q: If I set Ultra, then they pay for Basic via link, what happens?
**A:** 
1. User currently has Ultra tier + 2000 credits (manual)
2. They pay for Basic via Stripe
3. Webhook updates `credit_accounts.tier` → `"tier_basic"`
4. Webhook grants 500 Basic credits (recurring monthly)
5. User now has Basic tier, but balance = 2000 + 500 = 2500 credits

**Warning:** The frontend shows a mismatch warning if you generate a link for a different tier than what they're currently on.

### Q: Can I change tiers multiple times?
**A:** Yes, but with safeguards:
- ✅ Changing to a DIFFERENT tier → Always allowed (with confirmation)
- ⚠️ Setting SAME tier again within 10 minutes → Blocked (duplicate prevention)
- ✅ Setting SAME tier after 10 minutes → Allowed (intentional action)

### Q: What if they already have an active Stripe subscription?
**A:** 
- ❌ You CANNOT use "Set Tier" if they have an active subscription
- ❌ Error: "User already has an active subscription. Cancel their subscription first..."
- ✅ You can use "Link Existing Subscription" to connect a different Stripe sub

### Q: Do tier changes affect billing_subscriptions table?
**A:** 
- Manual tier changes via "Set Tier" → Only updates `credit_accounts.tier`
- Does NOT touch `billing_subscriptions` or `billing_customers`
- Those tables are only updated by Stripe webhooks or "Link Subscription" endpoint

---

## Technical Implementation

### Backend: Duplicate Prevention Logic

```python
if should_grant_credits:
    # CRITICAL: Prevent duplicate grants of the SAME tier within a short window
    # This allows legitimate tier CHANGES (pro -> ultra) but blocks accidental double-clicks
    if old_tier == request.tier_name:
        # Same tier being set again - check if it was VERY recent (last 10 minutes)
        recent_admin_actions = await client.table('admin_actions_log').select('*').eq(
            'target_user_id', user_id
        ).eq('action_type', 'set_tier').gte(
            'created_at', (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        ).execute()
        
        if recent_admin_actions.data:
            last_action = recent_admin_actions.data[0]
            last_tier = last_action.get('details', {}).get('new_tier')
            credits_granted_last = last_action.get('details', {}).get('credits_granted', 0)
            
            if last_tier == request.tier_name and credits_granted_last > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tier '{request.tier_name}' with credits was already set X minutes ago. To prevent accidental duplicates, please wait 10 minutes or uncheck 'Grant Credits' if you only need to update the tier."
                )
    else:
        # Tier is CHANGING (e.g., pro -> ultra) - this is legitimate, allow it
        logger.info(f"Tier change detected: {old_tier} -> {request.tier_name}. Granting new tier credits.")
```

### Frontend: Confirmation Dialogs

**Same tier:**
```javascript
if (user.tier === selectedTier && grantCredits) {
  const confirm = window.confirm(
    `⚠️ DUPLICATE WARNING:\n\n` +
    `User is already on "${currentTierName}".\n\n` +
    `If you click "OK", they will get ANOTHER set of credits...`
  );
  if (!confirm) return;
}
```

**Tier change:**
```javascript
else if (user.tier !== selectedTier && grantCredits) {
  const confirm = window.confirm(
    `✅ TIER CHANGE:\n\n` +
    `Current tier: ${currentTierName}\n` +
    `New tier: ${newTierName}\n\n` +
    `This will:\n` +
    `1. Update tier\n` +
    `2. Grant credits for ${newTierName}\n\n` +
    `Continue?`
  );
  if (!confirm) return;
}
```

---

## Summary

| Scenario | Allowed? | Credits Granted | Notes |
|----------|----------|-----------------|-------|
| First time set tier | ✅ | Yes | Sets tier + grants credits |
| Change tier (Basic → Ultra) | ✅ | Yes | Updates tier + grants new credits |
| Set same tier (<10 min) | ❌ | No | Blocked by duplicate prevention |
| Set same tier (>10 min) | ✅ | Yes | Allowed (intentional action) |
| Has active subscription | ❌ | No | Must cancel subscription first |

**Key principle:** Tier changes are always allowed and correct. Only duplicate grants of the SAME tier are blocked.

---

## Testing Checklist

- [x] Set tier for first time → Works ✅
- [x] Change tier (Basic → Ultra) → Works ✅
- [x] Set same tier again quickly → Blocked ✅
- [x] Set same tier after 10 min → Works ✅
- [x] Try to set tier with active sub → Blocked ✅
- [x] Credits accumulate correctly → Works ✅
- [x] UI shows appropriate confirmations → Works ✅
- [x] Audit log records all changes → Works ✅

---

**Status:** All tier change scenarios work correctly! ✅

