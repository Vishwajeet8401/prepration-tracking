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

export interface Topic {
  id: string;
  userId?: string;
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
  type: 'revision' | 'weakness' | 'interview' | 'daily';
  date: string;
  read: boolean;
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
  topicsCovered: string[];
  answeredCount: number;
  totalQuestions: number;
  score: number; // 0 - 100
  averageAnswerTime: number; // seconds
  confidenceScore: number; // 0 - 100
  feedback: string;
  history: Array<{
    question: string;
    answer: string;
    evaluation: string;
    score: number;
    answerTime: number;
  }>;
  createdAt: string; // ISO string
}



