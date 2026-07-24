import React, { useState, useEffect, useMemo } from 'react';
import { Routine, RoutineCategory, RepeatType } from '../types';
import { 
  X, Clock, Calendar as CalendarIcon, Bell, AlertTriangle, 
  Sparkles, Check, Code, BookOpen, Coffee, Dumbbell, Brain, 
  Briefcase, Zap, Moon, Sun, Droplet, MessageSquare, Video, 
  Layers, ShieldAlert, ChevronRight, Tag, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDurationMinutes, formatDuration, detectRoutineConflicts, formatTime12h } from '../utils/routineUtils';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routineData: any) => Promise<void>;
  existingRoutines: Routine[];
  initialRoutine?: Routine | null;
}

export const CATEGORY_OPTIONS: Array<{ name: RoutineCategory; icon: string; defaultColor: string }> = [
  { name: 'DSA', icon: 'Brain', defaultColor: '#8B5CF6' },
  { name: 'Java', icon: 'Code', defaultColor: '#3B82F6' },
  { name: 'Spring Boot', icon: 'Layers', defaultColor: '#10B981' },
  { name: 'System Design', icon: 'Layers', defaultColor: '#EC4899' },
  { name: 'HR Interview', icon: 'MessageSquare', defaultColor: '#F59E0B' },
  { name: 'Aptitude', icon: 'Zap', defaultColor: '#6366F1' },
  { name: 'English Speaking', icon: 'MessageSquare', defaultColor: '#06B6D4' },
  { name: 'Vocabulary', icon: 'BookOpen', defaultColor: '#14B8A6' },
  { name: 'Coding Practice', icon: 'Code', defaultColor: '#3B82F6' },
  { name: 'Mock Interview', icon: 'Video', defaultColor: '#F43F5E' },
  { name: 'Revision', icon: 'Sparkles', defaultColor: '#A855F7' },
  { name: 'Reading', icon: 'BookOpen', defaultColor: '#10B981' },
  { name: 'Exercise', icon: 'Dumbbell', defaultColor: '#10B981' },
  { name: 'Meditation', icon: 'Sun', defaultColor: '#F59E0B' },
  { name: 'Office', icon: 'Briefcase', defaultColor: '#64748B' },
  { name: 'Break', icon: 'Coffee', defaultColor: '#F97316' },
  { name: 'Sleep', icon: 'Moon', defaultColor: '#6366F1' },
  { name: 'Custom', icon: 'Sparkles', defaultColor: '#8B5CF6' }
];

