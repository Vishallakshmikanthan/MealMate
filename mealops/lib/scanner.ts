/**
 * lib/scanner.ts
 * AI food recognition pipeline:
 *   1. TensorFlow.js MobileNet v2 → top-5 ImageNet predictions
 *   2. Keyword mapping: generic ImageNet labels → South Indian food names
 *   3. Fuse.js weighted fuzzy match: prob × (1 – fuseScore) per candidate
 *   4. Aggregated ranking with confidence score + alternatives
 *
 * Fully client-side — no external API calls.
 * MobileNet weights are lazily fetched from TF.js CDN and browser-cached.
 */

import Fuse from "fuse.js";
import type { MenuItem } from "@/types/index";
import { getAllMenuItems } from "@/data/menu-week";

// ─── Types ────────────────────────────────────────────────────────────────────

/** One raw MobileNet prediction, normalised for display. */
export interface RawPrediction {
  label: string;       // normalised label text
  probability: number; // 0–1
}

export interface ScanResult {
  /** Best normalised label from MobileNet (e.g. "pancake"). */
  detectedName: string;
  /** Combined weighted score: mobilenet_prob × match_quality (0–1). */
  confidence: number;
  /** Matched menu item name. */
  name: string;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  fiber:    number;
  source: "menu" | "unknown";
  /** Original MobileNet className string (for debugging). */
  rawLabel: string;
  /** Up to 3 alternative menu items ranked by combined score. */
  alternatives: MenuItem[];
  matchedMenuItem?: MenuItem;
}

export type LoadingPhase = "model" | "analysis" | "matching";

export type ScanStatus =
  | { status: "idle" }
  | { status: "loading"; phase: LoadingPhase }
  | { status: "match";          result: ScanResult }
  | { status: "low-confidence"; result: ScanResult; rawPredictions: RawPrediction[] }
  | { status: "no-match";       rawLabel: string;   rawPredictions: RawPrediction[] }
  | { status: "error";          message: string };

// ─── Keyword mapping ──────────────────────────────────────────────────────────
// Maps single words that appear in ImageNet labels → local food name candidates.

const KEYWORD_MAP: Record<string, string[]> = {
  // Breads / Flatbreads
  flatbread: ["chapathi", "roti", "paratha"],
  naan:      ["naan", "chapathi"],
  tortilla:  ["chapathi", "dosa"],
  pancake:   ["dosa", "uttapam"],
  crepe:     ["dosa"],
  waffle:    ["uttapam"],
  pita:      ["chapathi", "roti"],
  // Lentils / Soups / Gravies
  stew:      ["sambar", "dal"],
  soup:      ["sambar", "rasam", "dal"],
  broth:     ["rasam", "sambar"],
  lentil:    ["dal sambar", "dal"],
  gravy:     ["curry", "sambar"],
  sauce:     ["sambar", "coconut chutney"],
  // Rice dishes
  rice:      ["rice", "biryani", "pongal", "pulao"],
  pilaf:     ["biryani", "pulao"],
  // Porridge / Semolina
  porridge:  ["upma", "pongal", "oats porridge"],
  grits:     ["upma"],
  oatmeal:   ["oats porridge"],
  pudding:   ["kheer", "payasam"],
  // Dumplings
  dumpling:  ["idli", "kozhukattai"],
  mochi:     ["idli"],
  bun:       ["idli"],
  // Fritters / Fried
  fritter:   ["vada", "pakoda", "bonda"],
  doughnut:  ["vada", "medu vada"],
  donut:     ["vada"],
  tempura:   ["pakoda"],
  // Eggs
  egg:       ["boiled egg", "egg omelette"],
  omelet:    ["egg omelette"],
  omelette:  ["egg omelette"],
  deviled:   ["boiled egg"],
  // Fruits
  banana:    ["banana"],
  apple:     ["apple"],
  mango:     ["mango"],
  // Beverages
  coffee:    ["coffee", "filter coffee"],
  espresso:  ["coffee", "filter coffee"],
  tea:       ["masala chai"],
  chai:      ["masala chai"],
  // Dairy
  yogurt:    ["curd", "lassi"],
  curd:      ["curd"],
  cheese:    ["paneer"],
  // Sweets
  halva:     ["halwa", "kesari"],
  cake:      ["cake"],
  // Meat
  chicken:   ["chicken curry", "chicken biryani", "grilled chicken"],
  meat:      ["mutton curry"],
  fish:      ["fish curry", "fish fry"],
  // Snacks
  pretzel:   ["murukku", "chakli"],
  chip:      ["chips"],
  // Salad / Veg
  salad:     ["salad", "sprouts"],
  pickle:    ["pickle"],
};

