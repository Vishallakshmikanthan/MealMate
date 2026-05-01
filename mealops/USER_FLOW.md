# MealOps — Complete User Flow

---

## 1. First-Time User Flow

```
App opens (first visit)
        │
        ▼
Onboarding Screen
  ├─ App name + tagline
  ├─ 3-step feature carousel
  │    Step 1: "View your mess menu"
  │    Step 2: "Scan and log meals"
  │    Step 3: "Track your nutrition"
  └─ "Get Started" CTA
        │
        ▼
Profile Setup (single screen, optional but prompted)
  ├─ Name (display only)
  ├─ Daily calorie goal (preset options: 1800 / 2000 / 2200 / custom)
  ├─ Dietary preference (veg / non-veg / vegan)
  └─ "Continue" → saves to localStorage
        │
        ▼
Dashboard (home)
  ├─ Welcome message with name
  ├─ Today's menu highlight card
  ├─ Nutrition ring (empty, 0/goal)
  └─ Tooltip prompt: "Log your first meal to get started"
```

**On every subsequent visit:** onboarding is skipped entirely — localStorage flag `onboarded: true` routes directly to Dashboard.

---

## 2. Daily Usage Flow

```
Student opens MealOps (morning)
        │
        ▼
Dashboard
  ├─ Calories consumed today (ring chart)
  ├─ Today's breakfast/lunch/dinner cards from menu
  ├─ Quick action bar: [Log Meal] [Scan Food] [View Menu]
  └─ Notification strip: "Lunch starts in 45 min"
        │
        ├──── Views menu ──────────────────────────────────┐
        │                                                  ▼
        │                                          Menu Page
        │                                    Current day highlighted
        │                                    Tap meal → see items + tags
        │                                    "Log this meal" button
        │                                          │
        │◄─────────────────────────────────────────┘
        │
        ├──── After breakfast ─────────────────────────────┐
        │                                                  ▼
        │                                     Log Meal (manual)
        │                                     Confirm → Dashboard updates
        │◄─────────────────────────────────────────────────┘
        │
        ├──── Midday ───────────────────────────────────────┐
        │                                                   ▼
        │                                    Scanner (food tray photo)
        │                                    Auto-log confirmed items
        │◄──────────────────────────────────────────────────┘
        │
        ├──── Evening ───────────────────────────────────────┐
        │                                                    ▼
        │                                       Nutrition page
        │                                  Daily summary + macro rings
        │                                  Health insight card appears
        │◄───────────────────────────────────────────────────┘
        │
        └──── Night ─────────────────────────────────────────┐
                                                             ▼
                                               Pre-order tomorrow's breakfast
                                               Confirm → localStorage entry
```

---

## 3. Food Scanning Flow

```
User taps "Scan Food"
        │
        ▼
Scanner Page
  └─ Upload area (drag-and-drop or tap to browse)
        │
        ▼
Image selected
  └─ Client-side preview shown
  └─ "Identify Food" button active
        │
        ▼
Classification step
  ├─ Client-side model OR keyword extraction from filename/EXIF
  └─ Loading state: "Identifying your meal..."
        │
        ▼
Result card appears
  ├─ Detected food name (e.g., "Dal Tadka")
  ├─ Confidence indicator
  └─ "Not right? Search manually" link
        │
        ├─── Correct ──────────────────────────────────────────┐
        │                                                      ▼
        │                                     Open Food Facts API called
        │                                     Loading: "Fetching nutrition..."
        │                                              │
        │                                      ┌───── API success ──────┐
        │                                      ▼                        ▼
        │                               Nutrition card           API failed / not found
        │                               ├─ Calories              └─ Fallback: manual entry
        │                               ├─ Protein                  or local nutrition DB
        │                               ├─ Carbs
        │                               ├─ Fats
        │                               └─ Fibre
        │                                      │
        │                                      ▼
        │                               Quantity selector
        │                               (grams / serving / cups)
        │                                      │
        │                                      ▼
        │                               [Log Meal] button
        │                                      │
        │                                      ▼
        │                               Entry saved to localStorage
        │                               Toast: "Dal Tadka logged ✓"
        │                                      │
        │◄─────────────────────────────────────┘
        │         Returns to Dashboard (nutrition ring updates)
        │
        └─── Incorrect ────────────────────────────────────────┐
                                                               ▼
                                                    Manual search input
                                                    Open Food Facts search
                                                    Select from results
                                                    → Continue from nutrition card step
```

---

## 4. Meal Logging Flow

### 4a — Manual Logging

