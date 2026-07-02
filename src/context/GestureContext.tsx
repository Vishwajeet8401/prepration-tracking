/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GestureContext.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Global gesture state + MediaPipe camera loop.
 * Wrap your app root with <GestureProvider> to enable gesture control.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';

import {
  detectHandGesture,
  getCursor,
  smoothCursor,
  drawHandOnCanvas,
  ConfidenceEngine,
  SwipeVelocityTracker,
  landmarkDist,
  detectPlatformCapabilities,
  CONFIDENCE_THRESHOLD,
  GESTURE_COOLDOWN_MS,
  PINCH_HOLD_MS,
  SMOOTH_FACTOR,
  SCROLL_DEAD_ZONE,
  REL_PINCH_THRESHOLD,
} from '../utils/gestureEngine';

import type { PlatformCapabilities } from '../utils/gestureEngine';

import type { CursorPos, GestureEvent, HandGesture } from '../utils/gestureEngine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GestureSettings {
  /** Master on/off toggle */
  enabled: boolean;
  /** 0.5 – 2.0, multiplies swipe threshold inversely */
  sensitivity: number;
  /** Which app tabs should respond to gesture events */
  activeTabs: string[];
}

export interface GestureDetection {
  gesture: HandGesture;
  confidence: number;
  timestamp: number;
  cursor: CursorPos;
}

export interface GestureState {
  settings: GestureSettings;
  camera: {
    active: boolean;
    /** true once permission was granted at least once */
    permissionGranted: boolean;
    /** Error message if camera failed */
    error: string | null;
  };
  detection: GestureDetection;
  calibration: {
    calibrated: boolean;
    /** Neutral center position locked during calibration */
    centerX: number;
    centerY: number;
  };
  /** true once HandLandmarker WASM is loaded */
  isModelReady: boolean;
  /** Platform capability info for UI display */
  platformInfo: PlatformCapabilities | null;
}

