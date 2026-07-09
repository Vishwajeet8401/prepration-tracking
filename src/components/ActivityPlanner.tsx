import React, { useState, useMemo } from 'react';
import { ActivityPlan, DailyTask, ActivityLog, ActivityCategory } from '../types';
import { 
  Plus, Calendar as CalendarIcon, Check, X, Flame, BarChart2, ListTodo, 
  Trash2, Info, ChevronLeft, ChevronRight, TrendingUp, Clock, HelpCircle
} from 'lucide-react';
import { useScrollGesture } from '../hooks/useScrollGesture';

const PLANNER_SUBTABS: Array<'today' | 'plans' | 'calendar' | 'reports'> = ['today', 'plans', 'calendar', 'reports'];


interface ActivityPlannerProps {
  plans: ActivityPlan[];
  tasks: DailyTask[];
  onAddPlan: (plan: Omit<ActivityPlan, 'id' | 'userId'>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onUpdateTask: (task: DailyTask, actualHours?: number, notes?: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const CATEGORIES: ActivityCategory[] = [
  'Technical', 'Communication', 'Interview Preparation', 'DSA', 
  'Reading', 'Writing', 'Speaking', 'Listening', 'Fitness', 'Custom'
];

const ActivityPlanner = React.memo(function ActivityPlanner({
  plans,
  tasks,
  onAddPlan,
  onDeletePlan,
  onUpdateTask,
  onDeleteTask
}: ActivityPlannerProps) {
  // Tabs: 'today' | 'plans' | 'calendar' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'plans' | 'calendar' | 'reports'>('today');

  // ── Gesture scroll + subtab switching ──
  useScrollGesture({
    activeTab: 'Task & Study Planner',
    onSwipeLeft: () => {
      const idx = PLANNER_SUBTABS.indexOf(activeSubTab);
      if (idx < PLANNER_SUBTABS.length - 1) { setActiveSubTab(PLANNER_SUBTABS[idx + 1]); }
    },
    onSwipeRight: () => {
      const idx = PLANNER_SUBTABS.indexOf(activeSubTab);
      if (idx > 0) { setActiveSubTab(PLANNER_SUBTABS[idx - 1]); }
    },
  });


  // Form State
  const [title, setTitle] = useState('');
  const [targetHours, setTargetHours] = useState('2');
  const [category, setCategory] = useState<ActivityCategory>('Technical');
  const [repeatType, setRepeatType] = useState<'Daily' | 'Weekly' | 'Custom'>('Daily');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 3); // 3-month window default
    return end.toISOString().split('T')[0];
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar State
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Complete / Skip modal or quick dialog form state
  const [loggingTaskId, setLoggingTaskId] = useState<string | null>(null);
  const [actualHoursInput, setActualHoursInput] = useState('2');
  const [notesInput, setNotesInput] = useState('');

  // 1. STREAK CALCULATIONS (Feature 6)
  const stats = useMemo(() => {
    // Group tasks by date
    const tasksByDate: { [dateStr: string]: DailyTask[] } = {};
    tasks.forEach(t => {
      if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
      tasksByDate[t.date].push(t);
    });

    // Sort all dates
    const dates = Object.keys(tasksByDate).sort();
    
    // Streaks calculations
    // An overall day is considered 'active' if there's at least one task and none are pending or skipped, or if overall completion rate is >= 50%
    // Let's count back consecutive active days from today or yesterday
    let overallStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Simple robust calendar streak scanner
    let checkDate = new Date();
    // If today has no completed tasks but yesterday was active, check from yesterday
    let startFromYesterday = false;
    const todayTasks = tasksByDate[todayStr] || [];
    const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
    if (todayCompleted === 0) {
      const yesterdayTasks = tasksByDate[yesterdayStr] || [];
      const yesterdayCompleted = yesterdayTasks.filter(t => t.status === 'Completed').length;
      if (yesterdayCompleted > 0) {
        startFromYesterday = true;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayTasks = tasksByDate[dateStr] || [];
      if (dayTasks.length > 0) {
        const completedCount = dayTasks.filter(t => t.status === 'Completed').length;
        const totalCount = dayTasks.length;
        // Overall consistency definition: if they completed at least 50% of today's tasks
        if (completedCount > 0 && completedCount / totalCount >= 0.5) {
          overallStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        // If there were active plans for this day but no tasks recorded, streak breaks
        const hasActivePlans = plans.some(p => dateStr >= p.startDate && dateStr <= p.endDate);
        if (hasActivePlans) {
          break;
        } else {
          // No plans were active, don't break the streak (buffer day), just skip backward
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    // Activity level streaks
    const activityStreaks: { [activityName: string]: number } = {};
    plans.forEach(plan => {
      let streak = 0;
      let scanDate = new Date();
      // Adjust start for current day checking
      const planTasksForToday = tasks.filter(t => t.planId === plan.id && t.date === todayStr);
      const todayState = planTasksForToday[0];
      if (!todayState || todayState.status !== 'Completed') {
        const planTasksForYest = tasks.filter(t => t.planId === plan.id && t.date === yesterdayStr);
        if (planTasksForYest[0]?.status === 'Completed') {
          scanDate.setDate(scanDate.getDate() - 1);
        }
      }

      for (let i = 0; i < 365; i++) {
        const dStr = scanDate.toISOString().split('T')[0];
        if (dStr < plan.startDate || dStr > plan.endDate) break;
        
        const matchingTask = tasks.find(t => t.planId === plan.id && t.date === dStr);
        if (matchingTask && matchingTask.status === 'Completed') {
          streak++;
          scanDate.setDate(scanDate.getDate() - 1);
        } else if (matchingTask && matchingTask.status === 'Skipped') {
          break;
        } else {
          // If the date is past and inside plan date bounds but no record, it's missed
          if (dStr < todayStr) {
            break;
          }
          scanDate.setDate(scanDate.getDate() - 1);
        }
      }
      activityStreaks[plan.title] = streak;
    });

    return {
      overallStreak,
      activityStreaks,
      tasksByDate
    };
  }, [plans, tasks]);

  // Today's Generation and Checklist filter
  const todayDateString = new Date().toISOString().split('T')[0];
  const todayTasksList = useMemo(() => {
    return tasks.filter(t => t.date === todayDateString);
  }, [tasks, todayDateString]);

  // Cumulative today score
  const todayPercentage = useMemo(() => {
    if (todayTasksList.length === 0) return 0;
    const completed = todayTasksList.filter(t => t.status === 'Completed').length;
    return Math.round((completed / todayTasksList.length) * 100);
  }, [todayTasksList]);

  // MONTHLY CONSISTENCY REPORT (Feature 7)
  const consistencyReport = useMemo(() => {
    // Current active month parameters
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const activityReport: { [planId: string]: { completed: number; total: number; percentage: number; name: string } } = {};
    
    // Initialize plans
    plans.forEach(p => {
      activityReport[p.id] = { completed: 0, total: 0, percentage: 0, name: p.title };
    });
    // Include elements for System tasks
    activityReport['system-recall'] = { completed: 0, total: 0, percentage: 0, name: 'Recall Session' };
    activityReport['system-revision'] = { completed: 0, total: 0, percentage: 0, name: 'Revision Queue' };

    let totalCompleted = 0;
    let totalScheduled = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dString = `${currentYear}-${monthStr}-${dayStr}`;

      plans.forEach(p => {
        if (dString >= p.startDate && dString <= p.endDate) {
          activityReport[p.id].total++;
          totalScheduled++;
          
          const matchingTask = tasks.find(t => t.planId === p.id && t.date === dString);
          if (matchingTask?.status === 'Completed') {
            activityReport[p.id].completed++;
            totalCompleted++;
          }
        }
      });

      // System Tasks
      const recallVal = tasks.find(t => t.planId === 'system-recall' && t.date === dString);
      if (recallVal) {
        activityReport['system-recall'].total++;
        totalScheduled++;
        if (recallVal.status === 'Completed') {
          activityReport['system-recall'].completed++;
          totalCompleted++;
        }
      }

      const revisionVal = tasks.find(t => t.planId === 'system-revision' && t.date === dString);
      if (revisionVal) {
        activityReport['system-revision'].total++;
        totalScheduled++;
        if (revisionVal.status === 'Completed') {
          activityReport['system-revision'].completed++;
          totalCompleted++;
        }
      }
    }

    // Map percentage
    const items = Object.entries(activityReport)
      .filter(([_, stats]) => stats.total > 0)
      .map(([id, stats]) => {
        const perc = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return {
          id,
          name: stats.name,
          completed: stats.completed,
          total: stats.total,
          percentage: perc
        };
      });

    const overallConsistency = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    return {
      items,
      overallConsistency
    };
  }, [plans, tasks, currentYear, currentMonth]);

  // MONTHLY PROGRESS FOR ANALYTICS (Feature 10)
  const analyticsByActivity = useMemo(() => {
    return plans.map(plan => {
      const planTasks = tasks.filter(t => t.planId === plan.id);
      
      const completedTasks = planTasks.filter(t => t.status === 'Completed');
      const missedTasks = planTasks.filter(t => t.status === 'Pending' && t.date < todayDateString);
      const skippedTasks = planTasks.filter(t => t.status === 'Skipped');
      
      const totalHours = completedTasks.reduce((sum, t) => sum + t.targetHours, 0);
      const totalCompleted = completedTasks.length;
      const totalScheduled = planTasks.length;
      const completionPercentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

      // Target calculations (Total days active * Daily target hours)
      const sDate = new Date(plan.startDate);
      const eDate = new Date(plan.endDate);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const hoursTargetTotal = diffDays * plan.targetHours;

      return {
        id: plan.id,
        title: plan.title,
        category: plan.category,
        totalHours,
        targetHoursTotal: hoursTargetTotal,
        completionPercentage,
        missedDaysCount: missedTasks.length + skippedTasks.length,
        streak: stats.activityStreaks[plan.title] || 0,
        repeatType: plan.repeatType,
        dateRange: `${plan.startDate} to ${plan.endDate}`
      };
    });
  }, [plans, tasks, stats.activityStreaks, todayDateString]);

  // Calendar render utilities
  const daysInMonthGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Previous Month Days (For padding)
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    
    const grid = [];
    
    // Add padded days from prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateString: `${currentMonth === 0 ? currentYear - 1 : currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`
      });
    }

    // Add actual month days
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      grid.push({
        day,
        isCurrentMonth: true,
        dateString: `${currentYear}-${monthStr}-${dayStr}`
      });
    }

    return grid;
  }, [currentYear, currentMonth]);

  // Day cell coloring algorithm:
  // "Green: All Tasks Completed, Yellow: Partially Completed, Red: All Tasks Missed"
  const getDayStatusColor = (dateStr: string) => {
    const dayTasks = stats.tasksByDate[dateStr] || [];
    const hasActivePlans = plans.some(p => dateStr >= p.startDate && dateStr <= p.endDate);

    if (dayTasks.length === 0) {
      if (hasActivePlans && dateStr < todayDateString) {
        return 'bg-rose-500/10 border-rose-500/20 text-rose-450'; // Red - all missed in past
      }
      return 'border-white/5 text-slate-500'; // Default gray
    }

    const completed = dayTasks.filter(t => t.status === 'Completed').length;
    const skipped = dayTasks.filter(t => t.status === 'Skipped').length;
    const total = dayTasks.length;

    if (completed === total && total > 0) {
      return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'; // Full complete
    } else if (completed > 0) {
      return 'bg-amber-500/15 border-amber-500/30 text-amber-305 font-medium'; // Partially complete
    } else if (skipped + completed === 0 && dateStr < todayDateString) {
      return 'bg-rose-500/15 border-rose-500/30 text-rose-400'; // Red
    } else {
      return 'bg-slate-800/60 border-slate-700/40 text-slate-400';
    }
  };

  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Handle Form Submission
  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim()) {
      setFormError('Please enter a descriptive activity name.');
      return;
    }

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      setFormError('Please input a valid target hour metric (positive number).');
      return;
    }

    if (!startDate || !endDate) {
      setFormError('Start Date and End Date range boundaries are required.');
      return;
    }

    if (startDate > endDate) {
      setFormError('Start boundary cannot settle after the selected end date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPlan({
        title: title.trim(),
        targetHours: hours,
        category,
        repeatType,
        startDate,
        endDate
      });
      setFormSuccess('Execution plan registered in the spacing database securely.');
      setTitle('');
      setTargetHours('2');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Launch quick log dialog
  const initiateLogTask = (task: DailyTask) => {
    setLoggingTaskId(task.id);
    setActualHoursInput(String(task.targetHours));
    setNotesInput('');
  };

  // Skip task quickly
  const handleSkipTask = async (task: DailyTask) => {
    try {
      await onUpdateTask({
        ...task,
        status: 'Skipped'
      });
    } catch (err) {
      alert('Updating task status failed.');
    }
  };

  // Complete task inside quick dialog
  const handleSubmitLogSession = async () => {
    if (!loggingTaskId) return;
    const task = tasks.find(t => t.id === loggingTaskId);
    if (!task) return;

    const hours = parseFloat(actualHoursInput);
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a valid numeric hours value.');
      return;
    }

    try {
      await onUpdateTask({
        ...task,
        status: 'Completed',
        completedAt: new Date().toISOString()
      }, hours, notesInput.trim());

      setLoggingTaskId(null);
    } catch (err) {
      alert('Logging task performance record failed.');
    }
  };

  // Months name array
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Milestone Badge Logic
  const milestoneTargets = [3, 7, 15, 30, 60, 90, 180, 365];
  const nextMilestone = milestoneTargets.find(m => m > stats.overallStreak) || 365;
  const prevMilestone = milestoneTargets.filter(m => m <= stats.overallStreak).pop() || 0;
  const percentToMilestone = Math.min(100, Math.max(0, Math.round(((stats.overallStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)));
  const badgeName = nextMilestone === 3 
    ? "Bronze Spark" 
    : nextMilestone === 7 
    ? "Silver Ignite" 
    : nextMilestone === 15 
    ? "Gold Flame" 
    : nextMilestone === 30 
    ? "30-Day Badge" 
    : nextMilestone === 60 
    ? "60-Day Champion" 
    : "Elite Titan";

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            Execution Planner & Habit Trackers
          </h2>
          <p className="text-xs text-slate-400">Strict technical practice, verbal skills, and overall preparation consistency controls.</p>
        </div>
        
        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-900Item bg-slate-900/50 p-1 rounded-xl border border-white/10 shrink-0 self-start md:self-auto">
          {[
            { id: 'today', label: "Today's Agenda" },
            { id: 'plans', label: 'Activity Plans' },
            { id: 'calendar', label: 'Calendar Grid' },
            { id: 'reports', label: 'Consistency Reports' }
          ].map(sb => (
            <button
              key={sb.id}
              onClick={() => setActiveSubTab(sb.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition ${
                activeSubTab === sb.id 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sb.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Overall Streaks & Score Overview Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overall Streak</span>
              <span className="text-2xl font-black text-[#f8fafc] font-mono flex items-baseline gap-1">
                {stats.overallStreak} <span className="text-xs font-normal text-slate-400">Days</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5 fill-current animate-bounce" />
            </div>
          </div>
          {/* Milestone Progress Indicator */}
          <div className="space-y-1 w-full pt-1 border-t border-white/5">
            <div className="flex items-center justify-between text-[9px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                Next: <strong className="text-orange-400 font-mono">{nextMilestone} Days</strong>
                <span className="text-slate-500">({badgeName})</span>
              </span>
              <span className="font-mono font-bold text-slate-300">{percentToMilestone}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5" title={`${percentToMilestone}% toward your next ${nextMilestone}-day milestone`}>
              <div 
                className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500" 
                style={{ width: `${percentToMilestone}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Progress</span>
            <span className="text-2xl font-black text-indigo-450 font-mono">
              {todayPercentage}%
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 animate-pulse">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card col-span-2 p-4 flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Execution Streak Feed</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {plans.slice(0, 3).map(p => (
                <span key={p.id} className="text-[10px] bg-slate-800 border border-white/5 px-2 py-0.5 rounded-full text-slate-350 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400 fill-current" />
                  {p.title}: <strong className="text-slate-100">{stats.activityStreaks[p.title] || 0}d</strong>
                </span>
              ))}
              {plans.length === 0 && (
                <span className="text-[10px] text-slate-400 italic">No plans running. Define custom habits below!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Body Viewports */}

      {/* A. TODAY'S AGENDA */}
      {activeSubTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-white text-base">Generation Feed: Today</h3>
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  {todayDateString}
                </span>
              </div>

              <div className="space-y-3">
                {todayTasksList.map(task => {
                  const isCompleted = task.status === 'Completed';
                  const isSkipped = task.status === 'Skipped';

                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isCompleted 
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80' 
                          : isSkipped
                          ? 'border-white/5 bg-slate-900/40 opacity-50'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : isSkipped ? 'bg-slate-500' : 'bg-indigo-400'}`} />
                          <h4 className={`font-bold text-sm leading-tight ${isCompleted ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {task.title}
                          </h4>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.2 bg-[#312e81]/30 text-indigo-300 rounded border border-indigo-500/10">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans">
                          Daily metric: <strong className="text-slate-300">{task.targetHours} Hours</strong>
                        </p>
                      </div>

                      {/* Control panel buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isCompleted && !isSkipped ? (
                          <>
                            <button
                              onClick={() => initiateLogTask(task)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/25 rounded-lg text-white font-semibold text-xs cursor-pointer flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleSkipTask(task)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-705 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 text-xs cursor-pointer flex items-center gap-1 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                              Skip
                            </button>
                          </>
                        ) : (
                          <div className="text-xs font-mono font-bold flex items-center gap-1 mr-2">
                            {isCompleted ? (
                              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 d-inline-block py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> ✓ Completed
                              </span>
                            ) : (
                              <span className="text-slate-450 bg-slate-800 border border-white/5 px-2 p-0.5 rounded-md">
                                ✗ Skipped
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* System clean reset trigger */}
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 px-1.5 text-slate-500 hover:text-rose-400 transition hover:bg-white/5 rounded-md"
                          title="Delete generated task node from today"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {todayTasksList.length === 0 && (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">No tasks generated for today yet.</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Go to "Activity Plans" tab and define some habits! PrepFlow will then auto-generate checklists here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Performance Log details dialog panel (Feature 10: Log with specific hours) */}
            {loggingTaskId && (
              <div className="glass-card p-5 border border-indigo-500/30 bg-[#1e1b4b]/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-sm">
                    Enter Task Performance Metrics
                  </h4>
                  <button onClick={() => setLoggingTaskId(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">Actual Spent Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                      value={actualHoursInput}
                      onChange={(e) => setActualHoursInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 block">Reflective Notes / Self-Remarks</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Completed speaking session with Mock AI. Focused on fluency."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setLoggingTaskId(null)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLogSession}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Accomplishment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick FAQ / Guide */}
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white pb-2 border-b border-white/10 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Planner Discipline Rules</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                PrepFlow features auto-generation filters for consistency auditing. 
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">&#8226;</span>
                  <span><strong>Recall & Revision</strong> items generated automatically connect to your actual forgetting curves.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">&#8226;</span>
                  <span><strong>Skips</strong> flag days where you consciously shifted focus. Skipped counts compile in your missed analytics.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">&#8226;</span>
                  <span><strong>Calendar</strong> tracks full completion (emerald), missing (gold/red) to keep streaks accurate.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* B. ACTIVITY PLANS LIST & CREATION */}
      {activeSubTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create Plan Form (Feature 1) */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-white pb-2 border-b border-white/10">Create Activity Plan</h3>
            
            <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-350 block font-semibold">Activity title</label>
                <input
                  type="text"
                  className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Java Coding Practice, Speaking Prep"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-350 block font-semibold">Daily Target (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="2"
                    value={targetHours}
                    onChange={(e) => setTargetHours(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-350 block font-semibold">Category</label>
                  <select
                    className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-350 block font-semibold">Repeat interval</label>
                <select
                  className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-slate-200 focus:outline-none focus:border-indigo-500"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as any)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-350 block font-semibold">Start date</label>
                  <input
                    type="date"
                    className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-350 block font-semibold">End date</label>
                  <input
                    type="date"
                    className="w-full text-xs p-3 rounded-xl border border-white/15 bg-slate-900/60 text-white focus:outline-none focus:border-indigo-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs text-center font-bold">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs text-center font-bold">
                  {formSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : (
                  <>
                    <Plus className="w-4 h-4" /> Save Spaced Plan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Plans List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white pb-2 border-b border-white/10">Active Spaced Plans</h3>
              
              <div className="space-y-3">
                {plans.map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/80 transition-all flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="font-bold text-slate-200 text-sm">{p.title}</h4>
                        <span className="text-[10px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-305 px-2 py-0.2 rounded font-semibold">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans">
                        Target Hours: <strong className="text-slate-350">{p.targetHours} Hours Daily</strong> | Repeat: <strong className="text-slate-350">{p.repeatType}</strong>
                      </p>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 pt-1">
                        <CalendarIcon className="w-3 h-3 text-slate-500" />
                        Duration: {p.startDate} to {p.endDate}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeletePlan(p.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/50 rounded-xl cursor-pointer transition"
                      title="Decommission this activity plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {plans.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs font-sans">
                    No habit tracker plans defined yet. Construct an execution rules template on the left!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. CALENDAR GRID VIEW */}
      {activeSubTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            <div className="glass-card p-5 space-y-4">
              
              {/* Month Selector Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-bold text-white text-base">
                  {MONTHS[currentMonth]} {currentYear}
                </span>

                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(y => y - 1);
                      } else {
                        setCurrentMonth(m => m - 1);
                      }
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(y => y + 1);
                      } else {
                        setCurrentMonth(m => m + 1);
                      }
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Cell Grid */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-350">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(dn => (
                  <div key={dn} className="py-1 uppercase text-[10px] font-bold text-slate-500 font-mono">{dn}</div>
                ))}

                {daysInMonthGrid.map((dt, idx) => {
                  const dayColorClasses = dt.isCurrentMonth 
                    ? getDayStatusColor(dt.dateString)
                    : 'text-slate-700 pointer-events-none opacity-25';

                  const isSelected = selectedDate === dt.dateString;

                  // Compute active task types for better tooltip & tiny indicators
                  const dayTasks = stats.tasksByDate[dt.dateString] || [];
                  const totalCount = dayTasks.length;
                  const completedCount = dayTasks.filter(t => t.status === 'Completed').length;
                  const skippedCount = dayTasks.filter(t => t.status === 'Skipped').length;
                  const pendingCount = dayTasks.filter(t => t.status === 'Pending').length;

                  let customTooltip = `${dt.dateString}`;
                  if (dt.isCurrentMonth) {
                    if (totalCount > 0) {
                      customTooltip += ` | ${completedCount}/${totalCount} Tasks Completed`;
                      if (skippedCount > 0) customTooltip += ` (${skippedCount} Skipped)`;
                      if (pendingCount > 0) customTooltip += ` (${pendingCount} Pending)`;
                      
                      if (completedCount === totalCount) {
                        customTooltip += ` 🎉 Perfect Day!`;
                      } else if (completedCount > 0) {
                        customTooltip += ` ◪ Partially Completed`;
                      } else if (skippedCount === totalCount) {
                        customTooltip += ` ↷ All Activities Skipped`;
                      }
                    } else {
                      const hasActivePlans = plans.some(p => dt.dateString >= p.startDate && dt.dateString <= p.endDate);
                      if (hasActivePlans && dt.dateString < todayDateString) {
                        customTooltip += ` 🛑 All tasks missed this day`;
                      } else if (hasActivePlans) {
                        customTooltip += ` 📅 Planned activities scheduled`;
                      } else {
                        customTooltip += ` | No activities defined`;
                      }
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => dt.isCurrentMonth && setSelectedDate(dt.dateString)}
                      title={customTooltip}
                      className={`h-11 rounded-lg border flex flex-col justify-between p-1 select-none transition-all cursor-pointer relative ${dayColorClasses} ${
                        isSelected 
                          ? 'ring-2 ring-indigo-505 border-indigo-405Scale' 
                          : 'hover:scale-103'
                      }`}
                      style={isSelected ? { borderWidth: '2px', borderColor: '#6366f1' } : {}}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="block text-left text-[10px] font-mono leading-none font-bold">{dt.day}</span>
                        
                        {/* Display Small Badges / Icons for Skipped or Partially Completed */}
                        {dt.isCurrentMonth && skippedCount > 0 && (
                          <span className="text-[7px] leading-none bg-slate-800/80 text-slate-300 px-1 py-0.5 rounded font-sans font-extrabold flex items-center gap-0.5 scale-90 border border-white/5 cursor-help" title={`${skippedCount} action items skipped on this date`}>
                            ↷ Skip
                          </span>
                        )}
                        {dt.isCurrentMonth && completedCount > 0 && completedCount < totalCount && (
                          <span className="text-[7px] leading-none bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-sans font-extrabold flex items-center gap-0.5 scale-90 border border-amber-500/25 cursor-help" title={`${completedCount} of ${totalCount} completed. Click to review.`}>
                            ◪ Part
                          </span>
                        )}
                      </div>

                      {/* Day summary micro bar or dot elements */}
                      <div className="w-full flex justify-center items-center gap-0.5">
                        {totalCount > 0 ? (
                          <div className="flex items-center gap-0.5 pb-0.5 overflow-hidden max-w-full">
                            {dayTasks.map((task, stepIdx) => {
                              let bgClass = "bg-slate-500";
                              if (task.status === "Completed") {
                                bgClass = "bg-emerald-400";
                              } else if (task.status === "Skipped") {
                                bgClass = "bg-slate-400";
                              } else if (dt.dateString < todayDateString) {
                                bgClass = "bg-rose-400"; // Missed
                              } else {
                                bgClass = "bg-indigo-400 animate-pulse";
                              }
                              return (
                                <span 
                                  key={task.id || stepIdx} 
                                  className={`w-1 h-1 rounded-full ${bgClass}`} 
                                  title={`${task.title}: ${task.status}`}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          // Traditional dot fallback if they have tasks but no layout matches
                          stats.tasksByDate[dt.dateString]?.length > 0 && (
                            <span className="w-1 h-1 rounded-full bg-current mx-auto block mb-0.5" />
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 block" /> Fully Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-amber-500/15 border border-amber-500/30 block" /> Partially Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-rose-500/15 border border-rose-500/30 block" /> All Tasks Missed
                </span>
              </div>
            </div>
          </div>

          {/* Date details details (Feature 4 Clicking a date shows details) */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-white pb-2 border-b border-white/10 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>Agenda Audit: {selectedDate}</span>
            </h3>

            <div className="space-y-3">
              {selectedDayTasks.map(t => (
                <div 
                  key={t.id} 
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    t.status === 'Completed' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-305' 
                      : t.status === 'Skipped'
                      ? 'bg-slate-800 border-slate-700/50 text-slate-450'
                      : 'bg-[#ff9800]/5 border-[#ff9800]/15 text-[#ff9800]'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-slate-205">{t.title}</span>
                    <span className="text-[10px] font-mono text-slate-450">Category: {t.category}</span>
                  </div>
                  <div className="font-mono text-[10.5px] font-bold">
                    {t.status === 'Completed' ? '✓ Completed' : t.status === 'Skipped' ? '✗ Skipped' : '☐ Pending'}
                  </div>
                </div>
              ))}

              {selectedDayTasks.length === 0 && (
                <div className="text-center py-10 text-slate-400 italic text-xs">
                  No tracking records found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* D. CONSISTENCY & ANALYTICS REPORT */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Monthly Overall Summary Card (Feature 7) */}
            <div className="glass-card p-5 space-y-3 col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Monthly Scorecard</h3>
                <span className="text-xs text-slate-400">{MONTHS[currentMonth]} {currentYear}</span>
              </div>
              <div className="py-5 text-center space-y-1">
                <span className="text-5xl font-black text-indigo-405 font-mono block">
                  {consistencyReport.overallConsistency}%
                </span>
                <span className="text-xs text-slate-400 font-medium">Overall Month Consistency</span>
              </div>
              <div className="text-[11px] text-slate-500 italic text-center font-sans">
                Computed from completed vs total activity schedules this month.
              </div>
            </div>

            {/* Consistency breakdown per plan item (Feature 7) */}
            <div className="glass-card p-5 col-span-2 space-y-4">
              <h3 className="font-bold text-white pb-1 border-b border-white/5 text-sm">Monthly Consistency Breakdown</h3>
              
              <div className="space-y-4 text-xs">
                {consistencyReport.items.map(item => (
                  <div key={item.id} className="space-y-1.5 font-sans">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-200 block font-bold">{item.name}</span>
                      <span className="text-slate-400 font-mono">
                        {item.percentage}% ({item.completed}/{item.total} days)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percentage >= 80 
                            ? 'bg-emerald-500' 
                            : item.percentage >= 60 
                            ? 'bg-indigo-500' 
                            : 'bg-rose-500'
                        }`} 
                        style={{ width: `${item.percentage}%` }} 
                      />
                    </div>
                  </div>
                ))}

                {consistencyReport.items.length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic">
                    No scheduled activity metrics compiled this monthly interval.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature 10: Complete Activity Analytics */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-white pb-2 border-b border-white/10 flex items-center gap-1.5">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Full Historical Activity Analytics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsByActivity.map(an => (
                <div key={an.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm leading-tight">{an.title}</h4>
                      <span className="text-[10px] text-slate-450 font-mono font-bold block uppercase">{an.category}</span>
                    </div>
                    <span className="text-[10.5px] bg-slate-800 border border-white/5 text-indigo-350 font-bold font-mono px-2.5 py-0.5 rounded-full">
                      Streak: {an.streak} Days
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 border border-white/5 bg-slate-900/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Spent Hours</span>
                      <strong className="text-sm font-black text-slate-205 font-mono">{an.totalHours} Hrs</strong>
                    </div>
                    <div className="p-2 border border-white/5 bg-slate-900/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Missed Days</span>
                      <strong className="text-sm font-black text-rose-350 font-mono">{an.missedDaysCount}</strong>
                    </div>
                    <div className="p-2 border border-white/5 bg-slate-900/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Completed %</span>
                      <strong className="text-sm font-black text-emerald-350 font-mono">{an.completionPercentage}%</strong>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total progress target hours</span>
                      <span className="font-mono">{an.totalHours} / {an.targetHoursTotal} Hours ({Math.min(100, Math.round((an.totalHours / (an.targetHoursTotal || 1)) * 100)) || 0}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full border border-white/5">
                      <div 
                        className="bg-indigo-505 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, Math.round((an.totalHours / (an.targetHoursTotal || 1)) * 100))}%`, backgroundColor: '#4f46e5' }} 
                      />
                    </div>
                  </div>
                </div>
              ))}

              {analyticsByActivity.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-400 italic font-sans text-xs">
                  Active plans are required to display execution analytics. Use the creation form to register plans.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
export default ActivityPlanner;
