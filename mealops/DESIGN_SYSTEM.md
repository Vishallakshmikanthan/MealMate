# MealOps — Design System

---

## 1. Color System

### Primary Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Verdant Green | `#16a34a` | CTAs, active nav, progress fills |
| Primary Light | Mint Mist | `#dcfce7` | Chip backgrounds, hover states |
| Primary Dark | Forest | `#15803d` | Pressed states, dark text on light |
| Secondary | Warm Slate | `#475569` | Body text, secondary labels |
| Accent | Sunrise Orange | `#f97316` | Calories badge, alerts, highlights |
| Accent Soft | Peach Glow | `#fff7ed` | Accent card backgrounds |

### Neutrals

| Role | Hex |
|---|---|
| Background | `#f8fafc` |
| Surface (cards) | `#ffffff` |
| Border | `#e2e8f0` |
| Muted Text | `#94a3b8` |
| Body Text | `#334155` |
| Headings | `#0f172a` |

### Semantic Colors

| State | Hex | Usage |
|---|---|---|
| Success | `#22c55e` | Logged, confirmed |
| Warning | `#f59e0b` | Near limit, caution |
| Error | `#ef4444` | Allergen alert, failed scan |
| Info | `#3b82f6` | Tips, chatbot messages |

### Gradients

Used sparingly — only on hero areas, stat cards, and empty states. Never on interactive elements.

```
Hero gradient:    linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)
Card accent top:  linear-gradient(180deg, #dcfce7 0%, transparent 60%)
Calorie ring bg:  conic-gradient(#16a34a {progress}%, #e2e8f0 0%)
Chatbot bubble:   linear-gradient(135deg, #16a34a, #15803d)
```

**Design decision:** Green as primary signals health, freshness, and nutrition — directly tied to the product's purpose. Orange as accent creates contrast for high-urgency data (calories remaining, pre-order deadlines) without clashing. The background stays off-white (`#f8fafc`) rather than pure white to reduce eye strain during daily use.

---

## 2. Typography

### Font Pairing

| Role | Font | Source |
|---|---|---|
| Display / Headings | **Plus Jakarta Sans** | Google Fonts |
| Body / UI | **Inter** | Google Fonts |

Plus Jakarta Sans brings personality and premium feel to large titles. Inter is the gold standard for UI legibility at small sizes. They share geometric construction so they pair naturally without tension.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 36px | 700 | 1.15 | Page heroes, onboarding |
| `h1` | 28px | 700 | 1.2 | Page titles |
| `h2` | 22px | 600 | 1.25 | Section headings |
| `h3` | 18px | 600 | 1.3 | Card titles |
| `h4` | 16px | 600 | 1.35 | Sub-section labels |
| `body-lg` | 16px | 400 | 1.6 | Primary body copy |
| `body` | 14px | 400 | 1.6 | Standard UI text |
| `body-sm` | 13px | 400 | 1.5 | Captions, metadata |
| `label` | 12px | 500 | 1.4 | Form labels, tags |
| `mono` | 13px | 400 | 1.5 | Calorie numbers, macros |

**Design decision:** Macro values (calories, protein, carbs) use a monospaced variant so numbers don't jump as they update — critical for a nutrition tracker where users scan numbers at a glance.

### Letter Spacing

- Headings: `-0.02em` (tighter, premium feel)
- Body: `0` (default, optimized for Inter)
- Labels / caps: `+0.05em` (slightly open for uppercase metadata)

---

## 3. Component Design

### Cards

The card is the dominant unit across every page — menu items, meal logs, nutrition stats, chat messages.

**Base card:**
- Background: `#ffffff`
- Border: `1px solid #e2e8f0`
- Border radius: `16px`
- Shadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`
- Padding: `20px 24px`

**Stat card (dashboard metrics):**
- Accent top border: `3px solid var(--primary)`
- Soft gradient header: `#f0fdf4 → transparent`
- Large number in display font, label below in muted

**Meal card (menu page):**
- Left color bar (`4px`, color varies by meal type: green = veg, amber = non-veg)
- Food name in `h4`, items listed in `body-sm`
- Nutritional tags inline at bottom

