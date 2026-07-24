import React, { useState, useEffect, useMemo } from 'react';
import { Routine, RoutineCategory, RepeatType } from '../types';
import { 
  X, Clock, Calendar as CalendarIcon, Bell, AlertTriangle, 
  Sparkles, Check, Code, BookOpen, Coffee, Dumbbell, Brain, 
  Briefcase, Zap, Moon, Sun, Droplet, MessageSquare, Video, 
  Layers, Volume2, ShieldAlert
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialRoutine ? 'Edit Routine' : 'Create New Routine'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure time, schedule, reminders & category
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'basic'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Basic Info & Category
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'schedule'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Time & Recurrence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'reminders'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Alarm & Reminders
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Overlap Conflict Alert */}
          {conflicts.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Schedule Overlap Warning!</span>
                This routine time ({formatTime12h(startTime)} - {formatTime12h(endTime)}) overlaps with:
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
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Routine Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Java Practice, DSA Revision, Exercise"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
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
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-md'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        className={`w-7 h-7 rounded-full transition transform ${
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
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIME & RECURRENCE */}
          {activeTab === 'schedule' && (
            <div className="space-y-5">
              {/* Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {formatTime12h(startTime)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {formatTime12h(endTime)}
                  </span>
                </div>
              </div>

              {/* Auto Calculated Duration Banner */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Calculated Duration:</span>
                </div>
                <span className="font-bold text-white text-base">
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
                      className={`px-3 py-2 rounded-xl border text-xs transition text-center ${
                        repeatType === type
                          ? 'bg-indigo-600 border-indigo-500 text-white font-medium shadow'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
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
                  <div className="flex items-center gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const active = repeatDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`w-10 h-10 rounded-xl border text-xs font-semibold transition ${
                            active
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                              : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
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
            <div className="space-y-5">
              {/* Enable Reminder Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Enable Reminder Notification</h4>
                    <p className="text-xs text-slate-400">Receive smart alarm before routine starts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alarmEnabled}
                    onChange={(e) => setAlarmEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {alarmEnabled && (
                <div className="space-y-4 pt-2">
                  {/* Reminder Time Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Reminder Trigger Time
                    </label>
                    <select
                      value={alarmMinutesBefore}
                      onChange={(e) => setAlarmMinutesBefore(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value={0}>At Start Time ({formatTime12h(startTime)})</option>
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
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
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="chime">🔔 Gentle Chime</option>
                        <option value="energetic">⚡ Energetic Alert</option>
                        <option value="bell">🛎️ Service Bell</option>
                        <option value="default">📱 Default Device Sound</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Vibration Alert
                      </label>
                      <select
                        value={vibration ? 'yes' : 'no'}
                        onChange={(e) => setVibration(e.target.value === 'yes')}
                        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="yes">📳 Enabled</option>
                        <option value="no">🔕 Disabled</option>
                      </select>
                    </div>
                  </div>

                  {/* Snooze Options */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Snooze Option</h5>
                      <p className="text-[11px] text-slate-400">Allow snoozing notifications</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={snoozeDuration}
                        onChange={(e) => setSnoozeDuration(Number(e.target.value))}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                      </select>
                    </div>
                  </div>

                  {/* Repeat notification until completed */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                    <div>
                      <h5 className="text-xs font-semibold text-white">Repeat Until Completed</h5>
                      <p className="text-[11px] text-slate-400">Keep reminding every 15 mins until routine is marked complete</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={repeatUntilCompleted}
                        onChange={(e) => setRepeatUntilCompleted(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialRoutine ? 'Update Routine' : 'Create Routine'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
