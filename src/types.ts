/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TopicStatus =
  | 'Not Started'
  | 'Learning'
  | 'Practicing'
  | 'Revising'
  | 'Interview Ready'
  | 'Mastered';

export type QuestionSource =
  | 'Interview'
  | 'Course'
  | 'Book'
  | 'Internet'
  | 'Personal Notes';

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type InterviewResult = 'Selected' | 'Rejected' | 'Pending';

export type JobApplicationStatus =
  | 'Applied'
  | 'Interview Scheduled'
  | 'Rejected'
  | 'Offer Received'
  | 'Joined';

export interface Subject {
  id: string;
  userId?: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  userId?: string;
  subjectId?: string; // Links this topic to a specific Subject
  name: string;
  category: string;
  description: string;
  status: TopicStatus;
  confidenceScore: number; // 0 - 100
  recallScore: number; // 0 - 100
  revisionCount: number;
  lastRevisionDate?: string; // ISO string
  nextRevisionDate?: string; // ISO string
  forgotCount: number;
  notes: string;
  dependencyIds: string[]; // Topic IDs that this topic is dependent on
  easeFactor?: number;     // SM-2 Ease Factor
  intervalDays?: number;   // SM-2 Interval in days
}

export interface Question {
  id: string;
  userId?: string;
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicId: string;
  tags: string[];
  source: QuestionSource;
  askedCount: number;
  lastAskedDate?: string; // ISO string
  lastRevisedDate?: string; // ISO string
}

export interface VoiceRecording {
  id: string;
  userId?: string;
  topicId: string;
  title: string;
  audioUrl: string; // Blob or Data URI URL
  duration: number; // seconds
  date: string;
  notes?: string;
}

export interface StudySession {
  id: string;
  userId?: string;
  topicId: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  notes?: string;
}

export interface Interview {
  id: string;
  userId?: string;
  companyName: string;
  date: string;
  status: InterviewStatus;
  questionsAsked: string[];
  questionsMissed: string[];
  feedback: string;
  result: InterviewResult;
}

export interface Mistake {
  id: string;
  userId?: string;
  companyName: string;
  date: string;
  missedQuestions: string[];
  reason: string;
}

export interface JobApplication {
  id: string;
  userId?: string;
  company: string;
  position: string;
  appliedDate: string;
  status: JobApplicationStatus;
  notes?: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'revision' | 'weakness' | 'interview' | 'daily' | 'streak' | 'journal' | 'mock';
  date: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'snoozed' | 'completed' | 'overdue' | 'dismissed';
  snoozedUntil?: string;
  actionText?: string;
  actionUrl?: string;
}

export interface InterviewIntelligenceQuestion {
  id: string;
  userId?: string;
  company: string;
  question: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dateAsked: string;
  answer: string;
  result: 'Answered Correctly' | 'Struggled' | 'Failed';
}

export type ActivityCategory =
  | 'Technical'
  | 'Communication'
  | 'Interview Preparation'
  | 'DSA'
  | 'Reading'
  | 'Writing'
  | 'Speaking'
  | 'Listening'
  | 'Fitness'
  | 'Custom';

export interface ActivityPlan {
  id: string;
  userId: string;
  title: string;
  targetHours: number;
  category: ActivityCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  repeatType: 'Daily' | 'Weekly' | 'Custom';
}

export interface DailyTask {
  id: string;
  planId: string; // references ActivityPlan.id or "system-recall" / "system-revision"
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'Pending' | 'Completed' | 'Skipped';
  completedAt?: string; // ISO string
  title: string; // Caching for display & system tasks
  targetHours: number;
  category: ActivityCategory;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  actualHours: number;
  notes?: string;
  loggedAt?: string; // ISO string
}

export type JournalType = 'Daily Reflection' | 'Interview Reflection' | 'Learning Journal' | 'Weekly Review Journal';

export interface Journal {
  id: string;
  userId: string;
  type: JournalType;
  title: string;
  content: string;
  tags: string[];
  relatedTopicId?: string;
  relatedInterviewId?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  attachments?: string[]; // list of attachment URLs or simulated files
}

export interface RoadmapTopic {
  name: string;
  dependencies: string[]; // names of other topics in this roadmap
  completed: boolean;
}

export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  description: string;
  topics: RoadmapTopic[];
  isPrebuilt: boolean;
  isActive: boolean;
  prebuiltId?: string;
  createdAt: string; // ISO String
}