**Hover state on all cards:**
- Shadow lifts: `0 4px 24px rgba(0,0,0,0.08)`
- Translate: `translateY(-2px)`
- Transition: `200ms ease`

---

### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | `#16a34a` | `#ffffff` | none | Log meal, confirm, get started |
| **Primary Hover** | `#15803d` | `#ffffff` | none | |
| **Secondary** | `#f1f5f9` | `#334155` | none | Cancel, go back |
| **Secondary Hover** | `#e2e8f0` | `#0f172a` | none | |
| **Ghost** | transparent | `#16a34a` | `1px solid #16a34a` | View details, secondary actions |
| **Ghost Hover** | `#f0fdf4` | `#15803d` | `1px solid #15803d` | |
| **Destructive** | `#fef2f2` | `#ef4444` | `1px solid #fecaca` | Delete log, cancel order |
| **Disabled** | `#f1f5f9` | `#94a3b8` | none | Any inactive state |

**Sizing:**
- Large: `48px` height, `16px` horizontal padding — primary CTAs
- Default: `40px` height, `14px` horizontal padding — most UI actions
- Small: `32px` height, `12px` horizontal padding — inline, tags

**Shape:** `border-radius: 10px` — rounded but not pill-shaped. Pill shape reserved only for tags.

---

### Inputs

```
Height:          44px
Border:          1.5px solid #e2e8f0
Border radius:   10px
Background:      #ffffff
Padding:         12px 14px
Font size:       14px / Inter
Color:           #334155

Focus ring:      1.5px solid #16a34a + box-shadow: 0 0 0 3px #dcfce7
Error state:     border: 1.5px solid #ef4444 + bg: #fef2f2
Placeholder:     #94a3b8
```

Search inputs get a leading search icon (`16px`, muted) and a subtle inner shadow on focus to signal active state.

---

### Tags / Chips

Tags are used for nutritional labels, dietary flags, and meal categories.

| Tag | Background | Text | Border |
|---|---|---|---|
| Veg | `#dcfce7` | `#15803d` | none |
| Non-veg | `#fff7ed` | `#c2410c` | none |
| High Protein | `#eff6ff` | `#1d4ed8` | none |
| High Fibre | `#faf5ff` | `#7c3aed` | none |
| Low Calorie | `#f0fdf4` | `#16a34a` | none |
| Allergen | `#fef2f2` | `#ef4444` | `1px solid #fecaca` |

**Shape:** `border-radius: 999px` (full pill)
**Size:** `24px` height, `10px 12px` padding, `12px / 500` font

---

## 4. Layout System

### Spacing Scale (base-4, rem)

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon padding, tight gaps |
| `space-2` | 8px | Between inline elements |
| `space-3` | 12px | Tag gaps, compact lists |
| `space-4` | 16px | Card inner padding (tight) |
| `space-5` | 20px | Standard gap |
| `space-6` | 24px | Card padding, section gaps |
| `space-8` | 32px | Between sections |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Large section breaks |

### Grid System

**Desktop (≥ 1024px):**
- Sidebar: `240px` fixed, collapsible to `64px` (icons only)
- Content area: `1fr`
- Max content width: `1200px`
- Column grid: `12-column`, `24px` gutter

**Tablet (768–1023px):**
- No sidebar — bottom nav
- Content: full width, `24px` horizontal padding
- Grid: `8-column`

**Mobile (< 768px):**
- Bottom navigation bar (`56px` height)
- Content: full width, `16px` horizontal padding
- Grid: `4-column` or single column stacked

### Card Grid Patterns

| Context | Layout |
|---|---|
| Dashboard stats | `2-col` on mobile, `4-col` on desktop |
| Menu weekly view | Horizontal scroll on mobile, `7-col` fixed on desktop |
| Meal log list | Single column, full width |
| Nutrition charts | `1-col` stacked, full width |
| Pre-order picker | `2-col` card grid |

