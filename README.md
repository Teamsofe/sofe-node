# Sofe Node — Next.js Project

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
sofe-node-nextjs/
├── app/
│   ├── globals.css         # All shared CSS (design tokens, nav, footer, components)
│   ├── layout.jsx          # Root layout: fonts, Nav, Footer, HexCanvas
│   ├── page.jsx            # Homepage (/)
│   ├── services/
│   │   ├── talent/page.jsx       # For Talent (/services/talent)
│   │   └── partners/page.jsx     # For Partners (/services/partners)
│   └── academy/page.jsx          # Academy (/academy)
│
├── components/
│   ├── Nav.jsx             # Sticky nav with mobile menu + theme toggle (client)
│   ├── Footer.jsx          # Site footer with newsletter signup
│   ├── HexCanvas.jsx       # Animated hex background (client, canvas)
│   ├── ScrollReveal.jsx    # IntersectionObserver for .reveal elements (client)
│   ├── HomeClient.jsx      # Homepage body — tabs, FAQ accordion (client)
│   ├── TalentClient.jsx    # /services/talent body (client)
│   ├── PartnersClient.jsx  # /services/partners body (client)
│   └── AcademyClient.jsx   # /academy body with mode toggle (client)
│
├── public/
│   └── logo.png            # ← Add your logo here
│
├── jsconfig.json           # Path alias: @/* → ./*
├── next.config.mjs
└── package.json
```

---

## Adding Your Logo

Place your `logo.png` in the `/public` folder. It will be served at `/logo.png`.

The Nav and Footer reference it as `<img src="/logo.png" />`. For optimal performance, switch to Next.js `<Image>` component once your logo is in place.

---

## Remaining Pages to Build

| Page | Route | Status |
|------|-------|--------|
| About Us | `/about` | 🔲 Pending |
| BCE Conference | `/bce` | 🔲 Pending |
| Login / Signup | `/login`, `/signup` | 🔲 Pending |
| Dashboard | `/dashboard` | 🔲 Pending |
| Contact | `/contact` | 🔲 Pending |

---

## CMS Integration (Next Step)

This project is ready for **Sanity CMS** integration. Recommended setup:

1. `npm create sanity@latest` — initialise Sanity Studio
2. Define content models for: cohort dates, case studies, partners, testimonials
3. Fetch in page components using `sanity/client`
4. Deploy to **Vercel** with a webhook to rebuild on Sanity publish

See the project documentation for the full CMS strategy.

---

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Custom CSS** (no Tailwind — preserves design system)
- **Google Fonts** (Poppins via `next/font`)
- **Vercel** (recommended hosting)
