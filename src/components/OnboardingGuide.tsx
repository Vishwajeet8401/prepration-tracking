import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target, Briefcase, Brain, Zap,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles,
  Code2, Server, BookOpen, Users, Trophy,
  Star, Rocket, GraduationCap, Building2, ChevronRight
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingAnswers {
  goal?: string;
  experienceLevel?: string;
  focusAreas?: string[];
}

interface OnboardingGuideProps {
  userName?: string;
  onComplete: (answers: OnboardingAnswers) => void;
  onSkip: () => void;
}

// ── Step Definitions ─────────────────────────────────────────────────────────

// Only 3 questions — keeps onboarding fast (< 30 seconds)
const STEPS = [
  {
    id: 'goal',
    icon: Target,
    emoji: '🎯',
    title: 'What is your primary goal?',
    subtitle: 'Help us personalize your learning journey',
    multiSelect: false,
    options: [
      { id: 'new-job', label: 'Get a new job', icon: Building2, color: 'from-violet-500 to-purple-600' },
      { id: 'product-interviews', label: 'Crack product interviews', icon: Trophy, color: 'from-amber-500 to-orange-600' },
      { id: 'upskill', label: 'Upskill for promotion', icon: Rocket, color: 'from-emerald-500 to-teal-600' },
      { id: 'exams', label: 'Clear competitive exams', icon: GraduationCap, color: 'from-blue-500 to-cyan-600' },
      { id: 'personal', label: 'Personal learning', icon: Star, color: 'from-rose-500 to-pink-600' },
    ],
  },
  {
    id: 'experienceLevel',
    icon: Briefcase,
    emoji: '💼',
    title: 'What is your experience level?',
    subtitle: "We'll tailor the difficulty and content for you",
    multiSelect: false,
    options: [
      { id: 'fresher', label: 'Student / Fresher', icon: GraduationCap, color: 'from-sky-500 to-blue-600' },
      { id: '0-2', label: '0–2 years', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
      { id: '2-5', label: '2–5 years', icon: Briefcase, color: 'from-amber-500 to-orange-600' },
      { id: '5+', label: '5+ years', icon: Trophy, color: 'from-emerald-500 to-teal-600' },
    ],
  },
  {
    id: 'focusAreas',
    icon: Brain,
    emoji: '🧠',
    title: 'Which areas to focus on?',
    subtitle: 'Select all that apply — you can change this later',
    multiSelect: true,
    options: [
      { id: 'dsa', label: 'Data Structures & Algorithms', icon: Code2, color: 'from-violet-500 to-purple-600' },
      { id: 'system-design', label: 'System Design', icon: Server, color: 'from-blue-500 to-cyan-600' },
      { id: 'cs-subjects', label: 'Core CS Subjects', icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
      { id: 'behavioral', label: 'Behavioral / HR', icon: Users, color: 'from-amber-500 to-orange-600' },
      { id: 'fullstack', label: 'Full Stack Development', icon: Zap, color: 'from-rose-500 to-pink-600' },
      { id: 'competitive', label: 'Competitive Programming', icon: Trophy, color: 'from-indigo-500 to-violet-600' },
    ],
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingGuide({ userName, onComplete, onSkip }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showCompletion, setShowCompletion] = useState(false);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;

  const getCurrentAnswer = (): string | string[] | undefined => {
    return (answers as any)[step.id];
  };

  const isOptionSelected = (optionId: string): boolean => {
    const current = getCurrentAnswer();
    if (step.multiSelect) {
      return Array.isArray(current) && current.includes(optionId);
    }
    return current === optionId;
  };

  const hasAnswer = (): boolean => {
    const current = getCurrentAnswer();
    if (step.multiSelect) return Array.isArray(current) && current.length > 0;
    return typeof current === 'string' && current.length > 0;
  };

  const selectOption = (optionId: string) => {
    if (step.multiSelect) {
      setAnswers(prev => {
        const current = ((prev as any)[step.id] as string[]) || [];
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [step.id]: updated };
      });
    } else {
      setAnswers(prev => ({ ...prev, [step.id]: optionId }));
    }
  };

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  // Skip current step without requiring an answer — always advances forward
  const skipStep = () => {
    goNext();
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    onComplete(answers);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.97,
    }),
  };

  // ── Completion Screen ──────────────────────────────────────────────────────

  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl px-4">
        <div className="mesh-gradient opacity-60 fixed inset-0 pointer-events-none" />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="relative z-10 max-w-md w-full text-center"
        >
          {/* Glow orbs */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-indigo-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 left-1/3 w-32 h-32 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          {/* Card */}
          <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-900/30">
            {/* Trophy animation */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
              className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <span className="text-3xl sm:text-4xl">🎉</span>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-2xl sm:text-3xl font-black text-white mb-2"
            >
              You're all set{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed"
            >
              Your personalized PrepFlow workspace is ready. We've customized your
              dashboard based on your goals. Time to crush those interviews! 🚀
            </motion.p>

            {/* Summary chips */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8"
            >
              {[
                answers.goal && STEPS[0].options.find(o => o.id === answers.goal)?.label,
                answers.experienceLevel && STEPS[1].options.find(o => o.id === answers.experienceLevel)?.label,
                answers.focusAreas && answers.focusAreas.length > 0 && `${answers.focusAreas.length} focus area${answers.focusAreas.length > 1 ? 's' : ''} selected`,
              ].filter(Boolean).map((label, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-900/50 text-indigo-300 border border-indigo-500/30"
                >
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleFinish}
              id="onboarding-finish-btn"
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Rocket className="w-5 h-5" />
              Launch My Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Wizard ────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xl overflow-y-auto">
      <div className="mesh-gradient opacity-50 fixed inset-0 pointer-events-none" />

      {/* Decorative glow orbs — hidden on small screens to save render budget */}
      <div className="hidden sm:block fixed top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="hidden sm:block fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

      {/* Scroll container — centres on desktop, top-aligns on mobile */}
      <div className="relative z-10 min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 px-4">
        <div className="w-full max-w-2xl">

          {/* Header — logo + skip */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-xs sm:text-sm leading-none">PrepFlow</p>
                <p className="text-indigo-400 text-[9px] sm:text-[10px] font-mono leading-none mt-0.5">Setup Wizard</p>
              </div>
            </div>

            <button
              onClick={onSkip}
              id="onboarding-skip-btn"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 sm:px-3 rounded-lg hover:bg-white/5 cursor-pointer font-mono whitespace-nowrap"
            >
              Skip →
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-5 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-indigo-400">
                {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete
              </span>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Step Dots */}
            <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === currentStep ? 20 : 6,
                    backgroundColor: i < currentStep
                      ? '#6366f1'
                      : i === currentStep
                      ? '#818cf8'
                      : '#334155'
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1.5 sm:h-2 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Step Card */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="glass-card rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Step Header */}
                <div className="px-4 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-6 border-b border-white/5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-inner">
                      {step.emoji}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-xl font-black text-white leading-snug mb-1">
                        {step.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {step.subtitle}
                        {step.multiSelect && (
                          <span className="ml-2 px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-[10px] font-mono rounded-full border border-indigo-500/20 inline-block mt-0.5 sm:mt-0">
                            multi-select
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options Grid */}
                <div className="px-4 sm:px-8 py-4 sm:py-6">
                  {/* Always single-column on mobile, 2-col on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {step.options.map((option, idx) => {
                      const Icon = option.icon;
                      const selected = isOptionSelected(option.id);
                      return (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.22 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => selectOption(option.id)}
                          id={`onboarding-option-${option.id}`}
                          className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 cursor-pointer group w-full ${
                            selected
                              ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md shadow-indigo-900/30'
                              : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/60 active:bg-slate-800/80'
                          }`}
                        >
                          {/* Option Icon */}
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 ${selected ? 'scale-110' : ''}`}>
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                          </div>

                          {/* Label */}
                          <span className={`text-xs sm:text-sm font-semibold leading-snug transition-colors duration-200 flex-1 ${
                            selected ? 'text-white' : 'text-slate-300'
                          }`}>
                            {option.label}
                          </span>

                          {/* Selection Indicator */}
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="shrink-0"
                              >
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Selected glow */}
                          {selected && (
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-indigo-500/5 pointer-events-none" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Multi-select hint */}
                  {step.multiSelect && (
                    <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
                      {Array.isArray(getCurrentAnswer()) && (getCurrentAnswer() as string[]).length > 0
                        ? `${(getCurrentAnswer() as string[]).length} selected`
                        : 'Tap to select one or more'}
                    </p>
                  )}
                </div>

                {/* Navigation — larger tap targets on mobile */}
                <div className="px-4 sm:px-8 pb-5 sm:pb-8 flex items-center justify-between gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={goBack}
                    disabled={currentStep === 0}
                    id="onboarding-back-btn"
                    className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-xl border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[72px] justify-center"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Back
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={hasAnswer() ? goNext : skipStep}
                    id="onboarding-next-btn"
                    className={`flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-md ${
                      hasAnswer()
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/25'
                        : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 border border-slate-600/40'
                    }`}
                  >
                    {hasAnswer()
                      ? currentStep === totalSteps - 1
                        ? <><span>Finish</span> <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>
                        : <><span>Next</span> <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>
                      : <><span>Skip this</span> <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom note */}
          <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4 font-mono px-2">
            You can always update your preferences in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
