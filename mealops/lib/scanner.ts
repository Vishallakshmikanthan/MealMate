/**
 * lib/scanner.ts
 * Offline food recognition pipeline:
 *   1. TensorFlow.js MobileNet → top-5 ImageNet predictions
 *   2. Fuse.js fuzzy match against local menu data
 *   3. Structured result (with fallback)
 *
 * No external API calls are made.  The MobileNet weights are fetched once
 * from the TF.js CDN (bundled in the browser cache after the first load).
 */

import Fuse from "fuse.js";
import type { MenuItem } from "@/types/index";
import { getAllMenuItems } from "@/data/menu-week";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: "menu" | "unknown";
  /** Raw MobileNet prediction label (for debugging / display). */
  rawLabel: string;
  /** Fuse.js confidence score (0 = perfect, 1 = no match). */
  confidence: number;
}

export type ScanStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "match"; result: ScanResult }
  | { status: "no-match"; rawLabel: string }
  | { status: "error"; message: string };

// ─── MobileNet lazy loader ────────────────────────────────────────────────────

// Dynamically imported so TF.js doesn't bloat the server bundle.
type MobileNetModel = {
  classify: (
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    topK?: number
  ) => Promise<Array<{ className: string; probability: number }>>;
};

let _model: MobileNetModel | null = null;

async function getModel(): Promise<MobileNetModel> {
  if (_model) return _model;

  // Dynamic import keeps TF.js out of the SSR bundle
  const [tf, mobilenet] = await Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/mobilenet"),
  ]);

  // Ensure the backend is ready before loading weights
  await tf.ready();
  _model = await mobilenet.load({ version: 2, alpha: 1.0 });
  return _model;
}

// ─── Fuse.js fuzzy matcher ────────────────────────────────────────────────────

let _fuse: Fuse<MenuItem> | null = null;

function getFuse(): Fuse<MenuItem> {
  if (_fuse) return _fuse;

  const items = getAllMenuItems();
  _fuse = new Fuse(items, {
    keys: ["name", "tags"],
    threshold: 0.5,          // 0 = exact, 1 = match everything
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 3,
  });
  return _fuse;
}

// ─── Label normalisation ──────────────────────────────────────────────────────

/**
 * MobileNet returns ImageNet class names like:
 *   "hotdog, hot dog, red hot"
 *   "pretzel"
 *   "plate"
 * We take the first synonym, lowercase it, strip punctuation.
 */
function normaliseMobileNetLabel(label: string): string {
  const first = label.split(",")[0] ?? label;
  return first.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

// ─── Core pipeline ────────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.55; // Fuse score — below this we consider it a good match

/**
 * Classifies an image element and attempts to match it against the local menu.
 *
 * @param imageEl - An already-loaded HTMLImageElement
 * @returns ScanStatus (always resolves, never throws)
 */
export async function classifyImage(
  imageEl: HTMLImageElement
): Promise<ScanStatus> {
  try {
    const model = await getModel();
    const predictions = await model.classify(imageEl, 5);

    // Attempt a menu match for each prediction (most confident first)
    for (const pred of predictions) {
      const query = normaliseMobileNetLabel(pred.className);
      const fuseResults = getFuse().search(query);

      if (fuseResults.length > 0) {
        const best = fuseResults[0];
        if (!best) continue;
        const score = best.score ?? 1;

        if (score < MATCH_THRESHOLD && best.item) {
          const item = best.item;
          return {
            status: "match",
            result: {
              name:       item.name,
              calories:   item.calories,
              protein:    item.protein,
              carbs:      item.carbs,
              fat:        item.fat,
              fiber:      item.fiber,
              source:     "menu",
              rawLabel:   pred.className,
              confidence: 1 - score,
            },
          };
        }
      }
    }

    // Nothing matched well enough
    const topLabel = normaliseMobileNetLabel(
      predictions[0]?.className ?? "unknown"
    );
    return { status: "no-match", rawLabel: topLabel };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Classification failed";
    return { status: "error", message };
  }
}

/**
 * Fuzzy-searches menu items by text query.
 * Used by the manual fallback selector.
 */
export function searchMenuItems(query: string): MenuItem[] {
  if (!query.trim()) return getAllMenuItems().slice(0, 20);
  return getFuse()
    .search(query)
    .map((r) => r.item);
}

/**
 * Converts a MenuItem to a ScanResult with source = "menu".
 * Used when the user manually selects a dish.
 */
export function menuItemToScanResult(item: MenuItem): ScanResult {
  return {
    name:       item.name,
    calories:   item.calories,
    protein:    item.protein,
    carbs:      item.carbs,
    fat:        item.fat,
    fiber:      item.fiber,
    source:     "menu",
    rawLabel:   item.name,
    confidence: 1,
  };
}
