/**
 * lib/teachable-machine.ts
 *
 * Loads and runs a Google Teachable Machine image classification model.
 *
 * HOW TO USE:
 *  1. Train your model at https://teachablemachine.withgoogle.com/train/image
 *     with classes: idly, dosa, poori, chapathi, rice, sambar (+ "unknown")
 *  2. Export → TensorFlow.js → "Download my model"
 *  3. Place the three files in: public/model/
 *       public/model/model.json
 *       public/model/weights.bin     (referenced inside model.json automatically)
 *       public/model/metadata.json
 *  4. The scanner will automatically prefer your TM model over MobileNet.
 *
 * Teachable Machine models accept 224×224 RGB input and output class probabilities.
 * metadata.json contains the ordered list of class label strings.
 */

import type * as TF from "@tensorflow/tfjs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TMPrediction {
  className:  string; // e.g. "dosa"
  confidence: number; // 0–1
}

interface TMMetadata {
  labels:    string[];
  imageSize: number; // usually 224
}

// ─── Module-level singletons ──────────────────────────────────────────────────

let _tmModel:    TF.LayersModel | null = null;
let _tmMeta:     TMMetadata     | null = null;
let _loadPromise: Promise<boolean> | null = null;

// ─── Model availability check ─────────────────────────────────────────────────

/**
 * Returns true if a trained Teachable Machine model is present at /model/.
 * This is a lightweight HEAD request — does not load the full model.
 */
export async function isTMModelAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/model/metadata.json", { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Lazy-loads the TM model (cached after first call).
 * @returns true if loaded successfully, false if model files are not found.
 */
export async function loadTMModel(): Promise<boolean> {
  if (_tmModel && _tmMeta) return true;

  // Deduplicate concurrent calls
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      // 1. Fetch metadata (class labels + image size)
      const metaRes = await fetch("/model/metadata.json");
      if (!metaRes.ok) return false;
      _tmMeta = (await metaRes.json()) as TMMetadata;

      // 2. Load TF.js model weights
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      _tmModel = await tf.loadLayersModel("/model/model.json");
      return true;
    } catch {
      _loadPromise = null; // allow retry on next call
      return false;
    }
  })();

  return _loadPromise;
}

// ─── Preprocess ───────────────────────────────────────────────────────────────

/**
 * Resizes the image to the model's expected input size, normalises pixels to
 * [-1, 1], and returns a batched tensor [1, size, size, 3].
 */
async function preprocessImage(
  imageEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<TF.Tensor4D> {
  const tf = await import("@tensorflow/tfjs");
  const size = _tmMeta?.imageSize ?? 224;

  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(imageEl);        // [H, W, 3]
    const resized = tf.image.resizeBilinear(pixels, [size, size]); // [size, size, 3]
    const normalised = resized.div(127.5).sub(1);         // [-1, 1]
    return normalised.expandDims(0) as TF.Tensor4D;       // [1, size, size, 3]
  });
}

// ─── Classify ─────────────────────────────────────────────────────────────────

/**
 * Classifies a single image using the loaded TM model.
 *
 * @returns Array of predictions sorted best-first, or empty array if model
 *          is not loaded.
 */
export async function classifyWithTM(
  imageEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<TMPrediction[]> {
  if (!_tmModel || !_tmMeta) return [];

  const tf = await import("@tensorflow/tfjs");
  const input = await preprocessImage(imageEl);

  try {
    const output = _tmModel.predict(input) as TF.Tensor;
    const probabilities = await output.data();
    input.dispose();
    output.dispose();

    const labels = _tmMeta.labels;
    return labels
      .map((className, i) => ({
        className,
        confidence: probabilities[i] as number,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  } catch {
    input.dispose();
    return [];
  }
}

/**
 * Returns the class labels from the loaded model's metadata.
 * Useful for display or validation.
 */
export function getTMLabels(): string[] {
  return _tmMeta?.labels ?? [];
}

/**
 * True once the model has been loaded successfully.
 */
export function isTMLoaded(): boolean {
  return _tmModel !== null && _tmMeta !== null;
}
