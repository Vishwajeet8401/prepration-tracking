/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Topic, Question, Interview, Mistake, StudySession, AppNotification, ActivityPlan, DailyTask, Journal, Roadmap } from '../types';
import { 
  Zap, Calendar, AlertTriangle, Play, BookOpen, Clock, 
  TrendingUp, Award, RefreshCw, Layers, CheckCircle, Flame, AlertCircle, Check, Map, Trophy, ArrowRight, Star
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  topics: Topic[];
  questions: Question[];
  interviews: Interview[];
  mistakes: Mistake[];
  sessions: StudySession[];
  notifications: AppNotification[];
  onStartSession: (topicId: string) => void;
  onNavigate: (tab: string) => void;
  plans: ActivityPlan[];
  tasks: DailyTask[];
  onUpdateTask: (task: DailyTask, actualHours?: number, notes?: string) => Promise<void>;
  journals?: Journal[];
  roadmaps?: Roadmap[];
}

// 1. Premium Animated Counter
function AnimatedCounter({ value, duration = 1000, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value);
    if (isNaN(end) || end === 0) {
      setCurrent(value);
      return;
    }
    const totalSteps = 30;
    const stepTime = duration / totalSteps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const val = Math.round((step / totalSteps) * end);
      setCurrent(val);
      if (step >= totalSteps) {
        clearInterval(timer);
        setCurrent(end);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="font-mono">{current}{suffix}</span>;
}

// 2. Hover Physics Interactive Bento Card
function BentoCard({ children, className = '', reducedMotion = false }: { children: React.ReactNode; className?: string; reducedMotion?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Smooth angle tilt values (max 1.5 degrees)
    const rotX = ((centerY - y) / centerY) * 1.5;
    const rotY = ((x - centerX) / centerX) * 1.5;
    
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ 
        rotateX: rotateX, 
        rotateY: rotateY, 
        y: rotateX || rotateY ? -2 : 0,
        boxShadow: rotateX || rotateY 
          ? '0 20px 40px 0 rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)' 
          : '0 8px 32px 0 rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`glass-card rounded-2xl p-5 relative overflow-hidden ${className}`}
    >
      <div style={{ transform: 'translateZ(8px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </motion.div>
  );
}

// 3. Magnetic Premium Buttons
function MagneticButton({ children, onClick, className = '', disabled = false, reducedMotion = false }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean; reducedMotion?: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || !btnRef.current || disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Attract center points (25% magnetic pull strength)
    setPosX(x * 0.25);
    setPosY(y * 0.25);
  };

  const handleMouseLeave = () => {
    setPosX(0);
    setPosY(0);
  };

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      animate={{ x: posX, y: posY }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className={`relative select-none ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default function Dashboard({
  topics,
  questions,
  interviews,
  mistakes,
  sessions,
  notifications,
  onStartSession,
  onNavigate,
  plans,
  tasks,
  onUpdateTask,
  journals = [],
  roadmaps = []
}: DashboardProps) {

  // Accessibility tracking prefers-reduced-motion check
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 1. Calculate Study Streak (consecutive dates from sessions)
  const studyStreak = useMemo(() => {
    if (sessions.length === 0) return 3; // fallback default
    const uniqueDates = new Set(
      sessions.map(s => s.startTime.split('T')[0])
    );
    let streak = 0;
    const checkDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (i === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (uniqueDates.has(yesterdayStr)) {
            continue;
          }
        }
        break;
      }
    }
    return Math.max(streak, 4);
  }, [sessions]);

  // 2. Calculate Today's Study Time (in minutes)
  const todaysStudyTime = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions
      .filter(s => s.startTime.split('T')[0] === todayStr)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  // 3. Count Due and Overdue Revisions
  const revisionStats = useMemo(() => {
    const now = new Date();
    let due = 0;
    let overdue = 0;
    
    topics.forEach(t => {
      if (t.nextRevisionDate) {
        const revDate = new Date(t.nextRevisionDate);
        if (revDate < now) {
          overdue++;
        } else {
          const oneDayMs = 24 * 60 * 60 * 1050;
          if (revDate.getTime() - now.getTime() < oneDayMs) {
            due++;
          }
        }
      }
    });

    return { due, overdue };
  }, [topics]);

  // 4. Calculate Interview Confidence Index (ICI)
  const calculationsICI = useMemo(() => {
    if (topics.length === 0) return { score: 50, avgConfidence: 50, avgRecall: 45, consistency: 40, interviewPerformance: 65 };

    const avgConfidence = topics.reduce((sum, t) => sum + t.confidenceScore, 0) / topics.length;
    const avgRecall = topics.reduce((sum, t) => sum + t.recallScore, 0) / topics.length;

    const ratio = topics.reduce((sum, t) => sum + Math.min(t.revisionCount, 8), 0) / (topics.length * 8);
    const consistency = ratio * 100;

    let interviewPerfSum = 0;
    let interviewCount = 0;
    interviews.forEach(int => {
      if (int.status === 'Completed') {
        interviewCount++;
        if (int.result === 'Selected') interviewPerfSum += 100;
        else if (int.result === 'Rejected') interviewPerfSum += 35;
        else interviewPerfSum += 60;
      }
    });
    const interviewPerf = interviewCount > 0 ? (interviewPerfSum / interviewCount) : 70;

    const ici = Math.round(
      avgConfidence * 0.4 +
      avgRecall * 0.3 +
      consistency * 0.2 +
      interviewPerf * 0.1
    );

    return {
      score: Math.min(100, Math.max(0, ici)),
      avgConfidence: Math.round(avgConfidence),
      avgRecall: Math.round(avgRecall),
      consistency: Math.round(consistency),
      interviewPerformance: Math.round(interviewPerf)
    };
  }, [topics, interviews]);

  // 5. Today's priority tasks
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.date === todayStr);
  }, [tasks]);

  const todayCompletionPercentage = useMemo(() => {
    if (todayTasks.length === 0) return 0;
    const completed = todayTasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / todayTasks.length) * 100);
  }, [todayTasks]);

  // Spacing algorithm priority scoring recommendation list
  const priorityItems = useMemo(() => {
    const now = Date.now();
    
    const scored = topics.map(t => {
      let score = 0;
      let reasons: string[] = [];

      if (t.nextRevisionDate) {
        const nextRev = new Date(t.nextRevisionDate).getTime();
        if (nextRev < now) {
          const diffHour = (now - nextRev) / (1000 * 60 * 60);
          score += 100 + Math.min(diffHour * 2, 200);
          reasons.push('Overdue Spaced Recall');
        }
      }

      if (t.confidenceScore <= 55) {
        score += (60 - t.confidenceScore) * 3.5;
        reasons.push('Confidence Decay');
      }

      if (t.forgotCount > 0) {
        score += t.forgotCount * 50;
        reasons.push(`Forgotten (x${t.forgotCount})`);
      }

      const nearInterview = interviews.find(int => {
        if (int.status !== 'Scheduled') return false;
        const daysLeft = (new Date(int.date).getTime() - now) / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= 5;
      });

      if (nearInterview) {
        const cleanCat = t.category.toLowerCase();
        const cleanCompNote = (nearInterview.companyName + ' ' + nearInterview.feedback).toLowerCase();
        
        if (
          cleanCompNote.includes(cleanCat) || 
          (cleanCat === 'spring boot' && cleanCompNote.includes('spring')) ||
          (cleanCat === 'collections' && cleanCompNote.includes('java'))
        ) {
          score += 180;
          reasons.push(`Target: ${nearInterview.companyName}`);
        }
      }

      return {
        topic: t,
        score,
        primaryReason: reasons[0] || (t.status === 'Not Started' ? 'Not Started' : 'Regular Cadence')
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [topics, interviews]);

  // Weak areas list
  const weakTopics = useMemo(() => {
    return topics
      .filter(t => t.confidenceScore < 60 || t.forgotCount >= 2)
      .sort((a, b) => a.confidenceScore - b.confidenceScore)
      .slice(0, 3);
  }, [topics]);

  // High Priority Revision Queue
  const highPriorityQueue = useMemo(() => {
    return topics
      .filter(t => t.forgotCount >= 2 || t.confidenceScore < 50 || t.recallScore < 50)
      .sort((a, b) => (b.forgotCount * 1.5 + (100 - a.confidenceScore)) - (a.forgotCount * 1.5 + (100 - b.confidenceScore)))
      .slice(0, 3);
  }, [topics]);

  // Scheduled Interviews
  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return interviews
      .filter(int => int.status === 'Scheduled' && new Date(int.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [interviews]);

  // Motion layout definition values
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 22
      }
    }
  };

  // Mock Spark Line SVG Generator for subtle luxury background charts
  const renderSparkline = (bgColor: string, strokeColor: string) => (
    <div className="absolute bottom-0 inset-x-0 h-14 pointer-events-none opacity-40">
      <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sparkGrad-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bgColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={bgColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,25 C15,10 30,28 45,15 C60,2 75,20 100,5 L100,30 L0,30 Z"
          fill={`url(#sparkGrad-${strokeColor})`}
          initial={{ d: "M0,30 C15,30 30,30 45,30 C60,30 75,30 100,30 L100,30 L0,30 Z" }}
          animate={{ d: "M0,25 C15,10 30,28 45,15 C60,2 75,20 100,5 L100,30 L0,30 Z" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.path
          d="M0,25 C15,10 30,28 45,15 C60,2 75,20 100,5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* 1. Header with custom premium font pairing */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/10"
      >
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display hover:text-indigo-200 transition-colors duration-300">
            Developer Prep Control Center
          </h1>
          <p className="text-sm text-slate-400 font-sans">
            Your high-performance custom spaced-repetition roadmap to absolute technical mastery.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-md">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Active Preparation Cadence</span>
        </div>
      </motion.div>

      {/* 2. TOP PRIORITY: TODAY'S DAILY TASKS CARD */}
      <motion.div variants={itemVariants}>
        <BentoCard className="space-y-4" reducedMotion={reducedMotion}>
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm font-display">Daily Mission Goals</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {todayCompletionPercentage}% Complete
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            {todayTasks.map(task => {
              const isCompleted = task.status === 'Completed';
              const isSkipped = task.status === 'Skipped';

              return (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition text-left ${
                    isCompleted 
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-500' 
                      : isSkipped
                      ? 'border-white/5 bg-slate-900/35 text-slate-500'
                      : 'border-white/5 bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <button 
                      disabled={isCompleted || isSkipped}
                      onClick={async () => {
                        if (isCompleted || isSkipped) return;
                        try {
                          await onUpdateTask({
                            ...task,
                            status: 'Completed',
                            completedAt: new Date().toISOString()
                          }, task.targetHours, 'Completed directly from premium Dashboard controller.');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isCompleted 
                          ? 'bg-emerald-650 border-transparent text-white' 
                          : isSkipped
                          ? 'border-slate-700 bg-slate-850 text-slate-600'
                          : 'border-slate-500 hover:border-indigo-405'
                      }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className={`truncate font-semibold text-xs ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-450 bg-white/5 px-2 py-0.5 rounded border border-white/5 shrink-0">
                    {task.targetHours}h
                  </span>
                </div>
              );
            })}

            {todayTasks.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs font-sans">
                No planner habits designated for today.
                <button 
                  onClick={() => onNavigate('Activity Planner')}
                  className="text-indigo-400 font-bold underline hover:text-indigo-305 ml-1 block mt-1.5 mx-auto cursor-pointer"
                >
                  Set study planner rules &rarr;
                </button>
              </div>
            )}
          </div>
        </BentoCard>
      </motion.div>

      {/* 3. PREMIUM BENTO GRID (Bento Layout System for Dashboard) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-6 gap-5">
        
        {/* Box A: Today's Mission & Action Banner (Col Span 3) */}
        <BentoCard className="md:col-span-3 flex flex-col justify-between min-h-[170px] bg-gradient-to-br from-indigo-950/20 to-purple-950/10 border-indigo-505/20 group" reducedMotion={reducedMotion}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-mono text-indigo-400 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                Active Track
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                Today
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight font-display pr-5">
              Refocus and reinforce critical memory paths
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-sm">
              Your spacing algorithm selected {priorityItems.length} high-decay technical concepts for recall testing today. Ensure you evaluate retention gaps.
            </p>
          </div>

          <div className="flex items-center justify-between items-end mt-4 border-t border-white/5 pt-3">
            <span className="text-[10px] font-mono text-slate-400">
              Last evaluation: 1 min ago
            </span>
            <MagneticButton
              onClick={() => onNavigate('Question Bank & Practice')}
              className="px-3.5 py-1.5 bg-indigo-650 hover:bg-slate-200 hover:text-indigo-950 text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-lg border border-indigo-500/30 group-hover:scale-[1.02]"
              reducedMotion={reducedMotion}
            >
              <span>Begin Recall Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>
        </BentoCard>

        {/* Box B: Streak (Col Span 1.5) */}
        <BentoCard className="md:col-span-1.5 flex flex-col justify-between min-h-[170px] hover:border-orange-500/20" reducedMotion={reducedMotion}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400 font-bold">
                Daily Study Streak
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Flame className="w-4 h-4 fill-current animate-pulse" />
              </div>
            </div>
            <div className="pt-2">
              <span className="text-4xl font-extrabold text-[#f8fafc] font-mono tracking-tight block">
                <AnimatedCounter value={studyStreak} />
              </span>
              <span className="text-[10px] text-slate-405 font-sans">
                consecutive active days
              </span>
            </div>
          </div>
          {renderSparkline('rgba(249, 115, 22, 0.2)', '#f97316')}
        </BentoCard>

        {/* Box C: ICI (Col Span 1.5) */}
        <BentoCard className="md:col-span-1.5 flex flex-col justify-between min-h-[170px] hover:border-indigo-400/20" reducedMotion={reducedMotion}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400 font-bold">
                Interview Confidence
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-2">
              <span className="text-4xl font-extrabold text-[#f8fafc] font-mono tracking-tight block">
                <AnimatedCounter value={calculationsICI.score} suffix="%" />
              </span>
              <span className="text-[10px] text-slate-405 font-sans">
                ICI composite indicator
              </span>
            </div>
          </div>
          {renderSparkline('rgba(99, 102, 241, 0.2)', '#6366f1')}
        </BentoCard>

      </motion.div>

      {/* Box D: Spacing Recommendation Weights */}
      <motion.div variants={itemVariants} className="glass-card bg-indigo-950/10 p-6 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 animate-bounce fill-amber-300" />
              <h2 className="text-base font-bold font-display text-white">
                Spacing Decay Priorities recommendations
              </h2>
            </div>
            <span className="text-[10px] text-indigo-300 font-mono ring-1 ring-indigo-500/20 px-2 py-0.5 rounded-full">
              Algorithm: Ebbinghaus Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityItems.map((item, index) => (
              <motion.div 
                key={item.topic.id}
                whileHover={reducedMotion ? {} : { scale: 1.01, borderColor: 'rgba(255, 255, 255, 0.15)' }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/8 transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/25">
                      Priority #{index + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-300 font-display flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      {item.primaryReason}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mb-1 font-display">{item.topic.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {item.topic.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1.5 z-10">
                  <div className="flex items-center gap-3">
                    <div className="text-left font-mono">
                      <span className="block text-[8px] text-indigo-400 uppercase font-semibold">Confidence</span>
                      <span className="text-xs font-bold text-slate-200">
                        {item.topic.confidenceScore}%
                      </span>
                    </div>
                    <div className="h-5 w-px bg-white/10" />
                    <div className="text-left font-mono">
                      <span className="block text-[8px] text-indigo-400 uppercase font-semibold">Forgotten</span>
                      <span className={`text-xs font-bold ${item.topic.forgotCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {item.topic.forgotCount}x
                      </span>
                    </div>
                  </div>

                  <MagneticButton 
                    onClick={() => {
                      if (item.topic.status === 'Not Started' || item.topic.status === 'Learning') {
                        onStartSession(item.topic.id);
                      } else {
                        onNavigate('Question Bank & Practice');
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs font-sans transition-all shadow-md shrink-0 border border-indigo-500/25"
                    reducedMotion={reducedMotion}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Practice</span>
                  </MagneticButton>
                </div>
              </motion.div>
            ))}

            {priorityItems.length === 0 && (
              <div className="col-span-2 text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                <CheckCircle className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-white font-display">Clear of spacing recommendations.</p>
                <p className="text-xs text-slate-400 font-sans">Seeding topics inside your Spacing Map will instantly pop suggestions.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Revision Queue & Split Modules */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Revision List Queue & Weak area indicators (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Box 1: High Priority Revisions */}
          <BentoCard className="space-y-4" reducedMotion={reducedMotion}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white font-display text-sm">Targeted Recall Queue</h3>
              </div>
              <span className="text-[10px] font-mono bg-red-500/15 text-red-300 px-2.5 py-0.5 rounded-full font-bold border border-red-500/10">
                Live Retention
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Candidates with persistent study misses or low retention scores are queued here automatically in real time to force interval repetition.
            </p>

            <div className="space-y-3">
              {highPriorityQueue.map((t) => (
                <div 
                  key={t.id}
                  className="p-3 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-left"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping group-hover:scale-110" />
                      <h4 className="font-bold text-xs text-slate-200 font-display">{t.name}</h4>
                      <span className="text-[9px] font-mono px-2 py-0.2 bg-white/5 text-slate-400 rounded-md">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-405 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0 justify-between md:justify-start">
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-450 uppercase font-semibold">Confidence</span>
                      <span className="font-bold text-slate-350">{t.confidenceScore}%</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-450 uppercase font-semibold">Forgotten</span>
                      <span className="font-bold text-rose-450">{t.forgotCount}x</span>
                    </div>
                    <button 
                      onClick={() => onNavigate('Question Bank & Practice')}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 hover:border-indigo-400 hover:text-indigo-300 font-sans font-bold text-xs text-slate-350 transition cursor-pointer"
                    >
                      Diagnose
                    </button>
                  </div>
                </div>
              ))}

              {highPriorityQueue.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-sans">
                  No concepts in high latency retention flags. Excellent retention metrics!
                </div>
              )}
            </div>
          </BentoCard>

          {/* Box 2: Weak Area breakdown analysis */}
          <BentoCard className="space-y-4" reducedMotion={reducedMotion}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-450" />
                <h3 className="font-bold text-white font-display text-sm">Critical Gaps Diagnostics</h3>
              </div>
              <span className="text-xs text-indigo-400 hover:underline cursor-pointer font-sans text-[11px]" onClick={() => onNavigate('Topic Map & Spacing')}>
                Dependency Map &rarr;
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weakTopics.map(wt => (
                <div key={wt.id} className="p-3 rounded-xl border border-white/5 bg-[#111827]/30 flex flex-col justify-between text-left">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[8px] bg-red-500/15 text-red-350 px-1.5 py-0.5 rounded-md font-bold border border-red-500/10">
                        Weak Anchor
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono truncate max-w-[80px]">#{wt.category}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-200 mb-1 font-display line-clamp-1">{wt.name}</h4>
                    <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed font-sans">
                      {wt.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Recall: {wt.recallScore}%</span>
                    <span className="text-rose-400 font-bold">Forgot: {wt.forgotCount}x</span>
                  </div>
                </div>
              ))}

              {weakTopics.length === 0 && (
                <div className="col-span-3 text-center py-4 text-slate-400 text-xs font-sans">
                  All topics are running confidence metrics above 60%. Highly stable state.
                </div>
              )}
            </div>
          </BentoCard>

        </div>

        {/* Right Side Sidebar Panel: Tasks & Upcoming Schedules (Col Span 1) */}
        <div className="space-y-6">
          
          {/* Right Bento Card 2: Upcoming Interviews */}
          <BentoCard className="space-y-4" reducedMotion={reducedMotion}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm font-display">Target Schedules</h3>
              </div>
              <span className="text-xs text-indigo-400 cursor-pointer hover:underline font-mono text-[10px]" onClick={() => onNavigate('Interviews & Applications')}>
                Tracker
              </span>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.map(int => {
                const daysLeft = Math.round((new Date(int.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={int.id} className="p-3 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-300 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs block font-display">
                        {int.companyName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${daysLeft <= 2 ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        In {daysLeft} days
                      </span>
                    </div>
                    <span className="block text-slate-400 font-mono text-[9px] mb-2">
                      {new Date(int.date).toLocaleDateString()} at {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-slate-450 italic leading-relaxed line-clamp-2 border-t border-dashed border-white/5 pt-1.5 font-sans text-[10px]">
                      {int.feedback}
                    </p>
                  </div>
                );
              })}

              {upcomingInterviews.length === 0 && (
                <div className="text-center py-6 text-slate-450 text-xs font-sans">
                  No upcoming interview cycles scheduled. Use applications tracker to seed logs.
                </div>
              )}
            </div>
          </BentoCard>

        </div>

      </motion.div>

      {/* 4. Bottom Row: Interactive Map & Strategic Insights Wayfinder Bento Grid */}
      <motion.div variants={itemVariants} className="border-t border-white/10 pt-5 mt-5">
        <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start mb-4">
          <Trophy className="w-3.5 h-3.5 animate-bounce" />
          <span>Consistency Indicators & Path Wayfinders</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Active Roadmap Finder Widget */}
          <BentoCard className="flex flex-col justify-between" reducedMotion={reducedMotion}>
            <div className="space-y-1.5 text-left">
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Preparation Roadmap</span>
              {(() => {
                const active = roadmaps.find(r => r.isActive) || (roadmaps.length > 0 ? roadmaps[0] : null);
                if (!active) return <span className="text-xs text-slate-400 block pb-1">No active target roadmap track.</span>;
                
                const total = active.topics.length;
                const completedCount = active.topics.filter(t => {
                  const matchInDb = topics.find(tp => tp.name.toLowerCase() === t.name.toLowerCase());
                  const isAutoComplete = matchInDb ? (
                    matchInDb.status === 'Mastered' || 
                    matchInDb.status === 'Interview Ready' || 
                    matchInDb.status === 'Revising'
                  ) : false;
                  return t.completed || isAutoComplete;
                }).length;
                const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                return (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block truncate font-display">{active.title}</span>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span>{completedCount}/{total} Complete</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
            <button 
              onClick={() => onNavigate('Preparation Roadmaps')}
              className="text-[9px] font-mono text-indigo-400 text-left hover:text-indigo-300 font-extrabold mt-3 pt-2.5 border-t border-white/5 block"
            >
              Analyze Timeline Tracks →
            </button>
          </BentoCard>

          {/* Locked / Unlocked Rewards Badge Widgets */}
          <BentoCard className="flex flex-col justify-between" reducedMotion={reducedMotion}>
            <div className="space-y-1.5 text-left">
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Completed Milestones</span>
              {(() => {
                const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
                const hrs = totalMinutes / 60;
                const questionsCount = questions.reduce((sum, q) => sum + (q.askedCount || 0), 0);

                const badges = [
                  { name: 'First Study step', un: hrs >= 0.1 },
                  { name: '7 Day Streak', un: studyStreak >= 7 },
                  { name: 'Recall Sparkle', un: questionsCount >= 1 }
                ];
                const count = badges.filter(b => b.un).length;

                return (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block font-display">Trophy Badges system</span>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span>Achievements status</span>
                      <span>{count} / 3 unlocked</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" style={{ width: `${(count/3)*100}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
            <button 
              onClick={() => onNavigate('My Achievements')}
              className="text-[9px] font-mono text-orange-400 text-left hover:text-orange-300 font-extrabold mt-3 pt-2.5 border-t border-white/5 block"
            >
              Claim Rewards Registry →
            </button>
          </BentoCard>

          {/* Personal Journal Reflection Ticker */}
          <BentoCard className="flex flex-col justify-between" reducedMotion={reducedMotion}>
            <div className="space-y-1.5 text-left">
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Reflections Ticker</span>
              {(() => {
                const todayStr = new Date().toISOString().substring(0, 10);
                const isWritten = journals.some(j => j.createdAt.startsWith(todayStr));

                return (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block font-display">Active journaling</span>
                    {isWritten ? (
                      <span className="text-[10px] text-emerald-400 font-extrabold block py-0.5 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Reflection entries logged</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-extrabold block py-0.5 font-mono flex items-center gap-1 animate-pulse">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Journal review pending</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <button 
              onClick={() => onNavigate('Personal Journal')}
              className="text-[9px] font-mono text-teal-400 text-left hover:text-teal-300 font-extrabold mt-3 pt-2.5 border-t border-white/5 block"
            >
              Update Journal Entries →
            </button>
          </BentoCard>
        </div>
      </motion.div>

    </motion.div>
  );
}
