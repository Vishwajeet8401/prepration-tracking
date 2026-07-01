/**
 * GestureInstructionBar.tsx
 * ─────────────────────────────────────────────────────────────────────
 * A fixed bottom bar that shows contextual gesture shortcuts for the
 * currently active tab. Only visible when gesture mode is on.
 * Dismissable per-session.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hand, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGestureContext } from '../context/GestureContext';

// ─── Per-tab instruction definitions ─────────────────────────────────────────

interface GestureInstruction {
  gesture: string;
  emoji: string;
  label: string;
}

const TAB_INSTRUCTIONS: Record<string, GestureInstruction[]> = {
  'Home Dashboard': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Tab' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Tab' },
    { gesture: 'point',       emoji: '👆', label: 'Air Cursor' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Click' },
  ],
  'AI Learning Assistant': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'thumb-up',   emoji: '👍', label: 'Good Answer' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Select' },
    { gesture: 'fist',       emoji: '✊', label: 'Stop / Clear' },
  ],
  'Study Topics & Revisions': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Tab' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Tab' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Expand Topic' },
    { gesture: 'thumb-up',    emoji: '👍', label: 'Mark Ready' },
  ],
  'Flashcards & Practice': [
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Card' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Card' },
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'thumb-up',    emoji: '👍', label: 'Easy' },
    { gesture: 'fist',        emoji: '✊', label: 'Hard' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Flip Card' },
  ],
  'Goals & Applications': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Open Item' },
    { gesture: 'thumb-up',   emoji: '👍', label: 'Mark Applied' },
  ],
  'Reminders & Habits': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'thumb-up',   emoji: '👍', label: 'Complete' },
    { gesture: 'fist',       emoji: '✊', label: 'Skip' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Select' },
  ],
  'Task & Study Planner': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'thumb-up',   emoji: '👍', label: 'Complete Task' },
    { gesture: 'fist',       emoji: '✊', label: 'Skip Task' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Open Task' },
  ],
  'Experience & Story Builder': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Story' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Story' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Open Story' },
  ],
  'Vocabulary Builder': [
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Word' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Word' },
    { gesture: 'thumb-up',    emoji: '👍', label: 'Mastered' },
    { gesture: 'fist',        emoji: '✊', label: 'Learning' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Mark Reviewed' },
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
  ],
  'Progress & Analytics': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Chart' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Chart' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Zoom In' },
  ],
  'Learning Roadmaps': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Roadmap' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Roadmap' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Expand Node' },
    { gesture: 'thumb-up',    emoji: '👍', label: 'Mark Done' },
  ],
  'My Achievements': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'pinch',      emoji: '🤏', label: 'View Badge' },
    { gesture: 'open-hand',  emoji: '🖐️', label: 'Show All' },
  ],
  'Daily Journal & Notes': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Entry' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Entry' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Open Entry' },
  ],
  'Practice Simulator': [
    { gesture: 'swipe-up',    emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down',  emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'swipe-right', emoji: '➡️', label: 'Next Question' },
    { gesture: 'thumb-up',    emoji: '👍', label: 'Good Answer' },
    { gesture: 'fist',        emoji: '✊', label: 'Skip Question' },
    { gesture: 'pinch',       emoji: '🤏', label: 'Submit / Select' },
  ],
  'Mobile Sync Hub': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Select' },
  ],
  'Backup & Data Settings': [
    { gesture: 'swipe-up',   emoji: '⬆️', label: 'Scroll Up' },
    { gesture: 'swipe-down', emoji: '⬇️', label: 'Scroll Down' },
    { gesture: 'pinch',      emoji: '🤏', label: 'Select' },
    { gesture: 'open-hand',  emoji: '🖐️', label: 'Cancel' },
  ],
};

// Universal fallback instructions shown for all tabs
const UNIVERSAL_INSTRUCTIONS: GestureInstruction[] = [
  { gesture: 'swipe-left',  emoji: '⬅️', label: 'Prev Tab' },
  { gesture: 'swipe-right', emoji: '➡️', label: 'Next Tab' },
  { gesture: 'point',       emoji: '👆', label: 'Air Cursor' },
  { gesture: 'pinch',       emoji: '🤏', label: 'Click' },
  { gesture: 'hold',        emoji: '🤌', label: 'Drag' },
];

// ─── Gesture Chip ─────────────────────────────────────────────────────────────

function GestureChip({ emoji, label }: { emoji: string; label: string; key?: string }) {
  return (
    <div className="gesture-chip">
      <span className="gesture-chip__emoji">{emoji}</span>
      <span className="gesture-chip__label">{label}</span>
    </div>
  );
}

// ─── Live Gesture Flash ───────────────────────────────────────────────────────

function LiveGestureFlash() {
  const { lastEvent, state } = useGestureContext();
  const [flash, setFlash] = useState<string | null>(null);

  const LABELS: Record<string, string> = {
    SWIPE_LEFT:  '⬅️ Swipe Left',
    SWIPE_RIGHT: '➡️ Swipe Right',
    SWIPE_UP:    '⬆️ Swipe Up',
    SWIPE_DOWN:  '⬇️ Swipe Down',
    PINCH:       '🤏 Click',
    PINCH_HOLD:  '🤌 Drag',
    THUMB_UP:    '👍 Thumb Up',
    OPEN_HAND:   '🖐️ Open Hand',
    FIST:        '✊ Fist',
    POINT:       '👆 Pointing',
    TWO_FINGERS: '✌️ Two Fingers',
  };

  useEffect(() => {
    if (!lastEvent || lastEvent.gesture === 'NONE') return;
    const label = LABELS[lastEvent.gesture];
    if (label) {
      setFlash(label);
      const t = setTimeout(() => setFlash(null), 1200);
      return () => clearTimeout(t);
    }
  }, [lastEvent]);

  if (!flash) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={flash}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="gesture-live-flash"
      >
        {flash}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GestureInstructionBarProps {
  activeTab: string;
}

export default function GestureInstructionBar({ activeTab }: GestureInstructionBarProps) {
  const { state } = useGestureContext();
  const [dismissed, setDismissed] = useState(false);

  const isActive = state.camera.active && state.settings.enabled;

  // Re-show bar when switching tabs
  useEffect(() => {
    setDismissed(false);
  }, [activeTab]);

  if (!isActive || dismissed) return <LiveGestureFlash />;

  const tabInstructions = TAB_INSTRUCTIONS[activeTab] ?? UNIVERSAL_INSTRUCTIONS;

  return (
    <>
      {/* Live gesture flash — always shows even when bar is dismissed */}
      <LiveGestureFlash />

      <motion.div
        className="gesture-instruction-bar"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      >
        {/* Left: icon + label */}
        <div className="gesture-bar__left">
          <Hand size={13} className="text-violet-400" />
          <span className="gesture-bar__tab-label">{activeTab}</span>
          <span className="gesture-bar__sep">·</span>
          <span className="gesture-bar__hint">Gesture shortcuts</span>
        </div>

        {/* Centre: chips */}
        <div className="gesture-bar__chips">
          {tabInstructions.map((inst) => (
            <GestureChip key={inst.gesture} emoji={inst.emoji} label={inst.label} />
          ))}
        </div>

        {/* Right: dismiss */}
        <button
          className="gesture-bar__dismiss"
          onClick={() => setDismissed(true)}
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </motion.div>
    </>
  );
}
