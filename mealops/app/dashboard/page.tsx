"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ScanLine,
  BookOpen,
  CalendarDays,
  Lightbulb,
  TrendingUp,
  Flame,
  Zap,
  Layers,
  Droplets,
} from "lucide-react";
import Link from "next/link";
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
import { generateInsights, compareAgainstGoals } from "@/lib/nutrition";
import { getTodayMenu, MEAL_ORDER, DAY_ABBR, DAYS } from "@/data/menu-week";

// --- Constants ----------------------------------------------------------------

const TAG_STYLES: Record<string, string> = {
  veg: "bg-green-100 text-green-700",
  "high-protein": "bg-blue-100 text-blue-700",
  "low-cal": "bg-purple-100 text-purple-700",
  "non-veg": "bg-amber-100 text-amber-700",
  "high-fiber": "bg-teal-100 text-teal-700",
  spicy: "bg-red-100 text-red-600",
};

const MEAL_META: Record<
  string,
  { label: string; time: string; emoji: string; gradient: string; border: string }
> = {
  breakfast: { label: "Breakfast", time: "7:30 - 9:30 AM",  emoji: "\uD83C\uDF05", gradient: "from-amber-50 to-yellow-50", border: "border-amber-100" },
  lunch:     { label: "Lunch",     time: "12:30 - 2:30 PM", emoji: "\u2600\uFE0F",  gradient: "from-green-50 to-emerald-50",  border: "border-green-100" },
  dinner:    { label: "Dinner",    time: "7:30 - 9:30 PM",  emoji: "\uD83C\uDF19", gradient: "from-indigo-50 to-purple-50",  border: "border-indigo-100" },
};

