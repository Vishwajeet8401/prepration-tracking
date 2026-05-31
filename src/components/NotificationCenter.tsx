/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AppNotification, Topic, Question, Interview, JobApplication, StudySession, DailyTask, Journal, MockInterview } from '../types';
import { 
  Bell, Check, Trash2, Calendar, AlertTriangle, Book, Clock, Star, Info,
  Settings, Award, Flame, Brain, Shield, Coffee, ChevronRight, CheckCircle2,
  X, Moon, CalendarDays, Compass, Activity, Play, Zap, ArrowRight, Sparkles, Sliders,
  HelpCircle, LineChart, PieChart, TrendingUp, RefreshCw, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  // Optional integrated prep metadata to dynamically feed the smart reminders generator
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
}

export default function NotificationCenter({
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
  pushNotification
}: NotificationCenterProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');

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
    return notifications.map(notif => {
      // Determine priority level if missing (based on categories/deadlines)
      let priority: 'high' | 'medium' | 'low' = notif.priority || 'medium';
      let timingSlot: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';

      if (notif.title.toLowerCase().includes('tomorrow') || notif.title.toLowerCase().includes('streak expiring') || notif.type === 'revision') {
        priority = 'high';
      } else if (notif.type === 'journal' || notif.type === 'weakness') {
        priority = notif.type === 'weakness' ? 'medium' : 'low';
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
  }, [notifications]);

  // Filtered lists for Today, Upcoming, Overdue, and Completed Tabs
  const filteredNotifications = useMemo(() => {
    const list = enrichedNotifications;
    const now = new Date();

    return {
      today: list.filter(n => n.status === 'active' || n.status === 'snoozed'),
      upcoming: list.filter(n => n.status === 'active' && new Date(n.date) > now),
      overdue: list.filter(n => n.status === 'active' && new Date(n.date) < new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      completed: list.filter(n => n.status === 'completed' || n.read === true)
    };
  }, [enrichedNotifications]);

  const activeFilteredList = useMemo(() => {
    return filteredNotifications[activeSubTab];
  }, [filteredNotifications, activeSubTab]);

  // Trigger high audit generation using real-time components parameters
  const generateSmartCoachReminders = async () => {
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
      actionUrl: "Activity Planner"
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
        actionUrl: "Analytics & Sessions"
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
      actionUrl: "Question Bank & Practice"
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
      actionUrl: "Topic Map & Spacing"
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
          actionUrl: "Interviews & Applications"
        });
      } else if (daysDiff > 1 && daysDiff <= 5) {
        await pushNotification({
          title: `Technical Interview in ${daysDiff} Days`,
          message: `Recommended study priority: Java 8, Collections frameworks, and Spring Boot patterns.`,
          type: 'interview',
          priority: 'high',
          status: 'active',
          actionText: "Review Materials",
          actionUrl: "Interviews & Applications"
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
        actionUrl: "Interviews & Applications"
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
        actionUrl: "Mock Interview Simulator"
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
      actionUrl: "Dashboard & Priorities"
    });

    // H. Journal summary alert
    await pushNotification({
      title: "Pending Learning Journal Reflection",
      message: "No daily learning review recorded for today. Write a quick 3-sentence evaluation for high retention.",
      type: 'journal',
      priority: 'low',
      status: 'active',
      actionText: "Write Quick Reflection",
      actionUrl: "Personal Journal"
    });

    // Increment Analytics Sent Count
    setAnalytics(prev => ({
      ...prev,
      sent: prev.sent + 8
    }));
  };

  const handleSnooze = (id: string, hours: number = 1) => {
    // Simulated notification snooze
    onMarkRead(id); // marks read to remove from standard active, but we handle status locally on client
    setAnalytics(prev => ({
      ...prev,
      snoozed: prev.snoozed + 1,
      ignored: prev.ignored + 1
    }));
  };

  const handleMarkCompleteAction = (id: string) => {
    onMarkRead(id);
    setAnalytics(prev => ({
      ...prev,
      completed: prev.completed + 1,
      studySuccess: Math.min(100, Math.floor(prev.studySuccess + 1.2)),
      activitySuccess: Math.min(100, Math.floor(prev.activitySuccess + 0.8))
    }));
  };

  const handleExecuteNavAction = (notif: any) => {
    setIsExpanded(false);
    if (notif.actionUrl && setActiveTab) {
      setActiveTab(notif.actionUrl);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Persistent Compact Sidebar Card layout */}
      <div className="glass-card p-5 space-y-4 relative overflow-hidden rounded-2xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-300">
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-teal-500 via-indigo-500 to-rose-500" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/15 rounded-lg text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-550 text-white font-mono text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white font-display">Active Coach Alerts</h4>
              <span className="text-[9px] text-slate-450 font-mono block">
                {unreadCount > 0 ? `${unreadCount} recommendations pending` : 'Syllabus healthy & calibrated'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-650 text-[10px] font-mono text-indigo-300 hover:text-white rounded-lg border border-indigo-500/15 cursor-pointer transition"
          >
            Management Dashboard
          </button>
        </div>

        {/* Mini Preview of the most critical message */}
        {unreadCount > 0 ? (
          <div className="bg-white/3 border border-indigo-500/5 p-3 rounded-xl space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/10">
                Coaching Priority Alert
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                Just now
              </span>
            </div>
            <h5 className="text-[11px] font-black text-slate-250 truncate">
              {enrichedNotifications.find(n => !n.read)?.title || "Revision Task Alert"}
            </h5>
            <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
              {enrichedNotifications.find(n => !n.read)?.message}
            </p>
            <div className="pt-1 flex justify-end">
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                <span>Snooze or Execute</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 text-center bg-white/2 border border-dashed border-white/5 rounded-xl text-slate-500 text-[10px] font-sans">
            No pending alarms. Launch the Coaching system below to evaluate reminders.
          </div>
        )}

        <button
          onClick={generateSmartCoachReminders}
          className="w-full py-2 bg-gradient-to-r from-indigo-600/25 to-indigo-550/15 hover:from-indigo-650 hover:to-indigo-550 border border-indigo-500/20 text-indigo-300 hover:text-white text-[10px] font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Trigger Coaching Check</span>
        </button>
      </div>

      {/* 2. Immersive Reminders & Coaching Space (Vercel-style Dashboard Slide-Over Overlay) */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex justify-end">
            
            {/* Modal Drawer Shell Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto flex flex-col justify-between"
            >
              
              {/* Header Box */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-920">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                    <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-display">PrepMaster Smart Reminder Space</h2>
                    <p className="text-xs text-slate-400">Advanced coaching analytics, scheduler settings, and target priorities</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={generateSmartCoachReminders}
                    className="p-1 px-3 bg-indigo-600 text-white hover:bg-indigo-550 text-[10.5px] rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
                    title="Generate intelligent notifications matching your preparation metrics"
                  >
                    <RefreshCw className="w-3 h-3 text-white" />
                    <span>Coach Check</span>
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Body Grid - Continues Below */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                
                {/* A. Live Analytics & Progress Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-450 block uppercase tracking-wider font-bold">Reminders Logged</span>
                    <span className="text-2xl font-extrabold font-mono text-white block mt-1">{analytics.sent}</span>
                    <span className="text-[9px] text-teal-400 font-sans block mt-0.5">🚀 Multi-channel push-ready</span>
                  </div>

                  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl text-left">
                    <span className="text-[9px] font-mono text-slate-450 block uppercase tracking-wider font-bold">Resolved Actions</span>
                    <span className="text-2xl font-extrabold font-mono text-emerald-400 block mt-1">{analytics.completed}</span>
                    <span className="text-[9px] text-slate-400 font-sans block mt-0.5">Completion count</span>
                  </div>

                  {/* Circle Metrics - Study Success */}
                  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-indigo-400" strokeDasharray={`${analytics.studySuccess}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-indigo-300">
                        {analytics.studySuccess}%
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-slate-450 block uppercase font-bold leading-tight">Study Reminder</span>
                      <span className="text-[10px] text-slate-300 font-sans font-bold">Success rate</span>
                    </div>
                  </div>

                  {/* Circle Metrics - Activity Success */}
                  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-teal-400" strokeDasharray={`${analytics.activitySuccess}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-teal-300">
                        {analytics.activitySuccess}%
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono text-slate-450 block uppercase font-bold leading-tight">Activity Reminder</span>
                      <span className="text-[10px] text-slate-300 font-sans font-bold">Success rate</span>
                    </div>
                  </div>

                </div>

                {/* B. Personal Time Settings Configuration Tab */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-5 text-left space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white font-display">Personal Reminders & Timing Configurations</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 uppercase mb-1 font-extrabold">Morning Time</label>
                      <input 
                        type="text" 
                        value={morningTime} 
                        onChange={(e) => setMorningTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2 text-xs text-slate-305 rounded-xl text-center outline-none focus:border-indigo-500 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 uppercase mb-1 font-extrabold">Afternoon Time</label>
                      <input 
                        type="text" 
                        value={afternoonTime} 
                        onChange={(e) => setAfternoonTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2 text-xs text-slate-305 rounded-xl text-center outline-none focus:border-indigo-500 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 uppercase mb-1 font-extrabold">Evening Time</label>
                      <input 
                        type="text" 
                        value={eveningTime} 
                        onChange={(e) => setEveningTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2 text-xs text-slate-305 rounded-xl text-center outline-none focus:border-indigo-500 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-slate-450 uppercase mb-1 font-extrabold">Night Time</label>
                      <input 
                        type="text" 
                        value={nightTime} 
                        onChange={(e) => setNightTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2 text-xs text-slate-305 rounded-xl text-center outline-none focus:border-indigo-500 font-mono" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-white/5">
                    <div className="flex-1 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <div className="text-left">
                        <span className="text-[11px] font-bold text-slate-200 block">Weekend Optimization Mode</span>
                        <span className="text-[9px] text-slate-450 font-sans block">Alters reminders frequency across Saturdays & Sundays</span>
                      </div>
                      <button 
                        onClick={() => setWeekendMode(!weekendMode)}
                        className={`text-[9.5px] px-3 py-1 font-bold rounded-lg ${weekendMode ? 'bg-indigo-650 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {weekendMode ? 'ACTIVE' : 'DORMANT'}
                      </button>
                    </div>

                    <div className="flex-1 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <div className="text-left">
                        <span className="text-[11px] font-bold text-slate-200 block flex items-center gap-1">
                          <Moon className="w-3 h-3 text-amber-400" />
                          <span>Do Not Disturb (DND)</span>
                        </span>
                        <span className="text-[9px] text-slate-450 font-sans block">Mutes all non-critical notifications</span>
                      </div>
                      <button 
                        onClick={() => setDndMode(!dndMode)}
                        className={`text-[9.5px] px-3 py-1 font-bold rounded-lg ${dndMode ? 'bg-rose-650 text-white' : 'bg-slate-800 text-slate-400'}`}
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
                          onClick={() => setActiveSubTab(tab)}
                          className={`pb-2.5 px-4 text-xs font-bold font-sans transition border-b-2 capitalize select-none cursor-pointer relative ${
                            activeSubTab === tab 
                              ? 'border-indigo-500 text-white font-extrabold' 
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{tab}</span>
                          {filteredNotifications[tab].length > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono leading-none ${
                              tab === 'today' ? 'bg-indigo-500/10 text-indigo-300' :
                              tab === 'overdue' ? 'bg-red-500/10 text-red-400 animate-pulse' :
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
                      <div className="py-12 border border-dashed border-white/5 rounded-2xl bg-white/2 text-center text-slate-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Compass className="w-8 h-8 text-slate-650 mx-auto animate-spin" style={{ animationDuration: '8s' }} />
                          <h4 className="text-xs font-bold text-slate-350">Alert Grid Clean</h4>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            All targets resolved for this filter! Run the "Coach Check" button at the top to re-evaluate potential priorities based on active syllabus data.
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
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden ${
                              notif.status === 'completed' 
                                ? 'bg-emerald-500/3 border-emerald-500/10 opacity-70' 
                                : isHigh 
                                ? 'bg-rose-500/4 border-rose-500/15 shadow-sm shadow-rose-500/2' 
                                : 'bg-white/4 border-white/5 hover:bg-white/5'
                            }`}
                          >
                            
                            {/* Accent indicator ribbon */}
                            <div className={`absolute left-0 inset-y-0 w-[3px] ${
                              notif.status === 'completed' ? 'bg-emerald-500' :
                              isHigh ? 'bg-rose-500 animate-pulse' :
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
                                  <span className={`text-xs font-black font-display text-slate-100`}>
                                    {notif.title}
                                  </span>
                                  
                                  {/* Priority indicator tag */}
                                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    notif.status === 'completed' ? 'bg-emerald-555/10 text-emerald-405' :
                                    isHigh ? 'bg-rose-600/10 text-rose-400 ring-1 ring-rose-500/10' :
                                    isMedium ? 'bg-amber-600/10 text-amber-400' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {notif.status === 'completed' ? 'Cleared' : notif.priority}
                                  </span>

                                  {/* Timing slot tag */}
                                  <span className="text-[8px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                    ⏱ Computed {notif.timingSlot || 'morning'} slot
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-300 leading-normal font-sans pr-2">
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
                                    className="p-1 px-2 bg-slate-800 hover:bg-slate-750 border border-white/5 text-[9.5px] font-mono text-slate-300 rounded-lg cursor-pointer flex items-center gap-0.5 transition"
                                    title="Snooze reminder by 1 hour"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Snooze 1h</span>
                                  </button>

                                  {notif.actionUrl && (
                                    <button
                                      onClick={() => handleExecuteNavAction(notif)}
                                      className="p-1.5 px-3 bg-indigo-650 hover:bg-slate-200 hover:text-indigo-950 text-white text-[9.5px] font-bold rounded-lg cursor-pointer transition flex items-center gap-0.5"
                                    >
                                      <span>{notif.actionText || 'Navigate'}</span>
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
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-slate-920">
                <span className="font-mono text-[9px]">UTC Anchor synchronized: 2026-05-31</span>
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="p-1.5 px-4 bg-rose-500/10 hover:bg-rose-550 text-rose-400 hover:text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border border-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Alert Database</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
