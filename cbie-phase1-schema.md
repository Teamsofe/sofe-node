# Sofe Node — Phase 1: Schema & Rules for CBIE + Generic Discount System

## What's new in this phase

We're adding three new collections, extending two existing ones, and updating Firestore rules. **No UI changes yet** — those come in Phase 2.

---

## New collection: `applications`

Tracks course applications that require admin review (CBIE, future executive courses).

**Document shape:**
```
applications/{appId}
  user_id              : string  (uid of applicant)
  course_id            : string  ('cbie', possibly others)
  cohort_id            : string  (links to cohorts collection)
  status               : string  See status flow below
  
  // Application data
  industry             : string  ('Real Estate', 'Finance', etc.)
  role                 : string  (job title)
  linkedin_url         : string  (optional)
  workplace_email      : string  (optional, for verification)
  motivation_industry  : string  (Q1: which industry are you in)
  motivation_impact    : string  (Q2: how will blockchain change your work)
  motivation_outcome   : string  (Q3: what will you do with the cert)
  
  // Scholarship request
  scholarship_requested : boolean
  scholarship_reason    : string  (only if requested)
  
  // Admin decision
  scholarship_granted   : boolean (set during review)
  scholarship_percent   : number  (locked at decision time, e.g. 50)
  
  // Payment tracking
  application_fee_paid  : boolean
  application_fee_payment_id : string (ref to payments doc)
  balance_amount        : number  (calculated after review)
  balance_paid          : boolean
  balance_payment_id    : string  (ref to payments doc)
  
  // Refund (if rejected)
  refund_initiated      : boolean
  refund_payment_id     : string
  
  // Audit trail
  submitted_at          : timestamp
  reviewed_at           : timestamp
  reviewed_by           : string  (admin uid)
  review_notes          : string  (internal)
  
  created_at, updated_at
```

**Status flow:**
```
submitted          → application form filled, ₦5k fee paid, awaiting review
under_review       → admin started reviewing (clicks "Review" in admin panel)
accepted           → admin approved (with or without scholarship)
declined           → admin rejected, refund initiated
awaiting_balance   → accepted, waiting for student to pay balance
active             → balance paid, courses unlocked
withdrawn          → student cancelled before completion
```

---

## New collection: `cohorts`

Groups students by start date, tracks scholarship slots.

**Document shape:**
```
cohorts/{cohortId}
  course_id            : string  (which course this cohort is for)
  name                 : string  ('CBIE May 2026 Cohort')
  start_date           : timestamp
  end_date             : timestamp
  application_deadline : timestamp
  
  // Capacity tracking
  capacity             : number  (max students, e.g. 50)
  enrolled_count       : number  (auto-incremented by Cloud Function)
  
  // Scholarship slots
  scholarship_slots    : number  (max scholarships, e.g. 10)
  scholarship_granted_count : number (auto-incremented)
  scholarship_percent  : number  (default discount %, can be overridden per applicant)
  
  // Pricing (snapshot at cohort creation, in case prices change)
  application_fee      : number  (₦5,000)
  full_price           : number  (₦100,000)
  
  status               : string  ('upcoming' | 'open' | 'closed' | 'in_progress' | 'completed')
  
  created_at, updated_at, created_by
```

**Status flow:**
```
upcoming     → created but applications not yet open
open         → accepting applications
closed       → application_deadline passed, no new applications
in_progress  → cohort started (start_date passed)
completed    → cohort finished (end_date passed)
```

---

## New collection: `discount_codes` (generic discount system)

Replaces the hardcoded "scholarship %" — works for any course or campaign.

**Document shape:**
```
discount_codes/{codeId}
  code             : string   (e.g. 'EARLYBIRD20', 'STUDENT50')
  type             : string   ('percent' | 'fixed_amount')
  value            : number   (50 for 50%, or 5000 for ₦5,000 off)
  
  // Scope (which courses this applies to)
  course_ids       : array    (['cbie', 'foundation'] or ['*'] for all)
  cohort_ids       : array    (optional, restrict to specific cohorts)
  
  // Usage limits
  max_uses         : number   (total uses allowed; null = unlimited)
  uses_count       : number   (current usage)
  max_per_user     : number   (1 by default)
  
  // Validity
  valid_from       : timestamp
  valid_until      : timestamp
  status           : string   ('active' | 'paused' | 'expired')
  
  // For automatic application (no code needed) e.g. cohort scholarship
  auto_apply       : boolean  (if true, applies automatically when conditions met)
  auto_apply_when  : string   (e.g. 'scholarship_granted')
  
  description      : string   (admin-facing)
  created_at, updated_at, created_by
```

**Why this is better than hardcoded `scholarship_percent`:**
- Admin can create different discount codes for different campaigns
- "EARLYBIRD20" for first 50 applicants, "STUDENT50" for verified students, etc.
- One code can apply to multiple courses
- Usage limits prevent abuse
- Audit trail shows which codes were used by whom

---

## Updated collection: `settings/platform`

Add new global settings for application fees and scholarship rules.

**New fields:**
```
settings/platform
  // ... existing fields
  
  // CBIE & application fee
  cbie_application_fee : number  (5000)
  cbie_full_price      : number  (100000)
  
  // Default scholarship (per cohort can override)
  default_scholarship_percent : number  (50)
  
  // Application review SLA
  application_review_sla_hours : number (48)
  
  // Refund policy
  application_fee_refundable : boolean (true)
  application_fee_credit_on_accept : boolean (true)  // counts toward balance if accepted
  
  // Email/notification toggles
  send_email_on_application_received : boolean (true)
  send_email_on_application_reviewed : boolean (true)
  send_email_on_payment_confirmed    : boolean (true)
```