**Design decision:** Card-based layout over table-based. Cards work across all breakpoints, can surface the most important data prominently, and feel modern. Tables are only used inside cards (macro breakdown) — never as a primary layout unit.

---

## 5. Interaction Design

### Hover Effects

| Element | Effect |
|---|---|
| Cards | `translateY(-2px)` + shadow lift, `200ms ease` |
| Primary button | Background darkens `#15803d`, `150ms ease` |
| Ghost button | Background fill fades in, `150ms ease` |
| Nav items | Left bar slides in (desktop), background pill appears |
| Tags | Slight opacity increase `0.85 → 1.0` |
| Meal row | Row background `→ #f8fafc`, `150ms` |

### Micro-animations

| Trigger | Animation |
|---|---|
| Meal logged | Nutrition ring animates from old to new value, `600ms ease-out` |
| Toast notification | Slides in from bottom-right, auto-dismiss with fade, `300ms` |
| Page transition | `opacity: 0 → 1` + `translateY(8px → 0)`, `250ms` |
| Chatbot response | Types in character-by-character with blinking cursor |
| Scanner result | Card slides up from bottom sheet, `350ms spring` |
| Calorie goal hit | Ring pulses green once, confetti micro-burst |
| Pre-order confirmed | Checkmark draws itself (SVG stroke animation), `400ms` |
| Accordion expand | `height: 0 → auto` with `200ms ease`, content fades in |

**Design decision:** All animations are under `400ms` except the calorie ring (deliberate, satisfying). No looping animations in the UI — they cause visual fatigue for an app used 3–4 times daily.

### Loading States

| Context | Treatment |
|---|---|
| Page load | Skeleton screens — card-shaped grey pulses, never a spinner |
| API fetch (Open Food Facts) | Inline skeleton in the nutrition card area |
| Scanner classification | Animated scan line over image preview |
| Chatbot thinking | Three dot pulse (`● ● ●`), same bubble style as messages |
| Pre-order submit | Button label → spinner → checkmark, no full page load |

**Skeleton color:** `#f1f5f9` → `#e2e8f0` pulsing, `1.5s` cycle, `ease-in-out`

---

## 6. Theming

### Light Mode (default)

The primary experience. Soft off-white background, white surfaces, green primary. Optimized for daytime use — in a mess hall, between classes, outdoors.

```
--background:   #f8fafc
--surface:      #ffffff
--foreground:   #0f172a
--border:       #e2e8f0
--muted:        #94a3b8
```

### Dark Mode (optional)

Activated via system preference (`prefers-color-scheme: dark`) or manual toggle stored in `localStorage`.

```
--background:   #0f172a
--surface:      #1e293b
--foreground:   #f1f5f9
--border:       #334155
--muted:        #64748b
--primary:      #4ade80   (lighter green for dark bg contrast)
--accent:       #fb923c   (lighter orange)
```

**Dark mode card shadow:** `0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)` — stronger since shadows don't read on dark backgrounds otherwise.

**Design decision:** Dark mode uses `#0f172a` (Slate-900) rather than true black (`#000000`). Pure black makes white text feel harsh and surfaces lose definition. The slate family maintains contrast without being aggressive — better for late-night pre-ordering before bed.

---

## Design Decisions Summary

| Decision | Reason |
|---|---|
| Green primary | Direct association with food, health, nature — no translation required |
| Orange accent | Warm, energetic contrast to green; signals calories and action without alarm |
| Off-white background | Reduces eye strain; students use this app multiple times daily |
| 16px card radius | Soft, approachable — not sterile (8px) or toy-like (24px+) |
| Plus Jakarta Sans for headings | Personality without being loud; premium SaaS feel |
| Inter for body | Best-in-class screen legibility; students read macros in poor mess lighting |
| No full-page spinners | Skeleton screens respect layout; spinners create anxiety, skeletons create patience |
| Animations ≤ 400ms | Snappy enough to feel reactive; slow enough to feel polished |
| Card-first layout | Works on any screen; scales from one stat to a full dashboard without redesign |
| Pill tags only for labels | Tags need to feel "soft" and informational, not like buttons |
