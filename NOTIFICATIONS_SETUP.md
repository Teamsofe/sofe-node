# Notifications — Firestore Setup

## 1. Required `firebase.js` exports

The bell imports these dynamically. Open your `firebase.js` and make sure it exports all of these alongside `auth` and `onAuthStateChanged`:

```js
// firebase.js — required exports for the notification bell
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut,
  /* ...your existing auth imports... */
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  collection, query, where, orderBy, limit, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Re-export everything the navbar (and dashboard) needs
export {
  onAuthStateChanged, signOut,
  collection, query, where, orderBy, limit, onSnapshot,
  doc, updateDoc, addDoc, serverTimestamp, Timestamp
};
```

If anything in `[db, collection, query, where, orderBy, limit, onSnapshot]` is missing, the bell stays empty and logs a single console warning telling you exactly which export is missing. No errors are thrown.

---

## 2. Firestore security rules

Add this block to your `firestore.rules` file:

```
match /databases/{database}/documents {

  match /notifications/{notifId} {
    // Users can read their own personal notifications + all broadcasts
    allow read: if request.auth != null && (
      resource.data.type == 'broadcast' ||
      resource.data.user_id == request.auth.uid
    );

    // A user can only update the `read` field on their own personal notification
    allow update: if request.auth != null
      && resource.data.type == 'personal'
      && resource.data.user_id == request.auth.uid
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);

    // Creates / deletes happen only from a trusted backend (Cloud Function or Admin SDK)
    allow create, delete: if false;
  }

  // ...your existing rules for other collections...
}
```

Then deploy: `firebase deploy --only firestore:rules`

---

## 3. Required composite indexes

The bell runs two real-time queries. Both need composite indexes:

| Query | Fields |
|---|---|
| Personal notifications | `user_id` ASC, `created_at` DESC |
| Broadcast notifications | `type` ASC, `created_at` DESC |

**Easiest way to create them:** open the bell in your app once while logged in. Each missing index throws a console error with a direct "create index" link — click it and Firebase builds the index in ~30 seconds.

The personal index also fixes the existing dashboard error you already saw (`Notifications: The query requires an index...`).

---

## 4. Document schema

Every notification doc looks like this:

```js
{
  user_id:    "abc123def456" | null,         // UID for personal; null for broadcast
  type:       "personal" | "broadcast",
  title:      "Payout received",
  message:    "₦15,000 has been credited to your wallet.",
  link:       "/dashboard.html#tab-wallet" | null,  // optional click target
  category:   "payout",                      // "blog" | "update" | "payout" | "referral" | "course" | ...
  created_at: serverTimestamp(),             // required for ordering
  read:       false                          // personal only; broadcast read state lives in localStorage
}
```

Broadcast read state is intentionally per-device (localStorage) so a single broadcast write doesn't generate one Firestore write per user. If you ever need per-user broadcast read tracking, add a `notification_reads/{uid}` doc with an array of read IDs.

---

## 5. Sample documents (paste into Firebase console to test)

### Personal notification
Collection: `notifications` → Add document → Auto-ID:

```
user_id    (string)    : <paste a real user UID here>
type       (string)    : personal
title      (string)    : Welcome to Sofe Node 🎉
message    (string)    : Your account is ready. Start earning by sharing your referral link.
link       (string)    : ./dashboard.html#tab-business
category   (string)    : referral
created_at (timestamp) : <click "current time">
read       (boolean)   : false
```

### Broadcast notification (e.g. blog post)
```
user_id    (string)    : (leave empty / null)
type       (string)    : broadcast
title      (string)    : New on the blog: Web3 in Nigeria 2026
message    (string)    : A breakdown of where the African Web3 market is heading.
link       (string)    : ./blog/web3-nigeria-2026.html
category   (string)    : blog
created_at (timestamp) : <click "current time">
read       (boolean)   : false
```

---

## 6. Seed helper (optional — for admin pages or Cloud Functions)

```js
// admin-helpers.js
import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export async function pushPersonalNotif(uid, { title, message, link = null, category = 'update' }) {
  return addDoc(collection(db, 'notifications'), {
    user_id: uid,
    type: 'personal',
    title, message, link, category,
    read: false,
    created_at: serverTimestamp(),
  });
}

export async function pushBroadcast({ title, message, link = null, category = 'update' }) {
  return addDoc(collection(db, 'notifications'), {
    user_id: null,
    type: 'broadcast',
    title, message, link, category,
    read: false,
    created_at: serverTimestamp(),
  });
}
```

Note: the security rules above block writes from the client. To push notifications you'll either need to (a) loosen rules for an admin UID, (b) run a Cloud Function, or (c) write from the Firebase console. Option (b) is the right long-term answer.
