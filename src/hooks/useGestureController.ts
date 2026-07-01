/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useGestureController.ts
 * ─────────────────────────────────────────────────────────────────────
 * Per-component hook that maps gesture events to action callbacks.
 * Attach this in any component that should respond to hand gestures.
 *
 * Usage:
 *   const { cursorPos, isPinching } = useGestureController({
 *     activeTab: 'Vocabulary Builder',
 *     onSwipeLeft: () => handlePrevCard(),
 *     onSwipeRight: () => handleNextCard(),
 *     onThumbUp: () => markMastered(),
 *   });
 */

import { useEffect } from 'react';
import { useGestureContext } from '../context/GestureContext';
import type { CursorPos, GestureEvent } from '../context/GestureContext';
import { CONFIDENCE_THRESHOLD } from '../utils/gestureEngine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GestureControllerOptions {
  /**
   * If provided, this hook only fires callbacks when the gesture system
   * has this tab listed in `settings.activeTabs`.
   * Leave undefined to always respond.
   */
  activeTab?: string;

  // ── Navigation ────────────────────────────────────────────────────────────
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;

  // ── Interaction ───────────────────────────────────────────────────────────
  /** Fired on short pinch (finger + thumb close then release) → click */
  onClick?: (cursor: CursorPos) => void;
  /** Fired while pinch is held > 300 ms → drag move */
  onPinchHold?: (cursor: CursorPos) => void;

  // ── Scroll ────────────────────────────────────────────────────────────────
  /** Two fingers extended — use with onSwipeUp/Down for scroll commands */
  onTwoFingers?: () => void;

  // ── Semantic gestures ─────────────────────────────────────────────────────
  onThumbUp?: () => void;
  onOpenHand?: () => void;
  onFist?: () => void;
  onPoint?: (cursor: CursorPos) => void;
}

export interface GestureControllerResult {
  /** Latest smoothed cursor position (updated every frame) */
  cursorPos: CursorPos;
  /** true while user is pinching */
  isPinching: boolean;
  /** true if gesture mode is enabled and active */
  isGestureActive: boolean;
  /** The raw lastEvent for advanced consumers */
  lastEvent: GestureEvent | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGestureController(
  options: GestureControllerOptions = {}
): GestureControllerResult {
  const {
    state,
    lastEvent,
    cursorPos,
    isPinching,
  } = useGestureContext();

  const { settings, camera } = state;
  const isGestureActive = settings.enabled && camera.active;

  // Is this component's tab allowed to receive gestures?
  const isTabAllowed =
    !options.activeTab ||
    settings.activeTabs.includes(options.activeTab);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!lastEvent || !isGestureActive || !isTabAllowed) return;
    if (lastEvent.confidence < CONFIDENCE_THRESHOLD) return;

    const { gesture, cursor } = lastEvent;
    const cur = cursor ?? { x: 0.5, y: 0.5 };
    const ops = optionsRef.current;

    switch (gesture) {
      case 'SWIPE_LEFT':
        ops.onSwipeLeft?.();
        break;
      case 'SWIPE_RIGHT':
        ops.onSwipeRight?.();
        break;
      case 'SWIPE_UP':
        ops.onSwipeUp?.();
        break;
      case 'SWIPE_DOWN':
        ops.onSwipeDown?.();
        break;
      case 'PINCH':
        ops.onClick?.(cur);
        break;
      case 'PINCH_HOLD':
        ops.onPinchHold?.(cur);
        break;
      case 'TWO_FINGERS':
        ops.onTwoFingers?.();
        break;
      case 'THUMB_UP':
        ops.onThumbUp?.();
        break;
      case 'OPEN_HAND':
        ops.onOpenHand?.();
        break;
      case 'FIST':
        ops.onFist?.();
        break;
      case 'POINT':
        ops.onPoint?.(cur);
        break;
      default:
        break;
    }
  }, [lastEvent, isGestureActive, isTabAllowed]);

  return { cursorPos, isPinching, isGestureActive, lastEvent };
}