```
User taps "Log Meal"
        │
        ▼
Log Page
  ├─ Meal type selector: Breakfast / Lunch / Snack / Dinner
  └─ Two entry methods shown as tabs:
        │
        ├─── Tab: "From Today's Menu" ─────────────────────────┐
        │                                                      ▼
        │                                   List of today's mess items
        │                                   Tap item → quantity selector
        │                                   Confirm → logged
        │◄─────────────────────────────────────────────────────┘
        │
        └─── Tab: "Search Food" ───────────────────────────────┐
                                                               ▼
                                                  Search bar (Open Food Facts)
                                                  Type 3+ chars → live results
                                                  Select item → nutrition card
                                                  Set quantity → [Log]
                                                  Saved to localStorage
                                                  Toast confirmation
```

### 4b — Automatic Logging (post-scan)

```
Scanner completes identification
        │
        ▼
Nutrition card + quantity shown
        │
        ▼
User taps [Log Meal]
        │
        ▼
Entry written to localStorage:
  { id, name, macros, quantity, mealType, timestamp }
        │
        ▼
Dashboard nutrition ring updates
        │
        ▼
Log History page reflects new entry
```

---

## 5. Chatbot Interaction Flow

```
User taps "Chat" in navigation
        │
        ▼
Chat Page
  ├─ Welcome message: "Hi, I'm MealBot. Ask me anything about the mess."
  └─ Suggested quick prompts:
       "What's for dinner today?"
       "When does the mess open?"
       "Is today's lunch vegetarian?"
       "How many calories in dal?"
        │
        ▼
User types or taps a prompt
        │
        ▼
Input normalised (lowercased, trimmed)
        │
        ▼
Intent matching against local knowledge base
  ├─ Matches menu query    → pull from menu JSON, format response
  ├─ Matches timing query  → return mess hours from constants
  ├─ Matches nutrition     → look up local DB or Open Food Facts
  ├─ Matches pre-order     → show order status from localStorage
  └─ No match              → "I'm not sure about that. Try rephrasing."
        │
        ▼
Bot response appended to chat thread
  └─ If actionable (e.g., "Log this?") → inline action button
        │
        ▼
User continues or exits
  └─ Chat history persisted in localStorage for session
```

---

## 6. Navigation Structure

```
Root Layout (Sidebar / Bottom Nav)
│
├── / (Dashboard)
│     └─ Today's summary, quick actions, insights strip
│
├── /menu
│     ├─ Weekly calendar view
│     ├─ Day detail (tap a day)
│     └─ Meal detail (tap a dish)
│
├── /scanner
│     ├─ Upload view
│     ├─ Result + nutrition card
│     └─ → /log (on confirm)
│
├── /log
│     ├─ Log entry form (manual)
│     ├─ Log history list
│     └─ Edit/delete an entry
│
├── /nutrition
│     ├─ Daily macro rings
│     ├─ 7-day bar chart
│     ├─ 30-day trend line
│     └─ Insights + recommendations
│
├── /chat
│     └─ Chat thread with MealBot
│
└── /preorder
      ├─ Menu picker (upcoming meals)
      ├─ Order confirmation
      └─ Order history
```

**Cross-cutting links:**
- Every menu meal card → "Log this" → `/log`
- Scanner result → "View nutrition details" → `/nutrition`
- Dashboard insight → "See full breakdown" → `/nutrition`
- Chatbot response about a meal → "Log it" → `/log`

---

## 7. UX Reasoning

**Dashboard as the anchor**
All flows begin and end at the dashboard. It gives students the one number that matters most — calories today — at a glance. Every action loops back here so users always know where they stand without navigating deep.

**Onboarding is minimal and optional**
Students abandon setup screens quickly. The goal setup (calorie target) is the only meaningful input — it unlocks the nutrition ring. Everything else defaults to sensible values so the app is useful on the very first session.

**Scan-first, type-second**
The scanner is a top-level navigation item, not buried in the log flow. For a student at the mess tray, taking a photo is faster than typing. Manual search is a fallback, not the default — reducing friction where it most often occurs.

**Open Food Facts is called only on demand**
API calls happen after the user confirms the food name, not on every keystroke. This avoids rate limiting, reduces data usage on campus Wi-Fi, and keeps the UI responsive even when the API is slow.

**localStorage as the backbone**
Since there is no backend, every write to localStorage is immediate and synchronous. No loading states for saves — the UI updates optimistically. Data is structured by date key so the nutrition page can query any time range without iterating all records.

**Chatbot as a shortcut layer, not a replacement**
The chatbot is not the primary way to access information — it is a faster path for common repetitive queries ("what time is lunch?"). All chatbot responses that surface actionable data link directly to the relevant page, so it works as a navigation accelerator.

**Pre-order is low-stakes by design**
Since there is no backend fulfillment, pre-order is explicitly a preference signal — the UI makes this clear with copy like "Your preference has been saved." This sets honest expectations while building the habit and the data model for a future backend integration.

**Bottom nav on mobile, sidebar on desktop**
The six primary sections fit comfortably in a bottom navigation bar on mobile (≤ 768px) — the primary device context for students in a mess queue. On desktop, a collapsible sidebar shows labels alongside icons for faster orientation.
