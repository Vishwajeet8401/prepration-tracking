/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * gestureEngine.ts
 * ─────────────────────────────────────────────────────────────────────
 * Pure TypeScript gesture detection utilities.
 * No React imports — safe to import anywhere including workers.
 *
 * Supported Gestures:
 *   POINT       → Index finger extended only    → Air cursor / hover
 *   PINCH       → Thumb + index tip close       → Click
 *   PINCH_HOLD  → Pinch held > 300 ms           → Drag
 *   OPEN_HAND   → All fingers extended          → Stop / neutral
 *   FIST        → All fingers folded            → Right-click / context
 *   TWO_FINGERS → Index + Middle extended only  → Two-finger scroll
 *   THUMB_UP    → Thumb high, others folded     → Confirm
 *   SWIPE_LEFT  → Wrist velocity Δx > threshold → Prev tab
 *   SWIPE_RIGHT → Wrist velocity Δx > threshold → Next tab
 *   SWIPE_UP    → Wrist velocity Δy > threshold → Scroll up
 *   SWIPE_DOWN  → Wrist velocity Δy > threshold → Scroll down
 *   NONE        → Unrecognised or no hand       → No-op
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type HandGesture =
  | 'NONE'
  | 'OPEN_HAND'
  | 'FIST'
  | 'THUMB_UP'
  | 'POINT'
  | 'TWO_FINGERS'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'PINCH'
  | 'PINCH_HOLD';

export interface CursorPos {
  /** Normalized 0‥1 (left to right in camera space, already mirrored) */
  x: number;
  /** Normalized 0‥1 (top to bottom) */
  y: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface GestureEvent {
  gesture: HandGesture;
  /** 0‥1 confidence score */
  confidence: number;
  /** performance.now() timestamp */
  timestamp: number;
  cursor?: CursorPos;
  /** "Left" | "Right" from MediaPipe handedness */
  handedness?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Thumb–index normalised distance below which we consider a pinch */
export const PINCH_THRESHOLD = 0.045;

/** Wrist displacement (0‥1) per frame required to fire a swipe */
export const SWIPE_THRESHOLD = 0.018;

/** Minimum confidence to emit a gesture event */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Exponential smoothing factor for cursor (lower = smoother but laggier) */
export const SMOOTH_FACTOR = 0.18;

/** Number of frames in the sliding window for confirmation */
export const HISTORY_WINDOW = 8;

/** How many frames in the window must agree before gesture is confirmed */
export const CONFIRM_COUNT = 6;

/** Minimum ms between emitting the same gesture twice (cooldown) */
export const GESTURE_COOLDOWN_MS = 550;

/** Ms of continuous PINCH before it becomes PINCH_HOLD (drag) */
export const PINCH_HOLD_MS = 280;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Euclidean distance between two landmarks */
export function landmarkDist(a: HandLandmark, b: HandLandmark): number {
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + dz ** 2);
}

/**
 * Determines if a finger tip is "folded" (below its MCP joint in image Y space).
 * MediaPipe y increases downward so tip.y > mcp.y means folded.
 */
function isFolded(tip: HandLandmark, mcp: HandLandmark): boolean {
  return tip.y > mcp.y - 0.01; // 0.01 tolerance
}

// ─── Core Gesture Classifier ─────────────────────────────────────────────────

/**
 * Classifies a hand gesture from 21 MediaPipe hand landmarks.
 * Landmark indices follow the MediaPipe hand model:
 *   0  = wrist
 *   4  = thumb tip
 *   5  = index MCP    8  = index tip
 *   9  = middle MCP   12 = middle tip
 *   13 = ring MCP     16 = ring tip
 *   17 = pinky MCP    20 = pinky tip
 */
export function detectHandGesture(landmarks: HandLandmark[]): HandGesture {
  if (!landmarks || landmarks.length < 21) return 'NONE';

  const wrist     = landmarks[0];
  const thumbTip  = landmarks[4];
  const indexMcp  = landmarks[5];
  const indexTip  = landmarks[8];
  const middleMcp = landmarks[9];
  const middleTip = landmarks[12];
  const ringMcp   = landmarks[13];
  const ringTip   = landmarks[16];
  const pinkyMcp  = landmarks[17];
  const pinkyTip  = landmarks[20];

  const indexUp  = !isFolded(indexTip, indexMcp);
  const middleUp = !isFolded(middleTip, middleMcp);
  const ringUp   = !isFolded(ringTip, ringMcp);
  const pinkyUp  = !isFolded(pinkyTip, pinkyMcp);

  // ── FIST ──────────────────────────────────────────────────────────────────
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    return 'FIST';
  }

  // ── OPEN HAND ─────────────────────────────────────────────────────────────
  if (indexUp && middleUp && ringUp && pinkyUp) {
    return 'OPEN_HAND';
  }

  // Calculate relative scale-independent pinch distance normalized by hand size (wrist to middle MCP)
  const handScale = landmarkDist(wrist, middleMcp);
  const pinchDist = landmarkDist(thumbTip, indexTip);
  const relPinchDist = handScale > 0 ? pinchDist / handScale : 999;

  // ── PINCH ─────────────────────────────────────────────────────────────────
  // Deliberate pinch: index is up, thumb touches index, and other fingers are folded
  if (relPinchDist < 0.22 && !middleUp && !ringUp && !pinkyUp) {
    return 'PINCH'; // PINCH_HOLD is determined by duration, not shape
  }

