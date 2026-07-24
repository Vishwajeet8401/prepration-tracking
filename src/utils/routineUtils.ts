/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routine, RoutineHistory, HabitLog, DailyReflection } from '../types';

/**
 * Convert time string "HH:mm" to total minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert total minutes from midnight to "HH:mm" time string.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(1439, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate duration in minutes between start and end time ("HH:mm").
 * Handles cross-midnight if end time < start time.
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const startMins = timeStringToMinutes(startTime);
  const endMins = timeStringToMinutes(endTime);
  if (endMins >= startMins) {
    return endMins - startMins;
  }
  // Crosses midnight
  return (1440 - startMins) + endMins;
}

/**
 * Formats duration in minutes into human readable string e.g. "45 min" or "1h 30m".
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Formats "HH:mm" 24h string to 12h display e.g. "07:00" -> "7:00 AM", "14:30" -> "2:30 PM".
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Detect overlapping routines. Returns array of conflicting routines.
 */
export function detectRoutineConflicts(
  routines: Routine[],
  target: Partial<Routine> & { startTime: string; endTime: string; id?: string }
): Routine[] {
  if (!target.startTime || !target.endTime) return [];
  const targetStart = timeStringToMinutes(target.startTime);
  const targetEnd = timeStringToMinutes(target.endTime);

  return routines.filter(r => {
    if (r.id === target.id) return false;
    const rStart = timeStringToMinutes(r.startTime);
    const rEnd = timeStringToMinutes(r.endTime);

    // Check time overlap condition: (StartA < EndB) && (EndA > StartB)
    return (targetStart < rEnd) && (targetEnd > rStart);
  });
}

/**
 * Calculates current streak (consecutive active days with completed routines or habits).
 */
export function calculateRoutineStreak(histories: RoutineHistory[], habitLogs: HabitLog[]): { currentStreak: number; longestStreak: number } {
  // Extract all unique dates where user completed at least 1 routine or habit
  const completedDatesSet = new Set<string>();
  
  histories.forEach(h => {
    if (h.completed) completedDatesSet.add(h.date);
  });
  habitLogs.forEach(hl => {
    if (hl.completed) completedDatesSet.add(hl.date);
  });

  const dates = Array.from(completedDatesSet).sort();
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = new Date();

  // If user completed today, start counting from today. Else if completed yesterday, start from yesterday.
  if (!completedDatesSet.has(todayStr) && completedDatesSet.has(yesterdayStr)) {
    checkDate = yesterday;
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (completedDatesSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Iterate through all days in range
  if (dates.length > 0) {
    const minDate = new Date(dates[0]);
    const maxDate = new Date();
    const curr = new Date(minDate);

    while (curr <= maxDate) {
      const dStr = curr.toISOString().split('T')[0];
      if (completedDatesSet.has(dStr)) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Calculates today's Productivity Score (0 - 100).
 */
export function calculateProductivityScore(
  routinesToday: Routine[],
  historiesToday: RoutineHistory[],
  habitsTodayCompleted: number,
  totalHabits: number
): number {
  if (routinesToday.length === 0 && totalHabits === 0) return 100;

  const totalRoutines = routinesToday.length;
  const completedRoutines = historiesToday.filter(h => h.completed).length;
  
  const routineScore = totalRoutines > 0 ? (completedRoutines / totalRoutines) * 70 : 70;
  const habitScore = totalHabits > 0 ? (habitsTodayCompleted / totalHabits) * 30 : 30;

  return Math.round(routineScore + habitScore);
}

/**
 * Export routines into standard iCalendar (.ics) format string.
 */
export function exportRoutinesToICS(routines: Routine[]): string {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PrepFlow//Daily Routine Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  routines.forEach(r => {
    const [startH, startM] = (r.startTime || '09:00').split(':');
    const [endH, endM] = (r.endTime || '10:00').split(':');

    // Create event date for today
    const d = new Date();
    const dtStart = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}T${startH}${startM}00`;
    const dtEnd = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}T${endH}${endM}00`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:routine-${r.id}@prepflow.app`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:[${r.category}] ${r.title}`,
      `DESCRIPTION:${(r.description || 'Daily Routine in PrepFlow').replace(/\n/g, '\\n')}`,
      `RRULE:FREQ=${r.repeatType === 'Daily' ? 'DAILY' : r.repeatType === 'Weekly' ? 'WEEKLY' : 'DAILY'}`,
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

/**
 * Export routines into CSV format string.
 */
export function exportRoutinesToCSV(routines: Routine[]): string {
  const headers = ['Title', 'Category', 'Start Time', 'End Time', 'Duration (min)', 'Repeat Type', 'Priority', 'Status', 'Description'];
  const rows = routines.map(r => [
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.startTime}"`,
    `"${r.endTime}"`,
    r.duration || 0,
    `"${r.repeatType}"`,
    `"${r.priority}"`,
    `"${r.status}"`,
    `"${(r.description || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