export interface GestureContextValue {
  state: GestureState;
  /** The most recently emitted (post-cooldown, post-confidence) gesture event */
  lastEvent: GestureEvent | null;
  /** Smoothed cursor position (updated every frame, even without events) */
  cursorPos: CursorPos;
  /** Whether the user is currently pinching */
  isPinching: boolean;
  /** Refs so CameraGestureWidget can show the live feed + skeleton */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // ── actions ──
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  calibrate: () => void;
  updateSettings: (partial: Partial<GestureSettings>) => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: GestureSettings = {
  enabled: false,
  sensitivity: 1.0,
  activeTabs: [
    'Home Dashboard',
    'AI Learning Assistant',
    'Study Topics & Revisions',
    'Flashcards & Practice',
    'Goals & Applications',
    'Reminders & Habits',
    'Task & Study Planner',
    'Experience & Story Builder',
    'Vocabulary Builder',
    'Progress & Analytics',
    'Learning Roadmaps',
    'My Achievements',
    'Daily Journal & Notes',
    'Practice Simulator',
    'Mobile Sync Hub',
    'Backup & Data Settings',
  ],
};

const DEFAULT_DETECTION: GestureDetection = {
  gesture: 'NONE',
  confidence: 0,
  timestamp: 0,
  cursor: { x: 0.5, y: 0.5 },
};

const DEFAULT_STATE: GestureState = {
  settings: DEFAULT_SETTINGS,
  camera: { active: false, permissionGranted: false, error: null },
  detection: DEFAULT_DETECTION,
  calibration: { calibrated: false, centerX: 0.5, centerY: 0.5 },
  isModelReady: false,
  platformInfo: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GestureContext = createContext<GestureContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const GestureProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ── state ──────────────────────────────────────────────────────────────────
  const [state, setState] = useState<GestureState>(DEFAULT_STATE);
  const [lastEvent, setLastEvent] = useState<GestureEvent | null>(null);
  const [cursorPos, setCursorPos] = useState<CursorPos>({ x: 0.5, y: 0.5 });
  const [isPinching, setIsPinching] = useState(false);

  // ── refs (stable, no re-renders) ──────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const prevWristYRef = useRef<number | undefined>(undefined);
  const smoothedCursorRef = useRef<CursorPos>({ x: 0.5, y: 0.5 });
  const confEngineRef = useRef(new ConfidenceEngine());
  const swipeTrackerRef = useRef(new SwipeVelocityTracker());
  const lastEmitTimeRef = useRef<Record<string, number>>({});
  const pinchStartRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const lastHoveredElementRef = useRef<Element | null>(null);


  // ── detect platform capabilities on mount ──────────────────────────────────
  const platformRef = useRef<PlatformCapabilities | null>(null);

  useEffect(() => {
    const caps = detectPlatformCapabilities();
    platformRef.current = caps;
    setState(prev => ({ ...prev, platformInfo: caps }));
    console.log('[GestureEngine] Platform:', caps.platform,
      '| Gesture supported:', caps.gestureSupported,
      '| Delegate:', caps.preferredDelegate,
      caps.unsupportedReason ? `| Reason: ${caps.unsupportedReason}` : '');
  }, []);

  // ── load MediaPipe HandLandmarker (with GPU→CPU fallback) ─────────────────
  useEffect(() => {
    let cancelled = false;

    async function tryCreateLandmarker(
      vision: any,
      delegate: 'GPU' | 'CPU'
    ): Promise<HandLandmarker> {
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate,
        },
        numHands: 1, // single hand for better perf on mobile
        runningMode: 'VIDEO',
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
    }

    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        const preferred = platformRef.current?.preferredDelegate ?? 'GPU';
        let landmarker: HandLandmarker;

        try {
          // Try preferred delegate first
          landmarker = await tryCreateLandmarker(vision, preferred);
          console.log(`[GestureEngine] Model loaded with ${preferred} delegate ✓`);
        } catch (gpuErr) {
          if (preferred === 'GPU') {
            // GPU failed — fallback to CPU
            console.warn('[GestureEngine] GPU delegate failed, falling back to CPU:', gpuErr);
            landmarker = await tryCreateLandmarker(vision, 'CPU');
            console.log('[GestureEngine] Model loaded with CPU delegate (fallback) ✓');
          } else {
            throw gpuErr;
          }
        }

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setState(prev => ({ ...prev, isModelReady: true }));
          console.log('[GestureEngine] HandLandmarker ready ✓');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[GestureEngine] Failed to load model:', err);
          setState(prev => ({
            ...prev,
            camera: {
              ...prev.camera,
              error: 'Failed to load AI hand-tracking model. Check your internet connection.',
            },
          }));
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // ── emit gesture (with per-gesture cooldown) ───────────────────────────────
  const emitGesture = useCallback(
    (gesture: HandGesture, confidence: number, cursor: CursorPos, handedness?: string) => {
      if (confidence < CONFIDENCE_THRESHOLD) return;

      const now = Date.now();
      const cooldowns: Record<string, number> = {
        PINCH: 600,
        PINCH_HOLD: 350,
        SWIPE_LEFT: 650,
        SWIPE_RIGHT: 650,
        THUMB_UP: 500,
        FIST: 500,
      };
      const cooldown = cooldowns[gesture] ?? GESTURE_COOLDOWN_MS;
      const lastEmit = lastEmitTimeRef.current[gesture] ?? 0;
      if (now - lastEmit < cooldown) return;

      lastEmitTimeRef.current[gesture] = now;

      // ── virtual click simulation ──
      if (gesture === 'PINCH') {
        const clientX = cursor.x * window.innerWidth;
        const clientY = cursor.y * window.innerHeight;
        const element = document.elementFromPoint(clientX, clientY);
        if (element) {
          const clickEvent = new MouseEvent('click', {
            clientX,
            clientY,
            bubbles: true,
            cancelable: true,
            view: window,
          });
          element.dispatchEvent(clickEvent);
          if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) {
            element.focus();
          }
        }
      }

      const event: GestureEvent = { gesture, confidence, timestamp: now, cursor, handedness };
      setLastEvent(event);
      setState(prev => ({
        ...prev,
        detection: { gesture, confidence, timestamp: now, cursor },
      }));
    },
    []
  );


  // ── main detection rAF loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!state.camera.active || !state.isModelReady) return;

    let frameId: number;

    function detect() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !canvas || !landmarker || video.readyState < 2) {
        frameId = requestAnimationFrame(detect);
        return;
      }

      // ── run inference ────────────────────────────────────────────────────
      const result: HandLandmarkerResult = landmarker.detectForVideo(
        video,
        performance.now()
      );