// ─── MobileNet lazy loader ────────────────────────────────────────────────────

type MobileNetModel = {
  classify: (
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    topK?: number
  ) => Promise<Array<{ className: string; probability: number }>>;
};

let _model: MobileNetModel | null = null;

async function getModel(): Promise<MobileNetModel> {
  if (_model) return _model;
  const [tf, mobilenet] = await Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/mobilenet"),
  ]);
  await tf.ready();
  _model = await mobilenet.load({ version: 2, alpha: 1.0 });
  return _model;
}

// ─── Fuse.js setup ────────────────────────────────────────────────────────────

let _fuse: Fuse<MenuItem> | null = null;

function getFuse(): Fuse<MenuItem> {
  if (_fuse) return _fuse;
  const items = getAllMenuItems();
  _fuse = new Fuse(items, {
    keys: ["name", "tags"],
    threshold: 0.55,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return _fuse;
}

// ─── Text normalisation ───────────────────────────────────────────────────────

/** Take first synonym from "hotdog, hot dog" → "hotdog", lowercase + strip. */
function normaliseLabel(label: string): string {
  const first = label.split(",")[0] ?? label;
  return first.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

// ─── Keyword expansion ────────────────────────────────────────────────────────

/** Returns all food name candidates for a label via the keyword map. */
function expandLabel(label: string): string[] {
  const words = label.split(/\s+/);
  const candidates = new Set<string>([label]);
  for (const word of words) {
    const mapped = KEYWORD_MAP[word];
    if (mapped) mapped.forEach((m) => candidates.add(m));
  }
  return Array.from(candidates);
}

// ─── Weighted matching ────────────────────────────────────────────────────────

interface WeightedMatch {
  item: MenuItem;
  combinedScore: number; // higher = better
}

/**
 * For one MobileNet prediction, expand the label through keyword map,
 * search Fuse.js for each candidate, and score by:
 *   combinedScore = mobilenet_probability × (1 – fuse_score)
 */
function matchPrediction(label: string, probability: number): WeightedMatch[] {
  const fuse = getFuse();
  const candidates = expandLabel(label);
  const seen = new Set<number>();
  const matches: WeightedMatch[] = [];

  for (const candidate of candidates) {
    const results = fuse.search(candidate, { limit: 3 });
    for (const r of results) {
      if (!r.item || seen.has(r.item.id)) continue;
      seen.add(r.item.id);
      const fuseScore = r.score ?? 1; // Fuse: 0 = perfect, 1 = worst
      matches.push({
        item: r.item,
        combinedScore: probability * (1 - fuseScore),
      });
    }
  }
  return matches;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const HIGH_CONFIDENCE_THRESHOLD = 0.12; // show as definite match
const LOW_CONFIDENCE_THRESHOLD  = 0.04; // show as low-confidence guess

// ─── TM-based pipeline (used when trained model is present) ──────────────────

/**
 * TM confidence thresholds (higher because TM is trained on exact food classes):
 *   ≥ 0.70 → definite match
 *   ≥ 0.35 → low-confidence guess
 *   < 0.35 → no-match, fall through to MobileNet
 */
const TM_HIGH_THRESHOLD = 0.70;
const TM_LOW_THRESHOLD  = 0.35;

/**
 * Tries to classify via a Teachable Machine model.
 * Returns null if the TM model is not available or gives no useful result.
 */
async function classifyWithTMPipeline(
  imageEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  onPhase?: (phase: LoadingPhase) => void
): Promise<ScanStatus | null> {
  const { loadTMModel, classifyWithTM } = await import("@/lib/teachable-machine");

  onPhase?.("model");
  const loaded = await loadTMModel();
  if (!loaded) return null;

  onPhase?.("analysis");
  const preds = await classifyWithTM(imageEl);
  if (preds.length === 0) return null;

  // Ignore "unknown" class — it just means the model abstains
  const usable = preds.filter((p) => p.className.toLowerCase() !== "unknown");
  const best   = usable[0];
  if (!best || best.confidence < TM_LOW_THRESHOLD) return null;

  onPhase?.("matching");

  // Direct fuzzy match on the exact class name
  const fuse = getFuse();
  const fuseResults = fuse.search(best.className, { limit: 5 });
  if (fuseResults.length === 0) return null;

  const topMatch = fuseResults[0];
  if (!topMatch?.item) return null;

  const rawPredictions: RawPrediction[] = usable.map((p) => ({
    label:       p.className,
    probability: p.confidence,
  }));

  const item = topMatch.item;
  const result: ScanResult = {
    detectedName:    best.className,
    confidence:      best.confidence,
    name:            item.name,
    calories:        item.calories,
    protein:         item.protein,
    carbs:           item.carbs,
    fat:             item.fat,
    fiber:           item.fiber,
    source:          "menu",
    rawLabel:        best.className,
    alternatives:    fuseResults.slice(1, 4).map((r) => r.item),
    matchedMenuItem: item,
  };

  return best.confidence >= TM_HIGH_THRESHOLD
    ? { status: "match", result }
    : { status: "low-confidence", result, rawPredictions };
}

// ─── MobileNet pipeline (fallback) ───────────────────────────────────────────

async function classifyWithMobileNetPipeline(
  imageEl: HTMLImageElement,
  onPhase?: (phase: LoadingPhase) => void
): Promise<ScanStatus> {
  onPhase?.("model");
  const model = await getModel();

  onPhase?.("analysis");
  const predictions = await model.classify(imageEl, 5);

  onPhase?.("matching");

  const rawPredictions: RawPrediction[] = predictions.map((p) => ({
    label:       normaliseLabel(p.className),
    probability: p.probability,
  }));

  const allMatches = new Map<number, WeightedMatch>();
  for (const pred of predictions) {
    const label = normaliseLabel(pred.className);
    for (const m of matchPrediction(label, pred.probability)) {
      const existing = allMatches.get(m.item.id);
      if (!existing || m.combinedScore > existing.combinedScore) {
        allMatches.set(m.item.id, m);
      }
    }
  }

  const ranked   = Array.from(allMatches.values()).sort((a, b) => b.combinedScore - a.combinedScore);
  const best     = ranked[0];
  const topLabel = rawPredictions[0]?.label ?? "unknown";

  if (!best || best.combinedScore < LOW_CONFIDENCE_THRESHOLD) {
    return { status: "no-match", rawLabel: topLabel, rawPredictions };
  }

  const { item } = best;
  const result: ScanResult = {
    detectedName:    topLabel,
    confidence:      best.combinedScore,
    name:            item.name,
    calories:        item.calories,
    protein:         item.protein,
    carbs:           item.carbs,
    fat:             item.fat,
    fiber:           item.fiber,
    source:          "menu",
    rawLabel:        predictions[0]?.className ?? topLabel,
    alternatives:    ranked.slice(1, 4).map((m) => m.item),
    matchedMenuItem: item,
  };

  return best.combinedScore >= HIGH_CONFIDENCE_THRESHOLD
    ? { status: "match", result }
    : { status: "low-confidence", result, rawPredictions };
}

// ─── Core pipeline ────────────────────────────────────────────────────────────

/**
 * Classifies an image against the local menu.
 *
 * Strategy:
 *   1. Try the Teachable Machine model (if model files are present in /public/model/)
 *   2. Fall back to MobileNet + keyword mapping + Fuse.js
 *
 * @param imageEl  - A fully loaded HTMLImageElement (or video/canvas for camera mode)
 * @param onPhase  - Optional callback fired as each loading phase starts
 * @returns        ScanStatus (always resolves, never throws)
 */
export async function classifyImage(
  imageEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  onPhase?: (phase: LoadingPhase) => void
): Promise<ScanStatus> {
  try {
    // Try Teachable Machine first
    const tmResult = await classifyWithTMPipeline(imageEl, onPhase);
    if (tmResult) return tmResult;

    // Fall back to MobileNet (only works on HTMLImageElement)
    if (imageEl instanceof HTMLImageElement) {
      return await classifyWithMobileNetPipeline(imageEl, onPhase);
    }

    // Video/canvas with no TM model → prompt manual
    return {
      status:          "no-match",
      rawLabel:        "unknown",
      rawPredictions:  [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Classification failed";
    return { status: "error", message };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fuzzy-searches menu items by text — used by the manual fallback selector. */
export function searchMenuItems(query: string): MenuItem[] {
  if (!query.trim()) return getAllMenuItems().slice(0, 20);
  return getFuse().search(query).map((r) => r.item);
}

/** Wraps a manually selected MenuItem into a ScanResult. */
export function menuItemToScanResult(item: MenuItem): ScanResult {
  return {
    detectedName:    item.name,
    confidence:      1,
    name:            item.name,
    calories:        item.calories,
    protein:         item.protein,
    carbs:           item.carbs,
    fat:             item.fat,
    fiber:           item.fiber,
    source:          "menu",
    rawLabel:        item.name,
    alternatives:    [],
    matchedMenuItem: item,
  };
}
