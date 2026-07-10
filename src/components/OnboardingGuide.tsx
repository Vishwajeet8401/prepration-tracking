import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target, Briefcase, Brain, Clock, Zap,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles,
  Code2, Server, BookOpen, Users, Trophy,
  Star, Coffee, Rocket, GraduationCap, Building2, ChevronRight
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingAnswers {
  goal?: string;
  experienceLevel?: string;
  focusAreas?: string[];
  dailyTime?: string;
  interviewTimeline?: string;
}

interface OnboardingGuideProps {
  userName?: string;
  onComplete: (answers: OnboardingAnswers) => void;
  onSkip: () => void;
}

// ── Step Definitions ─────────────────────────────────────────────────────────

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
    title: 'What is your current experience level?',
    subtitle: 'We\'ll tailor the difficulty and content for you',
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
    title: 'Which areas do you want to focus on?',
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
  {
    id: 'dailyTime',
    icon: Clock,
    emoji: '⏰',
    title: 'How much time can you dedicate daily?',
    subtitle: 'We\'ll plan your schedule to match your availability',
    multiSelect: false,
    options: [
      { id: '<1h', label: 'Less than 1 hour', icon: Coffee, color: 'from-slate-500 to-gray-600' },
      { id: '1-2h', label: '1–2 hours', icon: Clock, color: 'from-blue-500 to-cyan-600' },
      { id: '2-4h', label: '2–4 hours', icon: Zap, color: 'from-amber-500 to-orange-600' },
      { id: '4h+', label: '4+ hours', icon: Rocket, color: 'from-emerald-500 to-teal-600' },
    ],
  },
  {
    id: 'interviewTimeline',
    icon: Zap,
    emoji: '🚀',
    title: 'Do you have any upcoming interviews?',
    subtitle: 'We\'ll help you prioritize what matters most right now',
    multiSelect: false,
    options: [
      { id: '1-week', label: 'Yes, within 1 week 🔥', icon: Zap, color: 'from-rose-500 to-red-600' },
      { id: '1-month', label: 'Yes, within a month', icon: Target, color: 'from-amber-500 to-orange-600' },
      { id: '2-3-months', label: 'In 2–3 months', icon: Clock, color: 'from-blue-500 to-cyan-600' },
      { id: 'not-scheduled', label: 'Not scheduled yet', icon: Star, color: 'from-emerald-500 to-teal-600' },
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
  const progress = ((currentStep) / totalSteps) * 100;

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
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
    }),
  };

  // ── Completion Screen ──────────────────────────────────────────────────────

  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl">
        <div className="mesh-gradient opacity-60 fixed inset-0 pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="relative z-10 max-w-lg w-full mx-4 text-center"
        >
          {/* Glow orbs */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-indigo-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

          {/* Card */}
          <div className="glass-card p-10 rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-900/30">
            {/* Trophy animation */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-3xl font-black text-white mb-2"
            >
              You're all set{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-slate-400 text-sm mb-8 leading-relaxed"
            >
              Your personalized PrepFlow workspace is ready. We've customized your
              dashboard based on your goals. Time to crush those interviews! 🚀
            </motion.p>

            {/* Summary chips */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap justify-center gap-2 mb-8"
            >
              {[
                answers.goal && STEPS[0].options.find(o => o.id === answers.goal)?.label,
                answers.experienceLevel && STEPS[1].options.find(o => o.id === answers.experienceLevel)?.label,
                answers.dailyTime && STEPS[3].options.find(o => o.id === answers.dailyTime)?.label,
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
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-base shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xl overflow-y-auto py-6">
      <div className="mesh-gradient opacity-50 fixed inset-0 pointer-events-none" />

      {/* Decorative glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-4">

        {/* Header — logo + skip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-none">PrepFlow</p>
              <p className="text-indigo-400 text-[10px] font-mono leading-none mt-0.5">Setup Wizard</p>
            </div>
          </div>

          <button
            onClick={onSkip}
            id="onboarding-skip-btn"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer font-mono"
          >
            Skip setup →
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-xs font-mono text-indigo-400">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              initial={{ width: `${progress}%` }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Step Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor: i < currentStep
                    ? '#6366f1'
                    : i === currentStep
                    ? '#818cf8'
                    : '#334155'
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
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
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Step Header */}
              <div className="px-8 pt-8 pb-6 border-b border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {step.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-snug mb-1">
                      {step.title}
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {step.subtitle}
                      {step.multiSelect && (
                        <span className="ml-2 px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-[10px] font-mono rounded-full border border-indigo-500/20">
                          multi-select
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options Grid */}
              <div className="px-8 py-6">
                <div className={`grid gap-3 ${step.options.length >= 5 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {step.options.map((option, idx) => {
                    const Icon = option.icon;
                    const selected = isOptionSelected(option.id);
                    return (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, duration: 0.25 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectOption(option.id)}
                        id={`onboarding-option-${option.id}`}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                          selected
                            ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md shadow-indigo-900/30'
                            : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Option Icon */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 ${selected ? 'scale-110' : 'group-hover:scale-105'}`}>
                          <Icon className="w-4.5 h-4.5 text-white" />
                        </div>

                        {/* Label */}
                        <span className={`text-sm font-semibold leading-snug transition-colors duration-200 ${
                          selected ? 'text-white' : 'text-slate-300 group-hover:text-white'
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
                              className="ml-auto shrink-0"
                            >
                              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Selected glow */}
                        {selected && (
                          <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 pointer-events-none" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Multi-select hint */}
                {step.multiSelect && (
                  <p className="text-center text-xs text-slate-500 mt-4">
                    {Array.isArray(getCurrentAnswer()) && (getCurrentAnswer() as string[]).length > 0
                      ? `${(getCurrentAnswer() as string[]).length} selected`
                      : 'Tap to select one or more'}
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="px-8 pb-8 flex items-center justify-between gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goBack}
                  disabled={currentStep === 0}
                  id="onboarding-back-btn"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>

                <motion.button
                  whileHover={{ scale: hasAnswer() ? 1.03 : 1, y: hasAnswer() ? -1 : 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={hasAnswer() ? goNext : onSkip}
                  id="onboarding-next-btn"
                  className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer shadow-md ${
                    hasAnswer()
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/25'
                      : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 border border-slate-600/40'
                  }`}
                >
                  {hasAnswer()
                    ? currentStep === totalSteps - 1
                      ? <>Finish <CheckCircle2 className="w-4 h-4" /></>
                      : <>Next <ArrowRight className="w-4 h-4" /></>
                    : <>Skip this <ChevronRight className="w-4 h-4" /></>
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom note */}
        <p className="text-center text-xs text-slate-500 mt-4 font-mono">
          You can always update your preferences in Settings
        </p>
      </div>
    </div>
  );
}
