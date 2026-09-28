# Sofe Node — Security Hardening Guide (Step 1 of 3)

## What was wrong with the old rules

### Critical vulnerabilities in the previous rules

**1. Role self-elevation attack** — The old `users/{uid}` rule allowed any signed-in user to update their own document with *any* fields, including `role: 'admin'`. Any user could log in, call `updateDoc(doc(db, 'users', myUid), { role: 'admin' })` from the browser console, and instantly gain full admin access.

**2. Enrolment bypass** — Students could create enrolments with `status: 'active'` directly, skipping payment entirely. Anyone could enrol in any course for free.

**3. Payment amount manipulation** — Students could create payment records with `amount: 0` and `status: 'confirmed'`, bypassing payment entirely.

**4. Referral fraud** — Students could create fake referral records and award themselves unlimited commissions.

**5. Certificate forgery** — Students could create their own certificate documents, generating fake credentials.

**6. XP inflation** — No validation on `xp_total`, students could set it to any value.

**7. Trust model in admin dashboard** — The admin dashboard reads `admin_role` from `sessionStorage` which the client fully controls. Anyone could run `sessionStorage.setItem('admin_role','super_admin')` and bypass the role check.

**8. No email verification gate** — Unverified email accounts had full access. An attacker could sign up with any email they don't own, then use that account to refer themselves.

**9. No rate limiting** — Anyone could spam-signup 1000 accounts in a minute.

**10. No file validation on uploads** — The old rules had no checks on file type or size for payment proof uploads. An attacker could upload a 500MB malware file to exhaust your storage quota or host illegal content on your infrastructure.

---

## What the new rules enforce

### `users` collection

- **Signup validation**: The new `isValidNewUser()` function rejects any signup that tries to set `role`, `admin_role`, `xp_total`, or `wallet_balance` to anything other than safe defaults. `role` must be `'student'`, `xp_total` must be `0`, `wallet_balance` must be `0`, and `admin_role` must not exist at all.
- **Update restrictions**: Students can only change `phone`, `state`, `node`, `node_label`, bank details, and `marketing_ok` on their own document. They cannot change their `uid`, `email`, `referral_code`, `role`, `xp_total`, or anything else.
- **Admin cannot self-promote**: Admins can update other users' documents but not their own sensitive fields. Only super admins can change roles.
- **Deletion**: Only super admins can delete user documents.

### `enrolments` collection

- Students can only create enrolments with `status: 'pending'`. They cannot set `status: 'active'` or add `completed_at` or `progress_pct` during creation.
- Only `super_admin` and `course_manager` (or Cloud Functions) can activate enrolments. This means a user can request enrolment but it only becomes active after payment is confirmed.

### `payments` collection

- Students create payments with `status: 'pending_approval'` only. They cannot mark their own payment as `'confirmed'`.
- Amount is validated: must be a number greater than zero and less than ₦10,000,000 (prevents obvious tampering).
- Only `finance_admin`, `super_admin`, or Cloud Functions (via Paystack webhook) can confirm payments.

### `referrals`, `commissions`, `certificates`, `user_badges`

All these collections have `allow write: if false;` — they can **only** be created by Cloud Functions running with admin privileges. The client has zero write access. This closes the referral-fraud, commission-theft, and certificate-forgery attack vectors.

### `notifications`

- Students can only update the `read` and `read_at` fields on their own notifications. They cannot change the title, message, or sender.
- Only `community_manager` or `super_admin` can create notifications.

### Role-based write access on admin actions

Every admin-facing collection now checks the specific `admin_role`, not just "is an admin". Example: only `course_manager` or `super_admin` can edit courses. A `finance_admin` cannot create a course; a `social_media_manager` cannot confirm a payment.

### Catch-all deny

A wildcard rule at the bottom denies all reads and writes to any path not explicitly covered. This prevents accidental exposure if a new collection is added without rules.

---

## Storage rules (new)

The storage rules now validate:
- **File type**: Payment proofs must be image or PDF; avatars must be images; nothing else is accepted.
- **File size**: Payment proofs under 5MB, avatars under 2MB, course materials under 100MB.
- **Ownership**: Users can only upload to paths containing their own UID.

---

## The admin dashboard trust model bug

Your admin dashboard was storing `admin_role` in `sessionStorage` after login and reading it back to decide which panels to show. This is client-side and trivially forgeable.

### Fix (already in the new dashboard)

