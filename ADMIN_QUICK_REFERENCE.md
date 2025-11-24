# Admin Tier Management - Quick Reference Card

⚠️ **IMPORTANT:** If you got 500 errors before, they've been fixed! See `FIX_APPLIED.md` for details.

✅ **Status:** All endpoints working correctly after schema fix (Nov 24, 2025)

---

## 🚀 Onboard User Immediately (Today)

```
1. Go to: /admin/billing
2. Search: user's email
3. Click: their row → Admin Actions tab
4. Card 1: "Set Subscription Tier"
   - Select: Ultra - $499/month
   - Check: ✅ Grant Monthly Credits
   - Reason: "Manual onboarding - pending payment"
   - Click: Update Tier
✅ DONE - User has Ultra access + $499 credits
```

---

## 💳 When Boss Pays - Option A (Recommended)

**Generate Customer-Specific Link**

```
1. Same dialog → Admin Actions tab
2. Card 2: "Generate Customer Payment Link"
   - Select: Ultra - $499/month
   - Click: Generate Payment Link
   - Click: Copy button
3. Send link to boss
✅ DONE - When boss pays, webhook auto-links subscription
```

---

## 💳 When Boss Pays - Option B (If Already Paid)

**Link Existing Subscription**

```
1. Go to Stripe Dashboard
2. Find subscription → Copy ID (sub_xxx...)
3. Same dialog → Admin Actions tab
4. Card 3: "Link Existing Subscription"
   - Paste: subscription ID
   - Click: Link Subscription
✅ DONE - Subscription linked to her account
```

---

## 🎯 Available Tiers

- **Basic** - $49/month
- **Plus** - $199/month
- **Ultra** - $499/month

---

## 🔑 Key Points

✅ Manual tier setting is safe - creates audit log
✅ Customer-specific links prevent all linkage issues
✅ Future renewals are automatic once subscription linked
✅ All actions require admin authentication
✅ Credits can be granted or skipped as needed

---

## 📱 Quick Access

**Admin Portal:** `/admin/billing`

**API Endpoints:**
- `POST /admin/billing/set-tier`
- `POST /admin/billing/generate-customer-link`
- `POST /admin/billing/link-subscription`

---

## ⚡ Pro Tips

1. Always fill in the "Reason" field for audit trails
2. Generate customer-specific links to avoid manual linking
3. Check "Transactions" tab to verify credit grants
4. Subscription IDs always start with `sub_`

---

**For full details, see:** `ADMIN_TIER_MANAGEMENT_GUIDE.md`

