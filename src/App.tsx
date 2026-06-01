/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Topic, Question, JobApplication, Interview, Mistake, StudySession, AppNotification, VoiceRecording, InterviewIntelligenceQuestion, ActivityPlan, DailyTask, ActivityLog, ActivityCategory, Journal, Roadmap, MockInterview, PersonalReminder, ReminderLog, PersonalReminderSettings, ReminderStatus } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  initialTopics, initialQuestions, initialJobApplications, 
  initialInterviews, initialMistakes, initialStudySessions, initialNotifications, initialIntelliQuestions 
} from './initialData';

// Component imports
import Dashboard from './components/Dashboard';
import TopicManagement from './components/TopicManagement';
import QuestionBank from './components/QuestionBank';
import InterviewTracker from './components/InterviewTracker';
import Analytics from './components/Analytics';
import NotificationCenter from './components/NotificationCenter';
import FuturisticToaster from './components/FuturisticToaster';
import IntelligenceHub from './components/IntelligenceHub';
import AuthScreen from './components/AuthScreen';
import CloudBackupControls from './components/CloudBackupControls';
import ActivityPlanner from './components/ActivityPlanner';
import PersonalJournal from './components/PersonalJournal';
import PreparationRoadmaps from './components/PreparationRoadmaps';
import AchievementsView from './components/AchievementsView';
import MockInterviewWorkspace from './components/MockInterviewWorkspace';
import MobileOfflineHub from './components/MobileOfflineHub';
import BulkImportExportCenter from './components/BulkImportExportCenter';
import PersonalReminders from './components/PersonalReminders';

// Firebase core integrations
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, writeBatch, getDocs
} from 'firebase/firestore';
import { saveLocalFile } from './localFileStore';

// Lucide Icon assets
import { 
  BookOpen, Star, Sparkles, LogIn, Award, ListTodo, User as UserIcon, Calendar, 
  Settings, Flame, Activity, TrendingUp, HelpCircle, Bell, Clock, Compass, HelpCircle as HelpIcon, Volume2, ShieldAlert, BadgeCheck, Loader, LogOut, Layers, Smartphone, Gamepad2, Menu
} from 'lucide-react';

