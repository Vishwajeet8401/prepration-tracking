import React, { useState, useEffect, useRef } from 'react';
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
    content: 'We\'ve customized your learning environment based on your goals. Let\'s take a quick 1-minute tour to help you get hands-on and master the dashboard features.',
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
  
  const step = TOUR_STEPS[currentStepIdx];
  const popoverRef = useRef<HTMLDivElement>(null);

  // Function to calculate target coordinates
  const updateSpotlight = () => {
    if (!step.target) {
      setCoords(null);
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
      });
      return;
    }

    // Support multiple query selectors (e.g. falls back to mobile element if desktop is hidden)
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
      setCoords(null);
      // Fallback: bottom center
      setPopoverStyle({
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'calc(100% - 32px)',
        maxWidth: '450px'
      });
      return;
    }

    // Scroll target element into view if it's off-screen
    const rect = targetEl.getBoundingClientRect();
    const padding = 8;
    
    setCoords({
      x: rect.left - padding + window.scrollX,
      y: rect.top - padding + window.scrollY,
      w: rect.width + padding * 2,
      h: rect.height + padding * 2
    });

    // Dynamic placement calculations
    const popoverW = 380;
    const popoverH = 200;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = rect.bottom + padding + 12 + window.scrollY;
    let left = rect.left + rect.width / 2 - popoverW / 2 + window.scrollX;

    // Adjust left alignment if it exceeds viewport boundaries
    if (left < 16) left = 16;
    if (left + popoverW > viewportW - 16) left = viewportW - popoverW - 16;

    if (step.placement === 'top') {
      top = rect.top - padding - popoverH - 12 + window.scrollY;
    } else if (step.placement === 'left') {
      top = rect.top + rect.height / 2 - popoverH / 2 + window.scrollY;
      left = rect.left - padding - popoverW - 12 + window.scrollX;
    } else if (step.placement === 'right') {
      top = rect.top + rect.height / 2 - popoverH / 2 + window.scrollY;
      left = rect.right + padding + 12 + window.scrollX;
    }

    // Clamp vertical positions within viewport safety zones
    if (top < 16) top = rect.bottom + padding + 12 + window.scrollY;
    
    setPopoverStyle({
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: '100%',
      maxWidth: `${popoverW}px`,
      zIndex: 99999,
    });
  };

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
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }

    // Calculate spotlight layout coordinates
    updateSpotlight();

    // Recalculate once smooth scrolling settles
    const timer = setTimeout(() => {
      updateSpotlight();
    }, 400);

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStepIdx]);

  const handleNext = () => {
    // If the step points to a specific tab, we can navigate there
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

  // Blocker Overlay elements around target coordinate
  const renderBlockers = () => {
    if (!coords) {
      return <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[99998]" onClick={handleSkip} />;
    }

    const { x, y, w, h } = coords;
    return (
      <div className="absolute inset-0 pointer-events-none z-[99998] overflow-hidden" style={{ height: `${document.documentElement.scrollHeight}px` }}>
        {/* Semi-transparent background mask blockers */}
        <div className="absolute bg-black/75 backdrop-blur-[2.5px] pointer-events-auto" style={{ top: 0, left: 0, right: 0, height: `${y}px` }} />
        <div className="absolute bg-black/75 backdrop-blur-[2.5px] pointer-events-auto" style={{ top: `${y + h}px`, left: 0, right: 0, bottom: 0 }} />
        <div className="absolute bg-black/75 backdrop-blur-[2.5px] pointer-events-auto" style={{ top: `${y}px`, left: 0, width: `${x}px`, height: `${h}px` }} />
        <div className="absolute bg-black/75 backdrop-blur-[2.5px] pointer-events-auto" style={{ top: `${y}px`, left: `${x + w}px`, right: 0, height: `${h}px` }} />
        
        {/* Pulse glow highlight container over target element */}
        <div 
          className="absolute border-2 border-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] pointer-events-none animate-pulse transition-all duration-300"
          style={{ top: `${y}px`, left: `${x}px`, width: `${w}px`, height: `${h}px` }}
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
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          ref={popoverRef}
          style={popoverStyle}
          className="glass-card p-6 rounded-2xl border border-indigo-500/30 shadow-2xl z-[99999]"
        >
          {/* Progress dots */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentStepIdx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
            <h4 className="text-sm font-black text-white leading-tight font-display uppercase tracking-wide">
              {step.title}
            </h4>
          </div>

          {/* Content */}
          <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
            {step.content}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            {currentStepIdx > 0 ? (
              <button
                onClick={handleBack}
                className="px-4 py-1.5 rounded-lg border border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-400 text-[11px] font-mono cursor-pointer"
              >
                Skip intro
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-[11px] shadow-lg shadow-indigo-650/20 hover:scale-102 transition flex items-center gap-1 cursor-pointer"
            >
              {currentStepIdx === TOUR_STEPS.length - 1 ? (
                <>Finish Tour <CheckCircle2 className="w-3.5 h-3.5" /></>
              ) : (
                <>Continue <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
