"use client";

import {
  useState,
  useRef,
  useCallback,
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
} from "lucide-react";
import type { MenuItem } from "@/types/index";
import type { ScanResult, ScanStatus } from "@/lib/scanner";
import { searchMenuItems, menuItemToScanResult } from "@/lib/scanner";
import {
  getTodayDateString,
  addItemToLog,
} from "@/lib/storage";
import { getTodayMenu, MEAL_ORDER } from "@/data/menu-week";
import type { MealType } from "@/types/index";

// ─── Animation variants ───────────────────────────────────────────────────────

const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ─── Macro row ────────────────────────────────────────────────────────────────

const MACROS = [
  { key: "calories" as const, label: "Calories", unit: "kcal", icon: Flame,    color: "text-green-600",  bg: "bg-green-50"  },
  { key: "protein"  as const, label: "Protein",  unit: "g",    icon: Zap,      color: "text-blue-600",   bg: "bg-blue-50"   },
  { key: "carbs"    as const, label: "Carbs",    unit: "g",    icon: Layers,   color: "text-orange-600", bg: "bg-orange-50" },
  { key: "fat"      as const, label: "Fat",      unit: "g",    icon: Droplets, color: "text-purple-600", bg: "bg-purple-50" },
  { key: "fiber"    as const, label: "Fiber",    unit: "g",    icon: Leaf,     color: "text-teal-600",   bg: "bg-teal-50"   },
];

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onLog,
  onRetry,
}: {
  result: ScanResult;
  onLog: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      variants={fade} initial="hidden" animate="show" exit="exit"
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
              Match found
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{result.name}</h2>
          {result.rawLabel !== result.name && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detected as: <em>{result.rawLabel}</em>
            </p>
          )}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 font-medium shrink-0">
          {result.source === "menu" ? "In Menu" : "Custom"}
        </span>
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-5 gap-2">
        {MACROS.map(({ key, label, unit, icon: Icon, color, bg }) => (
          <div key={key} className={`${bg} rounded-xl p-2.5 flex flex-col items-center gap-1`}>
            <Icon size={14} className={color} />
            <p className="text-sm font-bold text-slate-800">
              {result[key]}
              <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
            </p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>Match confidence</span>
          <span>{Math.round(result.confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${Math.round(result.confidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
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
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    </motion.div>
  );
}

// ─── Manual selector ─────────────────────────────────────────────────────────

function ManualSelector({
  onSelect,
  onRetry,
}: {
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
          <p className="text-xs text-slate-400">Select manually from the menu</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes…"
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
              <span className="text-xs text-slate-400 ml-3">{item.calories} kcal · P {item.protein}g</span>
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

// ─── Log modal ───────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScannerPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef  = useRef<HTMLImageElement>(null);

  const [preview, setPreview]   = useState<string | null>(null);
  const [scanState, setScan]    = useState<ScanStatus>({ status: "idle" });
  const [showLog, setShowLog]   = useState(false);
  const [loggedDish, setLoggedDish] = useState<ScanResult | null>(null);
  const [logSuccess, setLogSuccess] = useState(false);

  const [isDragging, setDragging] = useState(false);

  // ── Load image from file ──────────────────────────────────────────────────

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScan({ status: "idle" });
    setLogSuccess(false);
    setLoggedDish(null);
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

  // ── Classify ──────────────────────────────────────────────────────────────

  const classify = useCallback(async () => {
    if (!imgRef.current || !preview) return;
    setScan({ status: "loading" });

    // Dynamic import keeps TF.js out of SSR
    const { classifyImage } = await import("@/lib/scanner");
    const result = await classifyImage(imgRef.current);
    setScan(result);
  }, [preview]);

  // ── Manual select ─────────────────────────────────────────────────────────

  function handleManualSelect(item: MenuItem) {
    const result = menuItemToScanResult(item);
    setScan({ status: "match", result });
  }

  // ── Log meal ─────────────────────────────────────────────────────────────

  function openLogModal() {
    if (scanState.status !== "match") return;
    setLoggedDish(scanState.result);
    setShowLog(true);
  }

  function confirmLog(mealType: MealType) {
    if (!loggedDish) return;
    // Build a MenuItem-like structure to pass to storage
    const pseudoItem = {
      id: Date.now(), // temporary ID for scanned items not in menu
      name:     loggedDish.name,
      type:     "veg" as const,
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
    setPreview(null);
    setScan({ status: "idle" });
    setLogSuccess(false);
    setLoggedDish(null);
    if (preview) URL.revokeObjectURL(preview);
  }

  const currentResult =
    scanState.status === "match" ? scanState.result : null;
  const noMatch =
    scanState.status === "no-match" || scanState.status === "error";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-lg mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Food Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Take a photo or upload an image to identify food
        </p>
      </div>

      {/* Upload zone */}
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
            isDragging
              ? "border-primary-400 bg-primary-50"
              : "border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/40"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center">
            <UploadCloud size={28} className="text-primary-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Drop an image here, or click to upload
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG, WEBP supported
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-card bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={preview}
              alt="Food preview"
              className="w-full max-h-72 object-contain"
              crossOrigin="anonymous"
            />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>

          {/* Identify button */}
          {scanState.status === "idle" && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={classify}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft transition-colors"
            >
              <ScanLine size={16} />
              Identify Food
            </motion.button>
          )}

          {/* Loading */}
          {scanState.status === "loading" && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-500">Analysing image…</span>
            </div>
          )}

          {/* Log success toast */}
          <AnimatePresence>
            {logSuccess && (
              <motion.div
                variants={fade} initial="hidden" animate="show" exit="exit"
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
              >
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-700">
                  Added to today's meal log!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result states */}
          <AnimatePresence mode="wait">
            {currentResult && (
              <ResultCard
                key="result"
                result={currentResult}
                onLog={openLogModal}
                onRetry={reset}
              />
            )}

            {noMatch && (
              <ManualSelector
                key="manual"
                onSelect={handleManualSelect}
                onRetry={reset}
              />
            )}

            {scanState.status === "error" && (
              <motion.div
                key="error"
                variants={fade} initial="hidden" animate="show" exit="exit"
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Classification failed</p>
                  <p className="text-xs text-red-500 mt-0.5">{scanState.message}</p>
                  <button onClick={reset} className="text-xs text-red-600 font-medium mt-2 hover:underline">
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Log modal */}
      <AnimatePresence>
        {showLog && loggedDish && (
          <LogModal
            result={loggedDish}
            onConfirm={confirmLog}
            onClose={() => setShowLog(false)}
          />
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Tips for best results
        </p>
        <ul className="space-y-1.5">
          {[
            "Use clear, well-lit images",
            "Zoom in so the food fills the frame",
            "Whole dishes work better than mixed plates",
            "If not recognised, use manual search",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-slate-500">
              <span className="text-primary-400 mt-0.5">›</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="h-6" aria-hidden="true" />
    </div>
  );
}
