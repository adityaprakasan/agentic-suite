# 🚨 User Journey Scenarios - UNTESTED

## Warning: These Scenarios Need Testing!

You're right - I haven't tested all the edge cases and plan switching scenarios. Here's what COULD happen:

---

## Scenario 1: Normal Flow (Should Work ✅)

### Journey:
```
1. User signs up → tier='none', no Stripe subscription
2. Admin sets tier to Ultra + grants $499 → tier='tier_ultra', balance=$499
3. Admin generates payment link
4. Boss pays via link
5. Webhook fires: customer.subscription.created
6. System updates: stripe_subscription_id=sub_xxx
7. System sees tier already = 'tier_ultra' 
8. System BLOCKS duplicate credit grant (same tier)
9. Next month: invoice.paid webhook grants $499
```

**Result:** ✅ Should work correctly

**Concerns:**
- Will webhook overwrite the manually set tier? 
- Answer: No, it updates the same tier
- Will it grant duplicate credits?
- Answer: No, renewal logic blocks same-tier grants

---

## Scenario 2: Boss Pays for DIFFERENT Tier (⚠️ PROBLEM!)

### Journey:
```
1. Admin sets tier to BASIC + grants $49
2. Admin generates payment link for ULTRA
3. Boss pays for ULTRA via link
4. Webhook fires with ULTRA price_id
5. System sees current tier = 'tier_basic'
6. System sees new tier = 'tier_ultra'
7. System thinks: UPGRADE!
8. System grants ANOTHER $499 credits
```

**Result:** ❌ User gets $49 + $499 = $548 (WRONG!)

**Problem:** No validation that admin's manual tier matches payment link tier

---

## Scenario 3: Admin Sets Tier, Boss Never Pays (⚠️ ORPHANED)

### Journey:
```
1. Admin sets tier to Ultra + grants $499
2. Admin generates payment link
3. Boss never pays (forgets, changes mind, etc.)
4. User keeps using platform with $499 credits
5. Credits run out
6. No Stripe subscription to renew
7. No more credits granted
```

**Result:** ⚠️ User becomes "orphaned" - has tier but no recurring billing

**Problem:** No way to track "pending payment" status

---

## Scenario 4: User Already Has Subscription, Admin Changes Tier (🤔 UNCLEAR)

### Journey:
```
1. User has active Basic subscription from Stripe
2. Admin manually sets tier to Ultra
3. User now has: 
   - Stripe subscription for Basic ($49/month)
   - Manual tier set to Ultra
   - Credits granted for Ultra ($499)
4. Next month: Webhook fires for Basic renewal
5. System sees mismatch!
```

**Result:** 🤔 Undefined behavior - which tier wins?

**Problem:** Manual admin tier conflicts with Stripe subscription tier

---

## Scenario 5: Admin Clicks "Set Tier" Multiple Times (NOW FIXED ✅)

### Before Fix:
```
1. Admin sets Ultra + grant credits
2. Admin clicks again
3. System grants ANOTHER $499
4. User gets $998
```

**Result:** ❌ Duplicate credits

### After Fix:
```
1. Admin sets Ultra + grant credits
2. Admin clicks same tier again
3. Frontend shows: "User already on tier_ultra. This will ADD more credits. Continue?"
4. If yes → Backend checks for duplicates
5. credit_manager prevents if within 5 seconds
```

**Result:** ✅ Mostly fixed, but still allows duplicates if >5 seconds apart

---

## Scenario 6: Boss Pays, Then Admin Links DIFFERENT Subscription (💥 CONFLICT!)

### Journey:
```
1. Boss pays via link A → creates sub_111
2. Webhook links sub_111 to account
3. Admin manually links sub_222 to same account
4. Now account has TWO subscriptions linked?
```

**Result:** 💥 Database may have conflicting subscription IDs

**Problem:** No validation that account doesn't already have a subscription

---

## Scenario 7: User Upgrades/Downgrades via Billing Portal (⚠️ UNTESTED)

### Journey:
```
1. User has Basic subscription
2. User goes to Stripe billing portal
3. User upgrades to Ultra
4. Webhook fires: customer.subscription.updated
5. System sees upgrade
6. System grants prorated credits
```

**Result:** ⚠️ Should work based on existing code, but UNTESTED with manual admin tier

---

## Scenario 8: Subscription Cancelled (⚠️ ORPHANED AGAIN)

### Journey:
```
1. User has Ultra subscription
2. Subscription cancelled in Stripe
3. Webhook fires: customer.subscription.deleted
4. System sets tier to 'none'?
5. User loses access mid-month?
```

**Result:** ⚠️ Unclear - does existing balance persist?

---

## 🐛 Bugs & Missing Features

### Critical Issues:

1. **No Tier Validation** ❌
   - Admin can set tier to X, generate link for Y
   - Webhook will grant credits for Y
   - User gets both X and Y credits

2. **No Pending Payment Tracking** ❌
   - Can't tell if admin is waiting for payment
   - Can't tell if payment was never received
   - Can't send reminders

