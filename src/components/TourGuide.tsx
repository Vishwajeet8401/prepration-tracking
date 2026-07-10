import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourGuideProps {
  onComplete: (completed: boolean) => void;
  onNavigateToTab?: (tab: string) => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '',
    title: 'Welcome to PrepFlow! 🎉',
    content: "We've customized your learning environment based on your goals. Let's take a quick 1-minute tour to help you get hands-on and master the dashboard features.",
    placement: 'center'
  },
  {
    target: '#app-header-brand',
    title: 'PrepFlow Brand Header 🎯',
    content: 'This is your brand new learning command center. You can navigate, configure study configurations, and see notifications from here.',
    placement: 'bottom'
  },
  {
    target: '#dashboard-stats-overview',
    title: 'Your Performance Metrics 📊',
    content: 'Monitor your study streaks, overall readiness score, and quick metrics to track your retention curves and consistency over time.',
    placement: 'bottom'
  },
  {
    target: '#desktop-sidebar-nav, #mobile-nav-toggle',
    title: 'Feature Navigator 🧭',
    content: 'Switch between modules: Practice Simulator (AI mock interviews), Code Playground, Roadmap Builder, Flashcards, and more.',
    placement: 'right'
  },
  {
    target: '#dashboard-daily-goals',
    title: 'Daily Action Checklist 🎯',
    content: 'Track and complete your scheduled daily goals. Building consistency is key to mastering technical and behavioral interviews.',
    placement: 'top'
  },
  {
    target: '#quests-widget',
    title: 'Hands-on Onboarding Quests 🚀',
    content: 'Try compiling a block of code, generating a study roadmap, starting a mock interview, and creating a study topic. Check them off to master the app!',
    placement: 'bottom'
  }
];

