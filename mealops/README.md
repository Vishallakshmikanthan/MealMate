# MealOps — Smart Mess Companion

> Track nutrition, scan food with AI, and chat your way to better meals — all **offline**, no API required.

---

## Overview

MealOps is a production-ready web app for hostel / canteen students who want to monitor what they eat without depending on any external service. Every feature — AI food scanning, smart chatbot, and nutrition analytics — runs entirely in the browser.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Real-time calorie ring, macro progress bars, weekly bar chart, and personalised insights |
| **Weekly Menu** | Structured 7-day mess menu with 55+ dishes, filterable by day and meal type |
| **AI Food Scanner** | TensorFlow.js MobileNet identifies food from a photo and matches it to the menu |
| **Smart Chatbot** | Intent-driven + Fuse.js fuzzy chatbot that answers nutrition and menu questions |
| **Meal Log** | Log meals per day/meal-type; totals persist in localStorage |
| **Nutrition Analytics** | Macro breakdowns, progress-to-goal gauges, and fibre tracking |
| **Offline-first** | Zero network calls at runtime; all data lives in the browser |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS custom properties |
| Animation | Framer Motion |
| AI / ML | TensorFlow.js + MobileNet (browser-only, lazy-loaded) |
| Fuzzy Search | Fuse.js |
| Charts | Recharts |
| Icons | Lucide React |
| Font | Inter (Google Fonts) |
| Storage | localStorage (SSR-safe, type-validated) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```
git clone <repo-url>
cd mealops
npm install
npm run dev
```

Open http://localhost:3000.

### Production Build

```
npm run build
npm start
```

### Deploy to Vercel

1. Push the mealops/ folder to a GitHub repository.
2. Import the repo in Vercel (https://vercel.com).
3. Set the **root directory** to `mealops` if the folder is nested.
4. Deploy — no environment variables required.

---

## Project Structure

```
mealops/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Home / nutrition overview
│   ├── menu/               # Weekly mess menu
│   ├── scanner/            # AI food scanner
│   ├── chat/               # MealBot chatbot
│   ├── nutrition/          # Macro analytics
│   └── log/                # Meal log history
├── components/layout/      # AppShell, Sidebar, BottomNav
├── data/                   # Static weekly menu data
├── lib/                    # Business logic (storage, nutrition, scanner, chatbot)
└── types/                  # Shared TypeScript types
```

---

## Security

- **XSS prevention** — bot responses rendered as React nodes (no dangerouslySetInnerHTML).
- **Input validation** — user input hard-capped at 500 characters; localStorage data validated with type guards before use.
- **Security headers** — X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy via next.config.mjs.
- **No server-side secrets** — the app is fully static with zero backend.

---

## License

MIT
