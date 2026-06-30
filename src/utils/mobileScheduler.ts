/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { PersonalReminder } from '../types';

/**
 * Maps a weekday string to Capacitor's weekday number (Sunday = 1, Monday = 2, ..., Saturday = 7)
 */
const mapDayToWeekday = (dayStr: string): number => {
  const mapping: { [key: string]: number } = {
    'Sunday': 1,
    'Monday': 2,
    'Tuesday': 3,
    'Wednesday': 4,
    'Thursday': 5,
    'Friday': 6,
    'Saturday': 7
  };
  return mapping[dayStr] || 1;
};

/**
 * Converts a reminder string ID to a unique 32-bit integer for Capacitor notification IDs
 */
const generateNumericId = (stringId: string): number => {
  let hash = 0;
  for (let i = 0; i < stringId.length; i++) {
    const character = stringId.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Parses time format "HH:MM" or "HH:MM AM/PM" into 24-hour hour and minute integers
 */
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  let cleanTime = timeStr.trim();
  let hour = 8;
  let minute = 0;

  if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
    const [timePart, modifier] = cleanTime.split(' ');
    const parts = timePart.split(':');
    hour = parseInt(parts[0], 10);
    minute = parseInt(parts[1], 10) || 0;

    if (hour === 12) {
      hour = 0;
    }
    if (modifier === 'PM') {
      hour += 12;
    }
  } else {
    const parts = cleanTime.split(':');
    hour = parseInt(parts[0], 10) || 8;
    minute = parseInt(parts[1], 10) || 0;
  }

  return { hour, minute };
};

/**
 * Requests native notification permissions from the OS if running on a mobile wrapper.
 */
export const requestNativeNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') {
      return true;
    }

    const request = await LocalNotifications.requestPermissions();
    return request.display === 'granted';
  } catch (err) {
    console.error('Error requesting Capacitor notification permissions:', err);
    return false;
  }
};

/**
 * Registers a native scheduled local notification for a reminder on Android/iOS.
 */
export const scheduleNativeNotification = async (reminder: PersonalReminder): Promise<void> => {
  if (!Capacitor.isNativePlatform() || !reminder.active) {
    return;
  }

  try {
    // Generate a unique numeric ID for the notification channel slot
    const notificationId = generateNumericId(reminder.id);
    const { hour, minute } = parseTime(reminder.reminderTime);

    // Cancel any previous notifications scheduled under this ID to avoid overlap/duplication
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });

    const notificationsToSchedule = [];

    if (reminder.repeatType === 'Daily') {
      notificationsToSchedule.push({
        id: notificationId,
        title: reminder.title,
        body: reminder.notificationMessage || reminder.description || `It's time for ${reminder.title}!`,
        schedule: {
          on: {
            hour,
            minute
          },
          allowWhileIdle: true,
          repeats: true
        },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      });
    } else if (reminder.repeatType === 'Weekly' && reminder.weeklyDays && reminder.weeklyDays.length > 0) {
      // For weekly schedules, schedule a separate notification for each selected weekday
      reminder.weeklyDays.forEach((day, index) => {
        const subId = notificationId + index; // offset sub-notifications
        const weekday = mapDayToWeekday(day);
        
        notificationsToSchedule.push({
          id: subId,
          title: reminder.title,
          body: reminder.notificationMessage || reminder.description || `Weekly reminder: ${reminder.title}`,
          schedule: {
            on: {
              weekday,
              hour,
              minute
            },
            allowWhileIdle: true,
            repeats: true
          },
          sound: 'chime.wav',
          channelId: 'prep_tracker_reminders'
        });
      });
    } else if (reminder.repeatType === 'Monthly' && reminder.monthlyDay) {
      notificationsToSchedule.push({
        id: notificationId,
        title: reminder.title,
        body: reminder.notificationMessage || reminder.description || `Monthly reminder: ${reminder.title}`,
        schedule: {
          on: {
            day: reminder.monthlyDay,
            hour,
            minute
          },
          allowWhileIdle: true,
          repeats: true
        },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      });
    } else if (reminder.repeatType === 'Interval Based' && reminder.intervalHours) {
      // For interval-based alarms, schedule standard recurring trigger on the device
      notificationsToSchedule.push({
        id: notificationId,
        title: reminder.title,
        body: reminder.notificationMessage || reminder.description || `Interval alert: ${reminder.title}`,
        schedule: {
          on: {
            // Note: Since native wrappers don't easily do custom hour ranges (like every 2 hours) on the basic 'on' parameter,
            // we default to repeating on the minute or hour slot standard. For true intervals, we trigger every day at the base time 
            // and use a daily repeat. Alternatively, we schedule it to repeat every 'hour'.
            hour,
            minute
          },
          allowWhileIdle: true,
          repeats: true
        },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      });
    } else {
      // Default to standard one-shot or daily schedule at the target time
      notificationsToSchedule.push({
        id: notificationId,
        title: reminder.title,
        body: reminder.notificationMessage || reminder.description || `Reminder: ${reminder.title}`,
        schedule: {
          on: {
            hour,
            minute
          },
          allowWhileIdle: true,
          repeats: false
        },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule
      });
      console.log(`Successfully scheduled native notification(s) for: "${reminder.title}"`);
    }
  } catch (err) {
    console.error(`Failed to schedule native notification for: "${reminder.title}"`, err);
  }
};

