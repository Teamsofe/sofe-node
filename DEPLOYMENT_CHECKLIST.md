# Deployment Checklist — Notification Bell

## What changed

### 1. **firebase.js** — ✅ NO CHANGES NEEDED
Your firebase.js already exports everything the bell requires:
- `db`, `collection`, `query`, `where`, `orderBy`, `limit`, `onSnapshot`, `doc`, `updateDoc`

Nothing to update here.

### 2. **firestore.rules** — UPDATED (lines 213-227)
Changed the notifications block to allow:
- Reading broadcast notifications (where `user_id` is null)
- Updating only personal notifications (type == 'personal')

Deploy with:
```bash
firebase deploy --only firestore:rules
```

### 3. **sofe-navbar.js** — UPDATED
Added:
- Bell button HTML (between theme toggle and Sign In)
- Bell CSS (~250 lines, dark + light themes)
- Bell logic (~250 lines, listeners/rendering/mark-as-read)
- Reduced `.page-header` padding from 4rem → 1.5rem (fixes navbar gap)

Replace your current `/js/sofe-navbar.js` with the updated version.

### 4. **style.css** — UPDATED
Changed the `#hero` rule (line ~64):
- `min-height: 100vh` → `min-height: calc(100vh - 70px)`
- Removed `padding-top: 80px`

This fixes the vertical centering so the hero content sits at the visual center of the visible viewport instead of being pushed down. Replace your current `/css/style.css`.

### 5. **firebase.json** — UPDATED (CSP fix)
Added `https://fonts.googleapis.com` and `https://fonts.gstatic.com` to the `connect-src` directive. This fixes the 504 errors from the service worker trying to cache Google Fonts.

Deploy with:
```bash
firebase deploy --only hosting
```

---

## What you need to do next

### Step 1: Deploy the code
```bash
# Upload the updated files
cp sofe-navbar.js public/js/sofe-navbar.js
cp style.css public/css/style.css

# Deploy hosting + rules
firebase deploy --only hosting,firestore:rules
```

### Step 2: Create the two composite indexes
Log into your site while signed in, open the bell (click the icon). You'll see two console errors with links like:

> `FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...`

Click both links. Firebase will build the indexes in ~30 seconds:
1. **Personal**: `user_id` ASC, `created_at` DESC
2. **Broadcast**: `type` ASC, `created_at` DESC

### Step 3: Test with sample notifications
Go to Firebase Console → Firestore → `notifications` collection → Add document:

**Sample personal notification** (use your own UID):
```
user_id:    <your Firebase UID>
type:       personal
title:      Welcome to Sofe Node 🎉
message:    Your referral dashboard is ready. Start earning!
link:       ./dashboard.html#tab-business
category:   referral
created_at: <click "current time">
read:       false
```

**Sample broadcast** (visible to everyone):
```
user_id:    (leave blank / null)
type:       broadcast
title:      New blog post: Web3 in Nigeria 2026
message:    A deep dive into where the market is headed.
link:       ./blog/web3-nigeria-2026.html
category:   blog
created_at: <click "current time">
read:       false
```

You'll see them appear in the bell instantly (via the real-time listener).

---

## How to push notifications going forward

**Option A: Firebase Console** (quick testing)
Go to Firestore → `notifications` → Add document → paste fields above

**Option B: Cloud Function** (production)
Your rules only allow admins to create notifications. Set up a callable Cloud Function:

```js
// functions/index.js
exports.pushNotification = onCall(async (request) => {
  // Check admin role in request.auth.token.admin_role
  if (!request.auth || !['super_admin', 'community_manager'].includes(request.auth.token.admin_role)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { user_id, type, title, message, link, category } = request.data;
  
  await admin.firestore().collection('notifications').add({
    user_id: user_id || null,
    type,
    title,
    message,
    link: link || null,
    category: category || 'update',
    read: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
```

Call from an admin page:
```js
import { callFunction } from './firebase.js';
await callFunction('pushNotification', {
  type: 'broadcast',
  title: 'New event next week',
  message: 'BCE 2026 tickets now available',
  link: './events.html',
  category: 'update'
});
```

**Option C: Admin UI** (recommended)
Build a simple admin panel at `/admin/notifications.html` that lets community managers compose + send notifications without touching the console.

---

## Expected behavior

- **Bell visibility**: Shows only when logged in; hidden when logged out
- **Badge count**: Red dot with unread count (1, 2, ...9+)
- **Tabs**: All / Personal / Updates — filter the list client-side
- **Real-time**: New notifications appear immediately (no refresh needed)
- **Mark as read**: Click a notification to mark it read (and navigate if it has a `link`)
- **Mark all read**: Button in the header marks everything read
- **Broadcast read state**: Stored in localStorage (per device), not Firestore
- **Personal read state**: Written to Firestore (`read: true`)

---

## Troubleshooting

**Bell stays empty after login**
- Check browser console for errors
- Most common: missing Firestore index (click the link in the error to create it)
- Also check: firebase.js exports `db` (it does in your file)

**Badge shows wrong count**
- The badge counts unread across ALL tabs (personal + broadcast combined)
- If a broadcast is unread on device A but read on device B, that's expected (localStorage is per-device)

**"Permission denied" when marking as read**
- Check firestore.rules deployed correctly
- Verify the notification has `type: 'personal'` (broadcasts can't be marked read in Firestore)

**Console warning about missing firebase.js exports**
- Your firebase.js is already correct, so this shouldn't happen
- If you see it, the warning names exactly which export is missing

---

All set. Deploy the 4 files and create the indexes, then test with the sample notifications above.
