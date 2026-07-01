/**
 * useScrollGesture.ts
 * ─────────────────────────────────────────────────────────────────────
 * Convenience hook that adds gesture-based scroll to any scrollable
 * element via a CSS class selector.
 *
 * Usage:
 *   useScrollGesture({ activeTab: 'My Achievements', scrollSelector: '.achievements-scroll' })
 */

import { useGestureController } from './useGestureController';

export interface ScrollGestureOptions {
  /** Tab name for filtering — only fires when this tab is active */
  activeTab: string;
  /**
   * CSS selector of the scrollable container.
   * Falls back to window scroll if not found.
   */
  scrollSelector?: string;
  /** Pixels to scroll per gesture event. Default 120. */
  scrollAmount?: number;
  /** Extra callbacks for gestures beyond scrolling */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onThumbUp?: () => void;
  onFist?: () => void;
  onClick?: () => void;
  onPinchHold?: () => void;
  onTwoFingers?: () => void;
  onOpenHand?: () => void;
}

export function useScrollGesture(options: ScrollGestureOptions) {
  const { activeTab, scrollSelector, scrollAmount = 120 } = options;

  const scroll = (dir: 'up' | 'down') => {
    const el = scrollSelector ? document.querySelector(scrollSelector) : null;
    const amount = dir === 'up' ? -scrollAmount : scrollAmount;
    if (el) {
      el.scrollBy({ top: amount, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  return useGestureController({
    activeTab,
    onSwipeUp:    () => scroll('up'),
    onSwipeDown:  () => scroll('down'),
    onSwipeLeft:  options.onSwipeLeft,
    onSwipeRight: options.onSwipeRight,
    onThumbUp:    options.onThumbUp,
    onFist:       options.onFist,
    onClick:      options.onClick,
    onPinchHold:  options.onPinchHold,
    onTwoFingers: options.onTwoFingers,
    onOpenHand:   options.onOpenHand,
  });
}
