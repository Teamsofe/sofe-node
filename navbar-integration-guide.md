# Universal Navbar — Integration Guide

## Setup (one-time)

1. Place `sofe-navbar.js` in your `public/js/` folder (create the folder if needed):
```
public/
├── firebase.js
├── academy.html
├── js/
│   └── sofe-navbar.js   ← here
```

2. Verify your `firebase.js` exports `auth` and `onAuthStateChanged` (it already does).

---

## Adding to any existing page

For every page on your site (`index.html`, `about.html`, `bie.html`, `blog.html`, etc.), do these 3 things:

### Step 1: Add a placeholder div

Wherever your old navbar was (typically right after `<body>`), replace it with:

```html
<div id="sofe-navbar"></div>
```

### Step 2: Add the script tag

Right before `</body>`, add:

```html
<script type="module" src="./js/sofe-navbar.js"></script>
```

### Step 3: Mark the active page

On the `<body>` tag, add `data-nav-active="X"` where X matches the page:

| Page                  | Use this value                |
|-----------------------|-------------------------------|
| `index.html`          | `home`                        |
| `academy.html`        | `academy`                     |
| `bie.html`            | `cbie`                        |
| `for-talents.html`    | `services`                    |
| `for-ecosystems.html` | `services`                    |
| `blog.html`           | `resources`                   |
| `events.html`         | `resources`                   |
| `about.html`          | `resources`                   |
| `bounties.html`       | `bounties`                    |

Example:
```html
<body data-nav-active="academy">
```

---

## What the navbar gives you automatically

- **Logged out visitors** see: Home · Academy · CBIE · Services▾ · Resources▾ · Bounties · [Log In] [Sign Up]
- **Logged in visitors** see the same nav, but Login/Signup buttons are replaced by an avatar circle linking to their dashboard
- **Mobile (< 980px)** collapses to a hamburger menu with all items grouped by section
- **Active page highlighting** — the current page shows in orange
- **Sticky** — stays at the top as you scroll
- **Frosted glass** effect over your dark page content

---

## Pages you'll need to create (as referenced in the navbar)

The navbar links to these pages. Create them as you build out:

- ✅ `index.html` — your homepage (already exists)
- ✅ `academy.html` — courses catalogue (just built in Phase 3A)
- ✅ `bie.html` — CBIE landing page (already exists)
- ❓ `for-talents.html` — B2B page for talents
- ❓ `for-ecosystems.html` — B2B page for ecosystem partners
- ✅ `blog.html` — blog (you mentioned this exists)
- ❓ `events.html` — events listing
- ❓ `about.html` — about us page
- ✅ `bounties.html` — bounty board (already built)
- ✅ `login.html` — already exists
- ✅ `signup.html` — already exists
- ✅ `dashboard.html` — already exists

If any of these don't exist yet, the nav still works — the link just goes to a 404 until you create the page.

---

## Customising

If you ever need to change the nav structure, only edit `sofe-navbar.js`. All pages automatically reflect the change on next deploy.

---

## Deploy

```powershell
firebase deploy --only hosting
```

Then visit any updated page — you should see the new unified navbar at the top.