export default function App() {
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<string>('Dashboard & Priorities');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const isHandlingHistoryRef = React.useRef(false);

  // Authenticated State tracking
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Core Persisted States synchronized with Cloud Firestore
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [intelliQuestions, setIntelliQuestions] = useState<InterviewIntelligenceQuestion[]>([]);
  const [plans, setPlans] = useState<ActivityPlan[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [personalReminders, setPersonalReminders] = useState<PersonalReminder[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [reminderSettings, setReminderSettings] = useState<PersonalReminderSettings | null>(null);

  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const processedToastsRef = React.useRef<Set<string>>(new Set());
  const initialLoadTimeRef = React.useRef<number>(Date.now());

  useEffect(() => {
    if (notifications.length === 0) return;

    const newNotifications = notifications.filter(n => {
      const isNew = !processedToastsRef.current.has(n.id);
      const isRecent = new Date(n.date).getTime() > initialLoadTimeRef.current - 5050;
      return isNew && isRecent && !n.read;
    });

    if (newNotifications.length > 0) {
      newNotifications.forEach(notif => {
        processedToastsRef.current.add(notif.id);

        setActiveToasts(prev => {
          if (prev.some(t => t.id === notif.id)) return prev;
          return [...prev, notif];
        });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notif.title, {
              body: notif.message,
              icon: '/favicon.ico'
            });
          } catch (e) {
            console.warn("Desktop notification triggered error:", e);
          }
        }

        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
        }, 6000);
      });
    }
  }, [notifications]);

  const handleExecuteToastAction = (toast: AppNotification) => {
    setActiveToasts(prev => prev.filter(t => t.id !== toast.id));
    if (toast.actionUrl) {
      setActiveTab(toast.actionUrl);
    }
  };

  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState?.prepTracker?.activeTab) {
      window.history.replaceState(
        { ...currentState, prepTracker: { ...(currentState?.prepTracker || {}), activeTab } },
        '',
        window.location.href,
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const nextTab = event.state?.prepTracker?.activeTab;
      if (typeof nextTab === 'string') {
        isHandlingHistoryRef.current = true;
        setActiveTab(nextTab);
        setIsNavOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isHandlingHistoryRef.current) {
      isHandlingHistoryRef.current = false;
      return;
    }

    const currentState = window.history.state;
    if (currentState?.prepTracker?.activeTab === activeTab) return;

    window.history.pushState(
      { ...currentState, prepTracker: { ...(currentState?.prepTracker || {}), activeTab } },
      '',
      window.location.href,
    );
  }, [activeTab]);

  // 1. Session state detection and recovery
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const fetchUserProfileWithRetry = async (retries = 3, delay = 250) => {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              setUserProfile(snap.data());
            } else {
              const initialProfile = {
                id: currentUser.uid,
                email: currentUser.email || '',
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Candidate',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await setDoc(userDocRef, initialProfile);
              setUserProfile(initialProfile);
            }
          } catch (err: any) {
            if (retries > 0 && (err.code === 'permission-denied' || err.message?.includes('permission'))) {
              console.warn(`Profile fetch permission-denied. Retrying in ${delay}ms... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchUserProfileWithRetry(retries - 1, delay * 2);
            } else {
              throw err;
            }
          }
        };

        fetchUserProfileWithRetry().catch((err) => {
          console.warn("Firestore user profile document is restricted (deploying firestore.rules is pending). Falling back to client-side auth profile details.");
          setUserProfile({
            id: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Active Candidate',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Multi-user Firebase Collections Snapshot bindings
  useEffect(() => {
    if (!user) {
      setTopics([]);
      return;
    }
    const q = query(collection(db, 'topics'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Topic[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Topic);
      });
      setTopics(list);
    }, (error) => {
      console.error("Topics snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setQuestions([]);
      return;
    }
    const q = query(collection(db, 'questions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Question[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Question);
      });
      setQuestions(list);
    }, (error) => {
      console.error("Questions snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }
    const q = query(collection(db, 'jobApplications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: JobApplication[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as JobApplication);
      });
      setApplications(list);
    }, (error) => {
      console.error("Applications snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      return;
    }
    const q = query(collection(db, 'interviews'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Interview[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Interview);
      });
      setInterviews(list);
    }, (error) => {
      console.error("Interviews snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMistakes([]);
      return;
    }
    const q = query(collection(db, 'mistakes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Mistake[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Mistake);
      });
      setMistakes(list);
    }, (error) => {
      console.error("Mistakes snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    const q = query(collection(db, 'studySessions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: StudySession[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as StudySession);
      });
      setSessions(list);
    }, (error) => {
      console.error("Sessions snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as AppNotification);
      });
      list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(list);
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setVoiceRecordings([]);
      return;
    }
    const q = query(collection(db, 'voiceRecordings'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VoiceRecording[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as VoiceRecording);
      });
      setVoiceRecordings(list);
    }, (error) => {
      console.error("Voice recordings snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIntelliQuestions([]);
      return;
    }
    const q = query(collection(db, 'intelliQuestions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: InterviewIntelligenceQuestion[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as InterviewIntelligenceQuestion);
      });
      setIntelliQuestions(list);
    }, (error) => {
      console.error("Intelligence questions snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Activity Plans Sync
  useEffect(() => {
    if (!user) {
      setPlans([]);
      return;
    }
    const q = query(collection(db, 'activityPlans'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ActivityPlan[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ActivityPlan);
      });
      setPlans(list);
    }, (error) => {
      console.error("Activity plans snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Daily Tasks Sync
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const q = query(collection(db, 'dailyTasks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DailyTask[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as DailyTask);
      });
      setTasks(list);
    }, (error) => {
      console.error("Daily tasks snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Journals Sync
  useEffect(() => {
    if (!user) {
      setJournals([]);
      return;
    }
    const q = query(collection(db, 'journals'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Journal[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Journal);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setJournals(list);
    }, (error) => {
      console.error("Journals snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Roadmaps Sync
  useEffect(() => {
    if (!user) {
      setRoadmaps([]);
      return;
    }
    const q = query(collection(db, 'roadmaps'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Roadmap[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Roadmap);
      });
      setRoadmaps(list);
    }, (error) => {
      console.error("Roadmaps snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Mock Interviews Sync
  useEffect(() => {
    if (!user) {
      setMockInterviews([]);
      return;
    }
    const q = query(collection(db, 'mockInterviews'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MockInterview[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as MockInterview);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setMockInterviews(list);
    }, (error) => {
      console.error("MockInterviews snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Personal Reminders Sync
  useEffect(() => {
    if (!user) {
      setPersonalReminders([]);
      return;
    }
    const q = query(collection(db, 'personalReminders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PersonalReminder[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as PersonalReminder);
      });
      setPersonalReminders(list);
    }, (error) => {
      console.error("PersonalReminders snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Reminder Logs Sync
  useEffect(() => {
    if (!user) {
      setReminderLogs([]);
      return;
    }
    const q = query(collection(db, 'reminderLogs'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ReminderLog[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ReminderLog);
      });
      setReminderLogs(list);
    }, (error) => {
      console.error("ReminderLogs snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Reminder Settings Sync
  useEffect(() => {
    if (!user) {
      setReminderSettings(null);
      return;
    }
    const docRef = doc(db, 'reminderSettings', user.uid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setReminderSettings(snapshot.data() as PersonalReminderSettings);
      } else {
        // Seed default settings
        const defaultSettings: PersonalReminderSettings = {
          userId: user.uid,
          notificationSound: true,
          reminderDuration: 5,
          defaultSnoozeTime: 15,
          weekendMode: true,
          dndEnabled: false,
          dndStart: '23:00',
          dndEnd: '07:00'
        };
        setDoc(docRef, defaultSettings).then(() => {
          setReminderSettings(defaultSettings);
        }).catch(err => console.error("Error seeding default reminder settings:", err));
      }
    }, (error) => {
      console.error("ReminderSettings snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Auto-generation of daily tasks for active plans (Feature 2)
  useEffect(() => {
    if (!user || plans.length === 0) return;

    const generateTodayTasks = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Active plans today
      const activePlans = plans.filter(p => todayStr >= p.startDate && todayStr <= p.endDate);
      
      // Standard system tasks (Feature 2)
      const systemTasks = [
        { id: 'system-recall', title: 'Recall Session', targetHours: 0.5, category: 'Technical' as ActivityCategory },
        { id: 'system-revision', title: 'Revision Queue', targetHours: 0.5, category: 'Technical' as ActivityCategory },
      ];

      const batch = writeBatch(db);
      let needsCommit = false;

      // Check and add plans
      activePlans.forEach(plan => {
        const taskExists = tasks.some(t => t.planId === plan.id && t.date === todayStr);
        if (!taskExists) {
          const taskId = `task-${plan.id}-${todayStr}`;
          const taskDocRef = doc(db, 'dailyTasks', taskId);
          batch.set(taskDocRef, {
            id: taskId,
            planId: plan.id,
            userId: user.uid,
            date: todayStr,
            status: 'Pending',
            title: plan.title,
            targetHours: plan.targetHours,
            category: plan.category
          });
          needsCommit = true;
        }
      });

      // Check and add system tasks
      systemTasks.forEach(sys => {
        const taskExists = tasks.some(t => t.planId === sys.id && t.date === todayStr);
        if (!taskExists) {
          const taskId = `task-${sys.id}-${todayStr}`;
          const taskDocRef = doc(db, 'dailyTasks', taskId);
          batch.set(taskDocRef, {
            id: taskId,
            planId: sys.id,
            userId: user.uid,
            date: todayStr,
            status: 'Pending',
            title: sys.title,
            targetHours: sys.targetHours,
            category: sys.category
          });
          needsCommit = true;
        }
      });

      if (needsCommit) {
        try {
          await batch.commit();
          await pushNotification({
            title: 'Daily Tasks Generated',
            message: 'Your custom preparation habit cards and spacing revisions are now active for today.',
            type: 'daily'
          });
        } catch (err) {
          console.error("Auto-generation of checklist nodes failed:", err);
        }
      }
    };

    generateTodayTasks();
  }, [user, plans, tasks]);

  // Real-time reminders background daemon checking loop
  useEffect(() => {
    if (!user || personalReminders.length === 0) return;

    const checkDueReminders = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const isWeekendDay = now.getDay() === 0 || now.getDay() === 6; // 0=Sun, 6=Sat

      // If weekend and weekendMode is disabled, return
      if (isWeekendDay && reminderSettings && !reminderSettings.weekendMode) return;

      // Handle Do Not Disturb Boundaries
      if (reminderSettings && reminderSettings.dndEnabled) {
        const dndStartMins = parseTimeToMinutes(reminderSettings.dndStart);
        const dndEndMins = parseTimeToMinutes(reminderSettings.dndEnd);
        const currentMins = now.getHours() * 60 + now.getMinutes();

        const inDND = dndStartMins <= dndEndMins
          ? (currentMins >= dndStartMins && currentMins <= dndEndMins)
          : (currentMins >= dndStartMins || currentMins <= dndEndMins);

        if (inDND) return;
      }

      personalReminders.forEach(async (rem) => {
        if (!rem.active) return;

        // Check date range limits
        if (todayStr < rem.startDate || todayStr > rem.endDate) return;

        // Parse reminder time to HH:MM (handles 12h or 24h input from user forms)
        const remTime24 = convertTo24h(rem.reminderTime);
        const [remH, remM] = remTime24.split(':').map(Number);
        
        if (now.getHours() === remH && now.getMinutes() === remM) {
          // Check if already triggered today
          const alreadyLogged = reminderLogs.some(l => l.reminderId === rem.id && l.date === todayStr && (l.status === 'Completed' || l.status === 'Skipped' || l.status === 'Missed'));
          
          if (!alreadyLogged) {
            // Push alert to Firestore notification tray so it pops instantly
            await pushNotification({
              title: `Reminder Alert: ${rem.title}`,
              message: rem.notificationMessage || `It is time for your task: "${rem.title}".`,
              type: 'daily'
            });

            // Also seed a pending log to track occurrence if not exists
            const hasPending = reminderLogs.some(l => l.reminderId === rem.id && l.date === todayStr);
            if (!hasPending) {
              const logId = `log-${rem.id}-${todayStr}-${Date.now()}`;
              await setDoc(doc(db, 'reminderLogs', logId), {
                id: logId,
                reminderId: rem.id,
                userId: user.uid,
                date: todayStr,
                status: 'Pending'
              });
            }
          }
        }
      });
    };

    const parseTimeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const convertTo24h = (timeStr: string) => {
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      return timeStr.padStart(5, '0');
    };

    const interval = setInterval(checkDueReminders, 60000); // Check every minute
    checkDueReminders(); // Initial check on load

    return () => clearInterval(interval);
  }, [user, personalReminders, reminderLogs, reminderSettings]);

  // Seeding engine to prep sandbox for new users
  const handleSeedSandbox = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      initialTopics.forEach((t) => {
        batch.set(doc(db, 'topics', t.id), { ...t, userId: user.uid });
      });
      initialQuestions.forEach((q) => {
        batch.set(doc(db, 'questions', q.id), { ...q, userId: user.uid });
      });
      initialJobApplications.forEach((ja) => {
        batch.set(doc(db, 'jobApplications', ja.id), { ...ja, userId: user.uid });
      });
      initialInterviews.forEach((i) => {
        batch.set(doc(db, 'interviews', i.id), { ...i, userId: user.uid });
      });
      initialMistakes.forEach((m) => {
        batch.set(doc(db, 'mistakes', m.id), { ...m, userId: user.uid });
      });
      initialStudySessions.forEach((s) => {
        batch.set(doc(db, 'studySessions', s.id), { ...s, userId: user.uid });
      });
      initialNotifications.forEach((n) => {
        batch.set(doc(db, 'notifications', n.id), { ...n, userId: user.uid });
      });
      initialIntelliQuestions.forEach((iq) => {
        batch.set(doc(db, 'intelliQuestions', iq.id), { ...iq, userId: user.uid });
      });

      await batch.commit();
      
      await pushNotification({
        title: 'Sandbox Seeding Complete',
        message: 'Successfully populated cloud workspace with corporate engineering collections.',
        type: 'daily'
      });
    } catch (err) {
      console.error(err);
      alert('Sandbox seeding failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Cloud restoration hook for CloudBackupControls callback
  const handleRestoreCloudBackup = async (backupData: any) => {
    if (!user) return;
    setLoading(true);
    try {
      const collectionsToFlush = ['topics', 'questions', 'jobApplications', 'interviews', 'mistakes', 'studySessions', 'voiceRecordings', 'notifications', 'intelliQuestions'];
      for (const colName of collectionsToFlush) {
        const q = query(collection(db, colName), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const delBatch = writeBatch(db);
        snap.forEach((doc) => {
          delBatch.delete(doc.ref);
        });
        await delBatch.commit();
      }

      const addBatch = writeBatch(db);
      backupData.topics?.forEach((item: any) => addBatch.set(doc(db, 'topics', item.id), { ...item, userId: user.uid }));
      backupData.questions?.forEach((item: any) => addBatch.set(doc(db, 'questions', item.id), { ...item, userId: user.uid }));
      backupData.applications?.forEach((item: any) => addBatch.set(doc(db, 'jobApplications', item.id), { ...item, userId: user.uid }));
      backupData.interviews?.forEach((item: any) => addBatch.set(doc(db, 'interviews', item.id), { ...item, userId: user.uid }));
      backupData.mistakes?.forEach((item: any) => addBatch.set(doc(db, 'mistakes', item.id), { ...item, userId: user.uid }));
      backupData.sessions?.forEach((item: any) => addBatch.set(doc(db, 'studySessions', item.id), { ...item, userId: user.uid }));
      backupData.voiceRecordings?.forEach((item: any) => addBatch.set(doc(db, 'voiceRecordings', item.id), { ...item, userId: user.uid }));
      backupData.notifications?.forEach((item: any) => addBatch.set(doc(db, 'notifications', item.id), { ...item, userId: user.uid }));
      backupData.intelliQuestions?.forEach((item: any) => addBatch.set(doc(db, 'intelliQuestions', item.id), { ...item, userId: user.uid }));
      
      await addBatch.commit();
    } catch (err) {
      console.error("Backup restoration error:", err);
      alert('Restoring snapshot failed, index corrupted.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TOPIC MODIFIERS (Direct to Firestore)
  // ==========================================
  const handleAddTopic = async (newTopic: Omit<Topic, 'id' | 'revisionCount' | 'forgotCount'>) => {
    if (!user) return;
    const topicId = 'topic-' + Date.now();
    const created: Topic = {
      ...newTopic,
      id: topicId,
      userId: user.uid,
      revisionCount: 0,
      forgotCount: 0,
    };
    try {
      await setDoc(doc(db, 'topics', topicId), created);
      await pushNotification({
        title: 'New Topic Created',
        message: `"${created.name}" registered successfully. Added to Spaced Repetition track.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `topics/${topicId}`);
    }
  };

  const handleUpdateTopic = async (updated: Topic) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'topics', updated.id), {
        ...updated,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `topics/${updated.id}`);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!user) return;
    if (confirm("Confirm deleting this studied topic? Linked dependencies could trigger warning shifts.")) {
      try {
        await deleteDoc(doc(db, 'topics', id));
        
        // Cascade delete linked questions to prevent orphaned indices
        const orphans = questions.filter(q => q.topicId === id);
        const batch = writeBatch(db);
        orphans.forEach(q => {
          batch.delete(doc(db, 'questions', q.id));
        });
        await batch.commit();

        await pushNotification({
          title: 'Topic Deleted',
          message: 'Topic card destroyed, orphan question bank nodes resolved.',
          type: 'daily'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `topics/${id}`);
      }
    }
  };

  // ==========================================
  // JOURNAL MODIFIERS
  // ==========================================
  const handleAddJournal = async (newJournal: Omit<Journal, 'id' | 'userId'>) => {
    if (!user) return;
    const journalId = 'journal-' + Date.now();
    const created: Journal = {
      ...newJournal,
      id: journalId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'journals', journalId), created);
      await pushNotification({
        title: 'Reflection Entry Logged',
        message: `Your insight "${created.title}" was saved successfully.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `journals/${journalId}`);
    }
  };

  const handleUpdateJournal = async (updated: Journal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'journals', updated.id), {
        ...updated,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `journals/${updated.id}`);
    }
  };

  const handleUploadJournalAttachment = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('You must be signed in to attach files.');
    }

    return saveLocalFile(file, file.name);
  };

  const handleDeleteJournal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'journals', id));
      await pushNotification({
        title: 'Reflection Removed',
        message: 'Journal entry removed from space.',
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `journals/${id}`);
    }
  };

  // ==========================================
  // ROADMAP MODIFIERS
  // ==========================================
  const handleAddRoadmap = async (newRoadmap: Omit<Roadmap, 'id' | 'userId'>) => {
    if (!user) return;
    const roadmapId = 'roadmap-' + Date.now();
    const created: Roadmap = {
      ...newRoadmap,
      id: roadmapId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'roadmaps', roadmapId), created);
      await pushNotification({
        title: 'Learning Pathway Active',
        message: `Track "${created.title}" is now active in your profile.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `roadmaps/${roadmapId}`);
    }
  };

  const handleUpdateRoadmap = async (updated: Roadmap) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'roadmaps', updated.id), {
        ...updated,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `roadmaps/${updated.id}`);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'roadmaps', id));
      await pushNotification({
        title: 'Pathway Removed',
        message: 'Roadmap track disassembled.',
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `roadmaps/${id}`);
    }
  };

  // ==========================================
  // QUESTION MODIFIERS
  // ==========================================
  const handleAddQuestion = async (newQ: Omit<Question, 'id' | 'askedCount'>) => {
    if (!user) return;
    const qId = 'q-' + Date.now();
    const created: Question = {
      ...newQ,
      id: qId,
      userId: user.uid,
      askedCount: 0
    };
    try {
      await setDoc(doc(db, 'questions', qId), created);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `questions/${qId}`);
    }
  };

  const handleUpdateQuestion = async (updated: Question) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'questions', updated.id), {
        ...updated,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `questions/${updated.id}`);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    }
  };


  // ==========================================
  // ACTIVE RECALL EVALUATOR Logic (CRITICAL SPACED REPETITION ENGINE!)
  // ==========================================
  const handleRecallResponse = async (questionId: string, topicId: string, response: 'Remembered' | 'Partially' | 'Forgot') => {
    if (!user) return;
    
    const targetQ = questions.find(q => q.id === questionId);
    const targetT = topics.find(t => t.id === topicId);
    if (!targetQ || !targetT) return;

    const updatedQ: Question = {
      ...targetQ,
      askedCount: targetQ.askedCount + 1,
      lastAskedDate: new Date().toISOString(),
      lastRevisedDate: new Date().toISOString()
    };

    const rc = targetT.revisionCount + 1;
    let cScore = targetT.confidenceScore;
    let rScore = targetT.recallScore;
    let forg = targetT.forgotCount;
    let nextIntervalDays = 1;

    if (response === 'Remembered') {
      cScore = Math.min(100, cScore + 8);
      rScore = Math.min(100, rScore + 10);
      forg = Math.max(0, forg - 1);
      const stages = [1, 3, 7, 15, 30, 60, 90];
      nextIntervalDays = stages[Math.min(rc, stages.length - 1)];

    } else if (response === 'Partially') {
      cScore = Math.min(100, cScore + 2);
      rScore = Math.min(100, rScore + 4);
      nextIntervalDays = 1;

    } else if (response === 'Forgot') {
      forg = forg + 1;
      cScore = Math.max(5, cScore - 15);
      rScore = Math.max(0, rScore - 20);
      nextIntervalDays = 0; 

      await pushNotification({
        title: `Retention Deficit: ${targetT.name}`,
        message: `You marked "${targetT.name}" concept as Forgotten. Transferred to High Priority Revision Queue.`,
        type: 'weakness'
      });
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextIntervalDays);

    const updatedT: Topic = {
      ...targetT,
      revisionCount: rc,
      confidenceScore: cScore,
      recallScore: rScore,
      forgotCount: forg,
      lastRevisionDate: new Date().toISOString(),
      nextRevisionDate: nextDate.toISOString(),
      status: response === 'Forgot' ? 'Revising' : targetT.status
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'questions', questionId), { ...updatedQ, userId: user.uid });
      batch.set(doc(db, 'topics', topicId), { ...updatedT, userId: user.uid });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };


  // ==========================================
  // VOICE RECORDINGS MANAGEMENT (Cloud Storage Integration)
  // ==========================================
  const handleAddVoice = async (rec: Omit<VoiceRecording, 'id'>) => {
    if (!user) return;
    const recId = 'voice-' + Date.now();
    let finalAudioUrl = rec.audioUrl;

    try {
      if (rec.audioUrl.startsWith('data:') || rec.audioUrl.startsWith('blob:')) {
        const response = await fetch(rec.audioUrl);
        const blob = await response.blob();
        finalAudioUrl = await saveLocalFile(blob, `${recId}.webm`);
      }
    } catch (err) {
      console.error("Local audio save failed.", err);
      alert('Audio save failed. Your browser may have blocked local storage or private mode storage.');
      return;
    }

    const created: VoiceRecording = {
      ...rec,
      id: recId,
      userId: user.uid,
      audioUrl: finalAudioUrl
    };

    try {
      await setDoc(doc(db, 'voiceRecordings', recId), created);
      await pushNotification({
        title: 'Verbal Study Track Saved',
        message: `Audio track "${created.title}" was saved locally on this device.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `voiceRecordings/${recId}`);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'voiceRecordings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `voiceRecordings/${id}`);
    }
  };


  // ==========================================
  // JOB APPLICATION AND SCHEDULER MODIFIERS
  // ==========================================
  const handleAddApplication = async (app: Omit<JobApplication, 'id'>) => {
    if (!user) return;
    const appId = 'app-' + Date.now();
    const created: JobApplication = { ...app, id: appId, userId: user.uid };
    try {
      await setDoc(doc(db, 'jobApplications', appId), created);
      await pushNotification({
        title: 'Application Logged',
        message: `Registered application at ${app.company} [${app.position}]`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobApplications/${appId}`);
    }
  };

  const handleUpdateApplication = async (updated: JobApplication) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'jobApplications', updated.id), {
        ...updated,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobApplications/${updated.id}`);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'jobApplications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobApplications/${id}`);
    }
  };

  const handleAddInterview = async (int: Omit<Interview, 'id'>) => {
    if (!user) return;
    const intId = 'int-' + Date.now();
    const created: Interview = { ...int, id: intId, userId: user.uid };
    try {
      await setDoc(doc(db, 'interviews', intId), created);
      await pushNotification({
        title: `Interview Scheduled`,
        message: `Interview structured with ${int.companyName} on ${new Date(int.date).toLocaleDateString()}`,
        type: 'interview'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `interviews/${intId}`);
    }
  };

  const handleUpdateInterview = async (updated: Interview) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'interviews', updated.id), {
        ...updated,
        userId: user.uid
      });

      if (updated.status === 'Completed' && updated.questionsMissed.length > 0) {
        const lowercasedMissed = updated.questionsMissed.map(q => q.toLowerCase());
        const batch = writeBatch(db);
        
        topics.forEach(t => {
          const matchesMissed = lowercasedMissed.some(miss => 
            t.name.toLowerCase().includes(miss) || 
            t.category.toLowerCase().includes(miss) ||
            miss.includes(t.name.toLowerCase())
          );

          if (matchesMissed) {
            batch.set(doc(db, 'topics', t.id), {
              ...t,
              userId: user.uid,
              forgotCount: t.forgotCount + 1,
              confidenceScore: Math.max(5, t.confidenceScore - 10)
            });
          }
        });
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `interviews/${updated.id}`);
    }
  };

  const handleDeleteInterview = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'interviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `interviews/${id}`);
    }
  };

  const handleAddMockInterview = async (mock: Omit<MockInterview, 'id' | 'userId'>) => {
    if (!user) return;
    const mockId = 'mock-' + Date.now();
    const created: MockInterview = {
      ...mock,
      id: mockId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'mockInterviews', mockId), created);
      await pushNotification({
        title: 'Mock Interview Evaluated',
        message: `Round ${mock.roundType} finished. Score: ${mock.score}%`,
        type: 'interview'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mockInterviews/${mockId}`);
    }
  };

  const handleDeleteMockInterview = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'mockInterviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mockInterviews/${id}`);
    }
  };

  const cleanObject = (obj: any) => {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  };

  const handleAddPersonalReminder = async (rem: Omit<PersonalReminder, 'id' | 'userId'>) => {
    if (!user) return;
    const remId = 'reminder-' + Date.now();
    const created = cleanObject({
      ...rem,
      id: remId,
      userId: user.uid
    });
    try {
      await setDoc(doc(db, 'personalReminders', remId), created);
      await pushNotification({
        title: 'New Personal Goal Registered',
        message: `Goal "${rem.title}" created under Category: ${rem.category}.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `personalReminders/${remId}`);
    }
  };

  const handleUpdatePersonalReminder = async (updated: PersonalReminder) => {
    if (!user) return;
    const cleaned = cleanObject({
      ...updated,
      userId: user.uid
    });
    try {
      await setDoc(doc(db, 'personalReminders', updated.id), cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `personalReminders/${updated.id}`);
    }
  };

  const handleDeletePersonalReminder = async (id: string) => {
    if (!user) return;
    if (confirm("Decommissioning this reminder will also clear all linked consistency log records. Proceed?")) {
      try {
        await deleteDoc(doc(db, 'personalReminders', id));
        
        // Cascade delete logs
        const orphans = reminderLogs.filter(l => l.reminderId === id);
        const batch = writeBatch(db);
        orphans.forEach(l => {
          batch.delete(doc(db, 'reminderLogs', l.id));
        });
        await batch.commit();

        await pushNotification({
          title: 'Goal Decommissioned',
          message: 'Personal Reminder cleared successfully.',
          type: 'daily'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `personalReminders/${id}`);
      }
    }
  };

  const handleActionPersonalReminder = async (reminderId: string, status: ReminderStatus, snoozeMinutes?: number) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const targetRem = personalReminders.find(r => r.id === reminderId);
    if (!targetRem) return;

    // For water intake, we allow multiple logs per day to track multiple glasses
    const isMultiLogAllowed = targetRem.targetGlasses !== undefined;

    // Upsert strategy: reuse today's existing log if it exists to avoid duplicate accumulation
    const existingLog = !isMultiLogAllowed ? reminderLogs.find(l => l.reminderId === reminderId && l.date === todayStr) : null;
    const logId = existingLog ? existingLog.id : `log-${reminderId}-${todayStr}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logRef = doc(db, 'reminderLogs', logId);

    let snoozedUntil: string | undefined = undefined;
    if (status === 'Snoozed' && snoozeMinutes) {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);
      snoozedUntil = snoozeTime.toISOString();
    }

    const newLog: any = {
      id: logId,
      reminderId,
      userId: user.uid,
      date: todayStr,
      status,
    };
    if (status === 'Completed') {
      newLog.completedAt = new Date().toISOString();
    }
    if (snoozedUntil) {
      newLog.snoozedUntil = snoozedUntil;
    }
    if (snoozeMinutes !== undefined) {
      newLog.snoozeDurationMinutes = snoozeMinutes;
    }

    try {
      const batch = writeBatch(db);
      batch.set(logRef, newLog);

      // Handle Habit Streaks
      if (targetRem.isHabit && status === 'Completed') {
        const completedDates = targetRem.habitCompletedDates ? [...targetRem.habitCompletedDates] : [];
        if (!completedDates.includes(todayStr)) {
          completedDates.push(todayStr);
        }

        // Sort dates desc
        const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));
        
        // Compute streak
        let streak = 0;
        const tempDate = new Date();
        // Check today and consecutive previous dates
        for (let i = 0; i < 365; i++) {
          const dStr = tempDate.toISOString().split('T')[0];
          if (completedDates.includes(dStr)) {
            streak++;
            tempDate.setDate(tempDate.getDate() - 1);
          } else {
            // If checking today and it's not completed, allow streak if yesterday was completed
            if (i === 0) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yStr = yesterday.toISOString().split('T')[0];
              if (completedDates.includes(yStr)) {
                tempDate.setDate(tempDate.getDate() - 1);
                continue;
              }
            }
            break;
          }
        }

        const bestStreak = Math.max(targetRem.habitBestStreak || 0, streak);

        batch.set(doc(db, 'personalReminders', reminderId), {
          ...targetRem,
          habitStreak: streak,
          habitBestStreak: bestStreak,
          habitCompletedDates: completedDates,
          userId: user.uid
        });

        // Trigger streak badge trigger notification
        if (streak > 0 && streak % 5 === 0) {
          await pushNotification({
            title: `Habit Milestone: ${streak} Days!`,
            message: `Awesome job! You achieved a ${streak} days streak on "${targetRem.title}".`,
            type: 'streak'
          });
        }
      }

      await batch.commit();

      if (status === 'Completed') {
        await pushNotification({
          title: `Goal Checked In: ${targetRem.title}`,
          message: `Logged complete for habit checklist element today. Keep it up!`,
          type: 'daily'
        });
      }
    } catch (err) {
      console.error("Error logging action reminder:", err);
    }
  };

  const handleUpdateReminderSettings = async (updatedSettings: PersonalReminderSettings) => {
    if (!user) return;
    const settingsWithUserId = { ...updatedSettings, userId: user.uid };
    try {
      await setDoc(doc(db, 'reminderSettings', user.uid), settingsWithUserId);
      setReminderSettings(settingsWithUserId); // store the userId-corrected version locally
    } catch (err) {
      console.error("Error updating reminder settings:", err);
    }
  };

  const handleBulkImport = async (
    dataType: string,
    records: any[],
    duplicatePolicy: 'skip' | 'replace' | 'keep'
  ): Promise<{ imported: number; updated: number; skipped: number }> => {
    if (!user) throw new Error('User session is required');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    const batch = writeBatch(db);

    records.forEach((item, idx) => {
      let existing: any = null;
      let colName = '';

      switch (dataType) {
        case 'Topics': {
          colName = 'topics';
          existing = topics.find(t => t.name.toLowerCase().trim() === item.name.toLowerCase().trim());
          break;
        }
        case 'Questions': {
          colName = 'questions';
          existing = questions.find(q => q.question.toLowerCase().trim() === item.question.toLowerCase().trim());
          break;
        }
        case 'Interview Questions': {
          colName = 'intelliQuestions';
          existing = intelliQuestions.find(iq => iq.question.toLowerCase().trim() === item.question.toLowerCase().trim());
          break;
        }
        case 'Mistake Journals': {
          colName = 'mistakes';
          existing = mistakes.find(m => m.companyName.toLowerCase().trim() === item.companyName.toLowerCase().trim() && m.reason.toLowerCase().trim() === item.reason.toLowerCase().trim());
          break;
        }
        case 'Activity Plans': {
          colName = 'activityPlans';
          existing = plans.find(p => p.title.toLowerCase().trim() === item.title.toLowerCase().trim());
          break;
        }
        case 'Roadmaps': {
          colName = 'roadmaps';
          existing = roadmaps.find(r => r.title.toLowerCase().trim() === item.title.toLowerCase().trim());
          break;
        }
        case 'Journal Entries': {
          colName = 'journals';
          existing = journals.find(j => j.title.toLowerCase().trim() === item.title.toLowerCase().trim() && j.content.toLowerCase().trim() === item.content.toLowerCase().trim());
          break;
        }
        default:
          return;
      }

      if (existing) {
        if (duplicatePolicy === 'skip') {
          skipped++;
          return;
        }
        if (duplicatePolicy === 'replace') {
          updated++;
        } else {
          imported++;
          existing = null; // treat as new
        }
      } else {
        imported++;
      }

      let docData: any = {};
      let docId = '';

      switch (dataType) {
        case 'Topics': {
          docId = existing ? existing.id : 'topic-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            name: item.name,
            category: item.category,
            description: item.description || '',
            status: item.status || 'Not Started',
            confidenceScore: Number(item.confidenceScore) || 0,
            recallScore: Number(item.recallScore) || 0,
            revisionCount: Number(item.revisionCount) || 0,
            forgotCount: Number(item.forgotCount) || 0,
            notes: item.notes || '',
            dependencyIds: Array.isArray(item.dependencyIds) ? item.dependencyIds : []
          };
          break;
        }
        case 'Questions': {
          docId = existing ? existing.id : 'question-' + Date.now() + '-' + idx;
          
          let topicId = '';
          if (item.topicName) {
            const matchedTopic = topics.find(t => t.name.toLowerCase().trim() === item.topicName.toLowerCase().trim());
            if (matchedTopic) {
              topicId = matchedTopic.id;
            } else {
              const newTopicId = 'topic-' + Date.now() + '-' + idx;
              batch.set(doc(db, 'topics', newTopicId), {
                id: newTopicId,
                userId: user.uid,
                name: item.topicName,
                category: 'Uncategorized',
                description: 'Auto-generated topic from bulk questions import.',
                status: 'Not Started',
                confidenceScore: 0,
                recallScore: 0,
                revisionCount: 0,
                forgotCount: 0,
                notes: '',
                dependencyIds: []
              });
              topics.push({
                id: newTopicId,
                name: item.topicName,
                category: 'Uncategorized',
                description: 'Auto-generated topic from bulk questions import.',
                status: 'Not Started',
                confidenceScore: 0,
                recallScore: 0,
                revisionCount: 0,
                forgotCount: 0,
                notes: '',
                dependencyIds: []
              });
              topicId = newTopicId;
            }
          }

          docData = {
            id: docId,
            userId: user.uid,
            question: item.question,
            answer: item.answer,
            difficulty: item.difficulty || 'Medium',
            topicId: topicId || 'general',
            tags: typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : (Array.isArray(item.tags) ? item.tags : []),
            source: item.source || 'Interview',
            askedCount: Number(item.askedCount) || 0
          };
          break;
        }
        case 'Interview Questions': {
          docId = existing ? existing.id : 'intelli-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            company: item.company || 'Unknown',
            question: item.question,
            answer: item.answer,
            difficulty: item.difficulty || 'Medium',
            topic: item.topic || 'General',
            dateAsked: item.dateAsked || new Date().toISOString().substring(0, 10),
            result: item.result || 'Answered Correctly'
          };
          break;
        }
        case 'Mistake Journals': {
          docId = existing ? existing.id : 'mistake-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            companyName: item.companyName,
            reason: item.reason,
            missedQuestions: typeof item.missedQuestions === 'string' ? item.missedQuestions.split(',').map((q: string) => q.trim()).filter((q: string) => q !== '') : (Array.isArray(item.missedQuestions) ? item.missedQuestions : []),
            date: item.date || new Date().toISOString().substring(0, 10)
          };
          break;
        }
        case 'Activity Plans': {
          docId = existing ? existing.id : 'plan-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            title: item.title,
            targetHours: Number(item.targetHours) || 1,
            category: item.category || 'Technical',
            startDate: item.startDate || new Date().toISOString().substring(0, 10),
            endDate: item.endDate || new Date().toISOString().substring(0, 10),
            repeatType: item.repeatType || 'Daily'
          };
          break;
        }
        case 'Roadmaps': {
          docId = existing ? existing.id : 'roadmap-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            title: item.title,
            description: item.description || '',
            topics: Array.isArray(item.topics) ? item.topics.map((t: any) => ({
              name: t.name,
              dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
              completed: !!t.completed
            })) : [],
            isPrebuilt: false,
            isActive: !!item.isActive,
            createdAt: item.createdAt || new Date().toISOString()
          };
          break;
        }
        case 'Journal Entries': {
          docId = existing ? existing.id : 'journal-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            title: item.title,
            content: item.content,
            type: item.type || 'Learning Journal',
            tags: typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : (Array.isArray(item.tags) ? item.tags : []),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          break;
        }
        default:
          return;
      }

      batch.set(doc(db, colName, docId), docData);
    });

    await batch.commit();

    await pushNotification({
      title: 'Bulk Import Finalized',
      message: `Parsed bulk operations: Imported ${imported}, updated ${updated}, skipped ${skipped} duplicate keys.`,
      type: 'daily'
    });

    return { imported, updated, skipped };
  };


  // ==========================================
  // INTERVIEW MISTAKES JOURNAL LOGIC
  // ==========================================
  const handleAddMistake = async (mistake: Omit<Mistake, 'id'>) => {
    if (!user) return;
    const mId = 'mistake-' + Date.now();
    const created: Mistake = {
      ...mistake,
      id: mId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'mistakes', mId), created);

      const batch = writeBatch(db);
      topics.forEach(t => {
        const isRelated = mistake.missedQuestions.some(missedQ => {
          const qClean = missedQ.toLowerCase();
          const tClean = t.name.toLowerCase();
          const catClean = t.category.toLowerCase();
          return qClean.includes(tClean) || tClean.includes(qClean) || qClean.includes(catClean);
        });

        if (isRelated) {
          batch.set(doc(db, 'topics', t.id), {
            ...t,
            forgotCount: t.forgotCount + 1,
            confidenceScore: Math.max(10, t.confidenceScore - 20),
            nextRevisionDate: new Date().toISOString()
          });
        }
      });
      await batch.commit();

      await pushNotification({
        title: 'Mistake Journal Entry logged',
        message: `Gaps recorded from ${mistake.companyName} round. Topic schedules updated.`,
        type: 'weakness'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mistakes/${mId}`);
    }
  };

  const handleDeleteMistake = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'mistakes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mistakes/${id}`);
    }
  };


  // ==========================================
  // STUDY SESSIONS TRACKER
  // ==========================================
  const handleAddSession = async (newSession: Omit<StudySession, 'id'>) => {
    if (!user) return;
    const ssId = 'session-' + Date.now();
    const created: StudySession = {
      ...newSession,
      id: ssId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'studySessions', ssId), created);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `studySessions/${ssId}`);
    }
  };


  // ==========================================
  // CORE NOTIFICATION BUILD SYSTEM
  // ==========================================
  const pushNotification = async (params: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    if (!user) return;
    const notifId = 'notif-' + Date.now();
    const created: AppNotification = {
      ...params,
      id: notifId,
      userId: user.uid,
      date: new Date().toISOString(),
      read: false
    };
    try {
      await setDoc(doc(db, 'notifications', notifId), created);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    // Find the notification in local state and use setDoc with the full object
    // (updateDoc partial patch fails the isValidNotification rule which requires all fields)
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    try {
      await setDoc(doc(db, 'notifications', id), { ...notif, read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // INTERVIEW INTELLIGENCE DATABASE SYSTEM
  // ==========================================
  const handleAddIntelliQuestion = async (newIQ: Omit<InterviewIntelligenceQuestion, 'id'>) => {
    if (!user) return;
    const iqId = 'intq-' + Date.now();
    const created: InterviewIntelligenceQuestion = {
      ...newIQ,
      id: iqId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'intelliQuestions', iqId), created);
      await pushNotification({
        title: 'Interview Knowledge Logged',
        message: `Enriched permanent database with a new question from ${newIQ.company}.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `intelliQuestions/${iqId}`);
    }
  };

  const handleDeleteIntelliQuestion = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'intelliQuestions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `intelliQuestions/${id}`);
    }
  };

  // ==========================================
  // HABITS AND ACTIVITY PLANNING DATABASE MUTATIONS
  // ==========================================
  const handleAddPlan = async (newPlan: Omit<ActivityPlan, 'id' | 'userId'>) => {
    if (!user) return;
    const planId = 'plan-' + Date.now();
    const created: ActivityPlan = {
      ...newPlan,
      id: planId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'activityPlans', planId), created);
      await pushNotification({
        title: 'New Activity Plan Created',
        message: `Registered "${created.title}" with target ${created.targetHours}h daily in your planner database.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `activityPlans/${planId}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!user) return;
    if (confirm("Decommissioning this habit plan will also delete all associated generated daily task trackers. Proceed?")) {
      try {
        await deleteDoc(doc(db, 'activityPlans', id));
        
        const orphans = tasks.filter(t => t.planId === id);
        const batch = writeBatch(db);
        orphans.forEach(t => {
          batch.delete(doc(db, 'dailyTasks', t.id));
        });
        await batch.commit();

        await pushNotification({
          title: 'Activity Plan Terminated',
          message: 'Decommissioned tracking plan and cascading daily tracker records successfully.',
          type: 'daily'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `activityPlans/${id}`);
      }
    }
  };

  const handleUpdateTaskInApp = async (updated: DailyTask, actualHours?: number, notes?: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'dailyTasks', updated.id), {
        ...updated,
        userId: user.uid
      });

      if (updated.status === 'Completed' && actualHours !== undefined) {
        const logId = 'log-' + Date.now();
        const logged: ActivityLog = {
          id: logId,
          taskId: updated.id,
          userId: user.uid,
          actualHours,
          notes: notes || '',
          loggedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'activityLogs', logId), logged);
        
        await pushNotification({
          title: `Milestone Accomplishment logged`,
          message: `Finished "${updated.title}" and logged ${actualHours} hours successfully.`,
          type: 'daily'
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `dailyTasks/${updated.id}`);
    }
  };

  const handleDeleteTaskInApp = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'dailyTasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `dailyTasks/${id}`);
    }
  };

  // 3. Loading check
  if (authLoading) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center font-sans antialiased relative">
        <div className="mesh-gradient opacity-80" />
        <Loader className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
        <p className="text-xs font-mono tracking-widest text-indigo-300 uppercase animate-pulse">Syncing Cloud Services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans select-none antialiased relative">
      <div className="mesh-gradient" />
      
      {/* 2. Top Navigation header layout block */}
      {user && (
      <header className="app-header text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo with clean typography */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs border border-indigo-400/30">
              <BookOpen className="w-5 h-5 text-indigo-50" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-base tracking-tight text-white font-sans">Preparation Tracker</span>
               
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5 leading-none">
                Focused Interview Readiness
              </span>
            </div>
          </div>

          {/* User profile identifier or Sign Out (Personalised Context!) */}
          {user ? (
            <div className="flex items-center gap-3.5 text-xs text-indigo-100 shrink-0 font-sans">
              <div className="hidden sm:flex flex-col items-end leading-none gap-1">
                <span className="font-bold text-slate-200">{user.email}</span>
                <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-0.5">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  {userProfile?.name || 'Active Candidate'}
                </span>
              </div>
              <button
                onClick={() => signOut(auth)}
                id="header-logout-btn"
                className="hidden sm:flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-xs font-semibold text-rose-350 hover:text-rose-300 cursor-pointer items-center gap-1.5 hover:shadow-md transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>

              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="sm:hidden p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Toggle navigation"
              >
                <Menu className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          ) : null}

        </div>
      </header>
      )}

      {/* 3. Main Workspace Container */}
      {!user ? (
        <AuthScreen />
      ) : (
        <>
          {/* Mobile Navigation Overlay & Slide Panel */}
          <AnimatePresence>
            {isNavOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNavOpen(false)}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                />
                
                {/* Right Slide Panel */}
                <motion.div
                  initial={{ x: 300 }}
                  animate={{ x: 0 }}
                  exit={{ x: 300 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-16 h-[calc(100vh-64px)] w-72 bg-slate-900 border-l border-slate-700/50 z-40 overflow-y-auto p-4"
                >
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 mb-3 font-black">
                      Explore Modules
                    </span>

                    {[
                      { label: 'Dashboard & Priorities', icon: Flame },
                      { label: 'Prep Intelligence Hub', icon: Sparkles },
                      { label: 'Topic Map & Spacing', icon: Compass },
                      { label: 'Question Bank & Practice', icon: HelpIcon },
                      { label: 'Interviews & Applications', icon: Calendar },
                      { label: 'Personal Reminders', icon: Bell },
                      { label: 'Activity Planner', icon: ListTodo },
                      { label: 'Analytics & Sessions', icon: Activity },
                      { label: 'Preparation Roadmaps', icon: Layers },
                      { label: 'My Achievements', icon: Award },
                      { label: 'Personal Journal', icon: BookOpen },
                      { label: 'Mock Interview Simulator', icon: Gamepad2 },
                      { label: 'Mobile & Offline Hub', icon: Smartphone },
                      { label: 'Import & Export Center', icon: Settings }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.label;
                      return (
                        <button
                          key={tab.label}
                          onClick={() => {
                            setActiveTab(tab.label);
                            setIsNavOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-650 text-white shadow-md border border-indigo-500/30' 
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}

                    {/* Mobile Sign Out */}
                    <button
                      onClick={() => {
                        signOut(auth);
                        setIsNavOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-350 hover:bg-rose-950/30 transition cursor-pointer mt-4 border border-rose-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col lg:flex-row gap-6">
          
          {/* Left column sidebar for filters & tabs selectors - Hidden on mobile */}
          <nav className="hidden lg:flex w-full lg:w-60 flex-col gap-4">
            
            {/* Navigation link group */}
            <div className="glass-card p-4 space-y-1.5">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 mb-2 font-black select-none">
                Explore Modules
              </span>

              {[
                { label: 'Dashboard & Priorities', icon: Flame },
                { label: 'Prep Intelligence Hub', icon: Sparkles },
                { label: 'Topic Map & Spacing', icon: Compass },
                { label: 'Question Bank & Practice', icon: HelpIcon },
                { label: 'Interviews & Applications', icon: Calendar },
                { label: 'Personal Reminders', icon: Bell },
                { label: 'Activity Planner', icon: ListTodo },
                { label: 'Analytics & Sessions', icon: Activity },
                { label: 'Preparation Roadmaps', icon: Layers },
                { label: 'My Achievements', icon: Award },
                { label: 'Personal Journal', icon: BookOpen },
                { label: 'Mock Interview Simulator', icon: Gamepad2 },
                { label: 'Mobile & Offline Hub', icon: Smartphone },
                { label: 'Import & Export Center', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold font-sans tracking-wide transition cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-650 text-white shadow-md border border-indigo-500/30 font-bold' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Persistent notification Center positioned directly under the sidebar */}
            <div className="hidden lg:block">
              <NotificationCenter 
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onClearAll={handleClearAll}
                topics={topics}
                questions={questions}
                interviews={interviews}
                applications={applications}
                sessions={sessions}
                tasks={tasks}
                journals={journals}
                mockInterviews={mockInterviews}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pushNotification={pushNotification}
                personalReminders={personalReminders}
              />
            </div>

          </nav>

          {/* Center/Right primary viewport panel */}
          <section className="flex-1 min-w-0 flex flex-col gap-6">
            
            {/* First-time welcome seed banner prompt */}
            {topics.length === 0 && (
              <div className="bg-slate-900/60 border border-indigo-500/25 rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-bounce" />
                <h3 className="text-base font-bold text-white mb-1.5 font-sans">Welcome to PrepMaster Cloud Space!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Your sandbox database in Firestore is currently unpopulated. Press the key below to seed with standard Java engineering topics and flashcards to start curves evaluation.
                </p>
                <button
                  onClick={handleSeedSandbox}
                  disabled={loading}
                  id="sandbox-seed-btn"
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl cursor-pointer shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {loading ? <Loader className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
                  Seed Sandbox Demo Workspace
                </button>
              </div>
            )}

            {/* Render Active Switch Tab View */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.985, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: -10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full flex flex-col gap-6"
              >
                {activeTab === 'Dashboard & Priorities' && (
              <div className="space-y-6">
                <Dashboard 
                  topics={topics}
                  questions={questions}
                  interviews={interviews}
                  mistakes={mistakes}
                  sessions={sessions}
                  notifications={notifications}
                  onStartSession={(id) => {
                    setActiveTab('Analytics & Sessions');
                  }}
                  onNavigate={(dest) => {
                    setActiveTab(dest);
                  }}
                  plans={plans}
                  tasks={tasks}
                  onUpdateTask={handleUpdateTaskInApp}
                  journals={journals}
                  roadmaps={roadmaps}
                  personalReminders={personalReminders}
                  reminderLogs={reminderLogs}
                  onActionReminder={handleActionPersonalReminder}
                />
                
                <CloudBackupControls 
                  userId={user.uid}
                  currentData={{
                    topics,
                    questions,
                    applications,
                    interviews,
                    mistakes,
                    sessions,
                    voiceRecordings,
                    notifications,
                    intelliQuestions
                  }}
                  onRestore={handleRestoreCloudBackup}
                  onPushNotification={pushNotification}
                />
              </div>
            )}

            {activeTab === 'Prep Intelligence Hub' && (
              <IntelligenceHub 
                topics={topics}
                questions={questions}
                interviews={interviews}
                mistakes={mistakes}
                sessions={sessions}
                voiceRecordings={voiceRecordings}
                onStartSession={(id) => {
                  setActiveTab('Analytics & Sessions');
                }}
                onNavigate={(dest) => {
                  setActiveTab(dest);
                }}
                intelliQuestions={intelliQuestions}
                onAddIntelliQuestion={handleAddIntelliQuestion}
                onDeleteIntelliQuestion={handleDeleteIntelliQuestion}
              />
            )}


          {activeTab === 'Topic Map & Spacing' && (
            <TopicManagement 
              topics={topics}
              onAddTopic={handleAddTopic}
              onUpdateTopic={handleUpdateTopic}
              onDeleteTopic={handleDeleteTopic}
            />
          )}

          {activeTab === 'Question Bank & Practice' && (
            <QuestionBank 
              questions={questions}
              topics={topics}
              voiceRecordings={voiceRecordings}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onRecallResponse={handleRecallResponse}
              onAddVoiceRecording={handleAddVoice}
              onDeleteVoiceRecording={handleDeleteVoice}
            />
          )}

          {activeTab === 'Interviews & Applications' && (
            <InterviewTracker 
              applications={applications}
              interviews={interviews}
              mistakes={mistakes}
              topics={topics}
              onAddApplication={handleAddApplication}
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              onAddInterview={handleAddInterview}
              onUpdateInterview={handleUpdateInterview}
              onDeleteInterview={handleDeleteInterview}
              onAddMistake={handleAddMistake}
              onDeleteMistake={handleDeleteMistake}
            />
          )}

          {activeTab === 'Analytics & Sessions' && (
            <Analytics 
              sessions={sessions}
              topics={topics}
              onAddSession={handleAddSession}
              plans={plans}
              tasks={tasks}
            />
          )}

          {activeTab === 'Activity Planner' && (
            <ActivityPlanner 
              plans={plans}
              tasks={tasks}
              onAddPlan={handleAddPlan}
              onDeletePlan={handleDeletePlan}
              onUpdateTask={handleUpdateTaskInApp}
              onDeleteTask={handleDeleteTaskInApp}
            />
          )}

          {activeTab === 'Preparation Roadmaps' && (
            <PreparationRoadmaps 
              roadmaps={roadmaps}
              topics={topics}
              onAddRoadmap={handleAddRoadmap}
              onUpdateRoadmap={handleUpdateRoadmap}
              onDeleteRoadmap={handleDeleteRoadmap}
            />
          )}

          {activeTab === 'My Achievements' && (
            <AchievementsView 
              sessions={sessions}
              questions={questions}
              interviews={interviews}
              applications={applications}
              streakDays={7}
            />
          )}

          {activeTab === 'Personal Journal' && (
            <PersonalJournal 
              journals={journals}
              topics={topics}
              interviews={interviews}
              onAddJournal={handleAddJournal}
              onUpdateJournal={handleUpdateJournal}
              onDeleteJournal={handleDeleteJournal}
              onUploadAttachment={handleUploadJournalAttachment}
            />
          )}

          {activeTab === 'Personal Reminders' && (
            <PersonalReminders 
              reminders={personalReminders}
              logs={reminderLogs}
              settings={reminderSettings}
              onAddReminder={handleAddPersonalReminder}
              onUpdateReminder={handleUpdatePersonalReminder}
              onDeleteReminder={handleDeletePersonalReminder}
              onActionReminder={handleActionPersonalReminder}
              onUpdateSettings={handleUpdateReminderSettings}
            />
          )}

          {activeTab === 'Mock Interview Simulator' && (
            <MockInterviewWorkspace 
              topics={topics}
              interviews={mockInterviews}
              onAddInterview={handleAddMockInterview}
              onDeleteInterview={handleDeleteMockInterview}
            />
          )}

          {activeTab === 'Mobile & Offline Hub' && (
            <MobileOfflineHub 
              notifications={notifications}
              onPushNotification={pushNotification}
            />
          )}

          {activeTab === 'Import & Export Center' && (
            <BulkImportExportCenter 
              topics={topics}
              questions={questions}
              intelliQuestions={intelliQuestions}
              mistakes={mistakes}
              plans={plans}
              roadmaps={roadmaps}
              journals={journals}
              interviews={interviews}
              onBulkImport={handleBulkImport}
            />
          )}

              </motion.div>
            </AnimatePresence>

        </section>

      </main>
        </>
      )}

      {/* Footer copyright */}
      <footer className="border-t border-white/5 mt-auto py-5 select-none text-center bg-black/10">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 font-sans">
          &copy; 2026 Preparation Tracker. Master interviews with focused, AI-powered preparation.
        </div>
      </footer>

      <FuturisticToaster 
        toasts={activeToasts}
        onDismiss={(id) => setActiveToasts(prev => prev.filter(t => t.id !== id))}
        onExecuteAction={handleExecuteToastAction}
      />

    </div>
  );
}
