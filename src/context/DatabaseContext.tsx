import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, writeBatch, getDocs, limit
} from 'firebase/firestore';
import { 
  Topic, Question, JobApplication, Interview, Mistake, StudySession, 
  AppNotification, VoiceRecording, InterviewIntelligenceQuestion, ActivityPlan, 
  DailyTask, ActivityLog, ActivityCategory, Journal, Roadmap, MockInterview, 
  PersonalReminder, ReminderLog, PersonalReminderSettings, ReminderStatus, Subject, UserSettings, StarStory, MockPresetQuestion 
} from '../types';
import { 
  initialTopics, initialQuestions, initialJobApplications, 
  initialInterviews, initialMistakes, initialStudySessions, initialNotifications, 
  initialIntelliQuestions, initialSubjects, initialMockPresetQuestions
} from '../initialData';
import { useGlobalStats } from '../hooks/useGlobalStats';
import { useUrgentTopics } from '../hooks/useUrgentTopics';
import { requestNativeNotificationPermission, scheduleNativeNotification, cancelNativeNotification, triggerImmediateNativeNotification } from '../utils/mobileScheduler';
import { saveLocalFile } from '../localFileStore';

export interface DatabaseContextType {
  subjects: Subject[];
  topics: Topic[];
  topicLimit: number;
  setTopicLimit: React.Dispatch<React.SetStateAction<number>>;
  questions: Question[];
  questionLimit: number;
  setQuestionLimit: React.Dispatch<React.SetStateAction<number>>;
  applications: JobApplication[];
  interviews: Interview[];
  mistakes: Mistake[];
  sessions: StudySession[];
  notifications: AppNotification[];
  voiceRecordings: VoiceRecording[];
  intelliQuestions: InterviewIntelligenceQuestion[];
  plans: ActivityPlan[];
  tasks: DailyTask[];
  journals: Journal[];
  roadmaps: Roadmap[];
  mockInterviews: MockInterview[];
  starStories: StarStory[];
  personalReminders: PersonalReminder[];
  reminderLogs: ReminderLog[];
  reminderSettings: PersonalReminderSettings | null;
  userSettings: UserSettings | null;
  loading: boolean;
  globalStats: any;
  urgentTopics: any;
  activeToasts: AppNotification[];
  setActiveToasts: React.Dispatch<React.SetStateAction<AppNotification[]>>;

