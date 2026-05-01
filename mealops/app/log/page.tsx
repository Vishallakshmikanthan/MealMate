"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trash2, 
  Plus, 
  Search,
  BookOpen,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { 
  getTodayDateString, 
  getLogsForDate, 
  removeLogItem, 
  onStorageUpdate 
} from "@/lib/storage";
import type { MealLog } from "@/types/index";

const MEAL_ORDER = ["breakfast", "lunch", "dinner"] as const;

export default function MealLogPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(() => {
    const dailyLogs = getLogsForDate(selectedDate);
    setLogs(dailyLogs);
    setIsHydrated(true);
  }, [selectedDate]);

  useEffect(() => {
    refresh();
    return onStorageUpdate(refresh);
  }, [refresh]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleRemove = (logId: string) => {
    removeLogItem(logId);
  };

  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += log.totalCalories;
      acc.protein += log.items.reduce((sum, i) => sum + i.protein, 0);
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-primary-500" size={24} />
            Meal History
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review your logged meals and nutrition</p>
        </div>

        <div className="flex items-center bg-white border border-slate-100 rounded-xl shadow-soft p-1 self-start sm:self-auto">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 py-1.5 text-sm font-semibold text-slate-700 min-w-32 text-center">
            {selectedDate === getTodayDateString() ? "Today" : new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Daily Summary Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg shadow-primary-200 flex justify-between items-center">
        <div>
          <p className="text-primary-100 text-xs font-bold uppercase tracking-wider">Total Consumed</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold">{totals.calories}</span>
            <span className="text-primary-100 text-sm font-medium">kcal</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-primary-100 text-xs font-bold uppercase tracking-wider">Protein</p>
          <div className="flex items-baseline gap-2 mt-1 justify-end">
            <span className="text-2xl font-bold">{totals.protein}</span>
            <span className="text-primary-100 text-sm font-medium">g</span>
          </div>
        </div>
      </div>

      {/* Logged Meals List */}
      <div className="space-y-4">
        {!isHydrated ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-slate-300" size={32} />
            </div>
            <h3 className="text-slate-800 font-semibold">No meals logged for this date</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              Keep track of your nutrition by logging meals from the menu or scanner.
            </p>
            <Link href="/menu">
              <button className="mt-6 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold shadow-soft hover:bg-primary-600 transition-colors flex items-center gap-2">
                Go to Menu <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={log.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 shadow-card hover:shadow-soft transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    log.mealType === "breakfast" ? "bg-amber-50 text-amber-600" :
                    log.mealType === "lunch" ? "bg-green-50 text-green-600" :
                    "bg-indigo-50 text-indigo-600"
                  }`}>
                    {log.mealType === "breakfast" ? "\uD83C\uDF05" : log.mealType === "lunch" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 capitalize leading-tight">{log.mealType}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(log.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove log"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {log.items.map((item, idx) => (
                  <div key={`${log.id}-${idx}`} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">· {item.name}</span>
                    <span className="text-slate-400 text-xs">{item.calories} kcal</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meal Total</span>
                <span className="text-sm font-extrabold text-slate-800">{log.totalCalories} kcal</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats Button Link */}
      {logs.length > 0 && (
        <Link href="/nutrition">
          <button className="w-full bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-primary-400">
                <Search size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">View Detailed Analytics</p>
                <p className="text-xs text-slate-400">Breakdown of macros and fiber</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </Link>
      )}
    </div>
  );
}
