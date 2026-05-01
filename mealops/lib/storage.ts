/**
 * lib/storage.ts
 * Type-safe localStorage abstraction for MealOps.
 * All functions are safe to call on the server (no-ops / nulls when no window).
 */

import type { MealLog, MenuItem, MealType, NutritionTotals, UserGoals } from "@/types/index";
import { calculateTotals } from "./nutrition";

// ─── Storage key helpers ──────────────────────────────────────────────────────

const KEYS = {
  logsForDate: (date: string) => `mealops:logs:${date}`,
  preorderForDate: (date: string) => `mealops:preorder:${date}`,
  userGoals: "mealops:goals",
} as const;

// ─── Runtime type guards ─────────────────────────────────────────────────────

function isMealLog(obj: unknown): obj is MealLog {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.date === "string" &&
    typeof o.mealType === "string" &&
    Array.isArray(o.items) &&
    typeof o.totalCalories === "number" &&
    typeof o.timestamp === "number"
  );
}

function isUserGoals(obj: unknown): obj is UserGoals {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.calories === "number" &&
    typeof o.protein === "number" &&
    typeof o.carbs === "number" &&
    typeof o.fat === "number" &&
    typeof o.fiber === "number"
  );
}

// ─── Generic primitives ───────────────────────────────────────────────────────

function storageGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function storageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private-mode restriction — fail silently.
  }
}

function storageDelete(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

// ─── Date helper ─────────────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" in local time. */
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Meal log operations ──────────────────────────────────────────────────────

/** Retrieves all MealLogs for a given date. Validates shape before use. */
export function getLogsForDate(date: string): MealLog[] {
  const raw = storageGet<unknown[]>(KEYS.logsForDate(date));
  if (!Array.isArray(raw)) return [];
  return raw.filter(isMealLog);
}

/**
 * Adds a single MenuItem to the log for the given date + mealType.
 * Creates the log entry if it doesn't exist yet.
 */
export function addItemToLog(
  date: string,
  mealType: MealType,
  item: MenuItem
): void {
  const logs = getLogsForDate(date);
  const existing = logs.find((l) => l.mealType === mealType);

  if (existing) {
    // Avoid duplicate items
    const alreadyIn = existing.items.some((i) => i.id === item.id);
    if (!alreadyIn) {
      existing.items.push(item);
      existing.totalCalories += item.calories;
      existing.timestamp = Date.now();
    }
  } else {
    const newLog: MealLog = {
      id: `${date}-${mealType}-${Date.now()}`,
      date,
      mealType,
      items: [item],
      totalCalories: item.calories,
      timestamp: Date.now(),
    };
    logs.push(newLog);
  }

  storageSet(KEYS.logsForDate(date), logs);
  dispatchStorageUpdate();
}

/** Removes a single MenuItem (by id) from the log for date + mealType. */
export function removeItemFromLog(
  date: string,
  mealType: MealType,
  itemId: number
): void {
  const logs = getLogsForDate(date);
  const existing = logs.find((l) => l.mealType === mealType);
  if (!existing) return;

  existing.items = existing.items.filter((i) => i.id !== itemId);
  existing.totalCalories = existing.items.reduce((s, i) => s + i.calories, 0);
  existing.timestamp = Date.now();

  storageSet(KEYS.logsForDate(date), logs);
  dispatchStorageUpdate();
}

/** Returns true if the item is already in the log for date + mealType. */
export function isItemLogged(
  date: string,
  mealType: MealType,
  itemId: number
): boolean {
  const logs = getLogsForDate(date);
  const entry = logs.find((l) => l.mealType === mealType);
  return entry?.items.some((i) => i.id === itemId) ?? false;
}

/** Removes an entire MealLog entry by its log id. */
export function removeLogItem(logId: string): void {
  // Find which date this log belongs to by scanning all stored keys
  if (typeof window === "undefined") return;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith("mealops:logs:")) continue;
      const date = key.replace("mealops:logs:", "");
      const logs = getLogsForDate(date);
      const filtered = logs.filter((l) => l.id !== logId);
      if (filtered.length !== logs.length) {
        storageSet(KEYS.logsForDate(date), filtered);
        dispatchStorageUpdate();
        return;
      }
    }
  } catch {
    // no-op
  }
}

