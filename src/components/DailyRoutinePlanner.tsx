import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Routine, RoutineCategory, RoutineStatus, Habit, DailyReflection } from '../types';
import { 
  Clock, Calendar as CalendarIcon, Play, Pause, RotateCcw, Check, X, 
  Flame, Award, TrendingUp, BarChart2, Plus, Search, Filter, 
  Download, Sparkles, Bell, AlertCircle, Dumbbell, Code, Brain, 
  Layers, MessageSquare, BookOpen, Video, Sun, Moon, Droplet, 
  Coffee, Briefcase, ChevronLeft, ChevronRight, Copy, Trash2, Edit3,
  Star, Heart, Smile, Meh, Frown, Zap, FileSpreadsheet, CalendarCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area 
} from 'recharts';
import RoutineModal, { CATEGORY_OPTIONS } from './RoutineModal';
import { 
  formatTime12h, formatDuration, calculateDurationMinutes, 
  calculateProductivityScore, calculateRoutineStreak, 
  exportRoutinesToICS, exportRoutinesToCSV 
} from '../utils/routineUtils';

type PlannerSubTab = 'dashboard' | 'timeline' | 'calendar' | 'routines' | 'analytics' | 'reflection';

export default function DailyRoutinePlanner() {
  const {
    routines,
    routineHistories,
    habits,
    habitLogs,
    dailyReflections,
    routineGamification,
    handleAddRoutine,
    handleUpdateRoutine,
    handleDeleteRoutine,
    handleDuplicateRoutine,
    handleActionRoutine,
    handleAddHabit,
    handleToggleHabit,
    handleDeleteHabit,
    handleSaveReflection
  } = useDatabase();

  const [activeSubTab, setActiveSubTab] = useState<PlannerSubTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Calendar View State
  const [calendarMode, setCalendarMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [calendarDate, setCalendarDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Live Timer State for Active Routine
  const [activeTimerRoutineId, setActiveTimerRoutineId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Habit Modal State
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('General');

  // Reflection Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const existingReflectionToday = useMemo(() => {
    return dailyReflections.find(r => r.date === todayStr);
  }, [dailyReflections, todayStr]);

  const [reflAchievement, setReflAchievement] = useState('');
  const [reflDistraction, setReflDistraction] = useState('');
  const [reflMood, setReflMood] = useState<'great' | 'good' | 'okay' | 'tired' | 'stressed'>('good');
  const [reflEnergy, setReflEnergy] = useState<number>(4);
  const [reflTomorrow, setReflTomorrow] = useState('');

  useEffect(() => {
    if (existingReflectionToday) {
      setReflAchievement(existingReflectionToday.biggestAchievement || '');
      setReflDistraction(existingReflectionToday.biggestDistraction || '');
      setReflMood(existingReflectionToday.mood || 'good');
      setReflEnergy(existingReflectionToday.energyLevel || 4);
      setReflTomorrow(existingReflectionToday.tomorrowGoal || '');
    }
  }, [existingReflectionToday]);

  // Live Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeTimerRoutineId) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerRoutineId]);

  // Active & Next Routine calculations
  const currentTimeMins = useMemo(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }, []);

  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number);
      const [bh, bm] = b.startTime.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
  }, [routines]);

  const currentRoutine = useMemo(() => {
    if (activeTimerRoutineId) {
      return routines.find(r => r.id === activeTimerRoutineId) || null;
    }
    return sortedRoutines.find(r => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      const sMins = sh * 60 + sm;
      const eMins = eh * 60 + em;
      return currentTimeMins >= sMins && currentTimeMins <= eMins;
    }) || sortedRoutines[0] || null;
  }, [sortedRoutines, currentTimeMins, activeTimerRoutineId, routines]);

  const nextRoutine = useMemo(() => {
    if (!currentRoutine) return sortedRoutines[0] || null;
    const currIndex = sortedRoutines.findIndex(r => r.id === currentRoutine.id);
    return sortedRoutines[currIndex + 1] || sortedRoutines[0] || null;
  }, [sortedRoutines, currentRoutine]);

  // Today's stats calculation
  const historiesToday = useMemo(() => {
    return routineHistories.filter(h => h.date === todayStr);
  }, [routineHistories, todayStr]);

  const habitsTodayCompletedCount = useMemo(() => {
    return habitLogs.filter(hl => hl.date === todayStr && hl.completed).length;
  }, [habitLogs, todayStr]);

  const productivityScore = useMemo(() => {
    return calculateProductivityScore(
      routines,
      historiesToday,
      habitsTodayCompletedCount,
      habits.length
    );
  }, [routines, historiesToday, habitsTodayCompletedCount, habits.length]);

  const totalStudyMinutesToday = useMemo(() => {
    return historiesToday
      .filter(h => h.completed)
      .reduce((acc, curr) => acc + (curr.focusDuration || 0), 0);
  }, [historiesToday]);

  const streakStats = useMemo(() => {
    return calculateRoutineStreak(routineHistories, habitLogs);
  }, [routineHistories, habitLogs]);

  // Filtered master routines
  const filteredRoutines = useMemo(() => {
    return routines.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
      const matchesPriority = selectedPriority === 'All' || r.priority === selectedPriority;
      return matchesSearch && matchesCat && matchesStatus && matchesPriority;
    });
  }, [routines, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  // Export actions
  const handleExportICS = () => {
    const icsData = exportRoutinesToICS(routines);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prepflow_routines_${todayStr}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvData = exportRoutinesToCSV(routines);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prepflow_routines_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Timer controls
  const handleStartTimer = (routine: Routine) => {
    setActiveTimerRoutineId(routine.id);
    setIsTimerRunning(true);
    handleActionRoutine(routine.id, 'start');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
  };

  const handleCompleteTimer = async (routine: Routine) => {
    setIsTimerRunning(false);
    setActiveTimerRoutineId(null);
    setTimerSeconds(0);
    await handleActionRoutine(routine.id, 'complete');
  };

  // Habit creation
  const handleCreateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    await handleAddHabit({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      icon: 'Check',
      color: '#10B981',
      targetFrequency: 'Daily'
    });
    setNewHabitTitle('');
    setIsHabitModalOpen(false);
  };

  // Reflection save
  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const completedTasksList = historiesToday
      .filter(h => h.completed)
      .map(h => h.routineTitle);

    await handleSaveReflection({
      date: todayStr,
      completedTasks: completedTasksList,
      biggestAchievement: reflAchievement,
      biggestDistraction: reflDistraction,
      mood: reflMood,
      energyLevel: reflEnergy,
      tomorrowGoal: reflTomorrow
    });
  };

  // Analytics Chart Datasets
  const studyHoursChartData = useMemo(() => {
    // Generate past 7 days study hours
    const days: { date: string; dayName: string; hours: number; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayHistories = routineHistories.filter(h => h.date === dStr && h.completed);
      const dayMinutes = dayHistories.reduce((acc, c) => acc + (c.focusDuration || 0), 0);
      const hrs = Number((dayMinutes / 60).toFixed(1));
      
      days.push({
        date: dStr,
        dayName,
        hours: hrs,
        score: Math.min(100, Math.round(hrs * 20 + 20))
      });
    }
    return days;
  }, [routineHistories]);

  const completionStatusData = useMemo(() => {
    const completed = historiesToday.filter(h => h.completed).length;
    const skipped = historiesToday.filter(h => h.skipped).length;
    const upcoming = Math.max(0, routines.length - completed - skipped);
    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Upcoming', value: upcoming, color: '#3B82F6' },
      { name: 'Skipped', value: skipped, color: '#F59E0B' }
    ];
  }, [historiesToday, routines]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Daily Routine Planner
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PrepFlow Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Time-based routines, reminders, streak tracking & productivity analytics for interview prep
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              setEditingRoutine(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Routine</span>
          </button>

          <button
            onClick={handleExportICS}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title="Export to Google Calendar / Outlook (.ics)"
          >
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
            <span>Export iCal</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title="Export to CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main SubTab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: Sparkles },
          { id: 'timeline', label: 'Daily Timeline', icon: Clock },
          { id: 'calendar', label: 'Calendar View', icon: CalendarIcon },
          { id: 'routines', label: 'Routines & Habits', icon: Layers },
          { id: 'analytics', label: 'Analytics & Insights', icon: BarChart2 },
          { id: 'reflection', label: 'Daily Reflection', icon: Star }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as PlannerSubTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: DASHBOARD OVERVIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Study Hours Today */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Today's Study Hours</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatDuration(totalStudyMinutesToday)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Focus Time Logged Today</p>
            </div>

            {/* Today's Productivity Score */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Productivity Score</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
                <span>{productivityScore}</span>
                <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Based on routines & habits</p>
            </div>

            {/* Streak & Consistency */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Current Streak</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                <span>{streakStats.currentStreak} Days</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Longest: {streakStats.longestStreak} Days</p>
            </div>

            {/* Gamification Level & XP */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Level {routineGamification.level}</span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {routineGamification.xp} XP
              </div>
              <p className="text-[11px] text-slate-400 mt-1">🪙 {routineGamification.coins} Coins Earned</p>
            </div>
          </div>

          {/* Current Routine Live Focus Timer & Next Routine Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Current Routine Live Card */}
            <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Current Routine Session</span>
                </div>
                {currentRoutine && (
                  <span 
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow"
                    style={{ backgroundColor: currentRoutine.color }}
                  >
                    {currentRoutine.category}
                  </span>
                )}
              </div>

              {currentRoutine ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentRoutine.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{currentRoutine.description}</p>
                  </div>

                  <div className="flex items-center gap-6 p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Scheduled Time</span>
                      <div className="text-sm font-semibold text-slate-200">
                        {formatTime12h(currentRoutine.startTime)} - {formatTime12h(currentRoutine.endTime)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Target Duration</span>
                      <div className="text-sm font-semibold text-slate-200">
                        {formatDuration(currentRoutine.duration)}
                      </div>
                    </div>
                  </div>

                  {/* Active Timer Display */}
                  {activeTimerRoutineId === currentRoutine.id && (
                    <div className="flex items-center justify-between p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
                      <div>
                        <span className="text-xs text-indigo-300">Elapsed Focus Time</span>
                        <div className="text-3xl font-extrabold text-indigo-400 font-mono">
                          {Math.floor(timerSeconds / 3600).toString().padStart(2, '0')}:
                          {Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0')}:
                          {(timerSeconds % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Controls */}
                  <div className="flex items-center gap-3 pt-2">
                    {activeTimerRoutineId !== currentRoutine.id ? (
                      <button
                        onClick={() => handleStartTimer(currentRoutine)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Focus Timer</span>
                      </button>
                    ) : isTimerRunning ? (
                      <button
                        onClick={handlePauseTimer}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause Timer</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeTimer}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume Timer</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCompleteTimer(currentRoutine)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Complete (+20 XP)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No active routine scheduled right now.
                </div>
              )}
            </div>

            {/* Next Routine & Upcoming Reminders Column */}
            <div className="space-y-4">
              {/* Next Routine Card */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Up Next Today</span>
                </div>
                {nextRoutine ? (
                  <div>
                    <h4 className="text-base font-bold text-white">{nextRoutine.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime12h(nextRoutine.startTime)} - {formatTime12h(nextRoutine.endTime)} ({nextRoutine.category})
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No further routines for today.</p>
                )}
              </div>

              {/* Habit Quick Checklist */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Daily Habits</span>
                  <button
                    onClick={() => setIsHabitModalOpen(true)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    + Add Habit
                  </button>
                </div>
                <div className="space-y-2">
                  {habits.map(h => {
                    const isDone = habitLogs.some(hl => hl.habitId === h.id && hl.date === todayStr && hl.completed);
                    return (
                      <div
                        key={h.id}
                        onClick={() => handleToggleHabit(h.id, todayStr)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isDone 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through' 
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isDone ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{h.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">+10 XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: DAILY TIMELINE VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'timeline' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Daily Timeline</h3>
              <p className="text-xs text-slate-400">Google Calendar style vertical schedule view</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Current Time Indicator
            </div>
          </div>

          {/* Timeline Grid (05:00 to 23:00) */}
          <div className="relative border-l border-slate-800 ml-12 my-4 space-y-6 pl-6">
            {Array.from({ length: 19 }, (_, i) => i + 5).map(hour => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              const routinesAtHour = routines.filter(r => {
                const [h] = r.startTime.split(':').map(Number);
                return h === hour;
              });

              return (
                <div key={hour} className="relative group">
                  {/* Hour label */}
                  <div className="absolute -left-16 top-0 text-xs font-semibold text-slate-500">
                    {formatTime12h(hourStr)}
                  </div>

                  {/* Routines rendered at this hour */}
                  {routinesAtHour.length > 0 ? (
                    <div className="space-y-3">
                      {routinesAtHour.map(r => (
                        <div
                          key={r.id}
                          className="p-4 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:border-indigo-500 transition shadow-lg flex items-start justify-between"
                          style={{ borderLeftColor: r.color, borderLeftWidth: '6px' }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{r.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                                {r.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{r.description}</p>
                            <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                              <span>⏰ {formatTime12h(r.startTime)} - {formatTime12h(r.endTime)}</span>
                              <span>⏳ {formatDuration(r.duration)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleActionRoutine(r.id, 'complete')}
                              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold transition"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => {
                                setEditingRoutine(r);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-6 border-b border-dashed border-slate-800/60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: CALENDAR VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'calendar' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Calendar Planner</h3>
              <p className="text-xs text-slate-400">View daily, weekly, and monthly routine schedules</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
              {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setCalendarMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                    calendarMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly 7-Day Grid View */}
          {calendarMode === 'weekly' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 min-h-[300px]">
                  <div className="text-xs font-bold text-center text-indigo-400 border-b border-slate-800 pb-2">
                    {day}
                  </div>
                  <div className="space-y-2">
                    {routines.map(r => (
                      <div
                        key={r.id}
                        className="p-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60"
                        style={{ borderLeft: `3px solid ${r.color}` }}
                      >
                        <span className="font-semibold text-slate-200 block truncate">{r.title}</span>
                        <span className="text-[10px] text-slate-400">{r.startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {calendarMode !== 'weekly' && (
            <div className="text-center py-12 text-slate-400 text-sm">
              Displaying {calendarMode} schedule for active routines.
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 4: ROUTINES & HABITS MANAGER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'routines' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Search & Filter Bar */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search routines or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="All">All Categories</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Master Routines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutines.map(r => (
              <div
                key={r.id}
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white inline-block mb-1.5"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.category}
                    </span>
                    <h4 className="text-base font-bold text-white">{r.title}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicateRoutine(r.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoutine(r);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoutine(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{r.description || 'No description provided.'}</p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>⏰ {formatTime12h(r.startTime)} - {formatTime12h(r.endTime)}</span>
                  <span>🔄 {r.repeatType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 5: ANALYTICS & INSIGHTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Study Hours Bar Chart */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Daily Study Hours (Past 7 Days)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyHoursChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Routine Completion Donut Chart */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Today's Routine Status Breakdown</h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {completionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 6: DAILY REFLECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'reflection' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-white">End of Day Reflection</h3>
            <p className="text-xs text-slate-400">Reflect on today's learning achievements and distractions</p>
          </div>

          <form onSubmit={handleReflectionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                🏆 Biggest Achievement Today
              </label>
              <textarea
                rows={2}
                placeholder="What went well today? What concept or question did you master?"
                value={reflAchievement}
                onChange={(e) => setReflAchievement(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ⚠️ Biggest Distraction
              </label>
              <input
                type="text"
                placeholder="e.g. Phone notifications, unplanned meetings..."
                value={reflDistraction}
                onChange={(e) => setReflDistraction(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mood Rating
                </label>
                <select
                  value={reflMood}
                  onChange={(e) => setReflMood(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="great">😄 Great</option>
                  <option value="good">🙂 Good</option>
                  <option value="okay">😐 Okay</option>
                  <option value="tired">🥱 Tired</option>
                  <option value="stressed">😫 Stressed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Energy Level (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={reflEnergy}
                  onChange={(e) => setReflEnergy(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                🎯 Tomorrow's Goal
              </label>
              <input
                type="text"
                placeholder="Main focus for tomorrow..."
                value={reflTomorrow}
                onChange={(e) => setReflTomorrow(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Reflection (+50 XP)</span>
            </button>
          </form>
        </div>
      )}

      {/* Routine Creation/Edit Modal */}
      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={async (data) => {
          if (editingRoutine) {
            await handleUpdateRoutine({ ...editingRoutine, ...data });
          } else {
            await handleAddRoutine(data);
          }
        }}
        existingRoutines={routines}
        initialRoutine={editingRoutine}
      />

      {/* Habit Create Modal */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add New Habit</h3>
            <form onSubmit={handleCreateHabitSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. Drink 3L Water, Exercise 30m"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHabitModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
