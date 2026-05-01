/**
 * lib/chatbot.ts
 * Fully offline, regex-based intent engine for MealOps.
 * Data source: local weeklyMenu only — no external API calls.
 */

import Fuse from "fuse.js";
import type { MenuItem, MealType, DayKey } from "@/types/index";
import {
  weeklyMenu,
  DAYS,
  DAY_ABBR,
  MEAL_ORDER,
  getTodayKey,
  getTodayMenu,
  getAllMenuItems,
  getItemsByTag,
} from "@/data/menu-week";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  /** Optional structured list to render as chips / cards */
  items?: MenuItem[];
  timestamp: number;
}

// ─── Fuse instance ────────────────────────────────────────────────────────────

let _fuse: Fuse<MenuItem> | null = null;

function getFuse(): Fuse<MenuItem> {
  if (_fuse) return _fuse;
  _fuse = new Fuse(getAllMenuItems(), {
    keys: ["name", "tags"],
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 3,
  });
  return _fuse;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function bot(text: string, items?: MenuItem[]): ChatMessage {
  return { id: uid(), role: "bot", text, items, timestamp: Date.now() };
}

function mealTypeLabel(t: MealType): string {
  const map: Record<MealType, string> = {
    breakfast: "Breakfast 🌅",
    lunch:     "Lunch ☀️",
    snacks:    "Snacks 🫖",
    dinner:    "Dinner 🌙",
  };
  return map[t];
}

function formatTime(t: MealType): string {
  const times: Record<MealType, string> = {
    breakfast: "7:30 – 9:30 AM",
    lunch:     "12:30 – 2:30 PM",
    snacks:    "4:30 – 5:30 PM",
    dinner:    "7:30 – 9:30 PM",
  };
  return times[t];
}

function itemLine(item: MenuItem): string {
  return `• ${item.name} — ${item.calories} kcal (P: ${item.protein}g, C: ${item.carbs}g, F: ${item.fat}g)`;
}

function sectionSummary(items: MenuItem[]): string {
  return items.map(itemLine).join("\n");
}

// ─── Intent patterns ──────────────────────────────────────────────────────────

const GREET        = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste)/i;
const TODAY_MENU   = /today'?s?\s*menu|what'?s?\s*(for\s*)?(today|tonight)|full\s*menu/i;
const BREAKFAST    = /breakfast/i;
const LUNCH        = /lunch/i;
const SNACKS       = /snack/i;
const DINNER       = /dinner/i;
const HIGH_PROTEIN = /high\s*protein|protein\s*rich|most\s*protein|best\s*protein/i;
const LOW_CAL      = /low\s*cal(orie)?|light\s*(meal|food|dish)|fewest\s*cal/i;
const HIGH_FIBER   = /high\s*fi(b|bre)er|fi(b|bre)er\s*rich/i;
const VEG_ONLY     = /\bveg\b(?!etable)|vegetarian|no\s*meat|plant.based/i;
const NON_VEG      = /non.?veg|meat|chicken|egg|mutton/i;
const TIMINGS      = /time|timing|when|schedule|hours?|open/i;
const WEEKLY_MENU  = /week(ly)?\s*menu|all\s*days?|every\s*day/i;
const CALORIES_Q   = /calorie|kcal|how\s*many\s*cal/i;
const HELP         = /help|what\s*(can|do)\s*(you|u)\s*(do|know)|commands?|options?/i;
const SPICY        = /spicy|hot\s*food/i;
const THANKS       = /thank(s| you)|thx|ty\b/i;

// ─── Day name detection ───────────────────────────────────────────────────────

const DAY_PATTERNS: Record<DayKey, RegExp> = {
  Monday:    /\bmon(day)?\b/i,
  Tuesday:   /\btue(sday)?\b/i,
  Wednesday: /\bwed(nesday)?\b/i,
  Thursday:  /\bthu(rsday)?\b/i,
  Friday:    /\bfri(day)?\b/i,
  Saturday:  /\bsat(urday)?\b/i,
  Sunday:    /\bsun(day)?\b/i,
};

function detectDayKey(input: string): DayKey | null {
  for (const [day, re] of Object.entries(DAY_PATTERNS) as [DayKey, RegExp][]) {
    if (re.test(input)) return day;
  }
  return null;
}

// ─── Intent handlers ──────────────────────────────────────────────────────────

function handleGreet(): ChatMessage {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return bot(
    `Good ${part}! 👋 I'm MealBot — your mess guide.\n` +
    `Ask me about today's menu, meal timings, high-protein dishes, or search for any food!`
  );
}

function handleHelp(): ChatMessage {
  return bot(
    `Here's what I can help with:\n\n` +
    `📋 *"What's today's menu?"*\n` +
    `🍳 *"What's for breakfast/lunch/snacks/dinner?"*\n` +
    `⏰ *"Mess timings"*\n` +
    `💪 *"High protein foods"*\n` +
    `🥗 *"Low calorie options"*\n` +
    `🌿 *"Veg only"* / 🍗 *"Non-veg"*\n` +
    `📅 *"Monday's menu"*\n` +
    `🔍 *"Search idli"* — search any dish\n\n` +
    `Just type naturally — I'll figure it out!`
  );
}

