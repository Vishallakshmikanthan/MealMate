"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  UploadCloud,
  ScanLine,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Flame,
  Zap,
  Layers,
  Droplets,
  Leaf,
  X,
  Plus,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import type { MenuItem } from "@/types/index";
import type { ScanResult, ScanStatus, LoadingPhase, RawPrediction } from "@/lib/scanner";
import { searchMenuItems, menuItemToScanResult } from "@/lib/scanner";
import {
  getTodayDateString,
  addItemToLog,
} from "@/lib/storage";
import { MEAL_ORDER } from "@/data/menu-week";
import type { MealType } from "@/types/index";

// â”€â”€â”€ Animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// â”€â”€â”€ Macro row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MACROS = [
  { key: "calories" as const, label: "Calories", unit: "kcal", icon: Flame,    color: "text-green-600",  bg: "bg-green-50"  },
  { key: "protein"  as const, label: "Protein",  unit: "g",    icon: Zap,      color: "text-blue-600",   bg: "bg-blue-50"   },
  { key: "carbs"    as const, label: "Carbs",    unit: "g",    icon: Layers,   color: "text-orange-600", bg: "bg-orange-50" },
  { key: "fat"      as const, label: "Fat",      unit: "g",    icon: Droplets, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "fiber"    as const, label: "Fiber",    unit: "g",    icon: Leaf,     color: "text-teal-600",   bg: "bg-teal-50"   },
];

// â”€â”€â”€ Loading overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LOADING_PHASES: LoadingPhase[] = ["model", "analysis", "matching"];

const PHASE_INFO: Record<LoadingPhase, { title: string; subtitle: string }> = {
  model:    { title: "Loading AI modelâ€¦",   subtitle: "First load may take a moment" },
  analysis: { title: "Analyzing imageâ€¦",    subtitle: "Identifying food with MobileNet" },
  matching: { title: "Matching to menuâ€¦",   subtitle: "Finding the best food match" },
};

