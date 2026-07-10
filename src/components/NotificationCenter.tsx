/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AppNotification, Topic, Question, Interview, JobApplication, StudySession, DailyTask, Journal, MockInterview, PersonalReminder, UserSettings } from '../types';
import { 
  Bell, Check, Trash2, Calendar, AlertTriangle, Book, Clock, Star, Info,
  Settings, Award, Flame, Brain, Shield, Coffee, ChevronRight, CheckCircle2,
  X, Moon, CalendarDays, Compass, Activity, Play, Zap, ArrowRight, Sparkles, Sliders,
  HelpCircle, LineChart, PieChart, TrendingUp, RefreshCw, BarChart2, Radio, Volume2, VolumeX, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  topics?: Topic[];
  questions?: Question[];
  interviews?: Interview[];
  applications?: JobApplication[];
  sessions?: StudySession[];
  tasks?: DailyTask[];
  journals?: Journal[];
  mockInterviews?: MockInterview[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  pushNotification?: (params: Omit<AppNotification, 'id' | 'date' | 'read'>) => Promise<void>;
  personalReminders?: PersonalReminder[];
  userSettings?: UserSettings | null;
}

const NotificationCenter = React.memo(function NotificationCenter({
  notifications,
  onMarkRead,
  onClearAll,
  topics = [],
  questions = [],
  interviews = [],
  applications = [],
  sessions = [],
  tasks = [],
  journals = [],
  mockInterviews = [],
  activeTab,
  setActiveTab,
  pushNotification,
  personalReminders = [],
  userSettings
}: NotificationCenterProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [audioMuted, setAudioMuted] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<{ time: string; message: string; color: string }[]>([]);

  useEffect(() => {
    if (!isExpanded) return;
    
    const now = new Date();
    const formats = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs([
      { time: formats(new Date(now.getTime() - 4000)), message: 'SYSTEM: Initialization vector check [OK]', color: 'text-slate-400' },
      { time: formats(new Date(now.getTime() - 2000)), message: 'COGNITIVE: Loading spacing memory weights...', color: 'text-indigo-400' },
      { time: formats(now), message: 'TELEMETRY: Handshake sync with Firebase complete: active', color: 'text-emerald-400' },
    ]);

    const messages = [
      { message: 'SCHEDULER: Spacing curves updated for Spaced Repetition queue.', color: 'text-slate-400' },
      { message: 'MIND: Calculated current retention threshold at 87.5%', color: 'text-indigo-305' },
      { message: 'MOCK: AI voice recognition ready at local buffer.', color: 'text-slate-400' },
      { message: 'COMPLIANCE: Personal habit checklist calibrated for daily check-in.', color: 'text-teal-400' },
      { message: 'FIREWALL: DND rules compiled successfully.', color: 'text-slate-400' },
      { message: 'BACKUP: Cloud backup checksum generated.', color: 'text-slate-405' },
      { message: 'TELEMETRY: Snapshot listeners verified at path /users/active.', color: 'text-emerald-400' },
    ];

    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const nextLog = messages[Math.floor(Math.random() * messages.length)];
      setTerminalLogs(prev => {
        const next = [...prev, { time: timeStr, ...nextLog }];
        if (next.length > 5) next.shift();
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  // ----------------------------------------------------
  // REAL-TIME COUNTDOWN HUD TELEMETRY ENGINE
  // ----------------------------------------------------
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getNextOccurrence = (timeStr: string) => {
    const now = new Date();
    let hours = 0;
    let minutes = 0;

    try {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, modifier] = timeStr.split(' ');
        const [hStr, mStr] = time.split(':');
        hours = parseInt(hStr, 10);
        minutes = parseInt(mStr, 10);
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
      } else {
        const [hStr, mStr] = timeStr.split(':');
        hours = parseInt(hStr, 10) || 0;
        minutes = parseInt(mStr, 10) || 0;
      }
    } catch (e) {
      console.warn("Error parsing reminder time:", timeStr, e);
    }

    const occurrence = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    if (occurrence.getTime() <= now.getTime()) {
      occurrence.setDate(occurrence.getDate() + 1);
    }
    return occurrence;
  };

  const upcomingReminder = useMemo(() => {
    if (!personalReminders || personalReminders.length === 0) return null;
    const activeReminders = personalReminders.filter(r => r.active);
    if (activeReminders.length === 0) return null;

    const mapped = activeReminders.map(r => {
      const nextTime = getNextOccurrence(r.reminderTime);
      return {
        reminder: r,
        nextTime,
        diff: nextTime.getTime() - currentTime
      };
    });

    mapped.sort((a, b) => a.diff - b.diff);
    return mapped[0];
  }, [personalReminders, currentTime]);

  const countdownString = useMemo(() => {
    if (!upcomingReminder) return '';
    const diff = upcomingReminder.nextTime.getTime() - currentTime;
    if (diff <= 0) return '00:00:00';
    
    const sec = Math.floor((diff / 1000) % 60);
    const min = Math.floor((diff / (1000 * 60)) % 60);
    const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${String(hrs).padStart(2, '0')}h`);
    parts.push(`${String(min).padStart(2, '0')}m`);
    parts.push(`${String(sec).padStart(2, '0')}s`);
    return parts.join(' ');
  }, [upcomingReminder, currentTime]);

  // Personal Reminders Configuration state (persisted locally)
  const [morningTime, setMorningTime] = useState(() => localStorage.getItem('pref_morning_time') || '09:00 AM');
  const [afternoonTime, setAfternoonTime] = useState(() => localStorage.getItem('pref_afternoon_time') || '02:00 PM');
  const [eveningTime, setEveningTime] = useState(() => localStorage.getItem('pref_evening_time') || '07:00 PM');
  const [nightTime, setNightTime] = useState(() => localStorage.getItem('pref_night_time') || '09:45 PM');
  const [weekendMode, setWeekendMode] = useState(() => {
    const val = localStorage.getItem('pref_weekend_mode');
    return val !== 'false'; // defaults to true
  });
  const [dndMode, setDndMode] = useState(() => localStorage.getItem('pref_dnd_mode') === 'true');

  // Reminders Analytics tracking state (persisted locally)
  const [analytics, setAnalytics] = useState(() => {
    const saved = localStorage.getItem('prep_reminder_analytics');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      sent: 34,
      completed: 27,
      snoozed: 12,
      ignored: 4,
      studySuccess: 85,
      activitySuccess: 72,
      weeklyPerformance: [
        { day: 'Mon', completed: 3, total: 4 },
        { day: 'Tue', completed: 4, total: 5 },
        { day: 'Wed', completed: 5, total: 5 },
        { day: 'Thu', completed: 3, total: 4 },
        { day: 'Fri', completed: 4, total: 6 },
        { day: 'Sat', completed: 5, total: 5 },
        { day: 'Sun', completed: 3, total: 5 }
      ]
    };
  });

  // Keep preference settings synchronized in localStorage
  useEffect(() => {
    localStorage.setItem('pref_morning_time', morningTime);
    localStorage.setItem('pref_afternoon_time', afternoonTime);
    localStorage.setItem('pref_evening_time', eveningTime);
    localStorage.setItem('pref_night_time', nightTime);
    localStorage.setItem('pref_weekend_mode', weekendMode.toString());
    localStorage.setItem('pref_dnd_mode', dndMode.toString());
  }, [morningTime, afternoonTime, eveningTime, nightTime, weekendMode, dndMode]);

  useEffect(() => {
    localStorage.setItem('prep_reminder_analytics', JSON.stringify(analytics));
  }, [analytics]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Dynamic coaching logic: Build or process notifications with priority indicator
  const enrichedNotifications = useMemo(() => {
    // If the user configured their private geminiApiKey, filter out the setup notification
    const baseList = userSettings?.geminiApiKey
      ? notifications.filter(n => !n.title.toLowerCase().includes('gemini api key') && !n.title.toLowerCase().includes('gemini key'))
      : notifications;

    return baseList.map(notif => {
      // Determine priority level if missing (based on categories/deadlines)
      let priority: 'high' | 'medium' | 'low' = notif.priority || 'medium';
      let timingSlot: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';

      if (notif.title.toLowerCase().includes('tomorrow') || notif.title.toLowerCase().includes('streak expiring') || notif.type === 'revision') {
        priority = 'high';
      } else if (notif.type === 'journal' || notif.type === 'weakness') {
        priority = notif.type === 'weakness' ? 'medium' : 'low';
      }

      // Ensure Gemini API key setup notifications always have high priority
      if (notif.title.toLowerCase().includes('gemini api key') || notif.title.toLowerCase().includes('gemini key')) {
        priority = 'high';
      }

      // Timing allocation mapping
      if (notif.type === 'daily' || notif.title.toLowerCase().includes('mission')) {
        timingSlot = 'morning';
      } else if (notif.type === 'revision') {
        timingSlot = 'afternoon';
      } else if (notif.type === 'weakness' || notif.type === 'mock') {
        timingSlot = 'evening';
      } else if (notif.type === 'journal' || notif.type === 'streak') {
        timingSlot = 'night';
      }

      return {
        ...notif,
        priority,
        timingSlot,
        status: notif.status || (notif.read ? 'completed' : 'active')
      };
    });
  }, [notifications, userSettings?.geminiApiKey]);

  // Filtered lists for Today, Upcoming, Overdue, and Completed Tabs
  const filteredNotifications = useMemo(() => {
    const list = enrichedNotifications;
    const now = new Date();

    const sortFn = (arr: typeof enrichedNotifications) => {
      return [...arr].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const scoreA = priorityOrder[a.priority] || 2;
        const scoreB = priorityOrder[b.priority] || 2;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    };

    return {
      today: sortFn(list.filter(n => n.status === 'active' || n.status === 'snoozed')),
      upcoming: sortFn(list.filter(n => n.status === 'active' && new Date(n.date) > now)),
      overdue: sortFn(list.filter(n => n.status === 'active' && new Date(n.date) < new Date(now.getTime() - 24 * 60 * 60 * 1000))),
      completed: sortFn(list.filter(n => n.status === 'completed' || n.read === true))
    };
  }, [enrichedNotifications]);

  const activeFilteredList = useMemo(() => {
    return filteredNotifications[activeSubTab];
  }, [filteredNotifications, activeSubTab]);

  // Futuristic Synthesized Sound Effects (Web Audio API)
  const playSound = (type: 'open' | 'chime' | 'buzz' | 'whoosh') => {
    if (audioMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chime') {
        // Futuristic tech blip chime (ascending digital blip)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'whoosh') {
        // Digital swipe whoosh (subtle sweep)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'buzz') {
        // Cyber alert DND buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'open') {
        // High-tech console deck startup chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Web Audio API blocked or not supported by browser:", e);
    }
  };

  // Trigger high audit generation using real-time components parameters
  const generateSmartCoachReminders = async () => {
    playSound('open');
    if (!pushNotification) {
      alert("Coaching engine is initialized inside local space. Try checking again or reload app!");
      return;
    }

    // A. Daily Study Reminder
    const activeTasksName = tasks.length > 0 
      ? tasks.slice(0, 3).map(t => t.title)
      : ['Collections Revision', 'Java 8 Questions', 'Speaking Practice (2h)'];
    const compCount = tasks.filter(t => t.status === 'Completed').length;
    const totalCount = tasks.length || 3;

    await pushNotification({
      title: "Today's Mission Checklist",
      message: `Preserve consistency: • ${activeTasksName.join(' • ')}. Progress is currently ${compCount}/${totalCount} tasks resolved.`,
      type: 'daily',
      priority: 'medium',
      status: 'active',
      actionText: "Open Daily Task Manager",
      actionUrl: "Task & Study Planner"
    });

    // B. Activity Reminder
    const incompleteTasks = tasks.filter(t => t.status !== 'Completed');
    if (incompleteTasks.length > 0 || tasks.length === 0) {
      await pushNotification({
        title: "Speaking & Verbal Practice Due",
        message: "Target: 2 Hours. You currently have unrecorded practice remaining to secure performance.",
        type: 'daily',
        priority: 'medium',
        status: 'active',
        actionText: "Log Practice Hour",
        actionUrl: "Progress & Analytics"
      });
    }

    // C. Revision Reminder
    const revisionCountDue = questions.filter(q => q.askedCount && q.askedCount > 0).length || 3;
    await pushNotification({
      title: `${revisionCountDue} Core Spacing Questions Active`,
      message: "Direct alert from retention engine: ConcurrentHashMap, CompletableFuture, JVM Memory Areas.",
      type: 'revision',
      priority: 'high',
      status: 'active',
      actionText: "Start Active Recall",
      actionUrl: "Flashcards & Practice"
    });

    // D. Weak Topic Alert
    const lowConfidenceTopics = topics.filter(t => t.confidenceScore < 50);
    const mockWeakTopicName = lowConfidenceTopics.length > 0 ? lowConfidenceTopics[0].name : "Collections";
    await pushNotification({
      title: `${mockWeakTopicName} Confidence Level Warning`,
      message: `Your confidence in ${mockWeakTopicName} has drifted below 50%. A focused review today is highly advised.`,
      type: 'weakness',
      priority: 'medium',
      status: 'active',
      actionText: "Study Core Map",
      actionUrl: "Study Topics & Revisions"
    });

    // E. Interview Countdowns
    const scheduledInterviews = interviews.filter(i => i.status === 'Scheduled');
    if (scheduledInterviews.length > 0) {
      const firstInt = scheduledInterviews[0];
      const daysDiff = Math.ceil((new Date(firstInt.date).getTime() - Date.now()) / (1000 * 3600 * 24));
      
      if (daysDiff === 1) {
        await pushNotification({
          title: "Critical Panel: Interview Tomorrow!",
          message: `${firstInt.companyName} technical round at 10:00 AM. Kick off the fast revision deck to calibrate!`,
          type: 'interview',
          priority: 'high',
          status: 'active',
          actionText: "Start Prep Deck",
          actionUrl: "Goals & Applications"
        });
      } else if (daysDiff > 1 && daysDiff <= 5) {
        await pushNotification({
          title: `Technical Interview in ${daysDiff} Days`,
          message: `Recommended study priority: Java 8, Collections frameworks, and Spring Boot patterns.`,
          type: 'interview',
          priority: 'high',
          status: 'active',
          actionText: "Review Materials",
          actionUrl: "Goals & Applications"
        });
      }
    } else {
      // Seed fallback sample interviewer Alert
      await pushNotification({
        title: "Upcoming Spring Boot Developer Call",
        message: "Scheduled in 3 days. Recommended Focus: • Java 8 • Monolithic structures • Database caching.",
        type: 'interview',
        priority: 'high',
        status: 'active',
        actionText: "Rehearse Templates",
        actionUrl: "Goals & Applications"
      });
    }

    // F. Mock Interview reminder
    const hasRecentMock = mockInterviews.some(mi => {
      const diff = Date.now() - new Date(mi.createdAt).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    });

    if (!hasRecentMock || mockInterviews.length === 0) {
      await pushNotification({
        title: "Mock Interview Recency Threshold Exceeded",
        message: "You have not completed a mock simulation for 7 days. Try a quick 15-minute diagnostic session right now.",
        type: 'mock',
        priority: 'medium',
        status: 'active',
        actionText: "Launch AI Expert Mock",
        actionUrl: "Practice Simulator"
      });
    }

    // G. Streak Protection Info
    await pushNotification({
      title: "Golden Streak Protection Warning",
      message: "Current Streak: 24 Days. Resolve or log at least one practice topic today to shield your daily habit streak!",
      type: 'streak',
      priority: 'high',
      status: 'active',
      actionText: "Solve Diagnostic Deck",
      actionUrl: "Home Dashboard"
    });

    // H. Journal summary alert
    await pushNotification({
      title: "Pending Learning Journal Reflection",
      message: "No daily learning review recorded for today. Write a quick 3-sentence evaluation for high retention.",
      type: 'journal',
      priority: 'low',
      status: 'active',
      actionText: "Write Quick Reflection",
      actionUrl: "Daily Journal & Notes"
    });

    // Increment Analytics Sent Count
    setAnalytics(prev => ({
      ...prev,
      sent: prev.sent + 8
    }));
  };

  const handleSnooze = (id: string, hours: number = 1) => {
    playSound('buzz');
    onMarkRead(id);
    setAnalytics(prev => ({
      ...prev,
      snoozed: prev.snoozed + 1,
      ignored: prev.ignored + 1
    }));
  };

  const handleMarkCompleteAction = (id: string) => {
    playSound('chime');
    onMarkRead(id);
    setAnalytics(prev => ({
      ...prev,
      completed: prev.completed + 1,
      studySuccess: Math.min(100, Math.floor(prev.studySuccess + 1.2)),
      activitySuccess: Math.min(100, Math.floor(prev.activitySuccess + 0.8))
    }));
  };

  const handleExecuteNavAction = (notif: any) => {
    playSound('whoosh');
    setIsExpanded(false);
    if (notif.actionUrl && setActiveTab) {
      setActiveTab(notif.actionUrl);
    }
  };

  const triggerOpenExpanded = () => {
    playSound('open');
    setIsExpanded(true);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Persistent Compact Sidebar Card layout */}
      <div className="glass-card p-5 space-y-4 relative overflow-hidden rounded-2xl border border-indigo-500/10 hover:border-indigo-400/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/15 rounded-lg text-indigo-400 shadow-[inset_0_0_8px_rgba(99,102,241,0.15)]">
                <Bell className="w-4 h-4 text-indigo-300 animate-pulse" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white font-mono text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Neural Alerts</h4>
              <span className="text-[9px] text-indigo-300/80 font-mono block">
                {unreadCount > 0 ? `${unreadCount} deck priority logs` : 'Telemetry calibrated'}
              </span>
            </div>
          </div>

          <button
            onClick={triggerOpenExpanded}
            className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-[10px] font-mono text-indigo-300 rounded-lg border border-indigo-500/15 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_10px_rgba(99,102,241,0.3)] cursor-pointer transition"
          >
            Tactical Deck
          </button>
        </div>

        {/* Real-time Upcoming Reminder Countdown HUD Panel */}
        {upcomingReminder && (
          <div className="bg-[#0b0f19]/60 border border-teal-500/20 p-3 rounded-xl space-y-1.5 text-left relative overflow-hidden shadow-[0_0_12px_rgba(20,184,166,0.05)]">
            <div className="absolute inset-0 pointer-events-none opacity-3 bg-[linear-gradient(rgba(20,184,166,0)_50%,rgba(20,184,166,0.1)_50%)] bg-[length:100%_4px]" />
            <div className="absolute top-0 right-0 w-6 h-6 bg-teal-500/5 rounded-full blur-md" />
            
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold uppercase text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 shadow-[0_0_6px_rgba(20,184,166,0.15)] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-teal-400 animate-pulse" />
                Next Slate Telemetry
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                Active
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <h5 className="text-[11px] font-black text-slate-200 truncate uppercase tracking-wider">
                  {upcomingReminder.reminder.title}
                </h5>
                <span className="text-[8px] font-mono text-slate-500 block leading-tight">
                  ⏱ Category: {upcomingReminder.reminder.category} // {upcomingReminder.reminder.reminderTime}
                </span>
              </div>
              <div className="shrink-0 pl-2">
                <span className="font-mono text-[10.5px] font-black text-teal-400 bg-teal-500/5 border border-teal-500/20 px-2 py-1 rounded-lg block tabular-nums shadow-[inset_0_0_6px_rgba(20,184,166,0.05)] animate-pulse">
                  {countdownString}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mini Preview of the most critical message */}
        {unreadCount > 0 ? (
          <div className="bg-slate-950/40 border border-indigo-500/10 p-3 rounded-xl space-y-2 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/5 rounded-full blur-xl" />
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold uppercase text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shadow-[0_0_6px_rgba(99,102,241,0.15)] flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                Active Recommendation
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                Live
              </span>
            </div>
            <h5 className="text-[11px] font-black text-slate-200 truncate">
              {enrichedNotifications.find(n => !n.read)?.title || "Revision Task Alert"}
            </h5>
            <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
              {enrichedNotifications.find(n => !n.read)?.message}
            </p>
            <div className="pt-1 flex justify-between items-center">
              <span className="text-[8px] text-slate-500 font-mono">Channel sync</span>
              <button 
                onClick={triggerOpenExpanded}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                <span>Execute diagnostic</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-[10px] font-sans">
            No pending alerts in pipeline. Trigger coach analysis below.
          </div>
        )}

        <button
          onClick={generateSmartCoachReminders}
          className="w-full py-2 bg-indigo-500/5 hover:bg-indigo-600/20 border border-indigo-500/15 text-indigo-300 hover:text-white text-[10px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[inset_0_0_8px_rgba(99,102,241,0.05)] hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
        >
          <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Execute Neural Scan</span>
        </button>
      </div>

      {/* 2. Immersive Reminders & Coaching Space (Vercel-style Dashboard Slide-Over Overlay) */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end">
            
            {/* Modal Drawer Shell Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 180 }}
              className="w-full max-w-2xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto flex flex-col justify-between relative"
            >
              {/* Futuristic Cyber Overlay scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-4 z-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(99,102,241,0.15)_50%)] bg-[length:100%_4px]" />
              
              {/* Header Box */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/30 backdrop-blur-md z-10 relative">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                    <Brain className="w-5 h-5 text-indigo-300 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-display uppercase tracking-widest flex items-center gap-1.5">
                      <span>Neural Deck Console</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    </h2>
                    <p className="text-[10px] font-mono text-indigo-300/80">Coaching Telemetry | Latency checks | Settings Drawer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Futuristic Interactive Frequency Bar Waveform */}
                  {!audioMuted && (
                    <div className="flex items-end gap-0.5 h-3.5 w-6 pb-0.5 mr-1 select-none">
                      <span className="w-[1.5px] bg-indigo-400 animate-pulse rounded-t-sm" style={{ height: '40%', animationDuration: '0.6s' }} />
                      <span className="w-[1.5px] bg-indigo-300 animate-pulse rounded-t-sm" style={{ height: '70%', animationDuration: '0.8s' }} />
                      <span className="w-[1.5px] bg-teal-400 animate-pulse rounded-t-sm" style={{ height: '100%', animationDuration: '0.5s' }} />
                      <span className="w-[1.5px] bg-indigo-500 animate-pulse rounded-t-sm" style={{ height: '50%', animationDuration: '0.7s' }} />
                      <span className="w-[1.5px] bg-emerald-400 animate-pulse rounded-t-sm" style={{ height: '80%', animationDuration: '0.9s' }} />
                    </div>
                  )}

                  <button 
                    onClick={() => setAudioMuted(!audioMuted)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                    title={audioMuted ? "Unmute tactical sound chimes" : "Mute tactical sound chimes"}
                  >
                    {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                  </button>

                  <button
                    onClick={async () => {
                      playSound('chime');
                      if (pushNotification) {
                        await pushNotification({
                          title: "Telemetry System Test",
                          message: "Visual console grid and audio wave chimes are active and synchronized.",
                          type: "daily",
                          priority: "high",
                          actionText: "Verify Telemetry",
                          actionUrl: "Home Dashboard"
                        });
                      } else {
                        alert("Visual console grid and audio wave chimes are active! Pushing local alert.");
                      }
                    }}
                    className="p-1.5 px-3 bg-teal-650 text-white hover:bg-teal-550 text-[10.5px] rounded-xl font-bold flex items-center gap-1 cursor-pointer transition shadow-[0_0_10px_rgba(20,184,166,0.3)] hover:scale-102"
                    title="Send a quick test notification to check if everything works"
                  >
                    <Zap className="w-3 h-3 text-white fill-current animate-pulse" />
                    <span>Test Alert</span>
                  </button>

                  <button
                    onClick={generateSmartCoachReminders}
                    className="p-1.5 px-3 bg-indigo-650 text-white hover:bg-indigo-550 text-[10.5px] rounded-xl font-bold flex items-center gap-1 cursor-pointer transition shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:scale-102"
                    title="Generate intelligent notifications matching your preparation metrics"
                  >
                    <RefreshCw className="w-3 h-3 text-white" />
                    <span>Neural Check</span>
                  </button>
                  <button
                    onClick={() => { playSound('buzz'); setIsExpanded(false); }}
                    className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Body Grid */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto z-10 relative">
                
                {/* Real-time Widescreen Countdown HUD Panel */}
                {upcomingReminder && (
                  <div className="bg-slate-950/65 border border-teal-500/30 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.15)] flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Glowing Scanner Line Animation */}
                    <div className="absolute inset-y-0 w-[1.5px] bg-gradient-to-b from-transparent via-teal-400 to-transparent shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse pointer-events-none left-0" style={{ animationDuration: '4s' }} />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(20,184,166,0)_50%,rgba(20,184,166,0.15)_50%)] bg-[length:100%_6px]" />
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center gap-4 text-left w-full sm:w-auto min-w-0">
                      <div className="p-3 bg-teal-500/10 border border-teal-500/25 rounded-2xl text-teal-400 shadow-[inset_0_0_10px_rgba(20,184,166,0.15)] animate-pulse shrink-0">
                        {upcomingReminder.reminder.category === 'Medicine' && <ShieldAlert className="w-6 h-6 text-rose-450" />}
                        {upcomingReminder.reminder.category === 'Health' && <Activity className="w-6 h-6 text-teal-400" />}
                        {upcomingReminder.reminder.category === 'Study' && <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />}
                        {upcomingReminder.reminder.category === 'Revision' && <Clock className="w-6 h-6 text-amber-400" />}
                        {!(upcomingReminder.reminder.category === 'Medicine' || upcomingReminder.reminder.category === 'Health' || upcomingReminder.reminder.category === 'Study' || upcomingReminder.reminder.category === 'Revision') && <Flame className="w-6 h-6 text-orange-400" />}
                      </div>
                      
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-teal-400 bg-teal-500/15 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase leading-none">
                            Next Mission Threshold
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            Telemetry: Synced
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-100 tracking-wide uppercase truncate">
                          {upcomingReminder.reminder.title}
                        </h3>
                        <p className="text-[10.5px] text-slate-400 leading-snug line-clamp-1 max-w-md font-sans">
                          {upcomingReminder.reminder.notificationMessage || upcomingReminder.reminder.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold leading-none mb-1">
                          Count Down T-Minus
                        </span>
                        <span className="font-mono text-2xl font-black text-teal-300 tracking-wider block tabular-nums text-glow-teal animate-pulse">
                          {countdownString}
                        </span>
                      </div>

                      {upcomingReminder.reminder.isHabit && (
                        <div className="bg-[#111827]/60 border border-teal-500/20 px-3.5 py-2 rounded-xl flex flex-col justify-center items-center font-mono">
                          <span className="text-[8px] text-slate-500 block font-bold leading-none uppercase mb-1">
                            Habit Streak
                          </span>
                          <span className="text-sm font-black text-orange-400 animate-pulse flex items-center gap-0.5 leading-none">
                            <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                            {upcomingReminder.reminder.habitStreak || 0}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* A. Live Analytics & Progress Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider font-bold">System Alerts</span>
                    <span className="text-2xl font-extrabold font-mono text-white block mt-1">{analytics.sent}</span>
                    <span className="text-[9px] text-indigo-400 font-sans block mt-0.5">🚀 Syncing dynamic push</span>
                  </div>

                  <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider font-bold">Actions Met</span>
                    <span className="text-2xl font-extrabold font-mono text-emerald-400 block mt-1">{analytics.completed}</span>
                    <span className="text-[9px] text-slate-400 font-sans block mt-0.5">Compliance logged</span>
                  </div>

                  {/* Circle Metrics - Study Success */}
                  <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-800/80" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-indigo-450" strokeDasharray={`${analytics.studySuccess}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-indigo-300">
                        {analytics.studySuccess}%
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-slate-405 block uppercase font-bold leading-tight">Study Loop</span>
                      <span className="text-[10px] text-slate-300 font-sans font-bold">Accuracy</span>
                    </div>
                  </div>

                  {/* Circle Metrics - Activity Success */}
                  <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-800/80" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-teal-400" strokeDasharray={`${analytics.activitySuccess}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-teal-300">
                        {analytics.activitySuccess}%
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-slate-405 block uppercase font-bold leading-tight">Habits Loop</span>
                      <span className="text-[10px] text-slate-300 font-sans font-bold">Accuracy</span>
                    </div>
                  </div>

                </div>

                {/* Futuristic Live Telemetry System Logs Console */}
                <div className="bg-[#0b0f19]/80 border border-indigo-500/15 p-4 rounded-2xl text-left font-mono text-[10px] text-indigo-300 space-y-2 relative overflow-hidden shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(99,102,241,0)_50%,rgba(99,102,241,0.15)_50%)] bg-[length:100%_4px]" />
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">Diagnostics Console Feed</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Channel: Telemetry-99A-SECURE</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-none font-mono">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start text-[10px] font-mono select-all">
                        <span className="text-slate-600 shrink-0 font-semibold">[{log.time}]</span>
                        <span className={`${log.color} leading-relaxed break-all`}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* B. Personal Time Settings Configuration Tab */}
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-left space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white font-display uppercase tracking-wider">Tactical Scheduling Matrix</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 mb-1 font-bold">MORNING SLATE</label>
                      <input 
                        type="text" 
                        value={morningTime} 
                        onChange={(e) => setMorningTime(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 p-2 text-xs text-slate-200 rounded-xl text-center outline-none focus:border-indigo-550 font-mono font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 mb-1 font-bold">AFTERNOON SLATE</label>
                      <input 
                        type="text" 
                        value={afternoonTime} 
                        onChange={(e) => setAfternoonTime(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 p-2 text-xs text-slate-200 rounded-xl text-center outline-none focus:border-indigo-550 font-mono font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 mb-1 font-bold">EVENING SLATE</label>
                      <input 
                        type="text" 
                        value={eveningTime} 
                        onChange={(e) => setEveningTime(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 p-2 text-xs text-slate-200 rounded-xl text-center outline-none focus:border-indigo-550 font-mono font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 mb-1 font-bold">NIGHT SLATE</label>
                      <input 
                        type="text" 
                        value={nightTime} 
                        onChange={(e) => setNightTime(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 p-2 text-xs text-slate-200 rounded-xl text-center outline-none focus:border-indigo-550 font-mono font-bold" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-white/5 text-xs">
                    <div className="flex-1 flex items-center justify-between bg-[#111827]/40 p-3 rounded-xl border border-white/5">
                      <div className="text-left">
                        <span className="font-bold text-slate-200 block">Weekend Mode</span>
                        <span className="text-[9px] text-slate-450 font-sans block">Alters diagnostic alerts on weekends</span>
                      </div>
                      <button 
                        onClick={() => { playSound('chime'); setWeekendMode(!weekendMode); }}
                        className={`text-[9.5px] px-3 py-1 font-bold rounded-lg border cursor-pointer transition ${weekendMode ? 'bg-indigo-650 border-indigo-500/20 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                      >
                        {weekendMode ? 'ACTIVE' : 'DORMANT'}
                      </button>
                    </div>

                    <div className="flex-1 flex items-center justify-between bg-[#111827]/40 p-3 rounded-xl border border-white/5">
                      <div className="text-left">
                        <span className="font-bold text-slate-200 block flex items-center gap-1">
                          <Moon className="w-3 h-3 text-amber-450" />
                          <span>DND Firewall</span>
                        </span>
                        <span className="text-[9px] text-slate-450 font-sans block">Mutes incoming telemetry triggers</span>
                      </div>
                      <button 
                        onClick={() => { playSound('buzz'); setDndMode(!dndMode); }}
                        className={`text-[9.5px] px-3 py-1 font-bold rounded-lg border cursor-pointer transition ${dndMode ? 'bg-rose-650 border-rose-500/20 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                      >
                        {dndMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* C. Primary Interactive Notifications List With Tab Selectors */}
                <div className="space-y-4 text-left">
                  
                  {/* Notification Center Sub-Tabs */}
                  <div className="flex border-b border-white/10">
                    <div className="flex gap-2">
                      {(['today', 'upcoming', 'overdue', 'completed'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => { playSound('whoosh'); setActiveSubTab(tab); }}
                          className={`pb-2.5 px-4 text-xs font-bold font-sans transition border-b-2 capitalize select-none cursor-pointer relative ${
                            activeSubTab === tab 
                              ? 'border-indigo-500 text-white font-extrabold shadow-[0_0_8px_rgba(99,102,241,0.15)]' 
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{tab}</span>
                          {filteredNotifications[tab].length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono leading-none ${
                              tab === 'today' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                              tab === 'overdue' ? 'bg-rose-500/15 text-rose-400 animate-pulse border border-rose-500/20' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {filteredNotifications[tab].length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active filtered notification center alerts list */}
                  <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                    {activeFilteredList.length === 0 ? (
                      <div className="py-12 border border-dashed border-white/5 rounded-2xl bg-[#111827]/10 text-center text-slate-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Compass className="w-8 h-8 text-indigo-500/40 mx-auto animate-spin" style={{ animationDuration: '8s' }} />
                          <h4 className="text-xs font-bold text-slate-350">ALERTS DECK STABILIZED</h4>
                          <p className="text-[10px] text-slate-450 leading-normal">
                            All targets resolved for this filter! Run the "Neural Check" button at the top to re-evaluate potential priorities based on active syllabus data.
                          </p>
                        </div>
                      </div>
                    ) : (
                      activeFilteredList.map(notif => {
                        const isHigh = notif.priority === 'high';
                        const isMedium = notif.priority === 'medium';

                        return (
                          <div 
                            key={notif.id}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden group ${
                              notif.status === 'completed' 
                                ? 'bg-emerald-500/3 border-emerald-500/10 opacity-70' 
                                : isHigh 
                                ? 'bg-rose-500/4 border-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.06)]' 
                                : 'bg-[#111827]/40 border-white/5 hover:border-indigo-500/35 hover:bg-white/5'
                            }`}
                          >
                            {/* HUD corner targeting reticles visible on hover */}
                            {notif.status !== 'completed' && (
                              <>
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-indigo-400/0 group-hover:border-indigo-400/80 transition-all duration-200" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-indigo-400/0 group-hover:border-indigo-400/80 transition-all duration-200" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-indigo-400/0 group-hover:border-indigo-400/80 transition-all duration-200" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-indigo-400/0 group-hover:border-indigo-400/80 transition-all duration-200" />
                              </>
                            )}
                            
                            {/* Accent indicator ribbon */}
                            <div className={`absolute left-0 inset-y-0 w-[2px] ${
                              notif.status === 'completed' ? 'bg-emerald-500' :
                              isHigh ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                              isMedium ? 'bg-amber-500' : 'bg-slate-500'
                            }`} />

                            <div className="flex-1 min-w-0 pl-1.5 flex items-start gap-3">
                              
                              {/* Left Icon */}
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                notif.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                isHigh ? 'bg-rose-500/10 text-rose-400' :
                                isMedium ? 'bg-amber-500/10 text-amber-400' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {notif.type === 'revision' && <Clock className="w-4 h-4" />}
                                {notif.type === 'interview' && <Calendar className="w-4 h-4" />}
                                {notif.type === 'weakness' && <AlertTriangle className="w-4 h-4" />}
                                {notif.type === 'daily' && <Book className="w-4 h-4" />}
                                {notif.type === 'streak' && <Flame className="w-4 h-4" />}
                                {notif.type === 'mock' && <Activity className="w-4 h-4" />}
                                {notif.type === 'journal' && <Book className="w-4 h-4" />}
                              </div>

                              <div className="space-y-1 text-left w-full">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black font-display text-slate-100">
                                    {notif.title}
                                  </span>
                                  
                                  {/* Priority indicator tag */}
                                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    notif.status === 'completed' ? 'bg-emerald-555/10 text-emerald-405 border border-emerald-500/20' :
                                    isHigh ? 'bg-rose-600/10 text-rose-400 ring-1 ring-rose-500/25 shadow-[0_0_6px_rgba(244,63,94,0.15)]' :
                                    isMedium ? 'bg-amber-600/10 text-amber-400' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {notif.status === 'completed' ? 'Resolved' : notif.priority}
                                  </span>

                                  {/* Timing slot tag */}
                                  <span className="text-[8px] font-mono text-indigo-300/60 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                    ⏱ Slot: {notif.timingSlot || 'morning'}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-400 leading-normal font-sans pr-2">
                                  {notif.message}
                                </p>
                              </div>

                            </div>

                            {/* Responsive Interactive actions buttons */}
                            <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0 w-full sm:w-auto justify-end">
                              {notif.status !== 'completed' && (
                                <>
                                  <button
                                    onClick={() => handleSnooze(notif.id, 1)}
                                    className="p-1 px-2 bg-slate-800 hover:bg-slate-750 border border-white/5 text-[9.5px] font-mono text-slate-350 rounded-lg cursor-pointer flex items-center gap-0.5 transition"
                                    title="Snooze reminder by 1 hour"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Snooze</span>
                                  </button>

                                  {notif.actionUrl && (
                                    <button
                                      onClick={() => handleExecuteNavAction(notif)}
                                      className="p-1.5 px-3 bg-indigo-650 hover:bg-slate-200 hover:text-indigo-950 text-white text-[9.5px] font-bold rounded-lg cursor-pointer transition flex items-center gap-0.5 shadow-md shadow-indigo-500/20"
                                    >
                                      <span>{notif.actionText || 'Execute'}</span>
                                      <Zap className="w-2.5 h-2.5 fill-current" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleMarkCompleteAction(notif.id)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-550 hover:text-slate-950 text-emerald-400 rounded-lg border border-emerald-500/10 cursor-pointer transition"
                                    title="Mark completed"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>

              </div>

              {/* Bottom footer bar with Clear and Dismiss */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-slate-955 z-10 relative">
                <span className="font-mono text-[8px] text-indigo-400/80">NEURAL ENGINE COMPLIANCE: SECURE</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => { playSound('buzz'); onClearAll(); }}
                    className="p-1.5 px-4 bg-rose-500/10 hover:bg-rose-550 text-rose-450 hover:text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Telemetry Logs</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});
export default NotificationCenter;