const quickActions = [
  { href: "/scanner", icon: ScanLine,    label: "Scan Food",  iconBg: "bg-green-50",  iconColor: "text-green-600"  },
  { href: "/log",     icon: BookOpen,    label: "Log Meal",   iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
  { href: "/menu",    icon: CalendarDays,label: "View Menu",  iconBg: "bg-orange-50", iconColor: "text-orange-600" },
];

// --- Sub-components ----------------------------------------------------------

const CalorieRing = memo(function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 144;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(consumed / goal, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#16a34a"
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Flame size={14} className="text-primary-500" />
        <span className="text-2xl font-extrabold text-slate-900 leading-none">
          {consumed.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400">of {goal.toLocaleString()} kcal</span>
      </div>
    </div>
  );
});

const MacroBar = memo(function MacroBar({
  label, consumed, goal, color, iconBg, iconColor, Icon,
}: {
  label: string; consumed: number; goal: number;
  color: string; iconBg: string; iconColor: string;
  Icon: React.ElementType;
}) {
  const pct = Math.min((consumed / goal) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center`}>
            <Icon size={12} className={iconColor} />
          </div>
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
        <span className="text-xs text-slate-400">{consumed}g / {goal}g</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
});

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value?: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="text-primary-500 mt-0.5">{Number(payload[0]?.value ?? 0).toLocaleString()} kcal</p>
    </div>
  );
}

// --- Framer Motion variants ---------------------------------------------------

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const card: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// --- Page --------------------------------------------------------------------

export default function DashboardPage() {
  const [totals, setTotals]   = useState<NutritionTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [goals, setGoals]     = useState<UserGoals>({ calories: 2000, protein: 120, carbs: 250, fat: 65, fiber: 30 });
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; cal: number }>>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(() => {
    const today = getTodayDateString();
    const g = getUserGoals();
    const t = getTotalsForDate(today);
    const weekly = getWeeklyTotals().map((entry, i) => ({
      day: DAY_ABBR[DAYS[i] ?? "Monday"] ?? DAYS[i] ?? "",
      cal: entry.totals.calories,
    }));
    setGoals(g);
    setTotals(t);
    setWeeklyData(weekly);
    setInsights(generateInsights(t, g));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    return onStorageUpdate(refresh);
  }, [refresh]);

  const pcts = compareAgainstGoals(totals, goals);
  const todayMenu = getTodayMenu();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const todayStr = getTodayDateString();

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="p-4 md:p-6 lg:p-8 max-w-4xl space-y-5">

      {/* Skeleton — only shown before first data load */}
      {!isHydrated && (
        <>
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-52 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        </>
      )}

      {/* Welcome */}
      {isHydrated && (
      <motion.div variants={card}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {greeting}, Arjun
        </h1>
        <p className="text-slate-500 text-sm mt-1">{todayLabel}</p>
      </motion.div>
      )}

      {/* Nutrition summary */}
      {isHydrated && (
      <motion.section variants={card}
        className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
        aria-label="Today nutrition">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Today&apos;s Nutrition
          {totals.calories === 0 && (
            <span className="ml-2 text-amber-400 font-normal normal-case">
              — nothing logged yet
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CalorieRing consumed={totals.calories} goal={goals.calories} />
          <div className="flex-1 w-full space-y-3.5">
            <MacroBar label="Protein"       consumed={totals.protein} goal={goals.protein}
              color="#3b82f6" iconBg="bg-blue-50"   iconColor="text-blue-500"   Icon={Zap} />
            <MacroBar label="Carbohydrates" consumed={totals.carbs}   goal={goals.carbs}
              color="#f97316" iconBg="bg-orange-50" iconColor="text-orange-500" Icon={Layers} />
            <MacroBar label="Fat"           consumed={totals.fat}     goal={goals.fat}
              color="#8b5cf6" iconBg="bg-purple-50" iconColor="text-purple-500" Icon={Droplets} />
          </div>
        </div>
        {/* Macro stat row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-50">
          {(["calories","protein","carbs","fat"] as const).map((k) => (
            <div key={k} className="text-center">
              <p className="text-base font-bold text-slate-900">{totals[k]}{k !== "calories" ? "g" : ""}</p>
              <p className="text-[10px] text-slate-400 capitalize">{k}</p>
              <p className="text-[10px] text-primary-500 font-medium">{pcts[k]}%</p>
            </div>
          ))}
        </div>
      </motion.section>
      )}

      {/* Quick actions */}
      <motion.div variants={card} className="grid grid-cols-3 gap-3">
        {quickActions.map(({ href, icon: Icon, label, iconBg, iconColor }) => (
          <Link key={href} href={href}>
            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col items-center gap-2.5 cursor-pointer">
              <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={iconColor} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Today menu preview */}
      <motion.section variants={card} aria-label="Today menu preview">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">Today&apos;s Menu</h2>
          <Link href="/menu" className="text-xs text-primary-500 font-medium hover:text-primary-700 transition-colors">
            Full menu &rarr;
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["breakfast", "lunch", "dinner"] as const).map((type) => {
            const section = todayMenu[type];
            const meta = MEAL_META[type];
            if (!meta) return null;
            const sectionCal = section.items.reduce((s, i) => s + i.calories, 0);
            const tags = Array.from(new Set(section.items.flatMap((i) => i.tags))).slice(0, 2);
            return (
              <motion.div key={type} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
                className={`bg-gradient-to-br ${meta.gradient} border ${meta.border} rounded-2xl p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span aria-hidden="true">{meta.emoji}</span>
                      <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{section.time}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full shrink-0">
                    {sectionCal} kcal
                  </span>
                </div>
                <ul className="space-y-0.5 mb-3">
                  {section.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-xs text-slate-600">· {item.name}</li>
                  ))}
                  {section.items.length > 3 && (
                    <li className="text-xs text-slate-400">+{section.items.length - 3} more</li>
                  )}
                </ul>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_STYLES[tag] ?? "bg-slate-100 text-slate-600"}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Weekly chart */}
      <motion.section variants={card}
        className="bg-white rounded-2xl border border-slate-100 shadow-card p-5"
        aria-label="Weekly calorie trend">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-primary-500" />
          <h2 className="text-sm font-semibold text-slate-800">Weekly Calories</h2>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyData} barCategoryGap="32%">
            <XAxis dataKey="day" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-inter)" }} />
            <YAxis hide domain={[0, Math.max(2400, ...weeklyData.map((d) => d.cal))]} />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Bar dataKey="cal" radius={[6, 6, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell key={`cell-${i}`}
                  fill={entry.day === (DAY_ABBR[DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ?? "Monday"] ?? "") ? "#16a34a" : "#e2e8f0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-slate-400 text-right mt-1">
          {totals.calories > 0 ? "Today highlighted in green" : "Log meals to see today's bar"}
        </p>
      </motion.section>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div variants={card} className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={15} className="text-amber-600" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Log Meal CTA when nothing is logged */}
      {totals.calories === 0 && (
        <motion.div variants={card}>
          <Link href="/menu">
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 text-center cursor-pointer hover:bg-primary-100 transition-colors">
              <p className="text-sm font-semibold text-primary-700">Start logging today&apos;s meals</p>
              <p className="text-xs text-primary-500 mt-1">Visit the Menu page and tap + on dishes you&apos;ve eaten</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Spacer so last card isn't clipped by bottom nav */}
      <div className="h-2" aria-hidden="true" />
    </motion.div>
  );
}