export const COLOR_SWATCHES = [
  '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', 
  '#06B6D4', '#6366F1', '#F43F5E', '#14B8A6', '#64748B'
];

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RoutineModal({
  isOpen,
  onClose,
  onSave,
  existingRoutines,
  initialRoutine
}: RoutineModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'reminders'>('basic');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('DSA');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('Brain');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [repeatType, setRepeatType] = useState<RepeatType>('Daily');
  const [repeatDays, setRepeatDays] = useState<string[]>(DAYS_OF_WEEK);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [notes, setNotes] = useState('');

  // Reminders state
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState(10);
  const [notificationSound, setNotificationSound] = useState('chime');
  const [vibration, setVibration] = useState(true);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(10);
  const [repeatUntilCompleted, setRepeatUntilCompleted] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialRoutine) {
      setTitle(initialRoutine.title || '');
      setDescription(initialRoutine.description || '');
      setCategory(initialRoutine.category || 'DSA');
      setColor(initialRoutine.color || '#8B5CF6');
      setIcon(initialRoutine.icon || 'Brain');
      setStartTime(initialRoutine.startTime || '09:00');
      setEndTime(initialRoutine.endTime || '10:30');
      setRepeatType(initialRoutine.repeatType || 'Daily');
      setRepeatDays(initialRoutine.repeatDays || DAYS_OF_WEEK);
      setPriority(initialRoutine.priority || 'High');
      setNotes(initialRoutine.notes || '');
      setAlarmEnabled(initialRoutine.alarmEnabled ?? true);
      setAlarmMinutesBefore(initialRoutine.alarmMinutesBefore ?? 10);
      setNotificationSound(initialRoutine.notificationSound || 'chime');
      setVibration(initialRoutine.vibration ?? true);
      setSnoozeEnabled(initialRoutine.snoozeEnabled ?? true);
      setSnoozeDuration(initialRoutine.snoozeDuration ?? 10);
      setRepeatUntilCompleted(initialRoutine.repeatNotificationUntilCompleted ?? false);
    } else {
      setTitle('');
      setDescription('');
      setCategory('DSA');
      setColor('#8B5CF6');
      setIcon('Brain');
      setStartTime('09:00');
      setEndTime('10:30');
      setRepeatType('Daily');
      setRepeatDays(DAYS_OF_WEEK);
      setPriority('High');
      setNotes('');
      setAlarmEnabled(true);
      setAlarmMinutesBefore(10);
      setNotificationSound('chime');
      setVibration(true);
      setSnoozeEnabled(true);
      setSnoozeDuration(10);
      setRepeatUntilCompleted(false);
    }
    setFormError('');
    setActiveTab('basic');
  }, [initialRoutine, isOpen]);

  // Compute live duration
  const durationMinutes = useMemo(() => {
    return calculateDurationMinutes(startTime, endTime);
  }, [startTime, endTime]);

  // Detect overlapping routine conflicts
  const conflicts = useMemo(() => {
    return detectRoutineConflicts(existingRoutines, {
      id: initialRoutine?.id,
      startTime,
      endTime
    });
  }, [existingRoutines, initialRoutine, startTime, endTime]);

  const handleCategorySelect = (catName: RoutineCategory) => {
    setCategory(catName);
    const catObj = CATEGORY_OPTIONS.find(c => c.name === catName);
    if (catObj) {
      setColor(catObj.defaultColor);
      setIcon(catObj.icon);
    }
  };

  const toggleDay = (day: string) => {
    if (repeatDays.includes(day)) {
      if (repeatDays.length > 1) {
        setRepeatDays(repeatDays.filter(d => d !== day));
      }
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Routine Name is required.');
      return;
    }

    if (durationMinutes <= 0) {
      setFormError('End time must be greater than Start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const routineData = {
        ...(initialRoutine ? { id: initialRoutine.id } : {}),
        title: title.trim(),
        description: description.trim(),
        category,
        color,
        icon,
        startTime,
        endTime,
        duration: durationMinutes,
        repeatType,
        repeatDays,
        alarmEnabled,
        alarmMinutesBefore,
        notificationSound,
        vibration,
        snoozeEnabled,
        snoozeDuration,
        repeatNotificationUntilCompleted: repeatUntilCompleted,
        status: initialRoutine?.status || 'Upcoming',
        priority,
        notes: notes.trim()
      };

      await onSave(routineData);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save routine');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl glass-card rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/15"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg font-mono font-bold"
                style={{ backgroundColor: color }}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#f8fafc] font-sans tracking-tight">
                  {initialRoutine ? 'Edit Routine' : 'Create New Routine'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  PrepFlow time scheduling & alarm controls
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PrepFlow Theme Mobile-Responsive Sub-Tabs */}
          <div className="flex bg-slate-950/60 p-1.5 border-b border-white/10 px-4 sm:px-6 gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'basic', label: '1. Basic Info' },
              { id: 'schedule', label: '2. Time & Days' },
              { id: 'reminders', label: '3. Alarms & Reminders' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold select-none transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-650 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-350 rounded-xl text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Overlap Conflict Alert */}
            {conflicts.length > 0 && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Schedule Overlap Warning!</span>
                  This time ({formatTime12h(startTime)} - {formatTime12h(endTime)}) overlaps with:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {conflicts.map(c => (
                      <li key={c.id}>
                        <span className="font-medium">{c.title}</span> ({formatTime12h(c.startTime)} - {formatTime12h(c.endTime)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 1: BASIC INFO */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Routine Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Java Practice, DSA Revision, Exercise"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Goals, target questions, or notes for this routine session..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Category Grid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Category Selection
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = category === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleCategorySelect(cat.name)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-650/40 border-indigo-500 text-white font-bold shadow'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: cat.defaultColor }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Swatches & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Theme Accent Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() => setColor(swatch)}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition transform cursor-pointer ${
                            color === swatch ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 glass-input rounded-xl text-white text-xs focus:outline-none"
                    >
                      <option value="High" className="bg-slate-900 text-white">🔴 High Priority</option>
                      <option value="Medium" className="bg-slate-900 text-white">🟡 Medium Priority</option>
                      <option value="Low" className="bg-slate-900 text-white">🟢 Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TIME & RECURRENCE */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                {/* Start Time & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Start Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-white text-xs focus:outline-none font-mono"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      {formatTime12h(startTime)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      End Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-white text-xs focus:outline-none font-mono"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                      {formatTime12h(endTime)}
                    </span>
                  </div>
                </div>

                {/* Auto Calculated Duration Banner */}
                <div className="flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Calculated Duration:</span>
                  </div>
                  <span className="font-bold text-white font-mono text-sm">
                    {formatDuration(durationMinutes)} ({durationMinutes} mins)
                  </span>
                </div>

                {/* Repeat Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Repeat Schedule
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['One Time', 'Daily', 'Weekdays', 'Weekends', 'Weekly', 'Monthly', 'Custom Days'] as RepeatType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRepeatType(type)}
                        className={`px-3 py-2 rounded-xl border text-xs transition text-center cursor-pointer ${
                          repeatType === type
                            ? 'bg-indigo-650 border-indigo-500 text-white font-bold shadow'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Days selector if repeatType === 'Custom Days' */}
                {repeatType === 'Custom Days' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Select Active Days
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => {
                        const active = repeatDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`w-9 h-9 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              active
                                ? 'bg-indigo-650 border-indigo-500 text-white shadow'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALARM & REMINDERS */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                {/* Enable Reminder Toggle */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 glass-card rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Enable Reminder Notification</h4>
                      <p className="text-[10px] text-slate-400">Receive alarm before routine starts</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alarmEnabled}
                      onChange={(e) => setAlarmEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-650"></div>
                  </label>
                </div>

                {alarmEnabled && (
                  <div className="space-y-3 pt-1">
                    {/* Reminder Time Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Reminder Trigger Time
                      </label>
                      <select
                        value={alarmMinutesBefore}
                        onChange={(e) => setAlarmMinutesBefore(Number(e.target.value))}
                        className="w-full px-4 py-2.5 glass-input rounded-xl text-white text-xs focus:outline-none"
                      >
                        <option value={0} className="bg-slate-900 text-white">At Start Time ({formatTime12h(startTime)})</option>
                        <option value={5} className="bg-slate-900 text-white">5 minutes before</option>
                        <option value={10} className="bg-slate-900 text-white">10 minutes before</option>
                        <option value={15} className="bg-slate-900 text-white">15 minutes before</option>
                        <option value={30} className="bg-slate-900 text-white">30 minutes before</option>
                        <option value={60} className="bg-slate-900 text-white">1 hour before</option>
                      </select>
                    </div>

                    {/* Sound & Vibration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Notification Sound
                        </label>
                        <select
                          value={notificationSound}
                          onChange={(e) => setNotificationSound(e.target.value)}
                          className="w-full px-3 py-2 glass-input rounded-xl text-white text-xs focus:outline-none"
                        >
                          <option value="chime" className="bg-slate-900 text-white">🔔 Gentle Chime</option>
                          <option value="energetic" className="bg-slate-900 text-white">⚡ Energetic Alert</option>
                          <option value="bell" className="bg-slate-900 text-white">🛎️ Service Bell</option>
                          <option value="default" className="bg-slate-900 text-white">📱 Default Device Sound</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Vibration Alert
                        </label>
                        <select
                          value={vibration ? 'yes' : 'no'}
                          onChange={(e) => setVibration(e.target.value === 'yes')}
                          className="w-full px-3 py-2 glass-input rounded-xl text-white text-xs focus:outline-none"
                        >
                          <option value="yes" className="bg-slate-900 text-white">📳 Enabled</option>
                          <option value="no" className="bg-slate-900 text-white">🔕 Disabled</option>
                        </select>
                      </div>
                    </div>

                    {/* Snooze Options */}
                    <div className="flex items-center justify-between p-3.5 glass-card rounded-xl border border-white/10">
                      <div>
                        <h5 className="text-xs font-semibold text-white">Snooze Option</h5>
                        <p className="text-[10px] text-slate-400">Allow snoozing notifications</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={snoozeDuration}
                          onChange={(e) => setSnoozeDuration(Number(e.target.value))}
                          className="px-2.5 py-1 glass-input rounded-lg text-white text-xs"
                        >
                          <option value={5} className="bg-slate-900 text-white">5 min</option>
                          <option value={10} className="bg-slate-900 text-white">10 min</option>
                          <option value={15} className="bg-slate-900 text-white">15 min</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{initialRoutine ? 'Update Routine' : 'Create Routine'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
