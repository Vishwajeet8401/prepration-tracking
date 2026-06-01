/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Topic, Question, Interview, Mistake, StudySession, AppNotification, ActivityPlan, DailyTask, Journal, Roadmap, PersonalReminder, ReminderLog, ReminderStatus } from '../types';
import {
  Zap, Calendar, AlertTriangle, Play, BookOpen, Clock,
  TrendingUp, Award, RefreshCw, Layers, CheckCircle, Flame, AlertCircle, Check, Map, Trophy, ArrowRight, Star, Bell, Pill, Droplet, Pause, Square, ListTodo
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
  personalReminders?: PersonalReminder[];
  reminderLogs?: ReminderLog[];
  onActionReminder?: (reminderId: string, status: ReminderStatus, snoozeMinutes?: number) => Promise<void>;
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
      style={{ WebkitFontSmoothing: 'antialiased', transformStyle: 'flat', perspective: 1000 }}
      className={`glass-card rounded-2xl p-5 relative overflow-hidden ${className}`}
    >
      <div className="relative z-10">
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
  roadmaps = [],
  personalReminders = [],
  reminderLogs = [],
  onActionReminder
}: DashboardProps) {

  // Accessibility tracking prefers-reduced-motion check
  const [reducedMotion, setReducedMotion] = useState(false);

  // Active Task Timer State
  const [activeTaskTimer, setActiveTaskTimer] = useState<{
    taskId: string;
    taskTitle: string;
    task: DailyTask;
    startTime: number;
    elapsed: number;
    isPaused: boolean;
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTaskTimer && !activeTaskTimer.isPaused) {
      interval = setInterval(() => {
        setActiveTaskTimer(prev => prev ? { ...prev, elapsed: prev.elapsed + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Habit Matrix State
  const [matrixCategory, setMatrixCategory] = useState<string>('All');
  const [matrixView, setMatrixView] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  };

  const isReminderScheduledForDate = (rem: PersonalReminder, dateStr: string) => {
    if (!rem.active) return false;
    if (dateStr < rem.startDate || dateStr > rem.endDate) return false;

    const dateObj = parseLocalDate(dateStr);

    if (rem.repeatType === 'Weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[dateObj.getDay()];
      return rem.weeklyDays?.includes(dayName) || false;
    }
    if (rem.repeatType === 'Monthly') {
      const dayOfMonth = dateObj.getDate();
      return rem.monthlyDay === dayOfMonth;
    }
    return true; // 'Daily' and 'Interval Based'
  };

  const matrixDates = useMemo(() => {
    const dates = [];
    if (matrixView === 'Weekly') {
      // Last 7 days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Days of the selected month
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dates.push(dStr);
      }
    }
    return dates;
  }, [matrixView, selectedMonth, selectedYear]);

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        month: d.getMonth(),
        year: d.getFullYear()
      });
    }
    return options;
  }, []);

  const matrixCategories = useMemo(() => {
    const cats = new Set<string>();
    personalReminders.forEach(r => cats.add(r.category));
    plans.forEach(p => cats.add(p.category));
    cats.add('Technical');
    return ['All', ...Array.from(cats)];
  }, [personalReminders, plans]);

  const combinedMatrixItems = useMemo(() => {
    const items: any[] = [];

    // Add Reminders
    personalReminders.forEach(rem => {
      if (matrixCategory !== 'All' && rem.category !== matrixCategory) return;
      items.push({
        id: rem.id,
        title: rem.title,
        category: rem.category,
        repeatType: rem.repeatType,
        isHabit: rem.isHabit,
        habitStreak: rem.habitStreak,
        isTask: false,
        isScheduled: (dateStr: string) => isReminderScheduledForDate(rem, dateStr),
        isCompleted: (dateStr: string) => {
          const log = reminderLogs.find(l => l.reminderId === rem.id && l.date === dateStr);
          return log?.status === 'Completed';
        },
        toggleToday: (currentlyCompleted: boolean) => {
          if (onActionReminder) {
            onActionReminder(rem.id, currentlyCompleted ? 'Skipped' : 'Completed');
          }
        }
      });
    });

    // Add Plans
    plans.forEach(plan => {
      if (matrixCategory !== 'All' && plan.category !== matrixCategory) return;
      items.push({
        id: plan.id,
        title: plan.title,
        category: plan.category,
        repeatType: plan.repeatType,
        isHabit: false,
        isTask: true,
        isScheduled: (dateStr: string) => dateStr >= plan.startDate && dateStr <= plan.endDate,
        isCompleted: (dateStr: string) => {
          const task = tasks.find(t => t.planId === plan.id && t.date === dateStr);
          return task?.status === 'Completed';
        },
        toggleToday: (currentlyCompleted: boolean) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const task = tasks.find(t => t.planId === plan.id && t.date === todayStr);
          if (task) {
            onUpdateTask({ ...task, status: currentlyCompleted ? 'Skipped' : 'Completed', completedAt: new Date().toISOString() }, task.targetHours, 'Toggled from Grid Matrix');
          }
        }
      });
    });

    // Add System Tasks
    if (matrixCategory === 'All' || matrixCategory === 'Technical') {
      const systemTasks = [
        { id: 'system-recall', title: 'Recall Session' },
        { id: 'system-revision', title: 'Revision Queue' }
      ];
      systemTasks.forEach(sys => {
        items.push({
          id: sys.id,
          title: sys.title,
          category: 'Technical',
          repeatType: 'Daily',
          isHabit: false,
          isTask: true,
          isScheduled: (dateStr: string) => true,
          isCompleted: (dateStr: string) => {
            const task = tasks.find(t => t.planId === sys.id && t.date === dateStr);
            return task?.status === 'Completed';
          },
          toggleToday: (currentlyCompleted: boolean) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const task = tasks.find(t => t.planId === sys.id && t.date === todayStr);
            if (task) {
              onUpdateTask({ ...task, status: currentlyCompleted ? 'Skipped' : 'Completed', completedAt: new Date().toISOString() }, task.targetHours, 'Toggled from Grid Matrix');
            }
          }
        });
      });
    }

    return items;
  }, [personalReminders, plans, tasks, reminderLogs, matrixCategory, onActionReminder, onUpdateTask]);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 1. Calculate Study Streak (consecutive dates from sessions)
  const studyStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
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
    return streak;
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

  const todayCompletedHours = useMemo(() => {
    const hours = todayTasks
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + (t.targetHours || 0), 0);
    return Number(hours.toFixed(2));
  }, [todayTasks]);

  const todayTotalHours = useMemo(() => {
    const hours = todayTasks.reduce((sum, t) => sum + (t.targetHours || 0), 0);
    return Number(hours.toFixed(2));
  }, [todayTasks]);

  // Reminders calculations for today
  const todaysRemindersList = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[now.getDay()];
    const todayDayOfMonth = now.getDate();

    return personalReminders
      .filter(rem => {
        if (!rem.active) return false;
        if (todayStr < rem.startDate || todayStr > rem.endDate) return false;

        if (rem.repeatType === 'Weekly') {
          return rem.weeklyDays?.includes(todayDayName);
        }
        if (rem.repeatType === 'Monthly') {
          return rem.monthlyDay === todayDayOfMonth;
        }
        return true; // Daily & Interval Based
      })
      .map(rem => {
        const todayLog = reminderLogs.find(l => l.reminderId === rem.id && l.date === todayStr);
        return {
          reminder: rem,
          status: (todayLog?.status || 'Pending') as ReminderStatus,
          log: todayLog
        };
      })
      .sort((a, b) => a.reminder.reminderTime.localeCompare(b.reminder.reminderTime));
  }, [personalReminders, reminderLogs]);

  const waterIntakeProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const waterRem = personalReminders.find(r => r.category === 'Health' && r.targetGlasses !== undefined);
    if (!waterRem) return { completed: 0, target: 8 };

    const completed = reminderLogs.filter(l => l.reminderId === waterRem.id && l.date === todayStr && l.status === 'Completed').length;
    return {
      completed,
      target: waterRem.targetGlasses || 8,
      reminderId: waterRem.id
    };
  }, [personalReminders, reminderLogs]);

  const medicineProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const medRems = personalReminders.filter(r => r.medicineName !== undefined);
    if (medRems.length === 0) return { completed: 0, total: 0 };

    let completed = 0;
    medRems.forEach(med => {
      const hasTaken = reminderLogs.some(l => l.reminderId === med.id && l.date === todayStr && l.status === 'Completed');
      if (hasTaken) completed++;
    });

    return {
      completed,
      total: medRems.length
    };
  }, [personalReminders, reminderLogs]);

  const reminderCompletionPercentage = useMemo(() => {
    if (todaysRemindersList.length === 0) return 100;
    const completed = todaysRemindersList.filter(r => r.status === 'Completed').length;
    return Math.round((completed / todaysRemindersList.length) * 100);
  }, [todaysRemindersList]);

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

  // Dynamic Spark Line SVG Generator for data charts
  const renderSparkline = (dataPoints: number[], bgColor: string, strokeColor: string) => {
    let pathD = "M0,30 L100,30 Z";
    let filledPathD = "M0,30 L100,30 Z";
    
    if (dataPoints && dataPoints.length > 0) {
      const max = Math.max(...dataPoints, 1);
      const min = 0;
      const range = max - min;
      const stepX = 100 / Math.max(dataPoints.length - 1, 1);
      
      const points = dataPoints.map((val, i) => {
        const x = i * stepX;
        const y = 30 - ((val - min) / range) * 25; 
        return `${x},${y}`;
      });
      
      if (points.length > 1) {
        let curve = `M${points[0]}`;
        for (let i = 0; i < points.length - 1; i++) {
          const [x1, y1] = points[i].split(',').map(Number);
          const [x2, y2] = points[i+1].split(',').map(Number);
          const cx1 = x1 + (x2 - x1) / 2;
          const cy1 = y1;
          const cx2 = x1 + (x2 - x1) / 2;
          const cy2 = y2;
          curve += ` C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
        }
        pathD = curve;
        filledPathD = `${curve} L100,30 L0,30 Z`;
      }
    }

    return (
      <div className="absolute bottom-0 inset-x-0 h-14 pointer-events-none opacity-40">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sparkGrad-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bgColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={bgColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={filledPathD}
            fill={`url(#sparkGrad-${strokeColor.replace('#', '')})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <motion.path
            d={pathD}
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
  };

  // Play a success sound using Web Audio API
  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playOscillator = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Play a quick uplifting chord arpeggio
      playOscillator(523.25, 0.0, 0.3); // C5
      playOscillator(659.25, 0.1, 0.3); // E5
      playOscillator(783.99, 0.2, 0.3); // G5
      playOscillator(1046.50, 0.3, 0.8); // C6
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >

      {/* 0. Top Priority Dynamic Island Timer Widget */}
      {activeTaskTimer && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center justify-center gap-8 shadow-xl border border-white/5"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-black/90 backdrop-blur-3xl -z-10" />

          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-50" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-30" />

          {/* Row 1: Mission Info & Timer */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 shadow-inner">
              <div className={`w-2 h-2 rounded-full ${activeTaskTimer.isPaused ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]'}`} />
              <div className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-widest">{activeTaskTimer.isPaused ? 'Paused' : 'Active Mission'}</div>
            </div>

            <div className="flex flex-col items-center mt-2">
              <div className={`font-mono font-bold tracking-tighter text-center ${activeTaskTimer.isPaused ? 'text-slate-600' : 'text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-slate-400 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]'}`}>
                {/* Mobile Vertical Timer */}
                <div className="flex md:hidden flex-col items-center text-[5.5rem] leading-[0.85]">
                  <div>{formatTime(activeTaskTimer.elapsed).split(':')[0]}</div>
                  <div>{formatTime(activeTaskTimer.elapsed).split(':')[1]}</div>
                  <div className="text-4xl text-indigo-300/60 mt-2 bg-clip-text">{formatTime(activeTaskTimer.elapsed).split(':')[2]}</div>
                </div>
                {/* Desktop Horizontal Timer */}
                <div className="hidden md:block text-[7.5rem] leading-none">
                  {formatTime(activeTaskTimer.elapsed)}
                </div>
              </div>
              <div className="font-display text-base md:text-xl font-medium text-indigo-200/70 mt-4 max-w-[280px] md:max-w-xl text-center truncate px-2">
                {activeTaskTimer.taskTitle}
              </div>
            </div>
          </div>

          {/* Row 2: Premium Dock Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/5 backdrop-blur-xl p-2 rounded-3xl border border-white/10 shadow-2xl">
            <button
              onClick={() => {
                setActiveTaskTimer(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
              }}
              title={activeTaskTimer.isPaused ? "Resume" : "Pause"}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {activeTaskTimer.isPaused ? <Play className="w-5 h-5 text-indigo-300 ml-0.5" /> : <Pause className="w-5 h-5 text-amber-300" />}
            </button>

            <button
              onClick={() => setActiveTaskTimer(null)}
              title="Stop & Discard"
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 group"
            >
              <Square className="w-4 h-4 text-rose-300 group-hover:text-rose-400" />
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <button
              onClick={async () => {
                try {
                  const elapsedHours = Number((activeTaskTimer.elapsed / 3600).toFixed(2));
                  await onUpdateTask({
                    ...activeTaskTimer.task,
                    status: 'Completed',
                    completedAt: new Date().toISOString()
                  }, elapsedHours > 0 ? elapsedHours : activeTaskTimer.task.targetHours, `Completed via timer. Time spent: ${formatTime(activeTaskTimer.elapsed)}`);

                  playSuccessChime();
                  setActiveTaskTimer(null);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-6 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-900 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Mission</span>
            </button>
          </div>
        </motion.div>
      )}

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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {todayCompletedHours} / {todayTotalHours} hr
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {todayCompletionPercentage}% Complete
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-sans">
            {todayTasks.map(task => {
              const isCompleted = task.status === 'Completed';
              const isSkipped = task.status === 'Skipped';
              const isActive = activeTaskTimer?.taskId === task.id;
              const isPaused = isActive && activeTaskTimer?.isPaused;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition text-left ${isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-500'
                      : isSkipped
                        ? 'border-white/5 bg-slate-900/35 text-slate-500'
                        : isActive
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
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
                          if (isActive) setActiveTaskTimer(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${isCompleted
                          ? 'bg-emerald-650 border-transparent text-white'
                          : isSkipped
                            ? 'border-slate-700 bg-slate-850 text-slate-600'
                            : 'border-slate-500 hover:border-indigo-405'
                        }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {!isCompleted && !isSkipped && (
                      <button
                        onClick={() => {
                          if (isActive) {
                            setActiveTaskTimer(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
                          } else {
                            setActiveTaskTimer({
                              taskId: task.id,
                              taskTitle: task.title,
                              task: task,
                              startTime: Date.now(),
                              elapsed: 0,
                              isPaused: false
                            });
                          }
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${isActive && !isPaused
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                          }`}
                      >
                        {isActive && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      </button>
                    )}

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

      {/* 2.5 TODAY'S PERSONAL REMINDERS & HYDRATION DASHBOARD WIDGET */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-6 gap-5">

        {/* Left Column: Reminders Checklist (Col Span 3) */}
        <BentoCard className="md:col-span-3 space-y-4" reducedMotion={reducedMotion}>
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Bell className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm font-display">Today's Reminders & Habits</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {reminderCompletionPercentage}% Complete
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans max-h-60 overflow-y-auto pr-1">
            {todaysRemindersList.map(({ reminder, status }) => {
              const isCompleted = status === 'Completed';
              const isSnoozed = status === 'Snoozed';
              const isSkipped = status === 'Skipped';

              return (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition text-left ${isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-500'
                      : isSkipped
                        ? 'border-white/5 bg-slate-900/35 text-slate-500'
                        : isSnoozed
                          ? 'border-amber-500/25 bg-amber-500/5 text-slate-300'
                          : 'border-white/5 bg-white/5 text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <button
                      disabled={isCompleted || isSkipped}
                      onClick={async () => {
                        if (isCompleted || isSkipped || !onActionReminder) return;
                        await onActionReminder(reminder.id, 'Completed');
                      }}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${isCompleted
                          ? 'bg-emerald-650 border-transparent text-white'
                          : isSkipped
                            ? 'border-slate-700 bg-slate-850 text-slate-600'
                            : 'border-slate-500 hover:border-indigo-400'
                        }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`truncate font-semibold text-xs ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {reminder.title}
                      </span>
                      <span className="text-[9px] text-slate-450 font-mono">
                        {reminder.reminderTime} | {reminder.category}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && !isSkipped && onActionReminder && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onActionReminder(reminder.id, 'Snoozed', 15)}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => onActionReminder(reminder.id, 'Skipped')}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-rose-950/20 text-rose-350 hover:text-rose-300 transition cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  )}

                  {(isCompleted || isSkipped) && (
                    <span className="text-[8px] font-mono font-bold uppercase text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {status}
                    </span>
                  )}
                </div>
              );
            })}

            {todaysRemindersList.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-sans">
                No reminders scheduled for today.
                <button
                  onClick={() => onNavigate('Personal Reminders')}
                  className="text-indigo-400 font-bold underline hover:text-indigo-305 ml-1 block mt-1.5 mx-auto cursor-pointer"
                >
                  Schedule Personal Reminders &rarr;
                </button>
              </div>
            )}
          </div>
        </BentoCard>

        {/* Right Column: Hydration & Medicine quick cards (Col Span 3) */}
        <BentoCard className="md:col-span-3 space-y-4" reducedMotion={reducedMotion}>
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-sm font-display">Hydration & Medications</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">
              Habits Check
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

            {/* Water hydration quick check */}
            <div className="p-3.5 bg-sky-500/5 rounded-xl border border-sky-500/10 flex flex-col justify-between min-h-[110px] text-left">
              <div>
                <span className="text-[9px] font-mono text-sky-400 font-bold block uppercase">Water Intake</span>
                <span className="font-display font-extrabold text-sm text-slate-100 block pt-1">
                  {waterIntakeProgress.completed} / {waterIntakeProgress.target} Glasses Completed
                </span>
              </div>
              <div className="pt-2 border-t border-sky-500/5 mt-2 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-450">Target: {waterIntakeProgress.target * 250}ml</span>
                {onActionReminder && waterIntakeProgress.reminderId && (
                  <button
                    onClick={() => onActionReminder(waterIntakeProgress.reminderId, 'Completed')}
                    className="p-1 px-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] transition cursor-pointer"
                  >
                    + Glass
                  </button>
                )}
              </div>
            </div>

            {/* Medicine compliance check */}
            <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-between min-h-[110px] text-left">
              <div>
                <span className="text-[9px] font-mono text-emerald-350 font-bold block uppercase">Medications Taken</span>
                <span className="font-display font-extrabold text-sm text-slate-100 block pt-1">
                  {medicineProgress.completed} / {medicineProgress.total} Taken
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-500/5 mt-2 flex items-center justify-between text-[9px] font-mono text-slate-450">
                <span>Compliance: {medicineProgress.total > 0 ? Math.round((medicineProgress.completed / medicineProgress.total) * 100) : 100}%</span>
                <button
                  onClick={() => onNavigate('Personal Reminders')}
                  className="text-emerald-400 font-bold underline hover:text-emerald-350 cursor-pointer"
                >
                  Manage Cabinet &rarr;
                </button>
              </div>
            </div>

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
              {priorityItems.length > 0 
                ? `Focus: ${priorityItems[0].topic.name} & related concepts`
                : 'All clear! No critical concepts need revision today.'}
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-sm">
              {priorityItems.length > 0 
                ? `Your spacing algorithm selected ${priorityItems.length} high-decay technical concepts for recall testing today. Ensure you evaluate retention gaps.`
                : 'Your retention metrics look strong. You can review your spacing map or practice new topics.'}
            </p>
          </div>

          <div className="flex items-center justify-between items-end mt-4 border-t border-white/5 pt-3">
            <span className="text-[10px] font-mono text-slate-400">
              Last evaluation: Just updated
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
          {renderSparkline(streakSparklineData, 'rgba(249, 115, 22, 0.2)', '#f97316')}
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
          {renderSparkline(iciSparklineData, 'rgba(99, 102, 241, 0.2)', '#6366f1')}
        </BentoCard>

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
                      <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" style={{ width: `${(count / 3) * 100}%` }} />
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

      {/* 5. Cyberpunk Habit & Task Grid Matrix */}
      <motion.div variants={itemVariants} className="border-t border-white/10 pt-6 mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="text-left">
            <h3 className="font-bold text-white font-display text-base flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              Neural Habit & Task Grid Matrix
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Interactive timeline mapping daily habits and scheduled tasks consistency checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono text-[10px]">Filter:</span>
              <select
                value={matrixCategory}
                onChange={(e) => setMatrixCategory(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                {matrixCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* View Horizon Toggle */}
            <div className="bg-slate-900/60 p-0.5 rounded-lg border border-white/10 flex items-center">
              <button
                onClick={() => setMatrixView('Weekly')}
                className={`px-2.5 py-0.5 rounded-md font-sans transition-all cursor-pointer ${matrixView === 'Weekly'
                    ? 'bg-indigo-650 text-white font-bold'
                    : 'text-slate-450 hover:text-slate-200'
                  }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setMatrixView('Monthly')}
                className={`px-2.5 py-0.5 rounded-md font-sans transition-all cursor-pointer ${matrixView === 'Monthly'
                    ? 'bg-indigo-650 text-white font-bold'
                    : 'text-slate-450 hover:text-slate-200'
                  }`}
              >
                Monthly
              </button>
            </div>

            {/* Month Selector Dropdown */}
            {matrixView === 'Monthly' && (
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                {monthOptions.map(opt => (
                  <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Matrix Grid Container */}
        <div className="glass-card rounded-2xl border-white/10 bg-slate-950/20 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-500/10 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 pb-2">
                  <th className="py-2.5 pr-4 text-[10px] font-mono uppercase text-slate-450 tracking-wider w-[220px]">
                    Reminder / Habit Title
                  </th>
                  {matrixDates.map(dateStr => {
                    const dateObj = parseLocalDate(dateStr);
                    const dayNum = String(dateObj.getDate()).padStart(2, '0');
                    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                    const dayName = days[dateObj.getDay()];
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <th
                        key={dateStr}
                        className={`py-2 px-1 text-center font-mono text-[9px] font-bold min-w-[32px] ${isToday
                            ? 'text-indigo-400 ring-1 ring-indigo-500/30 rounded bg-indigo-500/5'
                            : isWeekend
                              ? 'text-rose-450'
                              : 'text-slate-400'
                          }`}
                      >
                        <span className="block">{dayName}</span>
                        <span className="block text-[11px] font-bold mt-0.5">{dayNum}</span>
                      </th>
                    );
                  })}
                  <th className="py-2.5 pl-4 text-center text-[10px] font-mono uppercase text-slate-450 tracking-wider w-[80px]">
                    Ratio
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedMatrixItems.map(item => {
                  let totalScheduled = 0;
                  let totalCompleted = 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                    >
                      {/* First Column: Title & Streak */}
                      <td className="py-3 pr-4 text-left w-[220px]">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {item.isTask ? (
                            <ListTodo className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : item.isHabit ? (
                            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/10 shrink-0" />
                          ) : (
                            <Bell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          <span className="font-extrabold text-xs text-white truncate max-w-[140px]" title={item.title}>
                            {item.title}
                          </span>
                          {item.isHabit && item.habitStreak !== undefined && item.habitStreak > 0 && (
                            <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.2 rounded shrink-0">
                              {item.habitStreak}d
                            </span>
                          )}
                        </div>
                        <span className="block text-[9px] text-slate-450 font-mono mt-0.5 uppercase tracking-wide truncate max-w-[180px]">
                          {item.category} • {item.repeatType}
                        </span>
                      </td>

                      {/* Date Checkbox Cells */}
                      {matrixDates.map(dateStr => {
                        const isScheduled = item.isScheduled(dateStr);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const isCompleted = item.isCompleted(dateStr);

                        if (isScheduled) {
                          totalScheduled++;
                          if (isCompleted) totalCompleted++;
                        }

                        return (
                          <td
                            key={dateStr}
                            className={`py-3 px-1 text-center align-middle min-w-[32px] ${isToday ? 'bg-indigo-500/5' : ''
                              }`}
                          >
                            {isScheduled ? (
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  disabled={!isToday}
                                  onClick={() => {
                                    if (isToday && item.toggleToday) {
                                      item.toggleToday(isCompleted);
                                    }
                                  }}
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isCompleted
                                      ? 'bg-emerald-500 border-emerald-450 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                      : isToday
                                        ? 'bg-slate-900/80 border-indigo-400 hover:border-indigo-300 cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.15)] hover:scale-105'
                                        : 'bg-slate-950/40 border-slate-700 cursor-not-allowed'
                                    }`}
                                  title={
                                    isToday
                                      ? `Click to toggle completion for Today (${isCompleted ? 'Mark Incomplete' : 'Mark Completed'})`
                                      : isCompleted
                                        ? `Completed on ${dateStr}`
                                        : `Scheduled but Incomplete on ${dateStr}`
                                  }
                                >
                                  {isCompleted && <Check className="w-3 h-3 stroke-[3px]" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">•</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Final Column: Ratio Completion Percent */}
                      <td className="py-3 pl-4 text-center w-[80px]">
                        {totalScheduled > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[10px] font-mono font-bold text-indigo-300">
                              {totalCompleted}/{totalScheduled}
                            </span>
                            <span className="text-[8px] font-mono text-slate-450">
                              ({Math.round((totalCompleted / totalScheduled) * 100)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Hours Summary Row */}
                <tr className="border-t-2 border-white/10 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                  <td className="py-3 pr-4 text-left font-display font-bold text-[11px] text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Total Study Hours
                  </td>
                  {matrixDates.map(dateStr => {
                    const dayTasks = tasks.filter(t => t.date === dateStr);
                    const totalTarget = dayTasks.reduce((sum, t) => sum + (t.targetHours || 0), 0);
                    const totalCompleted = dayTasks.filter(t => t.status === 'Completed').reduce((sum, t) => sum + (t.targetHours || 0), 0);

                    return (
                      <td key={dateStr} className="py-3 px-1 text-center align-middle">
                        {totalTarget > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-[9px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded ${totalCompleted >= totalTarget ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                              }`}>
                              {totalCompleted.toFixed(1)} / {totalTarget.toFixed(1)} hr
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 pl-4 text-center"></td>
                </tr>

                {combinedMatrixItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={matrixDates.length + 2}
                      className="text-center py-8 text-slate-450 text-xs font-sans"
                    >
                      No active reminders or habits match the selected filter configuration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid Legend & Diagnostics */}
          <div className="border-t border-white/5 pt-3 mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] font-mono text-slate-450">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-450 flex items-center justify-center text-slate-950 font-bold text-[8px] shrink-0">
                  <Check className="w-2 h-2 stroke-[3px]" />
                </span>
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700 shrink-0" />
                <span>Scheduled (Incomplete)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-650 shrink-0 font-bold">•</span>
                <span>Off-Schedule (Not Due)</span>
              </span>
            </div>

            <div className="text-center sm:text-right text-slate-400">
              💡 <span className="text-indigo-400 font-bold">Interactive:</span> You can click **Today's** checkboxes directly inside the grid to log daily check-ins!
            </div>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