function handleMealType(type: MealType, dayKey?: DayKey | null): ChatMessage {
  const key = dayKey ?? getTodayKey();
  const menu = weeklyMenu[key];
  const section = menu[type];
  const label = mealTypeLabel(type);
  const time = formatTime(type);

  if (!section.items.length) {
    return bot(`No ${type} items found for ${key}.`);
  }

  const totalCal = section.items.reduce((s, i) => s + i.calories, 0);
  return bot(
    `**${label} — ${key}** (${time})\n` +
    `Total: ~${totalCal} kcal\n\n` +
    sectionSummary(section.items),
    section.items
  );
}

function handleTodayMenu(): ChatMessage {
  const todayKey = getTodayKey();
  const menu = getTodayMenu();

  const lines: string[] = [`**Today's Full Menu — ${todayKey}**\n`];
  let dayTotal = 0;

  for (const type of MEAL_ORDER) {
    const section = menu[type];
    const sectionCal = section.items.reduce((s, i) => s + i.calories, 0);
    dayTotal += sectionCal;
    lines.push(`**${mealTypeLabel(type)}** (${section.time}) — ${sectionCal} kcal`);
    section.items.forEach((item) => lines.push(`  · ${item.name}`));
    lines.push("");
  }
  lines.push(`🔥 Daily total: ~${dayTotal} kcal`);

  return bot(lines.join("\n"), getTodayMenu().breakfast.items);
}

function handleWeeklyMenu(): ChatMessage {
  const lines: string[] = ["**Weekly Mess Menu**\n"];
  for (const day of DAYS) {
    const menu = weeklyMenu[day];
    const dayTotal = MEAL_ORDER.reduce(
      (s, t) => s + menu[t].items.reduce((ss, i) => ss + i.calories, 0),
      0
    );
    lines.push(
      `**${day}** (${DAY_ABBR[day]}) — ~${dayTotal} kcal\n` +
      MEAL_ORDER.map((t) =>
        `  ${mealTypeLabel(t)}: ` +
        menu[t].items.map((i) => i.name).join(", ")
      ).join("\n")
    );
    lines.push("");
  }
  return bot(lines.join("\n").trim());
}

function handleHighProtein(): ChatMessage {
  const items = getItemsByTag("high-protein")
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 8);

  if (!items.length) {
    return bot("Couldn't find high-protein items in today's menu.");
  }

  return bot(
    `💪 **High-Protein Dishes** (today's menu):\n\n` +
    items.map((i) => `• ${i.name} — ${i.protein}g protein, ${i.calories} kcal`).join("\n"),
    items
  );
}

function handleLowCal(): ChatMessage {
  const items = getAllMenuItems()
    .filter((i) => i.calories <= 150)
    .sort((a, b) => a.calories - b.calories)
    .slice(0, 8);

  return bot(
    `🥗 **Light / Low-Calorie Options:**\n\n` +
    items.map((i) => `• ${i.name} — ${i.calories} kcal`).join("\n"),
    items
  );
}

function handleHighFiber(): ChatMessage {
  const items = getItemsByTag("high-fiber")
    .sort((a, b) => b.fiber - a.fiber)
    .slice(0, 8);

  return bot(
    `🌾 **High-Fiber Dishes:**\n\n` +
    items.map((i) => `• ${i.name} — ${i.fiber}g fiber, ${i.calories} kcal`).join("\n"),
    items
  );
}

function handleVegOnly(): ChatMessage {
  const items = getAllMenuItems()
    .filter((i) => i.type === "veg")
    .slice(0, 12);
  return bot(
    `🌿 **Veg Items in the Menu:**\n\n` +
    items.map((i) => `• ${i.name} — ${i.calories} kcal`).join("\n"),
    items
  );
}

function handleNonVeg(): ChatMessage {
  const items = getAllMenuItems().filter((i) => i.type === "non-veg");
  if (!items.length) {
    return bot("No non-veg items found in the current menu.");
  }
  return bot(
    `🍗 **Non-Veg Items:**\n\n` +
    items.map((i) => `• ${i.name} — ${i.calories} kcal (P: ${i.protein}g)`).join("\n"),
    items
  );
}

function handleTimings(): ChatMessage {
  return bot(
    `⏰ **Mess Timings:**\n\n` +
    `🌅 Breakfast  —  7:30 – 9:30 AM\n` +
    `☀️  Lunch       —  12:30 – 2:30 PM\n` +
    `🫖 Snacks      —  4:30 – 5:30 PM\n` +
    `🌙 Dinner      —  7:30 – 9:30 PM`
  );
}

