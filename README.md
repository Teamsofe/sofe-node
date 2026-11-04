# Sofe Node — Next.js Project

Africa's node for Web3 growth: marketing site, Academy (LMS), CBIE executive programme, bounties, learner dashboard and admin console.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Deploy

The site is a static export (`output: 'export'` → `out/`) served by Firebase Hosting.

```bash
npm run build                                  # writes out/
firebase deploy --only hosting                 # site
firebase deploy --only firestore:rules,storage # security rules
firebase deploy --only functions               # Cloud Functions (functions/)
```

---

## Project Structure

```
sofe-node-nextjs/
├── app/                    # App Router pages — each page.jsx renders a *Client component
│   ├── layout.jsx          # Root layout: fonts, Nav, Footer, HexCanvas, intro animation
│   ├── globals.css         # Shared CSS (design tokens, nav, footer, components)
│   ├── academy/ courses/ course-detail/ course-view/   # Academy / LMS
│   ├── cbie/ cbie-application/                          # CBIE executive programme
│   ├── bounties/ dashboard/ admin/ admin-dashboard/
│   ├── login/ signup/ payment/ payment-flow/ join/      # Auth, Paystack, chapter referral links
│   └── about/ bce/ blog/ contact/ events/ for-talents/ for-ecosystems/ services/
│
├── components/             # Page bodies (*Client.jsx) plus Nav, Footer, HexCanvas, ScrollReveal
├── lib/
│   ├── firebase.js         # Firebase app, Auth, Firestore, Storage, Functions exports
│   ├── qrcodeGenerator.js  # QR codes for score / certificate share images
│   └── sofeIntroEngine.js  # Homepage intro animation
│
├── functions/index.js      # Cloud Functions: XP, progress, certificates, payments,
│                           # commissions, referrals, leaderboards, notifications
├── public/                 # Static assets + legacy HTML pages (being migrated)
├── firestore.rules         # Firestore security rules
├── storage.rules
├── firebase.json           # Hosting (redirects, rewrites, CSP headers), functions, extensions
└── dataconnect/            # Firebase Data Connect schema
```

---

## Migration Status

All main routes have Next.js pages. Some features still live in the legacy HTML under
`public/` — most notably the admin console (`public/admin-dashboard-v2.html`), which is
being ported to `components/AdminDashboardClient.jsx`.

---

## Security Model

Progress, XP, payments, enrolment activation and certificates are written only by Cloud
Functions (`markSessionComplete`, `submitQuizAnswers`, `issueCertificate`, payment and grading
triggers). The Firestore rules block clients from writing these fields directly — don't add
client-side fallbacks that write them.

Backfill/migration HTTP endpoints require `?secret=` matching the `BACKFILL_SECRET` env var.

---

## Tech Stack

- **Next.js 14** (App Router, static export) + **React 18**
- **Firebase**: Auth, Firestore, Storage, Cloud Functions (v2), Data Connect, Trigger Email extension
- **Paystack** for payments
- **Custom CSS** (no Tailwind — preserves design system), Google Fonts (Poppins, Space Grotesk)
