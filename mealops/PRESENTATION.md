# MealOps — Your Offline Smart Mess Companion

**Tagline:** Track nutrition, scan food with AI, and chat your way to better meals — all without a single API call.

---

## Problem

Hostel and campus canteen students have no easy way to:
- Know the **nutritional value** of what they eat each day.
- Remember what was served and **log their meals** reliably.
- Get **personalised recommendations** without signing up or sharing data.

Existing apps require accounts, internet connectivity, and often don't know the local mess menu.

---

## Solution

MealOps is a **fully offline** web app that lives in the browser. It combines:
- A structured weekly canteen menu (55+ dishes with full macros)
- An AI food scanner powered by TensorFlow.js
- A conversational chatbot that understands the menu
- A personal nutrition dashboard with charts and goals

No logins. No servers. No data ever leaves the device.

---

## Key Features

| Feature | What it does |
|---|---|
| Dashboard | Calorie ring, macro bars, weekly trend chart, daily insights |
| Weekly Menu | Browse 7 days of meals; filter by type; log with one tap |
| AI Food Scanner | Upload any food photo → TF.js MobileNet identifies it → matches against the menu |
| Smart Chatbot | Ask "what's for lunch today?", "high protein options?", "Monday dinner calories?" — all answered offline |
| Meal Log | Per-meal logging persisted in localStorage with date-based retrieval |
| Nutrition Analytics | Macro progress to goal, fibre tracking, still-to-go section |

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 14 — App Router, server components, streaming |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + CSS custom properties design tokens |
| Animation | Framer Motion — staggered cards, spring nav indicators |
| AI / ML | **TensorFlow.js + MobileNet** — runs entirely in the browser |
| Fuzzy search | **Fuse.js** — for scanner fallback and chatbot intent matching |
| Charts | Recharts — weekly calorie bar chart |
| Icons | Lucide React |
| Storage | localStorage — SSR-guarded, runtime type-validated |

---

## Unique Highlights

1. **Truly offline** — once loaded, the app requires zero network access for any feature.
2. **No external APIs** — no OpenAI, no nutrition DB APIs, no auth services. Everything is local.
3. **AI food scanning in the browser** — TF.js MobileNet (a 9MB model) is lazy-loaded on first scan, cached, and runs inference client-side.
4. **Smart chatbot without NLP APIs** — ~25 regex intent patterns + Fuse.js fuzzy fallback answers menu and nutrition questions conversationally.
5. **Security-first** — XSS-safe chat rendering, type-validated storage reads, OWASP security headers, and strict TypeScript throughout.
6. **Production-ready** — skeleton loaders, `React.memo` on hot components, lazy imports, `removeConsole` in production.

---

## LinkedIn Description

> Built MealOps — a fully offline Smart Mess Companion for campus students, as a showcase of modern frontend engineering.
>
> The app lets you scan food photos with TensorFlow.js (MobileNet, running 100% in-browser), chat with a smart mess assistant powered by regex + Fuse.js, and track daily nutrition against personal goals — all with zero backend and zero API calls.
>
> Stack: Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · TF.js · Fuse.js · Recharts · localStorage
>
> Key engineering decisions: XSS-safe React chat renderer, runtime type guards for localStorage, Vercel security headers, lazy-loaded ML model, skeleton-first loading UX, and full strict TypeScript.
>
> #NextJS #TypeScript #TensorFlowJS #OfflineFirst #FrontendEngineering #ReactJS