/** Deletes all logs for a given date. */
export function clearLogsForDate(date: string): void {
  storageDelete(KEYS.logsForDate(date));
  dispatchStorageUpdate();
}

// ─── Nutrition aggregation ────────────────────────────────────────────────────

/** Calculates combined NutritionTotals from all logs on a given date. */
export function getTotalsForDate(date: string): NutritionTotals {
  const logs = getLogsForDate(date);
  const allItems = logs.flatMap((l) => l.items);
  return calculateTotals(allItems);
}

/**
 * Returns an array of { date, totals } for the 7 days ending today (inclusive).
 * Days with no logs return zero totals.
 */
export function getWeeklyTotals(): Array<{ date: string; totals: NutritionTotals }> {
  const result: Array<{ date: string; totals: NutritionTotals }> = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    result.push({ date: dateStr, totals: getTotalsForDate(dateStr) });
  }

  return result;
}

// ─── Pre-order storage ────────────────────────────────────────────────────────

export interface PreorderEntry {
  mealType: MealType;
  items: MenuItem[];
}

/** Returns all pre-order entries for a given date. */
export function getPreorder(date: string): PreorderEntry[] {
  return storageGet<PreorderEntry[]>(KEYS.preorderForDate(date)) ?? [];
}

/** Adds a MenuItem to the pre-order for a given date + mealType. */
export function addPreorderItem(
  date: string,
  mealType: MealType,
  item: MenuItem
): void {
  const entries = getPreorder(date);
  const entry = entries.find((e) => e.mealType === mealType);

  if (entry) {
    if (!entry.items.some((i) => i.id === item.id)) {
      entry.items.push(item);
    }
  } else {
    entries.push({ mealType, items: [item] });
  }

  storageSet(KEYS.preorderForDate(date), entries);
}

/** Removes a MenuItem from the pre-order for a given date + mealType. */
export function removePreorderItem(
  date: string,
  mealType: MealType,
  itemId: number
): void {
  const entries = getPreorder(date);
  const entry = entries.find((e) => e.mealType === mealType);
  if (!entry) return;
  entry.items = entry.items.filter((i) => i.id !== itemId);
  storageSet(KEYS.preorderForDate(date), entries);
}

/** Replaces the entire pre-order for a date. */
export function savePreorder(date: string, entries: PreorderEntry[]): void {
  storageSet(KEYS.preorderForDate(date), entries);
}

/** Clears the pre-order for a date. */
export function clearPreorder(date: string): void {
  storageDelete(KEYS.preorderForDate(date));
}

// ─── User goals ───────────────────────────────────────────────────────────────

const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
  fiber: 30,
};

/** Returns the user's saved goals, or sensible defaults if none are set. Validates shape. */
export function getUserGoals(): UserGoals {
  const raw = storageGet<unknown>(KEYS.userGoals);
  if (isUserGoals(raw)) return raw;
  return { ...DEFAULT_GOALS };
}

/** Persists the user's nutrition goals. */
export function setUserGoals(goals: UserGoals): void {
  storageSet(KEYS.userGoals, goals);
}

/**
 * Merges partial goal updates into the existing goals.
 */
export function updateUserGoals(partial: Partial<UserGoals>): void {
  const current = getUserGoals();
  setUserGoals({ ...current, ...partial });
}

// ─── Cross-component update bus ───────────────────────────────────────────────

const STORAGE_UPDATE_EVENT = "mealops:storage-update";

/**
 * Dispatches a custom DOM event so that any open component listening via
 * useStorageUpdate() can re-fetch data without a page reload.
 */
function dispatchStorageUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
}

/**
 * Returns a cleanup function.  Call this inside a useEffect to subscribe
 * to meal-log mutations from any part of the app.
 */
export function onStorageUpdate(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(STORAGE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
}