export default function TourGuide({ onComplete, onNavigateToTab }: TourGuideProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIdx];

  // Adaptive popover width — narrower on small screens
  const getPopoverWidth = () => {
    const vw = window.innerWidth;
    if (vw < 400) return Math.min(vw - 24, 320);
    if (vw < 640) return Math.min(vw - 32, 360);
    return 380;
  };

  // Function to calculate target coordinates using fixed positioning
  const updateSpotlight = useCallback(() => {
    if (!step.target) {
      setCoords(null);
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `calc(100% - 32px)`,
        maxWidth: `${getPopoverWidth()}px`,
        zIndex: 99999,
      });
      return;
    }

    // Support comma-separated selectors — picks first visible element (desktop vs mobile)
    const selectors = step.target.split(',');
    let targetEl: HTMLElement | null = null;

    for (const selector of selectors) {
      const el = document.querySelector(selector.trim()) as HTMLElement;
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        targetEl = el;
        break;
      }
    }

    if (!targetEl) {
      // Fallback: bottom-centre floating card
      setCoords(null);
      setPopoverStyle({
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'calc(100% - 32px)',
        maxWidth: `${getPopoverWidth()}px`,
      });
      return;
    }

    // getBoundingClientRect already gives viewport-relative coords
    const rect = targetEl.getBoundingClientRect();
    const padding = 6;

    setCoords({
      x: rect.left - padding,
      y: rect.top - padding,
      w: rect.width + padding * 2,
      h: rect.height + padding * 2,
    });

    // Placement logic — all values are viewport-relative (fixed positioning)
    const popoverW = getPopoverWidth();
    const popoverH = 220; // estimated height for clamping
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = rect.bottom + padding + 10;
    let left = rect.left + rect.width / 2 - popoverW / 2;

    // Keep popover inside horizontal bounds
    if (left < 12) left = 12;
    if (left + popoverW > viewportW - 12) left = viewportW - popoverW - 12;

    if (step.placement === 'top') {
      top = rect.top - padding - popoverH - 10;
    } else if (step.placement === 'left') {
      top = rect.top + rect.height / 2 - popoverH / 2;
      left = rect.left - padding - popoverW - 10;
      // If doesn't fit left (mobile), fall back to bottom
      if (left < 12) {
        top = rect.bottom + padding + 10;
        left = Math.max(12, rect.left + rect.width / 2 - popoverW / 2);
      }
    } else if (step.placement === 'right') {
      top = rect.top + rect.height / 2 - popoverH / 2;
      left = rect.right + padding + 10;
      // If doesn't fit right (mobile), fall back to bottom
      if (left + popoverW > viewportW - 12) {
        top = rect.bottom + padding + 10;
        left = Math.max(12, rect.left + rect.width / 2 - popoverW / 2);
      }
    }

    // Clamp vertical — if goes off bottom, try above; if still bad, pin to safe area
    if (top + popoverH > viewportH - 16) top = rect.top - padding - popoverH - 10;
    if (top < 8) top = Math.min(rect.bottom + padding + 10, viewportH - popoverH - 16);
    if (top < 8) top = 8;

    // Ensure left is still valid after vertical recalculations
    if (left < 12) left = 12;
    if (left + popoverW > viewportW - 12) left = viewportW - popoverW - 12;

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: '100%',
      maxWidth: `${popoverW}px`,
      zIndex: 99999,
    });
  }, [currentStepIdx, step]);

  useEffect(() => {
    // Scroll target element into view immediately if off-screen
    if (step.target) {
      const selectors = step.target.split(',');
      let targetEl: HTMLElement | null = null;
      for (const selector of selectors) {
        const el = document.querySelector(selector.trim()) as HTMLElement;
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          targetEl = el;
          break;
        }
      }
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }

    // Initial calculation
    updateSpotlight();

    // Recalculate once smooth scrolling has settled
    const timer = setTimeout(updateSpotlight, 420);

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStepIdx, updateSpotlight]);

  const handleNext = () => {
    if (step.target.includes('quests-widget') && onNavigateToTab) {
      onNavigateToTab('Home Dashboard');
    }
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      onComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete(false);
  };

  // Fixed-positioned spotlight overlay — consistent across all steps
  const renderBlockers = () => {
    if (!coords) {
      // No target — full-screen dim (click-to-skip disabled intentionally so user reads card)
      return <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-[99998]" />;
    }

    const { x, y, w, h } = coords;
    const rx = Math.max(0, x);
    const ry = Math.max(0, y);

    return (
      <div className="fixed inset-0 pointer-events-none z-[99998] overflow-hidden">
        {/* Four mask panels that surround the spotlight cutout */}
        <div
          className="absolute bg-black/72 backdrop-blur-[2px] pointer-events-auto"
          style={{ top: 0, left: 0, right: 0, height: `${ry}px` }}
        />
        <div
          className="absolute bg-black/72 backdrop-blur-[2px] pointer-events-auto"
          style={{ top: `${ry + h}px`, left: 0, right: 0, bottom: 0 }}
        />
        <div
          className="absolute bg-black/72 backdrop-blur-[2px] pointer-events-auto"
          style={{ top: `${ry}px`, left: 0, width: `${rx}px`, height: `${h}px` }}
        />
        <div
          className="absolute bg-black/72 backdrop-blur-[2px] pointer-events-auto"
          style={{ top: `${ry}px`, left: `${rx + w}px`, right: 0, height: `${h}px` }}
        />

        {/* Animated glow ring around target */}
        <div
          className="absolute rounded-2xl border-2 border-indigo-400 shadow-[0_0_18px_rgba(99,102,241,0.55)] pointer-events-none animate-pulse"
          style={{ top: `${ry}px`, left: `${rx}px`, width: `${w}px`, height: `${h}px` }}
        />
      </div>
    );
  };

  return (
    <>
      {renderBlockers()}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIdx}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          ref={popoverRef}
          style={popoverStyle}
          className="glass-card rounded-xl sm:rounded-2xl border border-indigo-500/30 shadow-2xl z-[99999] overflow-hidden"
        >
          <div className="p-4 sm:p-6">
            {/* Progress dots + close */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex gap-1 items-center">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStepIdx ? 'w-4 sm:w-5 bg-indigo-500' : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
                <span className="ml-2 text-[9px] sm:text-[10px] font-mono text-slate-500">
                  {currentStepIdx + 1}/{TOUR_STEPS.length}
                </span>
              </div>

              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                title="Skip Tour"
                aria-label="Skip Tour"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Title */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-indigo-400 animate-pulse shrink-0" />
              <h4 className="text-xs sm:text-sm font-black text-white leading-tight uppercase tracking-wide">
                {step.title}
              </h4>
            </div>

            {/* Content */}
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-4 sm:mb-6">
              {step.content}
            </p>

            {/* Action Buttons — taller tap targets on mobile */}
            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-white/5 gap-2">
              {currentStepIdx > 0 ? (
                <button
                  onClick={handleBack}
                  className="px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-[10px] sm:text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="text-slate-500 hover:text-slate-400 text-[10px] sm:text-[11px] font-mono cursor-pointer py-2 px-1"
                >
                  Skip intro
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 sm:px-5 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-[10px] sm:text-[11px] shadow-lg transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                {currentStepIdx === TOUR_STEPS.length - 1 ? (
                  <>Finish Tour <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></>
                ) : (
                  <>Continue <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