3. **No Subscription Conflict Detection** ❌
   - Can link multiple subscriptions to same account
   - Can have manual tier + Stripe tier mismatch

4. **No "Undo" Feature** ❌
   - If admin makes mistake, can't easily revert
   - Credits are granted immediately

5. **Duplicate Prevention is Weak** ⚠️
   - Only prevents duplicates within 5 seconds
   - Admin can wait 6 seconds and add more

6. **No Audit Trail Visibility** ❌
   - Admin can't see history of manual tier changes
   - Can't see who set what tier when

7. **No Notifications** ❌
   - Admin not notified when boss pays
   - User not notified of manual tier change
   - Boss not notified of payment link expiry

---

## 💡 What Should Be Added

### High Priority:

#### 1. **Tier Validation**
```typescript
// When generating link, validate it matches current tier
if (user.tier && user.tier !== selectedTier) {
  warn("User is on {user.tier} but link is for {selectedTier}. Mismatch!");
}
```

#### 2. **Pending Payment Status**
```sql
ALTER TABLE credit_accounts 
ADD COLUMN pending_payment_tier VARCHAR(50),
ADD COLUMN pending_payment_link_sent_at TIMESTAMPTZ,
ADD COLUMN pending_payment_expires_at TIMESTAMPTZ;
```

#### 3. **Subscription Conflict Check**
```python
# In link-subscription endpoint
if credit_account.stripe_subscription_id:
    raise HTTPException(400, "Account already has subscription {id}. Unlink first.")
```

#### 4. **Better Duplicate Prevention**
```python
# Check last admin tier change, not just last credit grant
last_tier_change = await check_last_admin_tier_change(account_id)
if last_tier_change.tier == request.tier_name and last_tier_change.timestamp > 1 hour ago:
    raise HTTPException(400, "Tier already set recently. Wait before changing again.")
```

### Medium Priority:

#### 5. **Audit Trail UI**
- Show history of admin actions in user details
- Show who did what when
- Allow filtering by action type

#### 6. **Notifications**
- Email admin when payment received
- Email user when tier changed manually
- Email boss reminder if link not used in 24h

#### 7. **Reconciliation Tool**
- List all "orphaned" accounts (tier but no subscription)
- List all mismatches (manual tier ≠ Stripe tier)
- Bulk fix tool

### Low Priority:

#### 8. **Undo Feature**
- Keep snapshots before admin changes
- Allow reverting to previous state
- Requires careful credit reversal logic

---

## 🧪 Testing Checklist (TODO)

- [ ] Normal flow: Set tier → Generate link → Boss pays
- [ ] Mismatch: Set Basic → Generate Ultra link → Boss pays
- [ ] Orphaned: Set tier → Never generate link
- [ ] Orphaned: Set tier → Generate link → Boss never pays
- [ ] Duplicate: Click set tier multiple times rapidly
- [ ] Duplicate: Click set tier twice with 10 second gap
- [ ] Conflict: Boss pays → Admin links different subscription
- [ ] Conflict: Has subscription → Admin sets different tier
- [ ] Upgrade: User on Basic → Upgrade to Ultra via portal
- [ ] Downgrade: User on Ultra → Downgrade to Basic via portal
- [ ] Cancel: User cancels subscription → What happens to tier?
- [ ] Renew: Subscription renews → Credits granted correctly?
- [ ] Expire: Payment link expires → What happens?
- [ ] Multiple: Admin generates multiple links for same user

---

## 🎯 Recommendations

### Immediate Actions:

1. **Add Validation** ✅ MUST DO
   - Validate tier matches when generating link
   - Check for existing subscription when linking
   - Prevent rapid duplicate tier sets

2. **Add Warnings** ✅ MUST DO
   - Warn if tier != link tier
   - Warn if subscription already exists
   - Warn if pending payment exists

3. **Test Scenarios** ✅ MUST DO
   - Test at least top 5 scenarios above
   - Document actual behavior
   - Fix any bugs found

### Future Improvements:

4. **Add Tracking**
   - Pending payment status
   - Link expiry tracking
   - Payment reminder system

5. **Add Reconciliation**
   - Orphaned account detection
   - Mismatch resolution
   - Bulk fix tools

6. **Add Notifications**
   - Admin alerts
   - User notifications  
   - Payment reminders

---

## ⚠️ Current State

**Working:** ✅
- Basic flow (set tier → generate link → pay → link)
- Duplicate prevention (weak)
- Audit logging

**Not Tested:** ⚠️
- Tier mismatches
- Multiple subscriptions
- Upgrade/downgrade flows
- Cancellation handling
- Orphaned accounts

**Not Implemented:** ❌
- Pending payment tracking
- Conflict detection
- Strong duplicate prevention
- Notifications
- Reconciliation tools

---

**Bottom Line:** The happy path works, but edge cases are untested and likely broken. Need comprehensive testing and additional validation before production use.

