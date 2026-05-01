"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, CheckCircle2 } from "lucide-react";
import type { MealType, DayKey, MenuItem, MealSection as MealSectionType } from "@/types/index";
import {
  weeklyMenu,
  DAYS,
  DAY_ABBR,
  MEAL_ORDER,
  getTodayKey,
} from "@/data/menu-week";
import {
  getTodayDateString,
  isItemLogged,
  addItemToLog,
  removeItemFromLog,
  onStorageUpdate,
} from "@/lib/storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_META: Record<
  MealType,
  { label: string; emoji: string; gradient: string; border: string }
> = {
  breakfast: { label: "Breakfast",      emoji: "\uD83C\uDF05", gradient: "from-amber-50 to-yellow-50",   border: "border-amber-100" },
  lunch:     { label: "Lunch",          emoji: "\u2600\uFE0F",  gradient: "from-green-50 to-emerald-50",  border: "border-green-100" },
  snacks:    { label: "Evening Snacks", emoji: "\uD83E\uDED6", gradient: "from-orange-50 to-red-50",     border: "border-orange-100" },
  dinner:    { label: "Dinner",         emoji: "\uD83C\uDF19", gradient: "from-indigo-50 to-purple-50",  border: "border-indigo-100" },
};

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  veg:            { bg: "bg-green-100",  text: "text-green-700"  },
  "non-veg":      { bg: "bg-amber-100",  text: "text-amber-700"  },
  "high-protein": { bg: "bg-blue-100",   text: "text-blue-700"   },
  "high-fiber":   { bg: "bg-purple-100", text: "text-purple-700" },
  "low-cal":      { bg: "bg-slate-100",  text: "text-slate-600"  },
  spicy:          { bg: "bg-red-100",    text: "text-red-600"    },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the date object for the given DAYS index (0=Mon…6=Sun) relative to today. */
function dateForDayIndex(i: number): Date {
  const today = new Date();
  const todayJsDay = today.getDay(); // 0=Sun…6=Sat
  const todayDayIdx = todayJsDay === 0 ? 6 : todayJsDay - 1; // 0=Mon…6=Sun
  const d = new Date(today);
  d.setDate(today.getDate() + (i - todayDayIdx));
  return d;
}

/** "YYYY-MM-DD" for the given DAYS index. */
function dateStringForDayIndex(i: number): string {
  const d = dateForDayIndex(i);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DishCard({
  dish,
  date,
  mealType,
}: {
  dish: MenuItem;
  date: string;
  mealType: MealType;
}) {
  const [logged, setLogged] = useState(() =>
    isItemLogged(date, mealType, dish.id)
  );

  // Keep state in sync if the date / mealType props change (day switch)
  useEffect(() => {
    setLogged(isItemLogged(date, mealType, dish.id));
  }, [date, mealType, dish.id]);

  // Keep state in sync when another component mutates storage
  useEffect(() => {
    const cleanup = onStorageUpdate(() => {
      setLogged(isItemLogged(date, mealType, dish.id));
    });
    return cleanup;
  }, [date, mealType, dish.id]);

  function handleToggle() {
    if (logged) {
      removeItemFromLog(date, mealType, dish.id);
    } else {
      addItemToLog(date, mealType, dish);
    }
    // Storage module dispatches the event; local state stays in sync via the listener.
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dish.type === "veg" ? "bg-green-500" : "bg-red-500"}`} />
          <p className="text-sm font-semibold text-slate-800 truncate">{dish.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />
            {dish.calories} kcal
          </span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-400">{dish.protein}g P · {dish.carbs}g C · {dish.fat}g F</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {dish.tags.slice(0, 3).map((tag) => {
            const style = TAG_STYLES[tag] ?? { bg: "bg-slate-100", text: "text-slate-600" };
            return (
              <span
                key={tag}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleToggle}
        aria-label={logged ? "Remove from log" : "Log this dish"}
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          logged
            ? "bg-primary-50 text-primary-500 ring-1 ring-primary-200"
            : "bg-slate-50 text-slate-300 hover:bg-primary-50 hover:text-primary-400"
        }`}
      >
        {logged ? (
          <CheckCircle2 size={17} strokeWidth={2.5} />
        ) : (
          <Plus size={17} strokeWidth={2} />
        )}
      </button>
    </motion.div>
  );
}

function MealSectionPanel({
  type,
  section,
  date,
}: {
  type: MealType;
  section: MealSectionType;
  date: string;
}) {
  const meta = MEAL_META[type];
  const totalCal = section.items.reduce((sum, d) => sum + d.calories, 0);

  return (
    <section>
      <div
        className={`flex items-center justify-between bg-gradient-to-r ${meta.gradient} border ${meta.border} rounded-2xl px-4 py-3 mb-2`}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">{meta.emoji}</span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{meta.label}</h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock size={10} />
              {section.time}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {totalCal} kcal
        </span>
      </div>
      <div className="space-y-2 pl-1">
        <AnimatePresence initial={false}>
          {section.items.map((dish) => (
            <DishCard key={dish.id} dish={dish} date={date} mealType={type} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayKey());

  const dayIndex = DAYS.indexOf(selectedDay);
  const date = dateStringForDayIndex(dayIndex === -1 ? 0 : dayIndex);
  const dayMeals = weeklyMenu[selectedDay];

  const dailyTotal = MEAL_ORDER.reduce(
    (sum, type) => sum + dayMeals[type].items.reduce((s, d) => s + d.calories, 0),
    0
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Weekly Menu
        </h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
          Mess schedule · Tap <Plus size={12} className="inline" /> to log a dish
        </p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none -mx-1 px-1">
        {DAYS.map((day, i) => {
          const isSelected = day === selectedDay;
          const dateNum = dateForDayIndex(i).getDate();
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center shrink-0 w-12 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-primary-500 border-primary-500 text-white shadow-soft"
                  : "bg-white border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-500"
              }`}
            >
              <span className="text-[10px] font-medium opacity-75 leading-none mb-0.5">
                {DAY_ABBR[day]}
              </span>
              <span className="text-sm font-bold leading-none">{dateNum}</span>
            </button>
          );
        })}
      </div>

      {/* Day summary banner */}
      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white border border-slate-100 rounded-2xl shadow-card px-4 py-3 flex items-center justify-between mb-5"
      >
        <div>
          <p className="text-sm font-bold text-slate-900">{selectedDay}</p>
          <p className="text-xs text-slate-400 mt-0.5">4 meal slots planned</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-slate-900">
            {dailyTotal.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">total kcal</p>
        </div>
      </motion.div>

      {/* Meal sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-5"
        >
          {MEAL_ORDER.map((type) => (
            <MealSectionPanel
              key={type}
              type={type}
              section={dayMeals[type]}
              date={date}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="h-6" aria-hidden="true" />
    </div>
  );
}