  handleSeedSandbox: () => Promise<void>;
  handleRestoreCloudBackup: (backupData: any) => Promise<void>;
  handleAddSubject: (newSubject: Omit<Subject, 'id'>) => Promise<void>;
  handleUpdateSubject: (updated: Subject) => Promise<void>;
  handleDeleteSubject: (id: string) => Promise<void>;
  handleAddTopic: (newTopic: Omit<Topic, 'id' | 'revisionCount' | 'forgotCount'>) => Promise<void>;
  handleUpdateTopic: (updated: Topic) => Promise<void>;
  handleDeleteTopic: (id: string) => Promise<void>;
  handleMergeTopics: (primaryTopicId: string, duplicateTopicIds: string[]) => Promise<void>;
  handleAddJournal: (newJournal: Omit<Journal, 'id' | 'userId'>) => Promise<void>;
  handleUpdateJournal: (updated: Journal) => Promise<void>;
  handleUploadJournalAttachment: (file: File) => Promise<string>;
  handleDeleteJournal: (id: string) => Promise<void>;
  handleAddRoadmap: (newRoadmap: Omit<Roadmap, 'id' | 'userId'>) => Promise<void>;
  handleUpdateRoadmap: (updated: Roadmap) => Promise<void>;
  handleDeleteRoadmap: (id: string) => Promise<void>;
  handleAddQuestion: (newQ: Omit<Question, 'id' | 'askedCount'>) => Promise<void>;
  handleUpdateQuestion: (updated: Question) => Promise<void>;
  handleDeleteQuestion: (id: string) => Promise<void>;
  handleRecallResponse: (questionId: string, topicId: string, response: 'Remembered' | 'Partially' | 'Forgot') => Promise<void>;
  handleAddVoice: (rec: Omit<VoiceRecording, 'id'>) => Promise<void>;
  handleDeleteVoice: (id: string) => Promise<void>;
  handleAddApplication: (app: Omit<JobApplication, 'id'>) => Promise<void>;
  handleUpdateApplication: (updated: JobApplication) => Promise<void>;
  handleDeleteApplication: (id: string) => Promise<void>;
  handleAddInterview: (int: Omit<Interview, 'id'>) => Promise<void>;
  handleUpdateInterview: (updated: Interview) => Promise<void>;
  handleDeleteInterview: (id: string) => Promise<void>;
  handleAddMockInterview: (mock: Omit<MockInterview, 'id' | 'userId'>) => Promise<void>;
  handleDeleteMockInterview: (id: string) => Promise<void>;
  handleAddPersonalReminder: (rem: Omit<PersonalReminder, 'id' | 'userId'>) => Promise<void>;
  handleUpdatePersonalReminder: (updated: PersonalReminder) => Promise<void>;
  handleDeletePersonalReminder: (id: string) => Promise<void>;
  handleActionPersonalReminder: (reminderId: string, status: ReminderStatus, snoozeMinutes?: number) => Promise<void>;
  handleUpdateReminderSettings: (updatedSettings: PersonalReminderSettings) => Promise<void>;
  handleUpdateCerebrasKey: (key: string) => Promise<void>;
  handleUpdateTheme: (theme: string) => Promise<void>;
  handleAddStarStory: (story: Omit<StarStory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  handleUpdateStarStory: (story: StarStory) => Promise<void>;
  handleDeleteStarStory: (id: string) => Promise<void>;
  handleBulkImport: (dataType: string, records: any[], duplicatePolicy: 'skip' | 'replace' | 'keep') => Promise<{ imported: number; updated: number; skipped: number }>;
  handleAddMistake: (mistake: Omit<Mistake, 'id'>) => Promise<void>;
  handleDeleteMistake: (id: string) => Promise<void>;
  handleAddSession: (newSession: Omit<StudySession, 'id'>) => Promise<void>;
  pushNotification: (params: Omit<AppNotification, 'id' | 'date' | 'read'>) => Promise<void>;
  handleMarkRead: (id: string) => Promise<void>;
  handleClearAll: () => Promise<void>;
  handleAddIntelliQuestion: (newIQ: Omit<InterviewIntelligenceQuestion, 'id'>) => Promise<void>;
  handleDeleteIntelliQuestion: (id: string) => Promise<void>;
  handleAddPlan: (newPlan: Omit<ActivityPlan, 'id' | 'userId'>) => Promise<void>;
  handleDeletePlan: (id: string) => Promise<void>;
  handleUpdateTaskInApp: (updated: DailyTask, actualHours?: number, notes?: string) => Promise<void>;
  handleDeleteTaskInApp: (id: string) => Promise<void>;
  mockPresetQuestions: MockPresetQuestion[];
  handleAddMockPresetQuestion: (newQ: Omit<MockPresetQuestion, 'id' | 'userId'>) => Promise<void>;
  handleDeleteMockPresetQuestion: (id: string) => Promise<void>;
  handleUpdateCustomPrompt: (prompt: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicLimit, setTopicLimit] = useState(50);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionLimit, setQuestionLimit] = useState(50);
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
  const [starStories, setStarStories] = useState<StarStory[]>([]);
  const [personalReminders, setPersonalReminders] = useState<PersonalReminder[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [reminderSettings, setReminderSettings] = useState<PersonalReminderSettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [mockPresetQuestions, setMockPresetQuestions] = useState<MockPresetQuestion[]>([]);

  const globalStats = useGlobalStats(user?.uid);
  const { urgentTopics } = useUrgentTopics(user?.uid);

  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const processedToastsRef = useRef<Set<string>>(new Set());
  const initialLoadTimeRef = useRef<number>(Date.now());

  // Refs for state values to avoid rebuilding callbacks
  const subjectsRef = useRef(subjects);
  const topicsRef = useRef(topics);
  const questionsRef = useRef(questions);
  const applicationsRef = useRef(applications);
  const interviewsRef = useRef(interviews);
  const mistakesRef = useRef(mistakes);
  const sessionsRef = useRef(sessions);
  const notificationsRef = useRef(notifications);
  const voiceRecordingsRef = useRef(voiceRecordings);
  const intelliQuestionsRef = useRef(intelliQuestions);
  const plansRef = useRef(plans);
  const tasksRef = useRef(tasks);
  const journalsRef = useRef(journals);
  const roadmapsRef = useRef(roadmaps);
  const mockInterviewsRef = useRef(mockInterviews);
  const personalRemindersRef = useRef(personalReminders);
  const reminderLogsRef = useRef(reminderLogs);
  const reminderSettingsRef = useRef(reminderSettings);
  const mockPresetQuestionsRef = useRef(mockPresetQuestions);

  useEffect(() => { subjectsRef.current = subjects; }, [subjects]);
  useEffect(() => { topicsRef.current = topics; }, [topics]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { applicationsRef.current = applications; }, [applications]);
  useEffect(() => { interviewsRef.current = interviews; }, [interviews]);
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  useEffect(() => { voiceRecordingsRef.current = voiceRecordings; }, [voiceRecordings]);
  useEffect(() => { intelliQuestionsRef.current = intelliQuestions; }, [intelliQuestions]);
  useEffect(() => { plansRef.current = plans; }, [plans]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { journalsRef.current = journals; }, [journals]);
  useEffect(() => { roadmapsRef.current = roadmaps; }, [roadmaps]);
  useEffect(() => { mockInterviewsRef.current = mockInterviews; }, [mockInterviews]);
  useEffect(() => { personalRemindersRef.current = personalReminders; }, [personalReminders]);
  useEffect(() => { reminderLogsRef.current = reminderLogs; }, [reminderLogs]);
  useEffect(() => { reminderSettingsRef.current = reminderSettings; }, [reminderSettings]);
  useEffect(() => { mockPresetQuestionsRef.current = mockPresetQuestions; }, [mockPresetQuestions]);

  // Toast Notifications Syncer
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

        // Trigger immediate native push notification on Android/iOS native platforms
        triggerImmediateNativeNotification(notif.title, notif.message);

        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== notif.id));
        }, 6000);
      });
    }
  }, [notifications]);

  // Firestore bindings
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      return;
    }
    const q = query(collection(db, 'subjects'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Subject[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Subject);
      });
      setSubjects(list);
    }, (error) => {
      console.error("Subjects snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTopics([]);
      return;
    }
    const q = query(collection(db, 'topics'), where('userId', '==', user.uid), limit(topicLimit));
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
  }, [user, topicLimit]);

  useEffect(() => {
    if (!user) {
      setQuestions([]);
      return;
    }
    const q = query(collection(db, 'questions'), where('userId', '==', user.uid), limit(questionLimit));
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
  }, [user, questionLimit]);

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
      setMockPresetQuestions([]);
      return;
    }
    const q = query(collection(db, 'mockPresetQuestions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MockPresetQuestion[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as MockPresetQuestion);
      });
      setMockPresetQuestions(list);
    }, (error) => {
      console.error("Mock preset questions snapshot error:", error);
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

  useEffect(() => {
    if (!user) {
      setStarStories([]);
      return;
    }
    const q = query(collection(db, 'starStories'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: StarStory[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as StarStory);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setStarStories(list);
    }, (error) => {
      console.error("StarStories snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserSettings(null);
      return;
    }
    const docRef = doc(db, 'userSettings', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserSettings(docSnap.data() as UserSettings);
      } else {
        setUserSettings({
          id: user.uid,
          userId: user.uid,
          cerebrasApiKey: 'csk-42tvmeyxc9mkpjdwm2hp556whrhvme63hh9wnypctt82vtj2',
          theme: 'cyber-midnight'
        });
      }
    }, (error) => {
      console.warn("userSettings snapshot listener failed, using local settings default:", error);
      setUserSettings({
        id: user.uid,
        userId: user.uid,
        cerebrasApiKey: 'csk-42tvmeyxc9mkpjdwm2hp556whrhvme63hh9wnypctt82vtj2',
        theme: 'cyber-midnight'
      });
    });
    return () => unsubscribe();
  }, [user]);

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

  // Request native notifications permission
  useEffect(() => {
    if (user) {
      requestNativeNotificationPermission();
    }
  }, [user]);

  // Sync active reminders with Capacitor native scheduler
  const syncedRef = useRef(false);
  useEffect(() => {
    if (user && personalReminders.length > 0 && !syncedRef.current) {
      syncedRef.current = true;
      personalReminders.forEach(rem => {
        if (rem.active) {
          scheduleNativeNotification(rem);
        } else {
          cancelNativeNotification(rem.id);
        }
      });
    }
  }, [user, personalReminders]);

  // Auto-generation of daily tasks
  useEffect(() => {
    if (!user || plans.length === 0) return;

    const generateTodayTasks = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const activePlans = plans.filter(p => todayStr >= p.startDate && todayStr <= p.endDate);
      
      const systemTasks = [
        { id: 'system-recall', title: 'Recall Session', targetHours: 0.5, category: 'Technical' as ActivityCategory },
        { id: 'system-revision', title: 'Revision Queue', targetHours: 0.5, category: 'Technical' as ActivityCategory },
      ];

      const batch = writeBatch(db);
      let needsCommit = false;

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

  // Real-time reminders daemon checking loop
  useEffect(() => {
    if (!user || personalReminders.length === 0) return;

    const checkDueReminders = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const isWeekendDay = now.getDay() === 0 || now.getDay() === 6;

      if (isWeekendDay && reminderSettings && !reminderSettings.weekendMode) return;

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
        if (todayStr < rem.startDate || todayStr > rem.endDate) return;

        const remTime24 = convertTo24h(rem.reminderTime);
        const [startH, startM] = remTime24.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (rem.repeatType === 'Interval Based' && rem.intervalHours && rem.intervalHours > 0) {
          const intervalMinutes = rem.intervalHours * 60;
          const elapsed = currentMinutes - startMinutes;
          if (elapsed < 0) return;

          const slotIndex = Math.floor(elapsed / intervalMinutes);
          const slotStartMin = startMinutes + slotIndex * intervalMinutes;

          if (currentMinutes !== slotStartMin) return;
          if (slotStartMin >= 24 * 60) return;

          const slotKey = `${todayStr}-slot${slotIndex}`;
          const alreadyFired = reminderLogs.some(l =>
            l.reminderId === rem.id &&
            l.date === todayStr &&
            (l.notes === slotKey || l.status === 'Pending' && l.notes === slotKey)
          );

          if (!alreadyFired) {
            await pushNotification({
              title: `Reminder: ${rem.title}`,
              message: rem.notificationMessage || `Time for "${rem.title}"! (Every ${rem.intervalHours}h)`,
              type: 'daily'
            });

            const logId = `log-${rem.id}-${todayStr}-slot${slotIndex}-${Date.now()}`;
            await setDoc(doc(db, 'reminderLogs', logId), {
              id: logId,
              reminderId: rem.id,
              userId: user.uid,
              date: todayStr,
              status: 'Pending',
              notes: slotKey
            });
          }
        } else {
          if (now.getHours() === startH && now.getMinutes() === startM) {
            const alreadyLogged = reminderLogs.some(l =>
              l.reminderId === rem.id &&
              l.date === todayStr &&
              (l.status === 'Completed' || l.status === 'Skipped' || l.status === 'Missed')
            );

            if (!alreadyLogged) {
              await pushNotification({
                title: `Reminder Alert: ${rem.title}`,
                message: rem.notificationMessage || `It is time for your task: "${rem.title}".`,
                type: 'daily'
              });

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

    const interval = setInterval(checkDueReminders, 60000);
    checkDueReminders();

    return () => clearInterval(interval);
  }, [user, personalReminders, reminderLogs, reminderSettings]);

  // Memoized CRUD mutations with stable callback bindings
  const handleSeedSandbox = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      initialSubjects.forEach((s) => {
        batch.set(doc(db, 'subjects', s.id), { ...s, userId: user.uid });
      });
      initialTopics.forEach((t) => {
        batch.set(doc(db, 'topics', t.id), { ...t, easeFactor: 2.5, intervalDays: 1, userId: user.uid });
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
      initialMockPresetQuestions.forEach((mpq) => {
        batch.set(doc(db, 'mockPresetQuestions', mpq.id), { ...mpq, userId: user.uid });
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
  }, [user]);

  const handleRestoreCloudBackup = useCallback(async (backupData: any) => {
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
  }, [user]);

  const handleAddSubject = useCallback(async (newSubject: Omit<Subject, 'id'>) => {
    if (!user) return;
    const subjectId = 'subj-' + Date.now();
    const created: Subject = { ...newSubject, id: subjectId, userId: user.uid };
    try {
      await setDoc(doc(db, 'subjects', subjectId), created);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `subjects/${subjectId}`);
    }
  }, [user]);

  const handleUpdateSubject = useCallback(async (updated: Subject) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'subjects', updated.id), { ...updated });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `subjects/${updated.id}`);
    }
  }, [user]);

  const handleDeleteSubject = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `subjects/${id}`);
    }
  }, [user]);

  const handleAddTopic = useCallback(async (newTopic: Omit<Topic, 'id' | 'revisionCount' | 'forgotCount'>) => {
    if (!user) return;
    const topicId = 'topic-' + Date.now();
    const created: Topic = {
      ...newTopic,
      id: topicId,
      userId: user.uid,
      revisionCount: 0,
      forgotCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
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
  }, [user]);

  const handleUpdateTopic = useCallback(async (updated: Topic) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'topics', updated.id), { ...updated, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `topics/${updated.id}`);
    }
  }, [user]);

  const handleDeleteTopic = useCallback(async (id: string) => {
    if (!user) return;
    if (confirm("Confirm deleting this studied topic? Linked dependencies could trigger warning shifts.")) {
      try {
        await deleteDoc(doc(db, 'topics', id));
        
        const orphans = questionsRef.current.filter(q => q.topicId === id);
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
  }, [user]);

  const handleMergeTopics = useCallback(async (primaryTopicId: string, duplicateTopicIds: string[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const primaryTopic = topicsRef.current.find(t => t.id === primaryTopicId);
      if (!primaryTopic) return;

      const duplicateTopics = topicsRef.current.filter(t => duplicateTopicIds.includes(t.id));
      
      let newDesc = primaryTopic.description || '';
      let newNotes = primaryTopic.notes || '';
      duplicateTopics.forEach(dup => {
        if (dup.description && dup.description.trim() !== '') {
          newDesc += `\n\n[Merged from ${dup.name}]:\n${dup.description}`;
        }
        if (dup.notes && dup.notes.trim() !== '') {
          newNotes += `\n\n[Merged Notes from ${dup.name}]:\n${dup.notes}`;
        }
      });
      
      batch.update(doc(db, 'topics', primaryTopicId), {
        description: newDesc,
        notes: newNotes
      });

      questionsRef.current.filter(q => duplicateTopicIds.includes(q.topicId)).forEach(q => {
        batch.update(doc(db, 'questions', q.id), { topicId: primaryTopicId });
      });

      sessionsRef.current.filter(s => duplicateTopicIds.includes(s.topicId)).forEach(s => {
        batch.update(doc(db, 'studySessions', s.id), { topicId: primaryTopicId });
      });

      voiceRecordingsRef.current.filter(v => duplicateTopicIds.includes(v.topicId)).forEach(v => {
        batch.update(doc(db, 'voiceRecordings', v.id), { topicId: primaryTopicId });
      });

      journalsRef.current.filter(j => j.relatedTopicId && duplicateTopicIds.includes(j.relatedTopicId)).forEach(j => {
        batch.update(doc(db, 'journals', j.id), { relatedTopicId: primaryTopicId });
      });

      topicsRef.current.filter(t => t.dependencyIds && t.dependencyIds.some(d => duplicateTopicIds.includes(d))).forEach(t => {
        const newDeps = new Set(t.dependencyIds.filter(d => !duplicateTopicIds.includes(d)));
        if (t.id !== primaryTopicId) {
          newDeps.add(primaryTopicId);
        }
        batch.update(doc(db, 'topics', t.id), { dependencyIds: Array.from(newDeps) });
      });

      duplicateTopicIds.forEach(id => {
        batch.delete(doc(db, 'topics', id));
      });

      await batch.commit();

      await pushNotification({
        title: 'Topics Merged',
        message: `Merged ${duplicateTopicIds.length} duplicate(s) into "${primaryTopic.name}".`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `merge-topics`);
    }
  }, [user]);

  const handleAddJournal = useCallback(async (newJournal: Omit<Journal, 'id' | 'userId'>) => {
    if (!user) return;
    const journalId = 'journal-' + Date.now();
    const created: Journal = { ...newJournal, id: journalId, userId: user.uid };
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
  }, [user]);

  const handleUpdateJournal = useCallback(async (updated: Journal) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'journals', updated.id), { ...updated, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `journals/${updated.id}`);
    }
  }, [user]);

  const handleUploadJournalAttachment = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('You must be signed in to attach files.');
    }
    return saveLocalFile(file, file.name);
  }, [user]);

  const handleDeleteJournal = useCallback(async (id: string) => {
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
  }, [user]);

  const handleAddRoadmap = useCallback(async (newRoadmap: Omit<Roadmap, 'id' | 'userId'>) => {
    if (!user) return;
    const roadmapId = 'roadmap-' + Date.now();
    const created: Roadmap = { ...newRoadmap, id: roadmapId, userId: user.uid };
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
  }, [user]);

  const handleUpdateRoadmap = useCallback(async (updated: Roadmap) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'roadmaps', updated.id), { ...updated, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `roadmaps/${updated.id}`);
    }
  }, [user]);

  const handleDeleteRoadmap = useCallback(async (id: string) => {
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
  }, [user]);

  const handleAddQuestion = useCallback(async (newQ: Omit<Question, 'id' | 'askedCount'>) => {
    if (!user) return;
    const qId = 'q-' + Date.now();
    const created: Question = { ...newQ, id: qId, userId: user.uid, askedCount: 0 };
    try {
      await setDoc(doc(db, 'questions', qId), created);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `questions/${qId}`);
    }
  }, [user]);

  const handleUpdateQuestion = useCallback(async (updated: Question) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'questions', updated.id), { ...updated, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `questions/${updated.id}`);
    }
  }, [user]);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    }
  }, [user]);

  const handleRecallResponse = useCallback(async (questionId: string | undefined | null, topicId: string, response: 'Remembered' | 'Partially' | 'Forgot') => {
    if (!user) return;
    
    const targetQ = questionId ? questionsRef.current.find(q => q.id === questionId) : null;
    const targetT = topicsRef.current.find(t => t.id === topicId);
    if (!targetT) return;

    const updatedQ: Question | null = targetQ ? {
      ...targetQ,
      askedCount: targetQ.askedCount + 1,
      lastAskedDate: new Date().toISOString(),
      lastRevisedDate: new Date().toISOString()
    } : null;

    const rc = targetT.revisionCount + 1;
    let cScore = targetT.confidenceScore;
    let rScore = targetT.recallScore;
    let forg = targetT.forgotCount;

    const currentEF = targetT.easeFactor !== undefined ? targetT.easeFactor : 2.5;
    const currentInterval = targetT.intervalDays !== undefined ? targetT.intervalDays : 1;
    
    let nextEF = currentEF;
    let nextIntervalDays = 1;

    if (response === 'Remembered') {
      cScore = Math.min(100, cScore + 8);
      rScore = Math.min(100, rScore + 10);
      forg = Math.max(0, forg - 1);
      
      const q = 5;
      nextEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      
      if (rc === 1) {
        nextIntervalDays = 1;
      } else if (rc === 2) {
        nextIntervalDays = 3;
      } else {
        nextIntervalDays = Math.max(1, Math.round(currentInterval * currentEF));
      }
    } else if (response === 'Partially') {
      cScore = Math.min(100, cScore + 2);
      rScore = Math.min(100, rScore + 4);
      
      const q = 3;
      nextEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      
      if (rc === 1) {
        nextIntervalDays = 1;
      } else {
        nextIntervalDays = Math.max(1, Math.round(currentInterval * 0.5));
      }
    } else if (response === 'Forgot') {
      forg = forg + 1;
      cScore = Math.max(5, cScore - 15);
      rScore = Math.max(0, rScore - 20);
      
      nextEF = Math.max(1.3, currentEF - 0.2);
      nextIntervalDays = 1; 

      await pushNotification({
        title: `Retention Deficit: ${targetT.name}`,
        message: `You marked "${targetT.name}" concept as Forgotten. Transferred to High Priority Revision Queue.`,
        type: 'weakness'
      });
    }

    nextEF = Math.max(1.3, nextEF);
    const nextRc = response === 'Forgot' ? 0 : rc;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextIntervalDays);

    const updatedT: Topic = {
      ...targetT,
      revisionCount: nextRc,
      confidenceScore: cScore,
      recallScore: rScore,
      forgotCount: forg,
      lastRevisionDate: new Date().toISOString(),
      nextRevisionDate: nextDate.toISOString(),
      status: response === 'Forgot' ? 'Revising' : targetT.status,
      easeFactor: nextEF,
      intervalDays: nextIntervalDays
    };

    try {
      const batch = writeBatch(db);
      if (updatedQ && questionId) {
        batch.set(doc(db, 'questions', questionId), { ...updatedQ, userId: user.uid });
      }
      batch.set(doc(db, 'topics', topicId), { ...updatedT, userId: user.uid });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const handleAddVoice = useCallback(async (rec: Omit<VoiceRecording, 'id'>) => {
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
  }, [user]);

  const handleDeleteVoice = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'voiceRecordings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `voiceRecordings/${id}`);
    }
  }, [user]);

  const handleAddApplication = useCallback(async (app: Omit<JobApplication, 'id'>) => {
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
  }, [user]);

  const handleUpdateApplication = useCallback(async (updated: JobApplication) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'jobApplications', updated.id), { ...updated, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobApplications/${updated.id}`);
    }
  }, [user]);

  const handleDeleteApplication = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'jobApplications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobApplications/${id}`);
    }
  }, [user]);

  const handleAddInterview = useCallback(async (int: Omit<Interview, 'id'>) => {
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
  }, [user]);

  const handleUpdateInterview = useCallback(async (updated: Interview) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'interviews', updated.id), { ...updated, userId: user.uid });

      if (updated.status === 'Completed' && updated.questionsMissed.length > 0) {
        const lowercasedMissed = updated.questionsMissed.map(q => q.toLowerCase());
        const batch = writeBatch(db);
        
        topicsRef.current.forEach(t => {
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
  }, [user]);

  const handleDeleteInterview = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'interviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `interviews/${id}`);
    }
  }, [user]);

  const handleAddMockInterview = useCallback(async (mock: Omit<MockInterview, 'id' | 'userId'>) => {
    if (!user) return;
    const mockId = 'mock-' + Date.now();
    const created: MockInterview = { ...mock, id: mockId, userId: user.uid };
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
  }, [user]);

  const handleDeleteMockInterview = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'mockInterviews', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mockInterviews/${id}`);
    }
  }, [user]);

  const handleAddStarStory = useCallback(async (story: Omit<StarStory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const storyId = 'star-' + Date.now();
    const now = new Date().toISOString();
    const created: StarStory = {
      ...story,
      id: storyId,
      userId: user.uid,
      createdAt: now,
      updatedAt: now
    };
    try {
      await setDoc(doc(db, 'starStories', storyId), created);
      await pushNotification({
        title: 'STAR Story Created',
        message: `Behavioral story "${story.title}" added successfully.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `starStories/${storyId}`);
    }
  }, [user]);

  const handleUpdateStarStory = useCallback(async (updated: StarStory) => {
    if (!user) return;
    const now = new Date().toISOString();
    const cleaned = {
      ...updated,
      userId: user.uid,
      updatedAt: now
    };
    try {
      await setDoc(doc(db, 'starStories', updated.id), cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `starStories/${updated.id}`);
    }
  }, [user]);

  const handleDeleteStarStory = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'starStories', id));
      await pushNotification({
        title: 'STAR Story Removed',
        message: 'Deleted behavioral card from your repository.',
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `starStories/${id}`);
    }
  }, [user]);

  const cleanObject = (obj: any) => {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  };

  const handleAddPersonalReminder = useCallback(async (rem: Omit<PersonalReminder, 'id' | 'userId'>) => {
    if (!user) return;
    const remId = 'reminder-' + Date.now();
    const created = cleanObject({ ...rem, id: remId, userId: user.uid });
    try {
      await setDoc(doc(db, 'personalReminders', remId), created);
      await scheduleNativeNotification(created as PersonalReminder);
      await pushNotification({
        title: 'New Personal Goal Registered',
        message: `Goal "${rem.title}" created under Category: ${rem.category}.`,
        type: 'daily'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `personalReminders/${remId}`);
    }
  }, [user]);

  const handleUpdatePersonalReminder = useCallback(async (updated: PersonalReminder) => {
    if (!user) return;
    const cleaned = cleanObject({ ...updated, userId: user.uid });
    try {
      await setDoc(doc(db, 'personalReminders', updated.id), cleaned);
      if (updated.active) {
        await scheduleNativeNotification(updated);
      } else {
        await cancelNativeNotification(updated.id);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `personalReminders/${updated.id}`);
    }
  }, [user]);

  const handleDeletePersonalReminder = useCallback(async (id: string) => {
    if (!user) return;
    if (confirm("Decommissioning this reminder will also clear all linked consistency log records. Proceed?")) {
      try {
        await deleteDoc(doc(db, 'personalReminders', id));
        await cancelNativeNotification(id);
        
        const orphans = reminderLogsRef.current.filter(l => l.reminderId === id);
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
  }, [user]);

  const handleActionPersonalReminder = useCallback(async (reminderId: string, status: ReminderStatus, snoozeMinutes?: number) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const targetRem = personalRemindersRef.current.find(r => r.id === reminderId);
    if (!targetRem) return;

    const isMultiLogAllowed = targetRem.targetGlasses !== undefined;
    const existingLog = !isMultiLogAllowed ? reminderLogsRef.current.find(l => l.reminderId === reminderId && l.date === todayStr) : null;
    const logId = existingLog ? existingLog.id : `log-${reminderId}-${todayStr}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logRef = doc(db, 'reminderLogs', logId);

    let snoozedUntil: string | undefined = undefined;
    if (status === 'Snoozed' && snoozeMinutes) {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);
      snoozedUntil = snoozeTime.toISOString();
    }

    const newLog: any = { id: logId, reminderId, userId: user.uid, date: todayStr, status };
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

      if (targetRem.isHabit && status === 'Completed') {
        const completedDates = targetRem.habitCompletedDates ? [...targetRem.habitCompletedDates] : [];
        if (!completedDates.includes(todayStr)) {
          completedDates.push(todayStr);
        }

        const sortedDates = [...completedDates].sort((a, b) => b.localeCompare(a));
        let streak = 0;
        const tempDate = new Date();
        for (let i = 0; i < 365; i++) {
          const dStr = tempDate.toISOString().split('T')[0];
          if (completedDates.includes(dStr)) {
            streak++;
            tempDate.setDate(tempDate.getDate() - 1);
          } else {
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
  }, [user]);

  const handleUpdateReminderSettings = useCallback(async (updatedSettings: PersonalReminderSettings) => {
    if (!user) return;
    const settingsWithUserId = { ...updatedSettings, userId: user.uid };
    try {
      await setDoc(doc(db, 'reminderSettings', user.uid), settingsWithUserId);
      setReminderSettings(settingsWithUserId);
    } catch (err) {
      console.error("Error updating reminder settings:", err);
    }
  }, [user]);

  const handleUpdateCerebrasKey = useCallback(async (key: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        id: user.uid,
        userId: user.uid,
        cerebrasApiKey: key.trim()
      }, { merge: true });
      await pushNotification({
        title: 'API Settings Saved',
        message: 'Your Cerebras AI Integration Key has been updated and securely synchronized with Firestore.',
        type: 'daily'
      });
    } catch (err) {
      console.error("Error updating API key settings:", err);
    }
  }, [user]);

  const handleUpdateTheme = useCallback(async (newTheme: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        id: user.uid,
        userId: user.uid,
        theme: newTheme
      }, { merge: true });
      await pushNotification({
        title: 'Theme Settings Saved',
        message: `Your appearance has been updated to the theme.`,
        type: 'daily'
      });
    } catch (err) {
      console.error("Error updating theme settings:", err);
    }
  }, [user]);

  const handleUpdateCustomPrompt = useCallback(async (prompt: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        id: user.uid,
        userId: user.uid,
        customInterviewPrompt: prompt
      }, { merge: true });
      await pushNotification({
        title: 'AI Prompt Settings Saved',
        message: 'Your custom AI interviewer prompt persona was updated successfully.',
        type: 'daily'
      });
    } catch (err) {
      console.error("Error updating custom prompt settings:", err);
    }
  }, [user]);

  const handleAddMockPresetQuestion = useCallback(async (newQ: Omit<MockPresetQuestion, 'id' | 'userId'>) => {
    if (!user) return;
    const newId = 'mpq-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const fullQ: MockPresetQuestion = {
      ...newQ,
      id: newId,
      userId: user.uid
    };
    try {
      await setDoc(doc(db, 'mockPresetQuestions', newId), fullQ);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `mockPresetQuestions/${newId}`);
    }
  }, [user]);

  const handleDeleteMockPresetQuestion = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'mockPresetQuestions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mockPresetQuestions/${id}`);
    }
  }, [user]);

  const handleBulkImport = useCallback(async (
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
        case 'Subjects': {
          colName = 'subjects';
          existing = subjectsRef.current.find((s: any) => s.name.toLowerCase().trim() === item.name.toLowerCase().trim());
          break;
        }
        case 'Topics': {
          colName = 'topics';
          existing = topicsRef.current.find(t => t.name.toLowerCase().trim() === item.name.toLowerCase().trim());
          break;
        }
        case 'Questions': {
          colName = 'questions';
          existing = questionsRef.current.find(q => q.question.toLowerCase().trim() === item.question.toLowerCase().trim());
          break;
        }
        case 'Interview Questions': {
          colName = 'intelliQuestions';
          existing = intelliQuestionsRef.current.find(iq => iq.question.toLowerCase().trim() === item.question.toLowerCase().trim());
          break;
        }
        case 'Mistake Journals': {
          colName = 'mistakes';
          existing = mistakesRef.current.find(m => m.companyName.toLowerCase().trim() === item.companyName.toLowerCase().trim() && m.reason.toLowerCase().trim() === item.reason.toLowerCase().trim());
          break;
        }
        case 'Activity Plans': {
          colName = 'activityPlans';
          existing = plansRef.current.find(p => p.title.toLowerCase().trim() === item.title.toLowerCase().trim());
          break;
        }
        case 'Roadmaps': {
          colName = 'roadmaps';
          existing = roadmapsRef.current.find(r => r.title.toLowerCase().trim() === item.title.toLowerCase().trim());
          break;
        }
        case 'Journal Entries': {
          colName = 'journals';
          existing = journalsRef.current.find(j => j.title.toLowerCase().trim() === item.title.toLowerCase().trim() && j.content.toLowerCase().trim() === item.content.toLowerCase().trim());
          break;
        }
        case 'Simulator Questions': {
          colName = 'mockPresetQuestions';
          existing = mockPresetQuestionsRef.current.find(mpq => mpq.question.toLowerCase().trim() === item.question.toLowerCase().trim());
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
          existing = null;
        }
      } else {
        imported++;
      }

      let docData: any = {};
      let docId = '';

      switch (dataType) {
        case 'Subjects': {
          docId = existing ? existing.id : 'subject-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            name: item.name || 'Untitled Subject',
            description: item.description || '',
            color: item.color || 'bg-indigo-500',
            createdAt: item.createdAt || new Date().toISOString()
          };
          break;
        }
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
            const matchedTopic = topicsRef.current.find(t => t.name.toLowerCase().trim() === item.topicName.toLowerCase().trim());
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
              topicsRef.current.push({
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
        case 'Simulator Questions': {
          docId = existing ? existing.id : 'mpq-' + Date.now() + '-' + idx;
          docData = {
            id: docId,
            userId: user.uid,
            question: item.question,
            idealConcept: item.idealConcept,
            roundType: item.roundType || 'Technical',
            expectedKeywords: typeof item.expectedKeywords === 'string' 
              ? item.expectedKeywords.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k !== '')
              : (Array.isArray(item.expectedKeywords) ? item.expectedKeywords : [])
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
  }, [user]);

  const handleAddMistake = useCallback(async (mistake: Omit<Mistake, 'id'>) => {
    if (!user) return;
    const mId = 'mistake-' + Date.now();
    const created: Mistake = { ...mistake, id: mId, userId: user.uid };
    try {
      await setDoc(doc(db, 'mistakes', mId), created);

      const batch = writeBatch(db);
      topicsRef.current.forEach(t => {
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
  }, [user]);

  const handleDeleteMistake = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'mistakes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `mistakes/${id}`);
    }
  }, [user]);

  const handleAddSession = useCallback(async (newSession: Omit<StudySession, 'id'>) => {
    if (!user) return;
    const ssId = 'session-' + Date.now();
    const created: StudySession = { ...newSession, id: ssId, userId: user.uid };
    try {
      await setDoc(doc(db, 'studySessions', ssId), created);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `studySessions/${ssId}`);
    }
  }, [user]);

  const pushNotification = useCallback(async (params: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
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
  }, [user]);

  const handleMarkRead = useCallback(async (id: string) => {
    if (!user) return;
    const notif = notificationsRef.current.find(n => n.id === id);
    if (!notif) return;
    try {
      await setDoc(doc(db, 'notifications', id), { ...notif, read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
    }
  }, [user]);

  const handleClearAll = useCallback(async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      notificationsRef.current.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const handleAddIntelliQuestion = useCallback(async (newIQ: Omit<InterviewIntelligenceQuestion, 'id'>) => {
    if (!user) return;
    const iqId = 'intq-' + Date.now();
    const created: InterviewIntelligenceQuestion = { ...newIQ, id: iqId, userId: user.uid };
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
  }, [user]);

  const handleDeleteIntelliQuestion = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'intelliQuestions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `intelliQuestions/${id}`);
    }
  }, [user]);

  const handleAddPlan = useCallback(async (newPlan: Omit<ActivityPlan, 'id' | 'userId'>) => {
    if (!user) return;
    const planId = 'plan-' + Date.now();
    const created: ActivityPlan = { ...newPlan, id: planId, userId: user.uid };
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
  }, [user]);

  const handleDeletePlan = useCallback(async (id: string) => {
    if (!user) return;
    if (confirm("Decommissioning this habit plan will also delete all associated generated daily task trackers. Proceed?")) {
      try {
        await deleteDoc(doc(db, 'activityPlans', id));
        
        const orphans = tasksRef.current.filter(t => t.planId === id);
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
  }, [user]);

  const handleUpdateTaskInApp = useCallback(async (updated: DailyTask, actualHours?: number, notes?: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'dailyTasks', updated.id), { ...updated, userId: user.uid });

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
  }, [user]);

  const handleDeleteTaskInApp = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'dailyTasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `dailyTasks/${id}`);
    }
  }, [user]);

  return (
    <DatabaseContext.Provider value={{
      subjects, topics, topicLimit, setTopicLimit, questions, questionLimit, setQuestionLimit,
      applications, interviews, mistakes, sessions, notifications, voiceRecordings, intelliQuestions,
      plans, tasks, journals, roadmaps, mockInterviews, starStories, personalReminders, reminderLogs, reminderSettings,
      userSettings, loading, globalStats, urgentTopics, activeToasts, setActiveToasts,
      mockPresetQuestions,
      handleSeedSandbox, handleRestoreCloudBackup, handleAddSubject, handleUpdateSubject, handleDeleteSubject,
      handleAddTopic, handleUpdateTopic, handleDeleteTopic, handleMergeTopics, handleAddJournal, handleUpdateJournal,
      handleUploadJournalAttachment, handleDeleteJournal, handleAddRoadmap, handleUpdateRoadmap, handleDeleteRoadmap,
      handleAddQuestion, handleUpdateQuestion, handleDeleteQuestion, handleRecallResponse, handleAddVoice, handleDeleteVoice,
      handleAddApplication, handleUpdateApplication, handleDeleteApplication, handleAddInterview, handleUpdateInterview,
      handleDeleteInterview, handleAddMockInterview, handleDeleteMockInterview, handleAddStarStory, handleUpdateStarStory,
      handleDeleteStarStory, handleAddPersonalReminder, handleUpdatePersonalReminder, handleDeletePersonalReminder,
      handleActionPersonalReminder, handleUpdateReminderSettings, handleUpdateCerebrasKey, handleUpdateTheme, handleBulkImport,
      handleAddMistake, handleDeleteMistake, handleAddSession, pushNotification, handleMarkRead, handleClearAll,
      handleAddIntelliQuestion, handleDeleteIntelliQuestion, handleAddPlan, handleDeletePlan, handleUpdateTaskInApp,
      handleDeleteTaskInApp, handleAddMockPresetQuestion, handleDeleteMockPresetQuestion, handleUpdateCustomPrompt
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