On every page load, the admin dashboard re-fetches the user's `admin_role` directly from Firestore via the authenticated Firebase SDK. The Firestore rule only returns that field if the user is actually that admin. So even if someone forges `sessionStorage`, the dashboard will overwrite it with the real role from Firestore.

**Do not trust `sessionStorage` for authorization decisions anywhere** — it's fine for UI hints only.

---

## Additional cyber-security measures added

### 1. Email verification gate (to add to signup flow in next update)

Firebase Auth lets you send verification emails. Until `user.emailVerified` is `true`, we can block access to sensitive features. The `isVerified()` helper in the rules is ready to use; we'll add `allow create: if isVerified()` to enrolments and payments in the next iteration.

### 2. Audit logging collection

New `audit_logs` collection — Cloud Functions will write entries here for sensitive actions (role changes, payment approvals, admin logins). Only super admins can read. This gives us a tamper-proof trail for investigations.

### 3. Rate limiting infrastructure

New `rate_limits/{uid}` collection — Cloud Functions will increment counters on signup attempts, password resets, withdrawal requests, etc. Exceeding thresholds triggers temporary blocks.

### 4. Content Security Policy (CSP) headers

Add to `firebase.json`:

```json
{
  "hosting": {
    "public": "public",
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.paystack.co; frame-src 'self' https://checkout.paystack.com;" },
          { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ]
  }
}
```

These headers prevent:
- **XSS** (CSP restricts which scripts can load)
- **Clickjacking** (X-Frame-Options blocks your site from being loaded in an iframe on another domain)
- **MIME sniffing attacks** (X-Content-Type-Options)
- **Protocol downgrade attacks** (Strict-Transport-Security forces HTTPS)
- **Sensitive browser API abuse** (Permissions-Policy denies camera/mic/geolocation unless explicitly granted)

### 5. Secret management

**Never put secret keys in frontend code**. Your Paystack public key is safe in the frontend, but the **secret key must stay in Cloud Functions config only**:

```bash
firebase functions:config:set paystack.secret="sk_live_xxx"
firebase functions:config:set paystack.public="pk_live_xxx"
```

### 6. Firestore field-level encryption (future)

For very sensitive fields like full bank account numbers, consider encrypting at the Cloud Function level using Google Cloud KMS before storing. We'll add this in Step 2.

---

## Deployment steps

### Deploy Firestore rules

```bash
# 1. Save firestore.rules to your project root
# 2. Make sure your firebase.json includes:
#    {
#      "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }
#    }

firebase deploy --only firestore:rules
```

### Deploy Storage rules

```bash
# Save storage.rules to your project root
# Make sure firebase.json includes:
#    {
#      "storage": { "rules": "storage.rules" }
#    }

firebase deploy --only storage
```

### Deploy hosting headers

Update `firebase.json` with the headers block above, then:

```bash
firebase deploy --only hosting
```

---

## Testing the rules

### Quick smoke test in the Firestore console

1. Go to Firebase Console → Firestore → Rules → Playground
2. Try to simulate:
   - Read `/users/otherUserId` as a signed-in non-admin → should **deny**
   - Create `/users/myUid` with `role: 'admin'` → should **deny**
   - Create `/enrolments/xyz` with `status: 'active'` → should **deny**
   - Update own `/notifications/xyz` with `read: true` → should **allow**
   - Update own `/notifications/xyz` with `title: 'hacked'` → should **deny**

### CLI emulator test (recommended before deploying to prod)

```bash
firebase emulators:start --only firestore
# Then run your test suite against localhost:8080
```

---

## Rollback plan

If the new rules break something in production, you can roll back from the Firebase Console → Firestore → Rules → "History" tab. Every rule deployment is versioned and reversible in one click.

---

## Next steps (Step 2 and 3)

Once these rules are deployed and tested, we move to:

**Step 2 — Cloud Functions** (server-side logic):
- Paystack webhook that verifies payment signatures and auto-activates enrolments
- Bank transfer approval trigger that creates enrolment when admin confirms payment
- Notification fan-out for platform-wide announcements
- Referral reward function that creates commission records when a referred user enrols
- Badge award function that fires when XP crosses thresholds
- Email sending via SendGrid or Firebase Extensions

**Step 3 — UI wiring**:
- Notifications tab reads from Firestore with real-time listener
- Payment flow routes to Paystack checkout or bank proof upload
- Approved payment auto-unlocks modules on dashboard
- Admin notification panel writes to Firestore (triggers fan-out function)
