# Google Sign-In Setup Guide

## Files updated in this delivery

- `firebase.js` — added `GoogleAuthProvider`, `signInWithPopup`, `fetchSignInMethodsForEmail`, `linkWithCredential`, `EmailAuthProvider` imports/exports
- `login.html` — wired up the existing "Google" social button to actually work
- `signup.html` — added "Continue with Google" button at top of step 1 + new Google profile completion mode

## ONE-TIME setup in Firebase Console

You need to enable Google as a sign-in provider before this works.

### Step 1: Enable Google provider

1. Go to [Firebase Console](https://console.firebase.google.com/) → your `sofe-node` project
2. Click **Authentication** in the left sidebar
3. Click **Sign-in method** tab
4. Find **Google** in the list of providers → click it
5. Toggle **Enable** to ON
6. Set:
   - **Project public-facing name**: `Sofe Node` (this is what users see in the Google popup)
   - **Project support email**: choose your support email
7. Click **Save**

### Step 2: Configure authorized domains

1. Still in **Authentication → Sign-in method**, scroll down to **Authorized domains**
2. Make sure these are listed:
   - `localhost` (for local testing)
   - `sofe-node.web.app` (Firebase Hosting)
   - `sofe-node.firebaseapp.com` (Firebase default)
   - `node.sofegroup.com` (your custom domain — add if not there)
3. If any are missing, click **Add domain** and add them

### Step 3: One account per email (recommended)

This prevents users from accidentally creating two accounts (one with email/password, one with Google) using the same email.

1. **Authentication → Settings** tab
2. Scroll to **User account linking**
3. Choose **Link accounts that use the same email** (recommended)

Without this setting, a user who signed up with `john@gmail.com` via email/password, then tries Google with the same Gmail, gets an "auth/account-exists-with-different-credential" error. With this setting enabled, Firebase will link them automatically.

## Deploy

```powershell
firebase deploy --only hosting
```

## Testing

After deploy:

**Test 1 — New user via Google**
1. Open `https://sofe-node.web.app/signup.html` in incognito
2. Click "Continue with Google"
3. Choose a Google account that has NEVER signed up to your app before
4. Expect: signup form skips to step 2 (Profile), shows green banner "✓ Signed in with Google. Welcome [Name]!"
5. Fill phone, state, node, optionally referral code
6. Click through to step 3, accept terms, submit
7. Expect: redirected to dashboard. The user document in Firestore should have `email_verified: true` already.

**Test 2 — Existing user via Google login**
1. Open `https://sofe-node.web.app/login.html`
2. Click "Google" button (under "or continue with")
3. Choose the Google account from Test 1
4. Expect: straight to dashboard, no signup flow

**Test 3 — Google user trying to use email/password**
1. With User from Test 1, open login.html
2. Try to log in with their email + a password
3. Expect: error message ("No account found with that email" — because they've only Google-signed-up, no password set)

## Edge cases handled

- ✅ User cancels the Google popup → friendly error "Sign-up cancelled"
- ✅ Browser blocks the popup → friendly error "Pop-up blocked. Please allow pop-ups"
- ✅ Existing user clicks Google on signup.html → redirected to dashboard automatically
- ✅ User with same email exists with different sign-in method → friendly error guiding them
- ✅ Google user gets `email_verified: true` automatically (no verification banner)
- ✅ Google user still gets a sequential Sofian ID (SN-000xxx) and referral code
- ✅ If they entered a referral code in step 2, it's still tracked in the `referrals` collection
- ✅ Sign-out works the same for Google and email users
- ✅ Profile fields (phone, state, node) are still REQUIRED for Google users

## Known limitations (for future work)

- **Apple Sign-In** — you said no for now; can add later with `OAuthProvider('apple.com')`
- **Facebook/Twitter** — same pattern as Google if you want to add later
- **Account linking UI** — if a user wants to add Google login to an existing email/password account, there's no UI for this yet. Currently they can only do it from a fresh sign-up.
