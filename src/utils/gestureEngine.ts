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

/**
 * Net wrist displacement (0‥1) across the velocity window to fire a swipe.
 * Raised from 0.018 → 0.035 to prevent hand-tremor false positives.
 */
export const SWIPE_THRESHOLD = 0.035;

/** Minimum confidence to emit a gesture event */
export const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Exponential smoothing factor for cursor (lower = smoother but laggier).
 * Raised from 0.18 → 0.25 for snappier tracking.
 */
export const SMOOTH_FACTOR = 0.25;

/**
 * Number of frames in the sliding window for gesture confirmation.
 * Reduced from 8 → 6 to cut latency from ~250ms to ~120ms.
 */
export const HISTORY_WINDOW = 6;

/**
 * How many frames in the window must agree before gesture is confirmed.
 * Reduced from 6 → 4 to match the smaller window.
 */
export const CONFIRM_COUNT = 4;

/** Minimum ms between emitting the same gesture twice (cooldown) */
export const GESTURE_COOLDOWN_MS = 550;

/** Ms of continuous PINCH before it becomes PINCH_HOLD (drag) */
export const PINCH_HOLD_MS = 280;

/** Number of frames in the swipe velocity accumulator window */
export const SWIPE_VELOCITY_FRAMES = 6;

/**
 * Minimum wrist Y movement for two-finger scroll (dead-zone).
 * Raised from 0.003 → 0.007 to eliminate hand-tremor scroll jitter.
 */
export const SCROLL_DEAD_ZONE = 0.007;

/**
 * Relative pinch distance (thumb-index / hand-scale) threshold for
 * continuous pinch-hold detection. Same metric as detectHandGesture.
 */
export const REL_PINCH_THRESHOLD = 0.22;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Euclidean distance between two landmarks */
export function landmarkDist(a: HandLandmark, b: HandLandmark): number {
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + dz ** 2);
}

/**
 * Determines if a finger is "folded" using rotation-invariant distance check.
 * Compares wrist→tip vs wrist→pip distance. When folded, the tip curls
 * back towards the wrist so tip_dist < pip_dist.
 * This works regardless of hand orientation (upright, sideways, tilted).
 *
 * PIP indices: index=6, middle=10, ring=14, pinky=18
 */
function isFolded(
  tip: HandLandmark,
  pip: HandLandmark,
  wrist: HandLandmark
): boolean {
  const tipDist = landmarkDist(tip, wrist);
  const pipDist = landmarkDist(pip, wrist);
  // Folded when tip is closer to wrist than PIP joint (with 5% tolerance)
  return tipDist < pipDist * 1.05;
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
  const indexPip  = landmarks[6];
  const indexTip  = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringMcp   = landmarks[13];
  const ringPip   = landmarks[14];
  const ringTip   = landmarks[16];
  const pinkyMcp  = landmarks[17];
  const pinkyPip  = landmarks[18];
  const pinkyTip  = landmarks[20];

  // Rotation-invariant fold detection using wrist-relative distances
  const indexUp  = !isFolded(indexTip, indexPip, wrist);
  const middleUp = !isFolded(middleTip, middlePip, wrist);
  const ringUp   = !isFolded(ringTip, ringPip, wrist);
  const pinkyUp  = !isFolded(pinkyTip, pinkyPip, wrist);

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

// ─── Swipe Detection (Velocity-Accumulated) ─────────────────────────────────

export interface SwipeResult {
  gesture: HandGesture;
  deltaX: number;
  deltaY: number;
}

/**
 * Multi-frame velocity accumulator for reliable swipe detection.
 * Tracks wrist positions over a sliding window and only fires a swipe when:
 *   1. The NET displacement exceeds the threshold (not per-frame jitter).
 *   2. The direction is consistent across the majority of frames.
 *   3. After firing, the buffer resets to prevent double/triple fires.
 */
export class SwipeVelocityTracker {
  private buffer: { x: number; y: number }[] = [];
  private readonly windowSize: number;
  private readonly threshold: number;

  constructor(
    windowSize: number = SWIPE_VELOCITY_FRAMES,
    threshold: number = SWIPE_THRESHOLD
  ) {
    this.windowSize = windowSize;
    this.threshold = threshold;
  }

  /**
   * Push a new wrist position and check for a completed swipe.
   * @param sensitivity Multiplier from user settings (higher = easier to trigger)
   */
  push(x: number, y: number, sensitivity: number = 1.0): SwipeResult {
    this.buffer.push({ x, y });
    if (this.buffer.length > this.windowSize) this.buffer.shift();

    // Need a full window to evaluate
    if (this.buffer.length < this.windowSize) {
      return { gesture: 'NONE', deltaX: 0, deltaY: 0 };
    }

    const first = this.buffer[0];
    const last = this.buffer[this.buffer.length - 1];
    const netDeltaX = last.x - first.x;
    const netDeltaY = last.y - first.y;
    const adjustedThreshold = this.threshold / sensitivity;

    // Check direction consistency — count how many consecutive frames
    // agree on the dominant direction
    let consistentFrames = 0;
    const dominantDir = Math.abs(netDeltaX) > Math.abs(netDeltaY) ? 'x' : 'y';
    const sign = dominantDir === 'x' ? Math.sign(netDeltaX) : Math.sign(netDeltaY);

    for (let i = 1; i < this.buffer.length; i++) {
      const delta = dominantDir === 'x'
        ? this.buffer[i].x - this.buffer[i - 1].x
        : this.buffer[i].y - this.buffer[i - 1].y;
      if (Math.sign(delta) === sign) consistentFrames++;
    }

    // Require majority of frames to agree on direction (≥60%)
    const minConsistent = Math.ceil((this.windowSize - 1) * 0.6);
    if (consistentFrames < minConsistent) {
      return { gesture: 'NONE', deltaX: netDeltaX, deltaY: netDeltaY };
    }

    // Horizontal swipe
    if (Math.abs(netDeltaX) > Math.abs(netDeltaY) && Math.abs(netDeltaX) > adjustedThreshold) {
      const gesture: HandGesture = netDeltaX > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
      this.reset(); // Prevent double-fire
      return { gesture, deltaX: netDeltaX, deltaY: netDeltaY };
    }

    // Vertical swipe
    if (Math.abs(netDeltaY) > Math.abs(netDeltaX) && Math.abs(netDeltaY) > adjustedThreshold) {
      const gesture: HandGesture = netDeltaY > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
      this.reset(); // Prevent double-fire
      return { gesture, deltaX: netDeltaX, deltaY: netDeltaY };
    }

    return { gesture: 'NONE', deltaX: netDeltaX, deltaY: netDeltaY };
  }

  reset(): void {
    this.buffer = [];
  }
}

/**
 * Simple single-frame swipe detector (kept for backward compat / lightweight use).
 * For the main loop, prefer SwipeVelocityTracker.
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

// ─── Platform Detection ───────────────────────────────────────────────────────

export type GesturePlatform = 'desktop' | 'mobile-web' | 'capacitor-android' | 'capacitor-ios' | 'unknown';

export interface PlatformCapabilities {
  platform: GesturePlatform;
  /** Whether the platform supports gesture camera navigation */
  gestureSupported: boolean;
  /** Reason if not supported */
  unsupportedReason?: string;
  /** Whether to use GPU or CPU delegate for MediaPipe */
  preferredDelegate: 'GPU' | 'CPU';
  /** Whether the device is primarily touch-based (phones) */
  isTouchPrimary: boolean;
}

