# MealOps — Product Requirement Document

**Version:** 1.0
**Date:** April 30, 2026
**Status:** Draft

---

## 1. Problem Statement

College students living in campus mess facilities face a fragmented and opaque meal experience. They have no reliable way to view upcoming menus in advance, track what they eat, understand its nutritional value, or make informed dietary decisions. Existing mess management is entirely manual — notice boards, WhatsApp groups, verbal communication — leading to missed meals, poor nutrition awareness, and food waste. There is no single tool built for this specific context.

---

## 2. Objectives

- Give students real-time visibility into their mess menu
- Enable passive and active meal logging without friction
- Surface meaningful nutritional data from everyday canteen food
- Reduce cognitive overhead of meal planning through smart recommendations
- Provide a self-service chatbot to answer common mess queries
- Allow students to pre-order meals to reduce queue time and food waste

---

## 3. Target Users

### Persona 1 — Arjun, 19, First-Year Engineering Student
Lives in a hostel, eats exclusively at the campus mess. Has no awareness of his caloric intake or nutritional balance. Wants to know what's for lunch before he walks to the mess. Occasionally skips meals due to disliked food. Not tech-averse but wants things to be simple.

**Pain points:** No advance menu visibility, no idea what's healthy, misses meals due to poor planning.

---

### Persona 2 — Priya, 21, Third-Year with Dietary Restrictions
Lactose intolerant, avoids certain foods. Currently asks mess staff directly every day. Tracks calories on a notes app. Wants to scan food to check ingredients and automatically log meals.

**Pain points:** Manual and error-prone food tracking, no way to flag allergens, time-consuming logging.

---

### Persona 3 — Ravi, 23, Final-Year with Fitness Goals
Actively monitors macros for gym performance. Uses multiple apps but none are integrated with campus mess food. Wants weekly summaries, protein/carb tracking, and actionable insights.

**Pain points:** Disconnected tools, no mess-specific food database, no trend analysis.

---

## 4. Key Features

### 4.1 Weekly Mess Menu Viewer
A structured weekly calendar displaying breakfast, lunch, snacks, and dinner for each day. Data is loaded from a static/editable JSON file. Students can view the current day prominently, navigate across the week, and see nutritional tags (veg/non-veg, high-protein, etc.).

### 4.2 AI Food Scanner
Students upload a photo of their meal or a food item. The app performs client-side image classification to identify the dish, then queries the **Open Food Facts API** to fetch nutritional data. The identified item is presented with macros and the option to log it directly.

### 4.3 Nutrition Tracking Dashboard
A visual dashboard showing daily and weekly nutritional intake — calories, protein, carbohydrates, fats, and fibre. Data is sourced from logged meals. Charts display progress against recommended daily values (RDA). Trends are shown over 7 and 30 days.

### 4.4 Meal Logging System
Students manually log meals by searching a food database (Open Food Facts) or selecting from the day's mess menu. Each log entry stores food name, quantity, macros, and timestamp. Logs are persisted in `localStorage`. History is viewable and editable.

### 4.5 Smart Chatbot
A rule-based chatbot that answers predefined queries about the mess: today's menu, opening hours, nutritional information for specific dishes, allergy information, and pre-order status. Uses pattern matching on a local knowledge base — no external AI API required.

### 4.6 Pre-Order System
Students can pre-order specific meals up to 24 hours in advance. Orders are stored in `localStorage` and displayed to the student as a confirmation. The system tracks order history and allows cancellations. (Designed to be connected to a backend in a future version.)

### 4.7 Health Insights & Recommendations
Based on logged meals, the app generates contextual text recommendations — e.g., "You've had low protein this week. Consider adding dal or eggs to your meals." Recommendations are rule-based, triggered by thresholds on macros and meal frequency.

---