---

## Updated collection: `payments`

Add fields to distinguish payment types.

**New fields:**
```
payments/{paymentId}
  // ... existing fields
  
  payment_type     : string   ('application_fee' | 'course_balance' | 'foundation_enrolment' | 'other')
  application_id   : string   (links to applications/{id} if relevant)
  course_id        : string
  cohort_id        : string
  
  // For Paystack
  paystack_reference : string
  paystack_verified  : boolean
  
  // For bank transfer
  bank_proof_url   : string   (Storage path to uploaded receipt)
  bank_verified_by : string   (admin uid who confirmed it)
  bank_verified_at : timestamp
```

---

## Updated collection: `enrolments`

Add fields to support the unlock-on-payment flow.

**New fields:**
```
enrolments/{enrolmentId}
  // ... existing fields
  
  source           : string   ('direct_signup' | 'cbie_unlock' | 'admin_grant')
  application_id   : string   (if created via CBIE flow)
  cohort_id        : string   (if cohort-based)
  unlocks_on       : timestamp (cohort start date for CBIE; null for self-paced)
  
  // Self-paced vs cohort-paced
  pace             : string   ('self' | 'cohort')
```

---

## Firestore Security Rules — additions

These get appended to your existing `firestore.rules`:

```javascript
// ── APPLICATIONS — students can create + view own; admins manage all ──
match /applications/{appId} {
  allow read: if isOwner(resource.data.user_id) ||
                 hasAdminRole(['super_admin', 'course_manager']);
  
  // Student creates application, status MUST be 'submitted', no scholarship_granted yet
  allow create: if isSignedIn()
    && request.resource.data.user_id == request.auth.uid
    && request.resource.data.status == 'submitted'
    && request.resource.data.scholarship_granted == false
    && !('reviewed_at' in request.resource.data)
    && !('reviewed_by' in request.resource.data);
  
  // Student can update their own application ONLY to 'withdrawn' status
  // (e.g. if they change their mind before review)
  allow update: if isOwner(resource.data.user_id)
    && resource.data.status == 'submitted'
    && request.resource.data.status == 'withdrawn'
    && onlyChanges(['status', 'updated_at']);
  
  // Admin can update review fields
  allow update: if hasAdminRole(['super_admin', 'course_manager']);
  
  // Only super admin can delete
  allow delete: if isSuperAdmin();
}

// ── COHORTS — public read of open cohorts, admin write ──
match /cohorts/{cohortId} {
  allow read: if isSignedIn();
  allow write: if hasAdminRole(['super_admin', 'course_manager']);
}

// ── DISCOUNT CODES — public read of active codes (for validation),
// admin write
match /discount_codes/{codeId} {
  allow read: if isSignedIn() && resource.data.status == 'active';
  allow write: if hasAdminRole(['super_admin', 'finance_admin']);
}
```

---

## Firestore composite indexes needed

Add these to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "submitted_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "submitted_at", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "cohort_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cohorts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "course_id", "order": "ASCENDING" },
        { "fieldPath": "start_date", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Initial data — what to seed manually after deploy

Once rules deploy, manually create these documents in Firestore Console:

**1. `cohorts/cbie-may-2026`** (example cohort)
```
course_id: "cbie"
name: "CBIE May 2026 Cohort"
start_date: <pick a date>
end_date: <6 weeks later>
application_deadline: <pick a date 1-2 weeks before start>
capacity: 50
enrolled_count: 0
scholarship_slots: 10
scholarship_granted_count: 0
scholarship_percent: 50
application_fee: 5000
full_price: 100000
status: "open"
```

**2. `settings/platform`** (extend existing or create)
```
cbie_application_fee: 5000
cbie_full_price: 100000
default_scholarship_percent: 50
application_review_sla_hours: 48
application_fee_refundable: true
application_fee_credit_on_accept: true
send_email_on_application_received: true
send_email_on_application_reviewed: true
send_email_on_payment_confirmed: true
```

**3. `discount_codes/SCHOLARSHIP_50`** (auto-applied when scholarship granted)
```
code: "SCHOLARSHIP_50"
type: "percent"
value: 50
course_ids: ["cbie"]
max_uses: null
uses_count: 0
max_per_user: 1
valid_from: <now>
valid_until: <year from now>
status: "active"
auto_apply: true
auto_apply_when: "scholarship_granted"
description: "Internal scholarship discount, 50% off CBIE fee"
```

---

## Deployment steps

1. Copy the new rules block into your existing `firestore.rules` (append before the catch-all `/{document=**}` deny rule)
2. Update `firestore.indexes.json` with the new composite indexes
3. Deploy: `firebase deploy --only firestore`
4. In Firebase Console, manually create the three seed documents above
5. Verify the rules in the Rules Playground

---

## What Phase 2 will build (next response, after this is deployed)

- `applications` panel in admin dashboard (list, review, accept, reject, grant scholarship)
- `cohorts` management panel (create, edit, capacity tracking)
- Discount codes management
- Scholarship percentage editor in Settings

## What Phase 3 will build

- `cbie-application.html` multi-step form
- `cbie-application-success.html` confirmation
- Update `bie.html` Apply Now CTA
- Student dashboard "My Application" status card
- Update payment flow for application fee + balance

## What Phase 4 will build (Cloud Functions)

- Paystack webhook handlers
- Email triggers (Firebase Trigger Email)
- Auto-enrolment on full payment
- Refund processing on rejection
- Cohort counter increment/decrement