/**
 * Cancels native notifications linked to a specific reminder ID.
 */
export const cancelNativeNotification = async (reminderId: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const notificationId = generateNumericId(reminderId);
    
    // We cancel both the base notification ID and sub-IDs (up to 7 for weekly offsets)
    const notificationsToCancel = [{ id: notificationId }];
    for (let i = 1; i <= 7; i++) {
      notificationsToCancel.push({ id: notificationId + i });
    }

    await LocalNotifications.cancel({
      notifications: notificationsToCancel
    });
    console.log(`Cancelled native notifications for reminder ID: ${reminderId}`);
  } catch (err) {
    console.error(`Failed to cancel native notification for ID: ${reminderId}`, err);
  }
};

/**
 * Triggers an immediate native notification on Android/iOS Capacitor platforms.
 */
export const triggerImmediateNativeNotification = async (title: string, body: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const permissionGranted = await requestNativeNotificationPermission();
    if (!permissionGranted) {
      console.warn('Native notification permission denied.');
      return;
    }

    const notificationId = Math.floor(Math.random() * 1000000);
    // Schedule 1 second in the future — scheduling at exact 'now' can fail on some Android versions
    const triggerAt = new Date(Date.now() + 1000);
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title,
        body,
        schedule: { at: triggerAt, allowWhileIdle: true },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      }]
    });
    console.log(`Triggered immediate native notification: "${title}"`);
  } catch (err) {
    console.error('Failed to trigger immediate native notification:', err);
  }
};

/**
 * Schedules a native notification for when a study task timer exceeds its target duration.
 * This ensures the notification will fire even if the app WebView is throttled/paused in the background.
 */
export const scheduleTimerOverflowNotification = async (
  taskId: string,
  taskTitle: string,
  targetHours: number,
  delaySeconds: number
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const permissionGranted = await requestNativeNotificationPermission();
    if (!permissionGranted) {
      console.warn('Native notification permission denied.');
      return;
    }

    const notificationId = generateNumericId('timer-' + taskId);
    
    // Cancel any previous notification under this ID to avoid duplicates
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });

    const triggerAt = new Date(Date.now() + delaySeconds * 1000);

    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: `Task Target Exceeded`,
        body: `You have exceeded the target of ${targetHours}h for task "${taskTitle}".`,
        schedule: { at: triggerAt, allowWhileIdle: true },
        sound: 'chime.wav',
        channelId: 'prep_tracker_reminders'
      }]
    });
    console.log(`Scheduled native task timer overflow notification for "${taskTitle}" in ${delaySeconds}s.`);
  } catch (err) {
    console.error('Failed to schedule native timer overflow notification:', err);
  }
};

/**
 * Cancels a scheduled task timer overflow notification.
 */
export const cancelTimerOverflowNotification = async (taskId: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const notificationId = generateNumericId('timer-' + taskId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
    console.log(`Cancelled native timer overflow notification for task: ${taskId}`);
  } catch (err) {
    console.error('Failed to cancel native timer overflow notification:', err);
  }
};

/**
 * Plays vocal speech natively using system voice engines on Android/iOS Capacitor wrapper.
 */
export const speakNativeText = async (text: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    // Cancel/Stop any previous ongoing speech first
    await stopNativeSpeech();
    
    await TextToSpeech.speak({
      text: text,
      lang: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient'
    });
  } catch (err) {
    console.error('Failed to play native system speech:', err);
  }
};

/**
 * Stops any ongoing native voice synthesis.
 */
export const stopNativeSpeech = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    await TextToSpeech.stop();
  } catch (err) {
    console.error('Failed to stop native system speech:', err);
  }
};

/**
 * Checks and requests microphone permissions for native speech recognition.
 */
export const requestSpeechPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const status = await SpeechRecognition.checkPermissions();
    if (status.speechRecognition === 'granted') {
      return true;
    }
    const req = await SpeechRecognition.requestPermissions();
    return req.speechRecognition === 'granted';
  } catch (err) {
    console.error('Speech recognition permission error:', err);
    return false;
  }
};

/**
 * Starts native speech recognition dictation.
 */
export const startNativeSpeechToText = async (
  onTextReceived: (text: string) => void
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    const isAvailable = await SpeechRecognition.available();
    if (!isAvailable.available) {
      console.warn('Speech recognition not available on this device');
      return;
    }
    const permission = await requestSpeechPermission();
    if (!permission) {
      console.warn('Microphone permission not granted for speech recognition');
      return;
    }

    // Stop any previous instance first
    await stopNativeSpeechToText();

    // Listen for partial results as the candidate speaks
    await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
      if (data.matches && data.matches.length > 0) {
        onTextReceived(data.matches[0]);
      }
    });

    await SpeechRecognition.start({
      language: 'en-US',
      partialResults: true,
      popup: false
    });
    console.log('Started native speech dictation');
  } catch (err) {
    console.error('Failed to start native speech to text:', err);
  }
};

/**
 * Stops native speech recognition dictation.
 */
export const stopNativeSpeechToText = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    await SpeechRecognition.removeAllListeners();
    await SpeechRecognition.stop();
    console.log('Stopped native speech dictation');
  } catch (err) {
    console.error('Failed to stop native speech to text:', err);
  }
};