## 5. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Display weekly mess menu in a day-by-day calendar view |
| FR-02 | Allow users to navigate between days and weeks |
| FR-03 | Accept image upload for food scanning |
| FR-04 | Query Open Food Facts API by food name to retrieve nutritional data |
| FR-05 | Allow users to confirm, edit, and log a scanned food item |
| FR-06 | Allow manual meal search and logging with quantity input |
| FR-07 | Store all meal logs in `localStorage` with timestamp |
| FR-08 | Display daily calorie and macro totals on the dashboard |
| FR-09 | Render nutrition trend charts for 7-day and 30-day windows |
| FR-10 | Provide a chatbot interface accepting text input |
| FR-11 | Match chatbot input to a local intent/response map |
| FR-12 | Allow users to pre-order meals from the current week's menu |
| FR-13 | Store pre-orders in `localStorage` and display confirmation |
| FR-14 | Allow cancellation of pre-orders before a cutoff time |
| FR-15 | Generate health recommendations based on weekly nutritional trends |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial page load under 2 seconds on a standard college Wi-Fi connection |
| **Responsiveness** | Fully functional on mobile (375px+), tablet, and desktop |
| **Offline support** | Core menu and logged data accessible without internet (from localStorage) |
| **Accessibility** | WCAG 2.1 AA compliance — keyboard navigation, sufficient color contrast |
| **Data privacy** | No user data leaves the device; no authentication required |
| **Reliability** | App functions fully if Open Food Facts API is unavailable (graceful fallback) |
| **Maintainability** | Modular component architecture; new features addable without refactoring core |
| **Bundle size** | JavaScript bundle under 250KB gzipped for the initial route |

---

## 7. User Stories

**As Arjun**, I want to open the app and immediately see what's being served for dinner tonight, so I can decide whether to eat at the mess or order outside.

**As Priya**, I want to take a photo of my lunch tray and have the app identify the food and show me whether it contains dairy, so I can make safe choices without asking the mess staff every day.

**As Priya**, I want my meals to be automatically logged after scanning, so I don't have to manually enter every item while standing in the mess queue.

**As Ravi**, I want to see a weekly bar chart of my protein intake compared to my daily target, so I can adjust my meals for the coming week.

**As Ravi**, I want the app to tell me "You hit your protein goal 5 out of 7 days this week", so I have clear feedback on my fitness-related nutrition without doing mental math.

**As Arjun**, I want to pre-order Tuesday's breakfast the night before, so I can skip the queue on an early exam day.

**As any student**, I want to ask the chatbot "What time does the mess open on Sunday?" and get an instant answer, so I don't need to search for the mess notice.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Daily Active Usage | Student returns to the app at least once per day (measured via localStorage visit count) |
| Meal Log Completion | Users log at least 2 meals per day after onboarding |
| Scanner Accuracy | Food identified correctly ≥ 80% of the time for common mess dishes |
| Pre-order Adoption | ≥ 30% of users use the pre-order feature at least once per week |
| Chatbot Resolution Rate | ≥ 90% of chatbot queries matched to a valid response |
| Dashboard Engagement | Users view the nutrition dashboard at least 3 times per week |
| Recommendation Relevance | ≥ 70% of displayed recommendations rated "useful" in an in-app prompt |

---

## 9. Constraints & Assumptions

### Constraints
- **No backend** — all data is stored in `localStorage`; multi-device sync is out of scope
- **No paid APIs** — only Open Food Facts (free, rate-limited) is used for nutritional data
- **No authentication** — the app is single-user per device with no account system
- **No real-time data** — menu data is static JSON maintained manually or by an admin
- **Image classification** — performed client-side or via a free, lightweight model; accuracy is limited for less common dishes

### Assumptions
- Students access the app on a personal smartphone or laptop
- The mess menu follows a weekly repeating pattern and is known in advance
- Open Food Facts contains sufficient coverage for common Indian mess/canteen dishes
- Students are willing to log meals manually when scanning is unavailable
- Pre-orders do not need actual backend fulfilment in v1 — the flow is UI-only
- The app will be deployed as a static site (Vercel or similar)
