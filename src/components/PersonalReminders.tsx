/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { PersonalReminder, ReminderLog, PersonalReminderSettings, ReminderCategory, ReminderRepeatType, ReminderStatus } from '../types';
import { 
  Bell, Calendar, Flame, Droplet, Plus, Minus, Trash2, Settings, 
  Activity, Check, Clock, Save, Moon, Sparkles, AlertCircle, 
  ChevronLeft, ChevronRight, Play, CheckCircle, Info, CalendarDays, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersonalRemindersProps {
  reminders: PersonalReminder[];
  logs: ReminderLog[];
  settings: PersonalReminderSettings | null;
  onAddReminder: (reminder: Omit<PersonalReminder, 'id' | 'userId'>) => Promise<void>;
  onUpdateReminder: (reminder: PersonalReminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  onActionReminder: (reminderId: string, status: ReminderStatus, snoozeMinutes?: number) => Promise<void>;
  onUpdateSettings: (settings: PersonalReminderSettings) => Promise<void>;
}

const PersonalReminders = React.memo(function PersonalReminders({
  reminders,
  logs,
  settings,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onActionReminder,
  onUpdateSettings,
}: PersonalRemindersProps) {
  // Tabs: 'Active', 'Water Tracker', 'Medicine Tracking', 'Habit Insights', 'Calendar View', 'Settings & History'
  const [activeSubTab, setActiveSubTab] = useState<string>('My Reminders');
  
  // States for new reminder form
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('Health');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('Daily');
  const [intervalHours, setIntervalHours] = useState(2);
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Custom type markers
  const [isMedicine, setIsMedicine] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  
  const [isWater, setIsWater] = useState(false);
  const [targetGlasses, setTargetGlasses] = useState(8);
  
  const [isHabit, setIsHabit] = useState(false);

  // Settings State matching profile configuration
  const [sound, setSound] = useState(true);
  const [duration, setDuration] = useState(5);
  const [snooze, setSnooze] = useState(15);
  const [weekend, setWeekend] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [dndStart, setDndStart] = useState('23:00');
  const [dndEnd, setDndEnd] = useState('07:00');

  // Load Settings
  useEffect(() => {
    if (settings) {
      setSound(settings.notificationSound);
      setDuration(settings.reminderDuration);
      setSnooze(settings.defaultSnoozeTime);
      setWeekend(settings.weekendMode);
      setDnd(settings.dndEnabled);
      setDndStart(settings.dndStart);
      setDndEnd(settings.dndEnd);
    }
  }, [settings]);

  // Calendar Year/Month View State
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Categories list
  const categories: ReminderCategory[] = [
    'Study', 'Revision', 'Health', 'Medicine', 'Fitness', 
    'Reading', 'Speaking', 'Writing', 'Job Search', 
    'Interview Preparation', 'Personal Development', 'Custom'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Handle reminder save
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data: Omit<PersonalReminder, 'id' | 'userId'> = {
      title: title.trim(),
      category: isWater ? 'Health' : (isMedicine ? 'Medicine' : category),
      description: description.trim(),
      reminderTime,
      repeatType: isWater ? 'Interval Based' : repeatType,
      intervalHours: repeatType === 'Interval Based' || isWater ? intervalHours : undefined,
      weeklyDays: repeatType === 'Weekly' ? weeklyDays : undefined,
      monthlyDay: repeatType === 'Monthly' ? monthlyDay : undefined,
      startDate,
      endDate,
      priority,
      active: true,
      notificationMessage: notificationMessage.trim() || `Time for ${title.trim()}!`,
      isHabit,
      ...(isMedicine ? { medicineName, dosage, frequency } : {}),
      ...(isWater ? { targetGlasses } : {}),
      ...(isHabit ? { habitStreak: 0, habitBestStreak: 0, habitCompletedDates: [] } : {})
    };

    try {
      await onAddReminder(data);
      // Reset form
      setTitle('');
      setDescription('');
      setIsAdding(false);
      setIsMedicine(false);
      setIsWater(false);
      setIsHabit(false);
      setMedicineName('');
      setDosage('');
    } catch (err) {
      console.error(err);
    }
  };

  // Water intake calculation
  const waterReminder = useMemo(() => {
    return reminders.find(r => r.category === 'Health' && r.targetGlasses !== undefined);
  }, [reminders]);

  const waterGlassesCompleted = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!waterReminder) return 0;
    return logs.filter(l => l.reminderId === waterReminder.id && l.date === todayStr && l.status === 'Completed').length;
  }, [logs, waterReminder]);

  const handleAddGlass = async () => {
    if (!waterReminder) {
      // Create a default water reminder
      const todayStr = new Date().toISOString().split('T')[0];
      await onAddReminder({
        title: 'Drink Water',
        category: 'Health',
        description: 'Stay hydrated through the day.',
        reminderTime: '08:00',
        repeatType: 'Interval Based',
        intervalHours: 2,
        startDate: todayStr,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium',
        active: true,
        notificationMessage: 'Time to drink a glass of water.',
        targetGlasses: 8
      });
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    await onActionReminder(waterReminder.id, 'Completed');
  };

  const handleRemoveGlass = async () => {
    if (!waterReminder) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLogs = logs
      .filter(l => l.reminderId === waterReminder.id && l.date === todayStr && l.status === 'Completed')
      .sort((a, b) => b.completedAt?.localeCompare(a.completedAt || '') || 0);
    
    if (todaysLogs.length > 0) {
      // Delete the latest log or mark skipped/missed. For simplicity we toggle status
      await onActionReminder(waterReminder.id, 'Skipped');
    }
  };

  // Medicine reminders and their compliance rates
  const medicineReminders = useMemo(() => {
    return reminders.filter(r => r.medicineName !== undefined);
  }, [reminders]);

  const medicineCompliance = useMemo(() => {
    const totalLogs = logs.filter(l => {
      const rem = reminders.find(r => r.id === l.reminderId);
      return rem && rem.medicineName !== undefined;
    });
    if (totalLogs.length === 0) return 100;
    const completed = totalLogs.filter(l => l.status === 'Completed').length;
    return Math.round((completed / totalLogs.length) * 100);
  }, [logs, reminders]);

  // Habit metrics calculation
  const habitsList = useMemo(() => {
    return reminders.filter(r => r.isHabit);
  }, [reminders]);

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PersonalReminderSettings = {
      userId: settings?.userId || '',
      notificationSound: sound,
      reminderDuration: duration,
      defaultSnoozeTime: snooze,
      weekendMode: weekend,
      dndEnabled: dnd,
      dndStart,
      dndEnd
    };
    try {
      await onUpdateSettings(updated);
      alert('Reminder Settings saved successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  // Calendar calculations
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday is 0
    const cells = [];

    // Empty spots before month start
    for (let i = 0; i < (firstDayIndex === 0 ? 6 : firstDayIndex - 1); i++) {
      cells.push({ day: null, dateStr: '' });
    }

    // Days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateStr: dStr });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const getCalendarDayColor = (dateStr: string) => {
    if (!dateStr) return '';
    const dayLogs = logs.filter(l => l.date === dateStr);
    if (dayLogs.length === 0) return '';

    const completed = dayLogs.filter(l => l.status === 'Completed').length;
    const total = dayLogs.length;

    if (completed === total && total > 0) return 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
    if (completed > 0 && completed < total) return 'bg-amber-500/20 border-amber-500 text-amber-300';
    return 'bg-rose-500/20 border-rose-500 text-rose-300';
  };

  // Handle calendar month changes
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedDayLogs = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return logs.filter(l => l.date === selectedCalendarDate).map(l => {
      const rem = reminders.find(r => r.id === l.reminderId);
      return { log: l, reminder: rem };
    });
  }, [selectedCalendarDate, logs, reminders]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400 animate-bounce" />
            Personal Habit & Reminders Center
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Build consistent daily routines, track custom habits, medications compliance, and stay hydrated in one integrated space.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-white/5">
        {['My Reminders', 'Water Intake Tracker', 'Medicine Cabinet', 'Streak & Analytics', 'Calendar Compliance', 'System Settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === tab 
                ? 'bg-indigo-600/90 text-white shadow' 
                : 'text-slate-350 hover:bg-white/5 hover:text-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. Form Drawer (AnimatePresence drop-down for creating a reminder) */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-5 border-indigo-500/25 bg-indigo-950/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            
            <h3 className="text-sm font-bold text-white font-display mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Configure Custom Habit / Reminder
            </h3>

            <form onSubmit={handleSaveReminder} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-left">
              
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Drink Water, Speaking Practice"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Trigger Type</label>
                    <div className="flex gap-2 mt-1">
                      <button 
                        type="button"
                        onClick={() => { setIsWater(false); setIsMedicine(false); }}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${!isWater && !isMedicine ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                        Generic
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setIsWater(true); setIsMedicine(false); }}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${isWater ? 'bg-sky-600/20 border-sky-400 text-sky-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                        Water
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">&nbsp;</label>
                    <button 
                      type="button"
                      onClick={() => { setIsWater(false); setIsMedicine(true); }}
                      className={`w-full py-1.5 rounded-lg border text-center font-bold ${isMedicine ? 'bg-emerald-650/20 border-emerald-450 text-emerald-350' : 'bg-white/5 border-white/10 text-slate-400'}`}
                    >
                      Medicine
                    </button>
                  </div>
                </div>

                {!isWater && !isMedicine && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {isMedicine && (
                  <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-emerald-400 font-semibold mb-1">Medicine Name *</label>
                      <input 
                        type="text" 
                        required={isMedicine}
                        value={medicineName}
                        onChange={(e) => setMedicineName(e.target.value)}
                        placeholder="Vitamin D3, Omega-3"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-405 font-semibold mb-0.5">Dosage</label>
                      <input 
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="1 tablet, 5ml"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-405 font-semibold mb-0.5">Frequency</label>
                      <input 
                        type="text"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        placeholder="Daily, Twice daily"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                  </div>
                )}

                {isWater && (
                  <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10">
                    <label className="block text-sky-400 font-semibold mb-1">Daily Hydro Target Glasses (250ml each)</label>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setTargetGlasses(Math.max(4, targetGlasses - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-extrabold"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold font-mono text-white">{targetGlasses} Glasses</span>
                      <button 
                        type="button"
                        onClick={() => setTargetGlasses(targetGlasses + 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-extrabold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Description / Guidelines</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of task limits or habits checklist."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Time</label>
                    <input 
                      type="time" 
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Priority</label>
                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-semibold"
                    >
                      <option value="High">🔴 High Priority</option>
                      <option value="Medium">🟡 Medium Priority</option>
                      <option value="Low">🟢 Low Priority</option>
                    </select>
                  </div>
                </div>

                {!isWater && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Repeat Schedule</label>
                    <select 
                      value={repeatType} 
                      onChange={(e) => setRepeatType(e.target.value as ReminderRepeatType)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    >
                      <option value="Daily">Every Day (Daily)</option>
                      <option value="Weekly">Specific Days (Weekly)</option>
                      <option value="Monthly">Specific Day of Month (Monthly)</option>
                      <option value="Interval Based">Interval Based (Every N Hours)</option>
                    </select>
                  </div>
                )}

                {(repeatType === 'Interval Based' || isWater) && (
                  <div>
                    <label className="block text-slate-450 font-semibold mb-1">Interval Frequency</label>
                    <select 
                      value={intervalHours} 
                      onChange={(e) => setIntervalHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    >
                      <option value={1}>Every 1 Hour</option>
                      <option value={2}>Every 2 Hours</option>
                      <option value={4}>Every 4 Hours</option>
                      <option value={6}>Every 6 Hours</option>
                    </select>
                  </div>
                )}

                {repeatType === 'Weekly' && !isWater && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Days of Week</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {daysOfWeek.map(d => {
                        const isSelected = weeklyDays.includes(d);
                        return (
                          <button
                            type="button"
                            key={d}
                            onClick={() => {
                              if (isSelected) {
                                setWeeklyDays(weeklyDays.filter(day => day !== d));
                              } else {
                                setWeeklyDays([...weeklyDays, d]);
                              }
                            }}
                            className={`px-2 py-1 rounded border text-[10px] font-bold transition cursor-pointer ${isSelected ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                          >
                            {d.substring(0,3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {repeatType === 'Monthly' && !isWater && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Day of Month</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={31}
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Alert Notification Message</label>
                  <input 
                    type="text" 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Message to display when alert fires"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 select-none">
                  <input 
                    type="checkbox" 
                    id="isHabit"
                    checked={isHabit}
                    onChange={(e) => setIsHabit(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-900"
                  />
                  <label htmlFor="isHabit" className="text-slate-200 font-bold flex items-center gap-1 cursor-pointer">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/40" />
                    Register as Habit (Track streaks & consistency)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Reminder</span>
                  </button>
                </div>

              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Panel Views */}
      
      {/* View A: My Reminders List */}
      {activeSubTab === 'My Reminders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="md:col-span-2 flex items-center justify-between bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 text-xs font-mono text-slate-400">
            <span>Registered Reminders: {reminders.length}</span>
            <span>Active Habits: {habitsList.length}</span>
          </div>

          {reminders.map(rem => {
            const priorityColor = rem.priority === 'High' ? 'text-rose-400 ring-rose-500/20 bg-rose-500/10' : (rem.priority === 'Medium' ? 'text-amber-400 ring-amber-500/20 bg-amber-500/10' : 'text-emerald-400 ring-emerald-500/20 bg-emerald-500/10');
            
            return (
              <motion.div 
                key={rem.id}
                whileHover={{ y: -1, borderColor: 'rgba(255, 255, 255, 0.12)' }}
                className="glass-card rounded-xl p-4 flex flex-col justify-between border-white/5 hover:bg-white/5 transition-all text-left"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-md uppercase font-bold shrink-0 ${priorityColor}`}>
                        {rem.priority} Priority
                      </span>
                      <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-400/15 shrink-0">
                        {rem.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={async () => {
                          await onUpdateReminder({
                            ...rem,
                            active: !rem.active
                          });
                        }}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded transition cursor-pointer border ${rem.active ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                      >
                        {rem.active ? 'Active' : 'Disabled'}
                      </button>

                      <button 
                        onClick={() => onDeleteReminder(rem.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-sm text-white mb-0.5 font-display flex items-center gap-1.5">
                    {rem.isHabit && <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400/20 shrink-0" />}
                    {rem.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3 font-sans line-clamp-2 leading-relaxed">
                    {rem.description || 'No description guidelines.'}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-slate-200">{rem.reminderTime}</span>
                    <span className="text-slate-500">|</span>
                    <span className="truncate max-w-[120px]">{rem.repeatType}</span>
                  </div>

                  {rem.active && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => onActionReminder(rem.id, 'Completed')}
                        className="p-1 px-2 rounded bg-emerald-650 hover:bg-emerald-550 text-white font-sans font-bold flex items-center gap-0.5 transition cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Complete</span>
                      </button>
                      <button 
                        onClick={() => onActionReminder(rem.id, 'Snoozed', 15)}
                        className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-sans font-bold transition cursor-pointer border border-white/10"
                      >
                        Snooze
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {reminders.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <Bell className="w-10 h-10 text-indigo-400/50 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm font-display">No reminders scheduled</h4>
              <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto mt-1">
                Configure your first customized daily study habit, exercise block or water goal.
              </p>
            </div>
          )}

        </div>
      )}

      {/* View B: Water Intake Tracker */}
      {activeSubTab === 'Water Intake Tracker' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left font-sans">
          
          <div className="md:col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <span className="text-[9px] uppercase tracking-widest font-mono text-sky-400 font-extrabold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20">
                Hydration Dashboard
              </span>
              
              <h3 className="text-base font-extrabold text-white font-display">Fluid check-in tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Dehydration decays mental cognitive memory speeds and causes study exhaustion. Keep track of daily glasses checked-in to maintain Peak focus cycles.
              </p>

              {/* Progress Hydration animation */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-350">Hydro Progress:</span>
                  <span className="font-bold text-sky-300">
                    {waterGlassesCompleted} / {waterReminder?.targetGlasses || 8} Glasses ({Math.round(Math.min(100, (waterGlassesCompleted / (waterReminder?.targetGlasses || 8)) * 100))}% Completed)
                  </span>
                </div>
                
                <div className="h-4 w-full rounded-full bg-slate-900/60 border border-white/5 overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (waterGlassesCompleted / (waterReminder?.targetGlasses || 8)) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 120 }}
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-6 z-10">
              <button 
                onClick={handleRemoveGlass}
                disabled={waterGlassesCompleted === 0}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-350 flex items-center justify-center font-extrabold transition cursor-pointer border border-white/10 disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button 
                onClick={handleAddGlass}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/20 border border-sky-400/20"
              >
                <Plus className="w-4 h-4" />
                <span>Drink 1 Glass checked-in (+250ml)</span>
              </button>
            </div>

          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-white text-xs font-display flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Droplet className="w-4 h-4 text-sky-400 fill-sky-400/30" />
              Hydration Analytics
            </h4>

            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#111827]/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-[8px] text-slate-450 uppercase font-semibold">Today's Intake</span>
                  <span className="font-bold text-sky-300">{waterGlassesCompleted * 250} ml</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-slate-450 uppercase font-semibold">Intake Target</span>
                  <span className="font-bold text-slate-200">{(waterReminder?.targetGlasses || 8) * 250} ml</span>
                </div>
              </div>

              {/* Today's reminder schedule */}
              {waterReminder && waterReminder.repeatType === 'Interval Based' && waterReminder.intervalHours && (
                <div className="bg-[#111827]/40 p-3 rounded-xl border border-sky-500/10">
                  <span className="block text-[8px] text-sky-400 uppercase font-semibold mb-2">
                    Today's Schedule (every {waterReminder.intervalHours}h)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const [sh, sm] = waterReminder.reminderTime.split(':').map(Number);
                      const startMin = sh * 60 + sm;
                      const intervalMin = waterReminder.intervalHours * 60;
                      const slots: { label: string; done: boolean }[] = [];
                      const todayStr = new Date().toISOString().split('T')[0];
                      const completedLogs = logs.filter(l => l.reminderId === waterReminder.id && l.date === todayStr && l.status === 'Completed');
                      for (let m = startMin; m < 24 * 60; m += intervalMin) {
                        const h = Math.floor(m / 60);
                        const min = m % 60;
                        slots.push({
                          label: `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
                          done: false
                        });
                      }
                      // Mark slots as done based on glass log times (chronologically)
                      const glassLogsSorted = [...completedLogs].sort((a,b) => (a.completedAt||'').localeCompare(b.completedAt||''));
                      glassLogsSorted.forEach((_, i) => { if (i < slots.length) slots[i].done = true; });
                      return slots.map((slot, i) => (
                        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${slot.done ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                          {slot.done ? '✓' : '○'} {slot.label}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div className="bg-[#111827]/40 p-3 rounded-xl border border-white/5">
                <span className="block text-[8px] text-slate-450 uppercase font-semibold mb-1">Water Intakes logged today</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {logs.filter(l => l.reminderId === waterReminder?.id && l.date === new Date().toISOString().split('T')[0] && l.status === 'Completed').map((log, idx) => (
                    <div key={log.id} className="flex items-center justify-between text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded">
                      <span className="font-bold">Glass #{idx + 1}</span>
                      <span>{log.completedAt ? new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}</span>
                    </div>
                  ))}
                  {waterGlassesCompleted === 0 && (
                    <span className="text-[10px] text-slate-500 block py-2">No glasses logged yet. Use + Glass to record.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* View C: Medicine Cabinet */}
      {activeSubTab === 'Medicine Cabinet' && (
        <div className="space-y-5 text-left font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[110px] border-emerald-500/20 bg-emerald-950/5">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>Compliance Meter</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="pt-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-350">{medicineCompliance}%</span>
                <p className="text-[10px] text-slate-450 mt-1">Medicine compliance rate</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[110px]">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Total Medications</span>
              <div className="pt-2">
                <span className="text-3xl font-extrabold font-mono text-white">{medicineReminders.length}</span>
                <p className="text-[10px] text-slate-450 mt-1">Active daily prescriptions</p>
              </div>
            </div>

            <div className="md:col-span-2 glass-card rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-white font-display">Medication Compliance Tracking</h4>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  Never miss crucial daily supplements, vitamins or medical prescriptions. Tracking compliance ensures cognitive and biological consistency.
                </p>
              </div>
              <span className="text-emerald-450 shrink-0 text-xl">🏥</span>
            </div>

          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white font-display border-b border-white/10 pb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              Configure Prescriptions Cabinet
            </h3>

            <div className="space-y-3">
              {medicineReminders.map(med => {
                const todayStr = new Date().toISOString().split('T')[0];
                const takenToday = logs.some(l => l.reminderId === med.id && l.date === todayStr && l.status === 'Completed');
                
                return (
                  <div key={med.id} className="p-3 bg-[#111827]/40 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-350 px-2 py-0.2 rounded font-mono">
                          {med.dosage || '1 dose'}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-200 font-display">{med.medicineName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-450">Scheduled Time: {med.reminderTime} | Frequency: {med.frequency || 'Daily'}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {takenToday ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 fill-current text-emerald-500" />
                          Taken Today
                        </span>
                      ) : (
                        <button 
                          onClick={() => onActionReminder(med.id, 'Completed')}
                          className="px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-550 text-white rounded-lg text-xs font-bold font-sans transition cursor-pointer"
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {medicineReminders.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-sans">
                  No medications configured in your prescription system.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* View D: Streak & Analytics */}
      {activeSubTab === 'Streak & Analytics' && (
        <div className="space-y-5 text-left font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {habitsList.map(habit => {
              const streak = habit.habitStreak || 0;
              const bestStreak = habit.habitBestStreak || 0;
              
              return (
                <div key={habit.id} className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[170px] border-orange-500/10 bg-orange-950/2">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-orange-400 font-extrabold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/15">
                        Habit Tracker
                      </span>
                      <Flame className="w-4 h-4 text-orange-400 animate-pulse fill-current" />
                    </div>
                    <h4 className="font-extrabold text-sm text-white font-display pt-1">{habit.title}</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans">{habit.description || 'Daily habit consistency.'}</p>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-white/5 mt-4 z-10 font-mono text-xs">
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase font-semibold">Current Streak</span>
                      <span className="text-2xl font-extrabold text-orange-400">{streak} Days</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase font-semibold">Best Streak</span>
                      <span className="text-2xl font-extrabold text-slate-200">{bestStreak} Days</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {habitsList.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Flame className="w-10 h-10 text-orange-400/50 mx-auto mb-2 animate-bounce" />
                <h4 className="font-bold text-white text-sm font-display">No habits registered</h4>
                <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto mt-1">
                  Ensure to toggle "Register as Habit" when creating reminders to compute consistency trends.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* View E: Calendar Compliance View */}
      {activeSubTab === 'Calendar Compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left font-sans">
          
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                <CalendarDays className="w-4.5 h-4.5 text-indigo-400" />
                Monthly Habit Calendar Visualizer
              </h3>

              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold font-mono text-white min-w-[100px] text-center">
                  {new Date(currentYear, currentMonth).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="grid grid-cols-7 gap-2.5 text-center text-xs">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <span key={day} className="font-bold font-mono text-[10px] uppercase text-slate-450 tracking-wider py-1 select-none">
                  {day}
                </span>
              ))}

              {calendarCells.map((cell, idx) => {
                const colorClass = cell.day ? getCalendarDayColor(cell.dateStr) : 'opacity-0 pointer-events-none';
                const isSelected = selectedCalendarDate === cell.dateStr;
                
                return (
                  <button
                    key={idx}
                    disabled={!cell.day}
                    onClick={() => setSelectedCalendarDate(cell.dateStr)}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center transition select-none cursor-pointer ${
                      cell.day 
                        ? (colorClass || 'border-white/5 bg-[#111827]/10 text-slate-400 hover:bg-white/5 hover:text-white')
                        : 'border-transparent bg-transparent'
                    } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 scale-102 font-black' : ''}`}
                  >
                    <span className="text-xs font-mono font-bold">{cell.day}</span>
                  </button>
                );
              })}
            </div>

            {/* Compliance Legend */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/20 border border-emerald-500 shrink-0" />
                <span>Fully Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500/20 border border-amber-500 shrink-0" />
                <span>Partially Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-rose-500/20 border border-rose-500 shrink-0" />
                <span>Missed Entirely</span>
              </div>
            </div>

          </div>

          {/* Side calendar selection records details drawer */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-white text-xs font-display flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Eye className="w-4.5 h-4.5 text-indigo-400" />
              Checking Log Archives
            </h4>

            {selectedCalendarDate ? (
              <div className="space-y-3 font-sans">
                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  Date: {selectedCalendarDate}
                </span>

                <div className="space-y-2 pt-2.5 max-h-80 overflow-y-auto">
                  {selectedDayLogs.map(({ log, reminder }) => {
                    const badgeColor = log.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-350 border-emerald-500/10' : (log.status === 'Snoozed' ? 'bg-amber-500/15 text-amber-350 border-amber-500/10' : 'bg-rose-500/15 text-rose-350 border-rose-500/10');
                    return (
                      <div key={log.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-left text-xs font-medium space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-200 text-xs truncate max-w-[120px]">{reminder?.title || 'Reminder Deleted'}</span>
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.2 rounded border uppercase shrink-0 ${badgeColor}`}>
                            {log.status}
                          </span>
                        </div>
                        {log.completedAt && (
                          <span className="block text-[9px] font-mono text-slate-450">
                            Completed: {new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {selectedDayLogs.length === 0 && (
                    <span className="text-[11px] text-slate-500 font-medium block py-4 text-center">No routine logs documented on this date.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-450 text-xs font-sans">
                Select a calendar cell to inspect checked-in task compliance records.
              </div>
            )}
          </div>

        </div>
      )}

      {/* View F: System Settings & History Log Table */}
      {activeSubTab === 'System Settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left font-sans">
          
          <div className="md:col-span-2 glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white font-display border-b border-white/10 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              Reminders Execution History
            </h3>

            <div className="overflow-x-auto select-none">
              <table className="w-full text-xs font-medium font-sans">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[9px] text-slate-450 uppercase tracking-widest text-left">
                    <th className="pb-2.5 font-bold">Reminder / Habit</th>
                    <th className="pb-2.5 font-bold">Check Date</th>
                    <th className="pb-2.5 font-bold">Log State</th>
                    <th className="pb-2.5 font-bold">Finished Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.slice(0, 15).map(log => {
                    const matchedRem = reminders.find(r => r.id === log.reminderId);
                    const statusColor = log.status === 'Completed' ? 'text-emerald-450 bg-emerald-500/10' : (log.status === 'Snoozed' ? 'text-amber-450 bg-amber-500/10' : 'text-rose-450 bg-rose-500/10');
                    
                    return (
                      <tr key={log.id} className="hover:bg-white/2 transition">
                        <td className="py-2.5 font-extrabold text-slate-200">
                          {matchedRem?.title || 'Custom hydra / prescription check'}
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono">{log.date}</td>
                        <td className="py-2.5">
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-white/5 uppercase ${statusColor}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono">
                          {log.completedAt ? new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500 text-xs">
                        No reminders checked-in yet. Use Practice triggers or Hydrate checks.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h4 className="font-bold text-white text-xs font-display flex items-center gap-1.5 border-b border-white/10 pb-2 mb-3">
              <Settings className="w-4 h-4 text-indigo-400" />
              Habits Settings Controls
            </h4>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-sans text-left">
              
              <div className="flex items-center justify-between select-none">
                <label className="text-slate-350 font-bold">Sound Triggers</label>
                <input 
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-450 font-semibold mb-1">Reminder Pop Duration (Minutes)</label>
                <input 
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-450 font-semibold mb-1">Default Snooze Interval (Minutes)</label>
                <input 
                  type="number"
                  min={5}
                  max={120}
                  value={snooze}
                  onChange={(e) => setSnooze(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between select-none">
                <label className="text-slate-350 font-bold">Active on Weekends</label>
                <input 
                  type="checkbox"
                  checked={weekend}
                  onChange={(e) => setWeekend(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="border-t border-white/5 pt-3 space-y-3">
                <div className="flex items-center justify-between select-none">
                  <label className="text-slate-205 font-bold flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    Do Not Disturb Hours
                  </label>
                  <input 
                    type="checkbox"
                    checked={dnd}
                    onChange={(e) => setDnd(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                </div>

                {dnd && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-450 font-semibold mb-0.5">DND Start</label>
                      <input 
                        type="time"
                        value={dndStart}
                        onChange={(e) => setDndStart(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-white/10 text-white text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-455 font-semibold mb-0.5">DND End</label>
                      <input 
                        type="time"
                        value={dndEnd}
                        onChange={(e) => setDndEnd(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-900 border border-white/10 text-white text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl cursor-pointer shadow flex items-center justify-center gap-1.5 transition mt-4"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Habits Settings</span>
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
});
export default PersonalReminders;