/** Detect whether running inside a Capacitor native shell */
function isCapacitor(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined';
}

/** Detect Android Capacitor specifically */
function isCapacitorAndroid(): boolean {
  return isCapacitor() && (window as any)?.Capacitor?.getPlatform?.() === 'android';
}

/** Detect iOS Capacitor specifically */
function isCapacitorIOS(): boolean {
  return isCapacitor() && (window as any)?.Capacitor?.getPlatform?.() === 'ios';
}

/** Detect mobile browser (not Capacitor) */
function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    && !isCapacitor();
}

/** Check if WebGL2 is available (needed for MediaPipe GPU delegate) */
function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}

/** Check if getUserMedia is available */
function hasGetUserMedia(): boolean {
  return !!(navigator?.mediaDevices?.getUserMedia);
}

/**
 * Check if the screen is phone-sized (likely held in hand).
 * Gesture camera nav makes no sense on a phone — user holds it with one hand
 * and can't gesture with the other at a tiny screen.
 */
function isPhoneScreen(): boolean {
  const short = Math.min(window.innerWidth, window.innerHeight);
  return short < 600; // phones are typically < 600px on the short side
}

/**
 * Full platform capability detection for the gesture system.
 * Call once at startup to decide whether to enable gesture features.
 */
export function detectPlatformCapabilities(): PlatformCapabilities {
  // ── Capacitor Android ──
  if (isCapacitorAndroid()) {
    const webgl2 = hasWebGL2();
    const camera = hasGetUserMedia();
    // Android WebView: GPU delegate is unreliable, use CPU
    // Camera requires native permission + WebView chrome client config
    if (!camera) {
      return {
        platform: 'capacitor-android',
        gestureSupported: false,
        unsupportedReason: 'Camera access not available in this Android WebView. Ensure CAMERA permission is declared.',
        preferredDelegate: 'CPU',
        isTouchPrimary: true,
      };
    }
    return {
      platform: 'capacitor-android',
      gestureSupported: true,
      preferredDelegate: webgl2 ? 'GPU' : 'CPU',
      isTouchPrimary: true,
    };
  }

  // ── Capacitor iOS ──
  if (isCapacitorIOS()) {
    return {
      platform: 'capacitor-ios',
      gestureSupported: hasGetUserMedia(),
      unsupportedReason: hasGetUserMedia() ? undefined : 'Camera not available on this iOS device.',
      preferredDelegate: 'GPU', // iOS WebView has good WebGL2
      isTouchPrimary: true,
    };
  }

  // ── Mobile browser (not Capacitor) ──
  if (isMobileBrowser()) {
    const phone = isPhoneScreen();
    return {
      platform: 'mobile-web',
      gestureSupported: !phone && hasGetUserMedia(),
      unsupportedReason: phone
        ? 'Gesture navigation is designed for desktop/tablet screens. Use touch controls on phone.'
        : (!hasGetUserMedia() ? 'Camera API not available in this browser.' : undefined),
      preferredDelegate: hasWebGL2() ? 'GPU' : 'CPU',
      isTouchPrimary: true,
    };
  }

  // ── Desktop browser ──
  return {
    platform: 'desktop',
    gestureSupported: hasGetUserMedia(),
    unsupportedReason: hasGetUserMedia() ? undefined : 'Camera not available. Check browser permissions.',
    preferredDelegate: hasWebGL2() ? 'GPU' : 'CPU',
    isTouchPrimary: false,
  };
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