      // ── clear canvas ────────────────────────────────────────────────────
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (result.landmarks && result.landmarks.length > 0) {
        const hand = result.landmarks[0];
        const handedness = result.handedness?.[0]?.[0]?.categoryName ?? 'Right';

        // ── gesture classification ──────────────────────────────────────
        const rawGesture = detectHandGesture(hand);
        const confirmed = confEngineRef.current.push(rawGesture);

        // ── cursor smoothing ────────────────────────────────────────────
        const rawCursor = getCursor(hand);
        smoothedCursorRef.current = smoothCursor(
          smoothedCursorRef.current,
          rawCursor,
          SMOOTH_FACTOR * state.settings.sensitivity
        );
        setCursorPos({ ...smoothedCursorRef.current });

        // ── virtual hover emulation ──
        const hoverX = smoothedCursorRef.current.x * window.innerWidth;
        const hoverY = smoothedCursorRef.current.y * window.innerHeight;
        const hoverEl = document.elementFromPoint(hoverX, hoverY);
        if (hoverEl !== lastHoveredElementRef.current) {
          if (lastHoveredElementRef.current) {
            lastHoveredElementRef.current.classList.remove('gesture-hover');
            const mouseLeaveEvent = new MouseEvent('mouseleave', {
              clientX: hoverX,
              clientY: hoverY,
              bubbles: true,
              cancelable: true,
              view: window,
            });
            lastHoveredElementRef.current.dispatchEvent(mouseLeaveEvent);
          }
          if (hoverEl) {
            hoverEl.classList.add('gesture-hover');
            const mouseEnterEvent = new MouseEvent('mouseenter', {
              clientX: hoverX,
              clientY: hoverY,
              bubbles: true,
              cancelable: true,
              view: window,
            });
            hoverEl.dispatchEvent(mouseEnterEvent);
          }
          lastHoveredElementRef.current = hoverEl;
        }
        if (hoverEl) {
          const mouseMoveEvent = new MouseEvent('mousemove', {
            clientX: hoverX,
            clientY: hoverY,
            bubbles: true,
            cancelable: true,
            view: window,
          });
          hoverEl.dispatchEvent(mouseMoveEvent);
        }


        // ── pinch detection (scale-normalized, continuous) ───────────────
        // Use relative pinch: thumb-index distance / hand scale (wrist-to-middleMCP)
        const wrist = hand[0];
        const middleMcp = hand[9];
        const handScale = landmarkDist(wrist, middleMcp);
        const pinchDist = landmarkDist(hand[4], hand[8]);
        const relPinch = handScale > 0 ? pinchDist / handScale : 999;
        const nowPinching = relPinch < REL_PINCH_THRESHOLD;

        if (nowPinching && !isPinchingRef.current) {
          // pinch started
          isPinchingRef.current = true;
          pinchStartRef.current = Date.now();
          setIsPinching(true);
        } else if (!nowPinching && isPinchingRef.current) {
          // pinch released
          const held = Date.now() - (pinchStartRef.current ?? 0);
          if (held < PINCH_HOLD_MS) {
            // short pinch → click
            emitGesture('PINCH', 0.92, smoothedCursorRef.current, handedness);
          }
          isPinchingRef.current = false;
          pinchStartRef.current = null;
          setIsPinching(false);
        }

        // pinch hold → drag
        if (
          nowPinching &&
          pinchStartRef.current &&
          Date.now() - pinchStartRef.current > PINCH_HOLD_MS
        ) {
          emitGesture('PINCH_HOLD', 0.90, smoothedCursorRef.current, handedness);
        }

        // ── swipe detection (velocity-accumulated, OPEN_HAND only) ──────
        // Only allow swipes when the raw gesture is OPEN_HAND (intentional
        // palm push). This prevents accidental swipes from FIST, POINT, etc.
        const wristX = hand[0].x;
        const wristY = hand[0].y;

        let swipeGesture: HandGesture = 'NONE';
        if (rawGesture === 'OPEN_HAND' && !nowPinching) {
          // Feed wrist position into the velocity accumulator
          const swipeResult = swipeTrackerRef.current.push(
            wristX,
            wristY,
            state.settings.sensitivity
          );
          swipeGesture = swipeResult.gesture;
        } else {
          // Not in swipe-eligible gesture — reset the tracker so partial
          // motion doesn't carry over
          swipeTrackerRef.current.reset();
        }

        // ── combine and emit ────────────────────────────────────────────
        let finalGesture: HandGesture = confirmed;

        // Swipes have priority over static gestures (except pinch)
        if (
          swipeGesture !== 'NONE' &&
          !nowPinching &&
          finalGesture !== 'PINCH' &&
          finalGesture !== 'PINCH_HOLD'
        ) {
          finalGesture = swipeGesture;
        }

        if (finalGesture !== 'NONE' && !nowPinching) {
          emitGesture(finalGesture, 0.88, smoothedCursorRef.current, handedness);
        }

        // ── continuous two finger scroll (with dead-zone) ───────────────
        if (confirmed === 'TWO_FINGERS') {
          const scrollWristY = hand[0].y;
          if (prevWristYRef.current !== undefined) {
            const movement = prevWristYRef.current - scrollWristY;
            // Dead-zone: ignore tiny hand tremor movements
            if (Math.abs(movement) >= SCROLL_DEAD_ZONE) {
              const sensitivity = 850 * state.settings.sensitivity;
              const scrollAmount = -movement * sensitivity;
              const clampedScroll = Math.max(-60, Math.min(60, scrollAmount));

              // Find scroll container
              let scrollTarget: Element | Window = window;
              const activeTabEl = document.querySelector('.tab-content-active, .tab-pane-active') || document;
              const container = activeTabEl.querySelector('.overflow-y-auto, [class*="scrollable"], .virtuoso-grid, .virtuoso-list');
              if (container) {
                scrollTarget = container;
              }

              scrollTarget.scrollBy({ top: clampedScroll, behavior: 'auto' });
            }
          }
          prevWristYRef.current = scrollWristY;
        } else {
          prevWristYRef.current = undefined;
        }

        // update detection state every frame (no cooldown here — just for display)
        setState(prev => ({
          ...prev,
          detection: {
            gesture: finalGesture,
            confidence: 0.88,
            timestamp: Date.now(),
            cursor: smoothedCursorRef.current,
          },
        }));

        // ── draw skeleton ───────────────────────────────────────────────
        if (ctx) {
          drawHandOnCanvas(ctx, hand, canvas.width, canvas.height, nowPinching);
        }
      } else {
        // no hand visible — reset all trackers
        confEngineRef.current.reset();
        swipeTrackerRef.current.reset();
        prevWristYRef.current = undefined;
        isPinchingRef.current = false;
        pinchStartRef.current = null;
        setIsPinching(false);

        setState(prev => ({
          ...prev,
          detection: { ...DEFAULT_DETECTION },
        }));
      }

