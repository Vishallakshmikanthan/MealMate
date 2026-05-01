"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Flame,
  Zap,
  Layers,
  Droplets,
  Leaf,
  TrendingUp,
  Lightbulb,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { NutritionTotals, UserGoals } from "@/types/index";
import {
  getTodayDateString,
  getTotalsForDate,
  getUserGoals,
  getWeeklyTotals,
  onStorageUpdate,
} from "@/lib/storage";
import {
  generateInsights,
  compareAgainstGoals,
  generateDayTags,
  remainingToGoal,
} from "@/lib/nutrition";
import { DAYS, DAY_ABBR } from "@/data/menu-week";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MacroDef {
  key: keyof NutritionTotals;
  label: string;
  unit: string;
  color: string;
  trackColor: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const MACROS: MacroDef[] = [
  { key: "calories", label: "Calories",      unit: "kcal", color: "#16a34a", trackColor: "bg-green-500",  icon: Flame,   iconBg: "bg-green-50",  iconColor: "text-green-600"  },
  { key: "protein",  label: "Protein",       unit: "g",    color: "#3b82f6", trackColor: "bg-blue-500",   icon: Zap,     iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
  { key: "carbs",    label: "Carbohydrates", unit: "g",    color: "#f97316", trackColor: "bg-orange-500", icon: Layers,  iconBg: "bg-orange-50", iconColor: "text-orange-600" },
  { key: "fat",      label: "Fat",           unit: "g",    color: "#8b5cf6", trackColor: "bg-purple-500", icon: Droplets,iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  { key: "fiber",    label: "Fiber",         unit: "g",    color: "#0d9488", trackColor: "bg-teal-500",   icon: Leaf,    iconBg: "bg-teal-50",   iconColor: "text-teal-600"   },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const card: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroProgressRow({
  macro,
  consumed,
  goal,
  pct,
}: {
  macro: MacroDef;
  consumed: number;
  goal: number;
  pct: number;
}) {
  const Icon = macro.icon;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl ${macro.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={macro.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">{macro.label}</span>
          <span className="text-xs text-slate-400">
            {consumed}{macro.unit} / {goal}{macro.unit}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${macro.trackColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-slate-400">{pct}% of goal</span>
          <span className="text-[10px] text-slate-400">
            {goal - consumed > 0
              ? `${goal - consumed}${macro.unit} remaining`
              : "Goal reached!"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="text-primary-500 mt-0.5">
        {Number(payload[0]?.value ?? 0).toLocaleString()} kcal
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [totals, setTotals] = useState<NutritionTotals>({
    calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  });
  const [goals, setGoals] = useState<UserGoals>({
    calories: 2000, protein: 120, carbs: 250, fat: 65, fiber: 30,
  });
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; cal: number }>>([]);

  const refresh = useCallback(() => {
    const today = getTodayDateString();
    const g = getUserGoals();
    const t = getTotalsForDate(today);
    const weekly = getWeeklyTotals().map((entry, i) => ({
      day: DAY_ABBR[DAYS[i] ?? "Monday"] ?? "",
      cal: entry.totals.calories,
    }));
    setGoals(g);
    setTotals(t);
    setWeeklyData(weekly);
  }, []);

  useEffect(() => {
    refresh();
    return onStorageUpdate(refresh);
  }, [refresh]);

  const pcts = compareAgainstGoals(totals, goals);
  const insights = generateInsights(totals, goals);
  const dayTags = generateDayTags(totals);
  const remaining = remainingToGoal(totals, goals);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  // index of today in the 7-day weekly array (last = today)
  const todayBarIndex = 6;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-5"
    >
      {/* Heading */}
      <motion.div variants={card}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Nutrition
        </h1>
        <p className="text-slate-500 text-sm mt-1">{todayLabel}</p>
      </motion.div>

      {/* Today tag summary */}
      {dayTags.length > 0 && (
        <motion.div variants={card} className="flex flex-wrap gap-2">
          {dayTags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* Macro progress bars */}
      <motion.section
        variants={card}
        className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-5"
        aria-label="Today macro progress"
      >
        <div className="flex items-center gap-2 mb-1">
          <Target size={15} className="text-primary-500" />
          <h2 className="text-sm font-semibold text-slate-800">Today vs Goals</h2>
        </div>
        {MACROS.map((macro) => (
          <MacroProgressRow
            key={macro.key}
            macro={macro}
            consumed={totals[macro.key]}
            goal={goals[macro.key]}
            pct={pcts[macro.key] ?? 0}
          />
        ))}
      </motion.section>

      {/* Quick stats grid */}
      <motion.div variants={card} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["calories", "protein", "carbs", "fat"] as const).map((k) => {
          const macro = MACROS.find((m) => m.key === k);
          if (!macro) return null;
          const Icon = macro.icon;
          return (
            <div
              key={k}
              className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col gap-2"
            >
              <div className={`w-8 h-8 rounded-xl ${macro.iconBg} flex items-center justify-center`}>
                <Icon size={15} className={macro.iconColor} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {totals[k]}
                  <span className="text-xs font-normal text-slate-400 ml-0.5">{macro.unit}</span>
                </p>
                <p className="text-[11px] text-slate-400">{macro.label}</p>
              </div>
              <p className="text-[10px] font-medium text-primary-500">{pcts[k]}% of goal</p>
            </div>
          );
        })}
      </motion.div>

      {/* Remaining goals */}
      <motion.section
        variants={card}
        className="bg-gradient-to-br from-primary-50 to-green-50 border border-primary-100 rounded-2xl p-5"
        aria-label="Remaining to goal"
      >
        <h2 className="text-sm font-semibold text-primary-800 mb-3">Still to Go Today</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MACROS.map(({ key, label, unit, iconBg, iconColor, icon: Icon }) => (
            <div key={key} className="flex flex-col items-center gap-1 bg-white/60 rounded-xl py-3 px-2">
              <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon size={13} className={iconColor} />
              </div>
              <p className="text-sm font-bold text-slate-900">{remaining[key]}{unit}</p>
              <p className="text-[10px] text-slate-400 text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Weekly chart */}
      <motion.section
        variants={card}
        className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
        aria-label="Weekly calorie trend"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-primary-500" />
          <h2 className="text-sm font-semibold text-slate-800">Weekly Calorie Trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData} barCategoryGap="32%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-inter)" }}
            />
            <YAxis
              hide
              domain={[0, Math.max(2400, ...weeklyData.map((d) => d.cal))]}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Bar dataKey="cal" radius={[6, 6, 0, 0]}>
              {weeklyData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={i === todayBarIndex ? "#16a34a" : "#e2e8f0"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <span className="text-[11px] text-slate-400">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-200" />
            <span className="text-[11px] text-slate-400">Past days</span>
          </div>
        </div>
      </motion.section>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.section variants={card} aria-label="Nutrition insights">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500" />
            Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb size={13} className="text-amber-600" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {totals.calories === 0 && (
        <motion.div variants={card}>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-slate-600">No meals logged today yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Head to the Menu page and tap + on dishes to start tracking
            </p>
          </div>
        </motion.div>
      )}

      <div className="h-4" aria-hidden="true" />
    </motion.div>
  );
}
