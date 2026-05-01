/**
 * lib/nutrition.ts
 * Pure, UI-free functions for nutrition calculations and insights.
 * No side effects — safe to call anywhere including server components.
 */

import type { MenuItem, NutritionTotals, UserGoals } from "@/types/index";

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  highProtein: 30,   // g per serving — item is "High Protein"
  highFiber: 5,      // g — "High Fiber"
  lowFat: 5,         // g — "Low Fat"
  lowCal: 150,       // kcal — "Low Cal"
  highCarb: 50,      // g — "High Carb"
} as const;

// ─── Core calculation ─────────────────────────────────────────────────────────

/** Sums all macros from a list of MenuItems. */
export function calculateTotals(items: MenuItem[]): NutritionTotals {
  return items.reduce<NutritionTotals>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein:  acc.protein  + item.protein,
      carbs:    acc.carbs    + item.carbs,
      fat:      acc.fat      + item.fat,
      fiber:    acc.fiber    + item.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/** Returns zero NutritionTotals — useful as a safe default. */
export function emptyTotals(): NutritionTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
}

// ─── Tag generation ───────────────────────────────────────────────────────────

/**
 * Generates descriptive tags for a single MenuItem based on its macro profile.
 * Tags are additive — an item can have several.
 */
export function generateItemTags(item: MenuItem): string[] {
  const tags: string[] = [];
  if (item.protein >= THRESHOLDS.highProtein) tags.push("High Protein");
  if (item.fiber  >= THRESHOLDS.highFiber)   tags.push("High Fiber");
  if (item.fat    <= THRESHOLDS.lowFat)      tags.push("Low Fat");
  if (item.calories <= THRESHOLDS.lowCal)    tags.push("Low Cal");
  if (item.carbs  >= THRESHOLDS.highCarb)    tags.push("High Carb");
  return tags;
}

/**
 * Generates summary tags for a day's aggregated NutritionTotals.
 * Thresholds here are scaled to a full day (not per-item).
 */
export function generateDayTags(totals: NutritionTotals): string[] {
  const tags: string[] = [];
  if (totals.protein  >= 100) tags.push("High Protein Day");
  if (totals.fiber    >= 25)  tags.push("Fiber Rich Day");
  if (totals.fat      <= 40)  tags.push("Low Fat Day");
  if (totals.calories <= 1500) tags.push("Low Cal Day");
  if (totals.calories >= 2200) tags.push("High Cal Day");
  if (totals.carbs    >= 300)  tags.push("High Carb Day");
  return tags;
}

// ─── Goal comparison ──────────────────────────────────────────────────────────

/** Percentage completion for each macro toward user goals (0–100, capped at 100). */
export function compareAgainstGoals(
  totals: NutritionTotals,
  goals: UserGoals
): Record<keyof NutritionTotals, number> {
  const pct = (consumed: number, goal: number) =>
    goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;

  return {
    calories: pct(totals.calories, goals.calories),
    protein:  pct(totals.protein,  goals.protein),
    carbs:    pct(totals.carbs,    goals.carbs),
    fat:      pct(totals.fat,      goals.fat),
    fiber:    pct(totals.fiber,    goals.fiber),
  };
}

// ─── Insights ────────────────────────────────────────────────────────────────

/**
 * Returns human-readable insight strings based on how far the user is
 * from their daily nutrition goals.
 */
export function generateInsights(
  totals: NutritionTotals,
  goals: UserGoals
): string[] {
  const insights: string[] = [];
  const pcts = compareAgainstGoals(totals, goals);

  // Calories
  if ((pcts["calories"] ?? 0) < 40) {
    insights.push("Your calorie intake is quite low — make sure to eat enough.");
  } else if ((pcts["calories"] ?? 0) >= 95) {
    insights.push("You've nearly hit your calorie goal for today. Great job!");
  } else if ((pcts["calories"] ?? 0) > 100) {
    insights.push("You've exceeded your calorie goal for today.");
  }

  // Protein
  if ((pcts["protein"] ?? 0) < 50) {
    const remaining = goals.protein - totals.protein;
    insights.push(
      `You need ${remaining}g more protein today. Try curd, paneer, dal, or eggs.`
    );
  } else if ((pcts["protein"] ?? 0) >= 90) {
    insights.push("Excellent protein intake today — your muscles will thank you!");
  }

  // Fiber
  if ((pcts["fiber"] ?? 0) < 50) {
    insights.push(
      "Your fiber intake is low. Add more vegetables, salad, or whole grains."
    );
  }

  // Fat
  if (totals.fat > goals.fat) {
    insights.push(
      "You've gone over your fat goal. Consider lighter cooking options tomorrow."
    );
  }

  // Carbs
  if (totals.carbs > goals.carbs * 1.2) {
    insights.push("Your carb intake is significantly above target today.");
  }

  // Nothing logged
  if (totals.calories === 0) {
    insights.push("Nothing logged yet today — tap + on any dish to start tracking.");
  }

  return insights;
}

// ─── Remaining macros ────────────────────────────────────────────────────────

/** How much of each macro is still needed to reach goals (never negative). */
export function remainingToGoal(
  totals: NutritionTotals,
  goals: UserGoals
): NutritionTotals {
  return {
    calories: Math.max(0, goals.calories - totals.calories),
    protein:  Math.max(0, goals.protein  - totals.protein),
    carbs:    Math.max(0, goals.carbs    - totals.carbs),
    fat:      Math.max(0, goals.fat      - totals.fat),
    fiber:    Math.max(0, goals.fiber    - totals.fiber),
  };
}