export interface MockInterview {
  id: string;
  userId: string;
  roundType: 'Technical' | 'HR' | 'System Design' | 'Behavioral';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subjectId?: string;
  experienceLevel?: string;
  companyType?: string;
  topicsCovered: string[];
  answeredCount: number;
  totalQuestions: number;
  score: number; // 0 - 100
  averageAnswerTime: number; // seconds
  confidenceScore: number; // 0 - 100
  feedback: string;
  history: Array<{
    id?: string;
    question: string;
    answer: string;
    evaluation: string;
    score: number;
    answerTime: number;
    matchedKeywords?: string[];
    missedKeywords?: string[];
    idealConcept?: string;
    fillerWordsCount?: number;
    fillerWordsSpotted?: string[];
    scores?: { accuracy: number; modeling: number; clarity: number; depth: number };
    hintUsed?: boolean;
  }>;
  createdAt: string; // ISO string
}

export type ReminderCategory =
  | 'Study'
  | 'Revision'
  | 'Health'
  | 'Medicine'
  | 'Fitness'
  | 'Reading'
  | 'Speaking'
  | 'Writing'
  | 'Job Search'
  | 'Interview Preparation'
  | 'Personal Development'
  | 'Custom';

export type ReminderRepeatType = 'Daily' | 'Weekly' | 'Monthly' | 'Interval Based';

export type ReminderStatus = 'Pending' | 'Completed' | 'Snoozed' | 'Skipped' | 'Missed';

export interface PersonalReminder {
  id: string;
  userId: string;
  title: string;
  category: ReminderCategory;
  description: string;
  reminderTime: string; // "09:00 AM" or "HH:MM"
  repeatType: ReminderRepeatType;
  intervalHours?: number; // for Interval Based e.g. 1, 2, 4, 6
  weeklyDays?: string[]; // e.g. ["Monday", "Wednesday", "Friday"] for Weekly
  monthlyDay?: number; // e.g. 1 for Monthly
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  priority: 'High' | 'Medium' | 'Low';
  active: boolean;
  notificationMessage: string;

  // Medicine Reminder System specialized fields
  medicineName?: string;
  dosage?: string;
  frequency?: string;
  notes?: string;

  // Water Intake Reminder specialized fields
  targetGlasses?: number;

  // Habit Tracking Integration
  isHabit?: boolean;
  habitStreak?: number;
  habitBestStreak?: number;
  habitCompletedDates?: string[]; // list of YYYY-MM-DD completion dates
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: ReminderStatus;
  completedAt?: string; // ISO string
  snoozedUntil?: string; // ISO string
  snoozeDurationMinutes?: number;
  notes?: string;
}

export interface PersonalReminderSettings {
  userId: string;
  notificationSound: boolean;
  reminderDuration: number; // minutes
  defaultSnoozeTime: number; // minutes
  weekendMode: boolean; // active on weekends
  dndEnabled: boolean;
  dndStart: string; // "23:00"
  dndEnd: string; // "07:00"
}

export interface UserSettings {
  id: string;
  userId: string;
  cerebrasApiKey: string;
  theme?: string;
  customInterviewPrompt?: string;
}

export interface StarStory {
  id: string;
  userId: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiScore?: number;
  aiFeedback?: string;
}

export interface MockPresetQuestion {
  id: string;
  userId: string;
  question: string;
  expectedKeywords: string[];
  idealConcept: string;
  roundType: 'Technical' | 'HR' | 'System Design' | 'Behavioral';
}

export type VocabularyStatus = 'Learning' | 'Reviewing' | 'Mastered';

export interface VocabularyWord {
  id: string;
  userId: string;
  word: string;
  pronunciation: string;       // Devanagari phonetic e.g. "ऑल्दो"
  englishMeaning: string;
  marathiMeaning: string;
  exampleSentence: string;
  status: VocabularyStatus;
  reviewCount: number;
  lastReviewDate: string;      // ISO date string
  createdDate: string;         // ISO date string
}

export interface WordDefinition {
  word: string;                // normalized lowercase — used as Firestore doc ID
  pronunciation: string;
  englishMeaning: string;
  marathiMeaning: string;
  exampleSentence: string;
  fetchedAt: string;           // ISO date string — when AI fetched this
}