      frameId = requestAnimationFrame(detect);
    }

    detect();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.camera.active, state.isModelReady, state.settings.sensitivity, emitGesture]);

  // ── camera controls (platform-aware) ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (state.camera.active) return;

    // Check platform support before trying camera
    const caps = platformRef.current;
    if (caps && !caps.gestureSupported) {
      setState(prev => ({
        ...prev,
        camera: {
          ...prev.camera,
          error: caps.unsupportedReason ?? 'Gesture navigation not supported on this device.',
        },
      }));
      return;
    }

    try {
      // Use lower resolution on mobile/Capacitor for performance
      const isMobile = caps?.isTouchPrimary ?? false;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: isMobile ? 320 : 640 },
          height: { ideal: isMobile ? 240 : 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState(prev => ({
        ...prev,
        camera: { active: true, permissionGranted: true, error: null },
        settings: { ...prev.settings, enabled: true },
      }));
    } catch (err: any) {
      let errMsg = err?.message ?? 'Camera access denied';

      // Provide platform-specific error guidance
      if (caps?.platform === 'capacitor-android') {
        errMsg += '\n\nOn Android: Go to Settings > Apps > Preparation Tracker > Permissions > Camera > Allow.';
      } else if (caps?.platform === 'capacitor-ios') {
        errMsg += '\n\nOn iOS: Go to Settings > Preparation Tracker > Camera > Allow.';
      }

      console.error('[GestureEngine] Camera error:', err);
      setState(prev => ({
        ...prev,
        camera: { ...prev.camera, error: errMsg },
      }));
    }
  }, [state.camera.active]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (lastHoveredElementRef.current) {
      lastHoveredElementRef.current.classList.remove('gesture-hover');
      lastHoveredElementRef.current = null;
    }
    confEngineRef.current.reset();
    swipeTrackerRef.current.reset();
    isPinchingRef.current = false;
    pinchStartRef.current = null;
    setIsPinching(false);
    setLastEvent(null);

    setState(prev => ({
      ...prev,
      camera: { ...prev.camera, active: false, error: null },
      settings: { ...prev.settings, enabled: false },
      detection: DEFAULT_DETECTION,
    }));
  }, []);

  // cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const calibrate = useCallback(() => {
    const { x, y } = smoothedCursorRef.current;
    setState(prev => ({
      ...prev,
      calibration: { calibrated: true, centerX: x, centerY: y },
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<GestureSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  }, []);

  // ── context value ──────────────────────────────────────────────────────────
  const value = useMemo<GestureContextValue>(
    () => ({
      state,
      lastEvent,
      cursorPos,
      isPinching,
      videoRef,
      canvasRef,
      startCamera,
      stopCamera,
      calibrate,
      updateSettings,
    }),
    [state, lastEvent, cursorPos, isPinching, startCamera, stopCamera, calibrate, updateSettings]
  );

  return (
    <GestureContext.Provider value={value}>
      {/* Hidden video + canvas used by the detection loop */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {children}
    </GestureContext.Provider>
  );
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Access the full gesture context */
export function useGestureContext(): GestureContextValue {
  const ctx = useContext(GestureContext);
  if (!ctx) throw new Error('useGestureContext must be used inside <GestureProvider>');
  return ctx;
}

// Re-export types consumed by hooks / components
export type { CursorPos, GestureEvent, HandGesture };