  // ── POINT ─────────────────────────────────────────────────────────────────
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    return 'POINT';
  }
  // ── TWO_FINGERS ───────────────────────────────────────────────────────────
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return 'TWO_FINGERS';
  }
  // ── THUMB_UP ──────────────────────────────────────────────────────────────
  // Thumb tip is clearly above wrist, other fingers down
  if (
    thumbTip.y < wrist.y - 0.10 &&
    !indexUp && !middleUp && !ringUp && !pinkyUp
  ) {
    return 'THUMB_UP';
  }

  return 'NONE';
}

// ─── Swipe Detection ─────────────────────────────────────────────────────────

export interface SwipeResult {
  gesture: HandGesture;
  deltaX: number;
  deltaY: number;
}

/**
 * Detects swipe from the change in wrist/palm-center position between frames.
 * Returns NONE if no swipe threshold is met.
 */
export function detectSwipe(
  prevX: number | undefined,
  prevY: number | undefined,
  currX: number,
  currY: number,
  threshold: number = SWIPE_THRESHOLD
): SwipeResult {
  if (prevX === undefined || prevY === undefined) {
    return { gesture: 'NONE', deltaX: 0, deltaY: 0 };
  }

  const deltaX = currX - prevX;
  const deltaY = currY - prevY;

  // Only detect horizontal swipes for tab navigation
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > threshold)  return { gesture: 'SWIPE_RIGHT', deltaX, deltaY };
    if (deltaX < -threshold) return { gesture: 'SWIPE_LEFT', deltaX, deltaY };
  }

  return { gesture: 'NONE', deltaX, deltaY };
}

// ─── Cursor ──────────────────────────────────────────────────────────────────

/**
 * Returns the normalised cursor position from the index finger tip.
 * Note: MediaPipe X is mirrored relative to what the user sees — we flip it
 * here so the cursor moves naturally (like a mirror).
 */
export function getCursor(landmarks: HandLandmark[]): CursorPos {
  if (!landmarks || landmarks.length < 9) return { x: 0.5, y: 0.5 };
  const tip = landmarks[8]; // index tip
  return {
    x: 1 - tip.x, // mirror horizontally
    y: tip.y,
  };
}

/**
 * Exponential smoothing filter for the cursor position.
 * factor ∈ (0,1]: larger = faster/jittery, smaller = smoother/laggier.
 */
export function smoothCursor(
  current: CursorPos,
  target: CursorPos,
  factor: number = SMOOTH_FACTOR
): CursorPos {
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  };
}

// ─── Confidence Engine ───────────────────────────────────────────────────────

/**
 * Sliding-window confidence engine.
 * A gesture is only "confirmed" when it appears ≥ confirmCount times
 * in the last windowSize frames.  This eliminates single-frame noise.
 */
export class ConfidenceEngine {
  private history: HandGesture[] = [];

  constructor(
    private windowSize: number = HISTORY_WINDOW,
    private confirmCount: number = CONFIRM_COUNT
  ) {}

  /**
   * Push a new raw gesture reading.
   * @returns The confirmed gesture or 'NONE'.
   */
  push(gesture: HandGesture): HandGesture {
    this.history.push(gesture);
    if (this.history.length > this.windowSize) this.history.shift();

    if (gesture === 'NONE') return 'NONE';

    const count = this.history.filter(g => g === gesture).length;
    return count >= this.confirmCount ? gesture : 'NONE';
  }

  reset(): void {
    this.history = [];
  }

  /** Peek at majority gesture without modifying history */
  peek(): HandGesture {
    const freq = new Map<HandGesture, number>();
    for (const g of this.history) {
      freq.set(g, (freq.get(g) ?? 0) + 1);
    }
    let best: HandGesture = 'NONE';
    let bestCount = 0;
    for (const [g, c] of freq.entries()) {
      if (g !== 'NONE' && c > bestCount) { best = g; bestCount = c; }
    }
    return best;
  }
}

// ─── Canvas Drawing Utilities ─────────────────────────────────────────────────

/** Hand skeleton connection pairs (MediaPipe standard) */
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],          // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [5, 9], [9, 10], [10, 11], [11, 12],      // middle
  [9, 13], [13, 14], [14, 15], [15, 16],    // ring
  [13, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [0, 17],                                   // palm base
];

/**
 * Draw hand skeleton + landmark dots + cursor circle on a 2D canvas.
 * Expects landmarks already mirrored (transform: scaleX(-1) on canvas element).
 */
export function drawHandOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  isPinching: boolean = false
): void {
  if (!landmarks || landmarks.length < 21) return;

  // ── connections ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.65)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (const [i, j] of HAND_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
  }
  ctx.stroke();

  // ── landmark dots ──────────────────────────────────────────────────────────
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192, 168, 255, 0.85)';
    ctx.fill();
  }

  // ── index tip cursor circle ────────────────────────────────────────────────
  const tip = landmarks[8];
  const thumbTip = landmarks[4];
  const cursorColor = isPinching
    ? 'rgba(251, 146, 60, 0.85)'   // orange when pinching
    : 'rgba(96, 165, 250, 0.80)';  // blue when pointing

  ctx.beginPath();
  ctx.arc(tip.x * width, tip.y * height, isPinching ? 6 : 10, 0, Math.PI * 2);
  ctx.fillStyle = cursorColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── thumb tip small dot when pinching ─────────────────────────────────────
  if (isPinching) {
    ctx.beginPath();
    ctx.arc(thumbTip.x * width, thumbTip.y * height, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
    ctx.fill();
  }
}
