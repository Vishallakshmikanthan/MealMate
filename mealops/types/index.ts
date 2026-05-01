// ─── Primitives ───────────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";

export type DayKey =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// ─── Menu item ────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: number;
  name: string;
  type: "veg" | "non-veg";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags: string[];
}

// ─── Menu structure ───────────────────────────────────────────────────────────

export interface MealSection {
  time: string;
  items: MenuItem[];
}

export interface DailyMenu {
  breakfast: MealSection;
  lunch: MealSection;
  snacks: MealSection;
  dinner: MealSection;
}

export type WeeklyMenu = Record<DayKey, DailyMenu>;

// ─── Logging ──────────────────────────────────────────────────────────────────

export interface MealLog {
  id: string;
  date: string;               // ISO date string "YYYY-MM-DD"
  mealType: MealType;
  items: MenuItem[];
  totalCalories: number;
  timestamp: number;          // Unix ms
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