function LoadingOverlay({ phase }: { phase: LoadingPhase }) {
  const { title, subtitle } = PHASE_INFO[phase];
  const stepIdx = LOADING_PHASES.indexOf(phase);

  return (
    <motion.div
      variants={fade} initial="hidden" animate="show"
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-6"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-30" />
          <div className="relative w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
            <ScanLine size={26} className="text-primary-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {LOADING_PHASES.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                i < stepIdx  ? "bg-primary-500" :
                i === stepIdx ? "bg-primary-500 scale-125 ring-2 ring-primary-200" :
                "bg-slate-200"
              }`} />
              {i < LOADING_PHASES.length - 1 && (
                <div className={`w-10 h-0.5 rounded-full transition-all duration-700 ${
                  i < stepIdx ? "bg-primary-500" : "bg-slate-200"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-6 text-[10px]">
          {LOADING_PHASES.map((step, i) => (
            <span key={step} className={`capitalize transition-colors ${
              i <= stepIdx ? "text-primary-500 font-semibold" : "text-slate-400"
            }`}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Confidence badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(Math.min(confidence * 100, 99));
  const { color, bg, ring, label } =
    pct >= 50 ? { color: "text-green-700",  bg: "bg-green-50",  ring: "ring-green-200",  label: "High"   } :
    pct >= 25 ? { color: "text-amber-700",  bg: "bg-amber-50",  ring: "ring-amber-200",  label: "Medium" } :
                { color: "text-orange-700", bg: "bg-orange-50", ring: "ring-orange-200", label: "Low"    };
  return (
    <div className={`${bg} ${color} ring-1 ${ring} rounded-xl px-3 py-2 text-center shrink-0`}>
      <p className="text-lg font-bold leading-none">{pct}%</p>
      <p className="text-[10px] font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

// â”€â”€â”€ Result card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ResultCard({
  result,
  onLog,
  onRetry,
  onSelectAlternative,
  onManualCorrect,
}: {
  result: ScanResult;
  onLog: () => void;
  onRetry: () => void;
  onSelectAlternative: (item: MenuItem) => void;
  onManualCorrect: () => void;
}) {
  return (
    <motion.div
      variants={fade} initial="hidden" animate="show" exit="exit"
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <CheckCircle2 size={15} className="text-green-500 shrink-0" />
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
              Match found
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 truncate">{result.name}</h2>
          {result.detectedName.toLowerCase() !== result.name.toLowerCase() && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detected as: <em>{result.detectedName}</em>
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={result.confidence} />
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {MACROS.map(({ key, label, unit, icon: Icon, color, bg }) => (
          <div key={key} className={`${bg} rounded-xl p-2 flex flex-col items-center gap-1`}>
            <Icon size={13} className={color} />
            <p className="text-xs font-bold text-slate-800 leading-none">{result[key]}</p>
            <p className="text-[9px] text-slate-400">{unit}</p>
            <p className="text-[9px] text-slate-400 leading-none">{label}</p>
          </div>
        ))}
      </div>

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Did you mean:
          </p>
          <div className="flex flex-wrap gap-2">
            {result.alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelectAlternative(alt)}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-600 border border-transparent hover:border-primary-200 text-slate-600 font-medium rounded-lg transition-all"
              >
                {alt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onLog}
          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          Log Meal
        </button>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <RotateCcw size={13} />
          Retry
        </button>
      </div>

      {/* Manual correction link */}
      <button
        onClick={onManualCorrect}
        className="w-full text-center text-xs text-slate-400 hover:text-primary-500 py-0.5 transition-colors flex items-center justify-center gap-1"
      >
        Not right? Choose manually
        <ChevronRight size={11} />
      </button>
    </motion.div>
  );
}

// â”€â”€â”€ Low confidence card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LowConfidenceCard({
  result,
  rawPredictions,
  onAccept,
  onSelectAlternative,
  onManualCorrect,
  onRetry,
}: {
  result: ScanResult;
  rawPredictions: RawPrediction[];
  onAccept: () => void;
  onSelectAlternative: (item: MenuItem) => void;
  onManualCorrect: () => void;
  onRetry: () => void;
}) {
  const pct = Math.round(Math.min(result.confidence * 100, 99));
  return (
    <motion.div
      variants={fade} initial="hidden" animate="show" exit="exit"
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={16} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Low confidence match</p>
          <p className="text-xs text-slate-400">Best guess â€” please verify before logging</p>
        </div>
      </div>

      {/* Best guess */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Best guess</p>
          <p className="text-base font-bold text-slate-900 truncate">{result.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Detected: <em>{result.detectedName}</em></p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-amber-600">{pct}%</p>
          <p className="text-[10px] text-amber-500">confidence</p>
        </div>
      </div>

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Did you mean:</p>
          <div className="flex flex-wrap gap-2">
            {result.alternatives.map((alt) => (
              <button
                key={alt.id}
                onClick={() => onSelectAlternative(alt)}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-primary-300 hover:text-primary-600 text-slate-700 font-medium rounded-lg transition-all"
              >
                {alt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Raw AI predictions */}
      {rawPredictions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            AI detected
          </p>
          <div className="space-y-1.5">
            {rawPredictions.slice(0, 3).map((pred) => (
              <div key={pred.label} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-300 rounded-full" style={{ width: `${Math.round(pred.probability * 100)}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 w-24 truncate text-right">{pred.label}</span>
                <span className="text-[11px] font-medium text-slate-600 w-8 text-right">{Math.round(pred.probability * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          Yes, log "{result.name}"
        </button>
        <button
          onClick={onManualCorrect}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-colors"
        >
          Choose
        </button>
      </div>

      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-0.5"
      >
        <RotateCcw size={11} />
        Scan a different image
      </button>

      {/* Tips */}
      <div className="bg-slate-50 rounded-xl p-3 flex gap-3">
        <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-600">For better results:</p>
          <p className="text-[11px] text-slate-500">â€¢ Use good lighting â€” avoid harsh shadows</p>
          <p className="text-[11px] text-slate-500">â€¢ Center the food and fill the frame</p>
          <p className="text-[11px] text-slate-500">â€¢ Use a plain, uncluttered background</p>
        </div>
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Manual selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ManualSelector({
  rawLabel,
  rawPredictions = [],
  onSelect,
  onRetry,
}: {
  rawLabel?: string;
  rawPredictions?: RawPrediction[];
  onSelect: (item: MenuItem) => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchMenuItems(query);

  return (
    <motion.div
      variants={fade} initial="hidden" animate="show" exit="exit"
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Couldn't recognise the food</p>
          <p className="text-xs text-slate-400">
            {rawLabel ? <>AI saw: <em>{rawLabel}</em> â€” select manually</> : "Select manually from the menu"}
          </p>
        </div>
      </div>

      {/* Top AI detections */}
      {rawPredictions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Top detections
          </p>
          <div className="space-y-1.5">
            {rawPredictions.slice(0, 3).map((pred) => (
              <div key={pred.label} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-200 rounded-full" style={{ width: `${Math.round(pred.probability * 100)}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 w-28 truncate text-right">{pred.label}</span>
                <span className="text-[11px] font-medium text-slate-600 w-8 text-right">{Math.round(pred.probability * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishesâ€¦"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-slate-50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Results list */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 -mx-1 px-1">
        {results.slice(0, 12).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full flex items-center justify-between text-left bg-slate-50 hover:bg-primary-50 border border-transparent hover:border-primary-100 rounded-xl px-3 py-2.5 transition-all group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${item.type === "veg" ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
              </div>
              <span className="text-xs text-slate-400 ml-3">{item.calories} kcal Â· P {item.protein}g</span>
            </div>
            <Plus size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors shrink-0" />
          </button>
        ))}
        {results.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No dishes found</p>
        )}
      </div>

      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
      >
        <RotateCcw size={14} />
        Try scanning again
      </button>
    </motion.div>
  );
}

// â”€â”€â”€ Log modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LogModal({
  result,
  onConfirm,
  onClose,
}: {
  result: ScanResult;
  onConfirm: (mealType: MealType) => void;
  onClose: () => void;
}) {
  const [mealType, setMealType] = useState<MealType>("lunch");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Log "{result.name}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Meal type</p>
          <div className="grid grid-cols-2 gap-2">
            {(MEAL_ORDER).map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`py-2 px-3 rounded-xl text-sm font-medium capitalize transition-all border ${
                  mealType === t
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-slate-50 text-slate-600 border-transparent hover:border-primary-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onConfirm(mealType)}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          Add to Today's Log
        </button>
      </motion.div>
    </div>
  );
}

// ─── Camera live-detection overlay ───────────────────────────────────────────

function CameraOverlay({ prediction }: { prediction: { label: string; pct: number } | null }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-primary-400 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary-400 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-primary-400 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-primary-400 rounded-br-lg" />

      {/* Live badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
      </div>

      {/* Prediction label */}
      <AnimatePresence mode="wait">
        {prediction && (
          <motion.div
            key={prediction.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 text-center"
          >
            <p className="text-sm font-bold text-white capitalize">{prediction.label}</p>
            <p className="text-[10px] text-white/70">{prediction.pct}% confidence</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ScanMode = "upload" | "camera";

export default function ScannerPage() {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileRef     = useRef<HTMLInputElement>(null);
  const imgRef      = useRef<HTMLImageElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [mode,       setMode]       = useState<ScanMode>("upload");
  const [preview,    setPreview]    = useState<string | null>(null);
  const [scanState,  setScan]       = useState<ScanStatus>({ status: "idle" });
  const [rawPreds,   setRawPreds]   = useState<RawPrediction[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [showLog,    setShowLog]    = useState(false);
  const [loggedDish, setLoggedDish] = useState<ScanResult | null>(null);
  const [logSuccess, setLogSuccess] = useState(false);
  const [isDragging, setDragging]   = useState(false);
  // Camera-specific
  const [cameraOn,   setCameraOn]   = useState(false);
  const [camError,   setCamError]   = useState<string | null>(null);
  const [livePred,   setLivePred]   = useState<{ label: string; pct: number } | null>(null);
  const [capturing,  setCapturing]  = useState(false);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current)   { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraOn(false);
    setLivePred(null);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setScan({ status: "idle" });
      setManualMode(false);
      setLogSuccess(false);
    } catch (err) {
      setCamError(err instanceof Error ? err.message : "Camera access denied");
    }
  }, []);

  // ── Live prediction loop ───────────────────────────────────────────────────

  useEffect(() => {
    if (!cameraOn) return;

    intervalRef.current = setInterval(async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || capturing) return;

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);

      try {
        const { isTMLoaded, classifyWithTM, loadTMModel } = await import("@/lib/teachable-machine");
        if (!isTMLoaded()) { await loadTMModel(); return; }
        const preds = await classifyWithTM(canvas);
        const best  = preds.filter((p) => p.className.toLowerCase() !== "unknown")[0];
        if (best && best.confidence >= 0.4) {
          setLivePred({ label: best.className, pct: Math.round(best.confidence * 100) });
        } else {
          setLivePred(null);
        }
      } catch {
        // silently ignore
      }
    }, 1500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cameraOn, capturing]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Capture & classify ────────────────────────────────────────────────────

  const captureAndClassify = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);
    setScan({ status: "loading", phase: "model" });
    setManualMode(false);
    setLogSuccess(false);

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const { classifyImage } = await import("@/lib/scanner");
    const result = await classifyImage(canvas, (phase) => setScan({ status: "loading", phase }));

    if (result.status === "no-match" || result.status === "low-confidence") {
      setRawPreds(result.rawPredictions ?? []);
    }
    setScan(result);
    setCapturing(false);
    stopCamera();
  }, [stopCamera]);

  // ── Upload mode ───────────────────────────────────────────────────────────

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScan({ status: "idle" });
    setManualMode(false);
    setLogSuccess(false);
    setLoggedDish(null);
    setRawPreds([]);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  const classify = useCallback(async () => {
    if (!imgRef.current || !preview) return;
    setScan({ status: "loading", phase: "model" });
    setManualMode(false);
    setLogSuccess(false);

    const { classifyImage } = await import("@/lib/scanner");
    const result = await classifyImage(imgRef.current, (phase) => setScan({ status: "loading", phase }));

    if (result.status === "no-match" || result.status === "low-confidence") {
      setRawPreds(result.rawPredictions ?? []);
    }
    setScan(result);
  }, [preview]);

  // ── Mode switch ───────────────────────────────────────────────────────────

  function switchMode(next: ScanMode) {
    if (next === mode) return;
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setScan({ status: "idle" });
    setManualMode(false);
    setLogSuccess(false);
    setRawPreds([]);
    setMode(next);
  }

  // ── Item selection ────────────────────────────────────────────────────────

  function handleSelectItem(item: MenuItem) {
    setScan({ status: "match", result: menuItemToScanResult(item) });
    setManualMode(false);
  }

  // ── Log meal ──────────────────────────────────────────────────────────────

  function openLogModal() {
    const result =
      scanState.status === "match"          ? scanState.result :
      scanState.status === "low-confidence" ? scanState.result : null;
    if (!result) return;
    setLoggedDish(result);
    setShowLog(true);
  }

  function confirmLog(mealType: MealType) {
    if (!loggedDish) return;
    const pseudoItem: MenuItem = {
      id:       Date.now(),
      name:     loggedDish.name,
      type:     "veg",
      calories: loggedDish.calories,
      protein:  loggedDish.protein,
      carbs:    loggedDish.carbs,
      fat:      loggedDish.fat,
      fiber:    loggedDish.fiber,
      tags:     [],
    };
    addItemToLog(getTodayDateString(), mealType, pseudoItem);
    setShowLog(false);
    setLogSuccess(true);
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setScan({ status: "idle" });
    setManualMode(false);
    setLogSuccess(false);
    setLoggedDish(null);
    setRawPreds([]);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const matchResult   = scanState.status === "match"          ? scanState.result : null;
  const lowConfResult = scanState.status === "low-confidence" ? scanState.result : null;
  const lowConfPreds  = scanState.status === "low-confidence" ? scanState.rawPredictions : rawPreds;
  const noMatchLabel  = scanState.status === "no-match"       ? scanState.rawLabel : undefined;
  const showManual    = manualMode || scanState.status === "no-match" || scanState.status === "error";
  const showResults   = mode === "camera" && (matchResult || lowConfResult || showManual);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-lg mx-auto">
      {/* Heading */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Food Scanner</h1>
        <p className="text-slate-500 text-sm mt-1">Identify food and log its nutrition instantly</p>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
        {(["upload", "camera"] as ScanMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "upload" ? <UploadCloud size={15} /> : <ScanLine size={15} />}
            {m === "upload" ? "Upload Photo" : "Live Camera"}
          </button>
        ))}
      </div>

      {/* ── UPLOAD MODE ── */}
      {mode === "upload" && (
        <>
          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                isDragging
                  ? "border-primary-400 bg-primary-50"
                  : "border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/40"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center">
                <UploadCloud size={28} className="text-primary-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">Drop an image here, or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP supported</p>
              </div>
              <div className="w-full bg-white border border-slate-100 rounded-xl p-3 mt-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-500 shrink-0" />
                  <p className="text-[11px] font-semibold text-slate-600">Tips for best results</p>
                </div>
                <ul className="space-y-1">
                  {["Good lighting — avoid dark or harsh shadows", "Center the food and fill the frame", "Plain background improves accuracy"].map((tip) => (
                    <li key={tip} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-primary-400 shrink-0 mt-0.5">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-card bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={preview} alt="Food preview" className="w-full max-h-72 object-contain" crossOrigin="anonymous" />
                <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors" aria-label="Remove image">
                  <X size={14} />
                </button>
              </div>

              {scanState.status === "idle" && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={classify}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft transition-colors"
                >
                  <ScanLine size={16} />Identify Food
                </motion.button>
              )}

              {scanState.status === "loading" && <LoadingOverlay phase={scanState.phase} />}

              <AnimatePresence>
                {logSuccess && (
                  <motion.div variants={fade} initial="hidden" animate="show" exit="exit"
                    className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                  >
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    <p className="text-sm font-medium text-green-700">Added to today's meal log!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {matchResult && !manualMode && (
                  <ResultCard key="result" result={matchResult} onLog={openLogModal} onRetry={reset}
                    onSelectAlternative={handleSelectItem} onManualCorrect={() => setManualMode(true)} />
                )}
                {lowConfResult && !manualMode && (
                  <LowConfidenceCard key="low-conf" result={lowConfResult} rawPredictions={lowConfPreds}
                    onAccept={openLogModal} onSelectAlternative={handleSelectItem}
                    onManualCorrect={() => setManualMode(true)} onRetry={reset} />
                )}
                {showManual && (
                  <ManualSelector key="manual" rawLabel={noMatchLabel} rawPredictions={rawPreds}
                    onSelect={handleSelectItem} onRetry={reset} />
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ── CAMERA MODE ── */}
      {mode === "camera" && (
        <div className="space-y-4">
          {/* Camera viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-card aspect-[4/3]">
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${cameraOn ? "block" : "hidden"}`} />
            <canvas ref={canvasRef} className="hidden" />

            {/* Idle placeholder */}
            {!cameraOn && !camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <ScanLine size={28} className="text-white/80" />
                </div>
                <p className="text-sm text-white/60">Camera is off</p>
              </div>
            )}

            {/* Error overlay */}
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white px-6 text-center">
                <AlertCircle size={32} className="text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Camera access failed</p>
                  <p className="text-xs text-white/40">{camError}</p>
                </div>
                {/permission/i.test(camError) && (
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left max-w-xs">
                    <p className="text-[11px] font-semibold text-white/80 mb-1.5">How to fix:</p>
                    <ol className="space-y-1">
                      {["Click the camera/lock icon in your browser's address bar", 'Set Camera to "Allow"', "Then press Retry below"].map((step, i) => (
                        <li key={i} className="text-[11px] text-white/60 flex items-start gap-2">
                          <span className="text-primary-400 font-bold shrink-0">{i + 1}.</span>{step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Live overlay */}
            {cameraOn && <CameraOverlay prediction={livePred} />}
          </div>

          {/* Controls */}
          {!cameraOn ? (
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setCamError(null); startCamera(); }}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft transition-colors"
              >
                <ScanLine size={16} />{camError ? "Retry" : "Start Camera"}
              </motion.button>
              {camError && (
                <button onClick={() => switchMode("upload")}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
                >
                  Upload instead
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={captureAndClassify}
                disabled={capturing || scanState.status === "loading"}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft transition-colors"
              >
                {(capturing || scanState.status === "loading")
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Classifying…</>
                  : <><ScanLine size={16} />Capture &amp; Identify</>
                }
              </motion.button>
              <button onClick={stopCamera}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {scanState.status === "loading" && <LoadingOverlay phase={scanState.phase} />}

          <AnimatePresence>
            {logSuccess && (
              <motion.div variants={fade} initial="hidden" animate="show" exit="exit"
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
              >
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700">Added to today's meal log!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showResults && matchResult && !manualMode && (
              <ResultCard key="result" result={matchResult} onLog={openLogModal} onRetry={reset}
                onSelectAlternative={handleSelectItem} onManualCorrect={() => setManualMode(true)} />
            )}
            {showResults && lowConfResult && !manualMode && (
              <LowConfidenceCard key="low-conf" result={lowConfResult} rawPredictions={lowConfPreds}
                onAccept={openLogModal} onSelectAlternative={handleSelectItem}
                onManualCorrect={() => setManualMode(true)} onRetry={reset} />
            )}
            {showResults && showManual && (
              <ManualSelector key="manual" rawLabel={noMatchLabel} rawPredictions={rawPreds}
                onSelect={handleSelectItem} onRetry={reset} />
            )}
          </AnimatePresence>

          {/* Camera tips */}
          {!cameraOn && !showResults && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={13} className="text-amber-500 shrink-0" />
                <p className="text-[11px] font-semibold text-slate-600">Tips for live scanning</p>
              </div>
              <ul className="space-y-1">
                {["Hold phone steady — avoid motion blur", "Point camera directly at the food", "Works best with your trained Teachable Machine model"].map((tip) => (
                  <li key={tip} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <span className="text-primary-400 shrink-0 mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Log modal */}
      <AnimatePresence>
        {showLog && loggedDish && (
          <LogModal result={loggedDish} onConfirm={confirmLog} onClose={() => setShowLog(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