function handleSpicy(): ChatMessage {
  const items = getItemsByTag("spicy").slice(0, 8);
  return bot(
    `🌶️ **Spicy Items:**\n\n` +
    items.map((i) => `• ${i.name} — ${i.calories} kcal`).join("\n"),
    items
  );
}

function handleFuzzySearch(input: string): ChatMessage {
  const results = getFuse().search(input);
  if (!results.length) {
    return handleFallback(input);
  }

  const items = results.slice(0, 5).map((r) => r.item);
  return bot(
    `🔍 **Found ${items.length} match${items.length > 1 ? "es" : ""} for "${input}":**\n\n` +
    items.map(itemLine).join("\n"),
    items
  );
}

function handleCaloriesQuery(input: string): ChatMessage {
  // Try to find a dish name in the query
  const cleaned = input
    .replace(/calorie|kcal|how many|in|of|calories|does|have|contain/gi, "")
    .trim();

  if (cleaned.length < 3) {
    const today = getTodayKey();
    const menu = getTodayMenu();
    const total = MEAL_ORDER.reduce(
      (s, t) => s + menu[t].items.reduce((ss, i) => ss + i.calories, 0),
      0
    );
    return bot(
      `Today's (${today}) full menu totals **~${total} kcal** if you eat everything.\n` +
      `Ask about a specific dish for its exact calories!`
    );
  }

  return handleFuzzySearch(cleaned);
}

function handleDayMenu(dayKey: DayKey): ChatMessage {
  const menu = weeklyMenu[dayKey];
  const lines: string[] = [`**${dayKey}'s Menu**\n`];
  let total = 0;
  for (const type of MEAL_ORDER) {
    const section = menu[type];
    const cal = section.items.reduce((s, i) => s + i.calories, 0);
    total += cal;
    lines.push(`**${mealTypeLabel(type)}** — ${cal} kcal`);
    section.items.forEach((i) => lines.push(`  · ${i.name}`));
    lines.push("");
  }
  lines.push(`🔥 Total: ~${total} kcal`);
  return bot(lines.join("\n").trim());
}

function handleFallback(input: string): ChatMessage {
  return bot(
    `Hmm, I didn't quite get that 🤔\n\n` +
    `Try asking:\n` +
    `• "What's today's menu?"\n` +
    `• "High protein foods"\n` +
    `• "Mess timings"\n` +
    `• "Veg only"\n` +
    `• Or just type a dish name to search!\n\n` +
    `*(You typed: "${input}")*`
  );
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Processes a user message and returns a bot reply.
 * Always resolves synchronously — no awaits needed from the UI.
 */
export function processMessage(input: string): ChatMessage {
  const text = input.trim();
  if (!text) return bot("Type something and I'll help! 😊");

  // Greetings
  if (GREET.test(text))    return handleGreet();
  if (THANKS.test(text))   return bot("You're welcome! 😊 Anything else?");
  if (HELP.test(text))     return handleHelp();

  // Menu queries
  if (TODAY_MENU.test(text))  return handleTodayMenu();
  if (WEEKLY_MENU.test(text)) return handleWeeklyMenu();

  // Specific day — check before meal type to catch "Monday lunch"
  const dayKey = detectDayKey(text);
  if (dayKey) {
    // Check if they also want a specific meal type
    if (BREAKFAST.test(text)) return handleMealType("breakfast", dayKey);
    if (LUNCH.test(text))     return handleMealType("lunch",     dayKey);
    if (SNACKS.test(text))    return handleMealType("snacks",    dayKey);
    if (DINNER.test(text))    return handleMealType("dinner",    dayKey);
    return handleDayMenu(dayKey);
  }

  // Meal types (today)
  if (BREAKFAST.test(text)) return handleMealType("breakfast");
  if (LUNCH.test(text))     return handleMealType("lunch");
  if (SNACKS.test(text))    return handleMealType("snacks");
  if (DINNER.test(text))    return handleMealType("dinner");

  // Nutrition filters
  if (HIGH_PROTEIN.test(text)) return handleHighProtein();
  if (LOW_CAL.test(text))      return handleLowCal();
  if (HIGH_FIBER.test(text))   return handleHighFiber();
  if (VEG_ONLY.test(text))     return handleVegOnly();
  if (NON_VEG.test(text))      return handleNonVeg();
  if (SPICY.test(text))        return handleSpicy();

  // Timings
  if (TIMINGS.test(text)) return handleTimings();

  // Calorie questions
  if (CALORIES_Q.test(text)) return handleCaloriesQuery(text);

  // Fuzzy dish search as last resort
  return handleFuzzySearch(text);
}

// ─── Welcome message ──────────────────────────────────────────────────────────

export function getWelcomeMessage(): ChatMessage {
  return bot(
    `Hi! I'm **MealBot** 🍱 — your mess assistant.\n\n` +
    `Ask me about today's menu, meal timings, or search for any dish.\n` +
    `Type **"help"** to see all commands!`
  );
}
