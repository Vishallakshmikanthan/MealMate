// Re-export all canonical types
export * from "./index";

// ─── Backward-compatible aliases ─────────────────────────────────────────────
export type { MenuItem as Dish } from "./index";
export type { DailyMenu as DayMeals } from "./index";
export type { WeeklyMenu as WeekMenu } from "./index";

/** Old tag union — now tags are plain strings; kept for build safety */
export type TagVariant = string;
