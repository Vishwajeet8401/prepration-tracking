import React, { useState, useRef, useEffect } from 'react';
import { 
  Topic, Question, InterviewIntelligenceQuestion, Mistake, 
  ActivityPlan, Roadmap, Journal, Interview, Subject, UserSettings, MockPresetQuestion, VocabularyWord
} from '../types';
import { 
  FileJson, FileSpreadsheet, Copy, Check, Trash2, HelpCircle, 
  Upload, Download, AlertTriangle, CheckCircle, Info, Clipboard, Play,
  PackageOpen, ShieldCheck, Zap, Database, Tag, BookOpen, ChevronRight,
  RefreshCw, Loader, BookMarked, Hand
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { useScrollGesture } from '../hooks/useScrollGesture';
import { useGestureContext } from '../context/GestureContext';


const BACKUP_SUBTABS: Array<'import' | 'templates' | 'export' | 'settings'> = ['import', 'templates', 'export', 'settings'];


interface BulkImportExportCenterProps {
  userId: string;
  topics: Topic[];
  questions: Question[];
  intelliQuestions: InterviewIntelligenceQuestion[];
  mistakes: Mistake[];
  plans: ActivityPlan[];
  roadmaps: Roadmap[];
  journals: Journal[];
  interviews: Interview[];
  subjects: Subject[];
  mockPresetQuestions: MockPresetQuestion[];
  userSettings: UserSettings | null;
  vocabularyWords: VocabularyWord[];
  onUpdateCerebrasKey: (key: string) => Promise<void>;
  onUpdateTheme: (theme: string) => Promise<void>;
  onBulkImport: (dataType: string, records: any[], duplicatePolicy: 'skip' | 'replace' | 'keep') => Promise<{ imported: number; updated: number; skipped: number }>;
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const TEMPLATES = {
  Subjects: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['name'],
    optionalFields: ['description', 'color'],
    example: [
      { name: 'Core Java', description: 'Fundamentals of Java programming and JVM internals.', color: 'bg-indigo-500' },
      { name: 'Spring Boot', description: 'Enterprise-grade Java framework for REST APIs and microservices.', color: 'bg-violet-500' }
    ],
    prompt: `You are an expert software engineering curriculum designer.

Generate a JSON array of 8 broad study subjects for a senior Java/backend engineering interview preparation curriculum.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no code fences, no explanation.
- "name" must be a concise subject area title (e.g., "Core Java", "System Design")
- "description" must be 1-2 sentences explaining what this subject covers
- "color" must be exactly one of: bg-indigo-500 | bg-violet-500 | bg-rose-500 | bg-amber-500 | bg-emerald-500 | bg-sky-500 | bg-pink-500 | bg-teal-500

[
  {
    "name": "Core Java",
    "description": "Fundamentals of Java including OOP, collections, generics, and JVM internals.",
    "color": "bg-indigo-500"
  }
]`
  },
  Topics: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['name', 'category'],
    optionalFields: ['subjectId', 'description', 'status', 'confidenceScore', 'recallScore', 'notes', 'dependencyIds'],
    example: [
      {
        name: 'Spring Boot Microservices',
        category: 'Backend Development',
        subjectId: '',
        description: 'Cloud-native configurations, Eureka server registry, gateways, and load balancing mechanics.',
        status: 'Learning',
        confidenceScore: 55,
        recallScore: 40,
        notes: 'Key review area: circuit breakers and resilience4j fallbacks.',
        dependencyIds: []
      },
      {
        name: 'Java Advanced Concurrency',
        category: 'Core Java',
        subjectId: '',
        description: 'Deep dive into virtual threads (Java 21), CompletableFuture pipelines, and ForkJoinPool architectures.',
        status: 'Practicing',
        confidenceScore: 70,
        recallScore: 65,
        notes: 'Study synchronized blocks vs. ReentrantLock performance characteristics.',
        dependencyIds: []
      }
    ],
    prompt: `You are an expert software engineer helping a developer prepare for senior Java/backend engineering interviews at top tech companies.

Generate a JSON array of 20 high-frequency, must-know study topics covering areas like Core Java, Spring Boot, System Design, DSA, Databases, Cloud, and Microservices.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "name" must be specific, not vague (e.g., "G1 Garbage Collector Internals" not "GC")
- "category" must be one of: Core Java, Spring Boot, System Design, DSA, Databases, Microservices, Cloud & DevOps, Security, Testing, Concurrency
- "status" must be exactly one of: Not Started | Learning | Practicing | Revising | Interview Ready | Mastered
- "confidenceScore" and "recallScore" must be realistic integers between 0–100
- "description" must be 2–3 sentences explaining the key concepts and why they matter in interviews
- "notes" must contain a concrete tip or a specific subtopic to focus on
- Leave "subjectId" as "" and "dependencyIds" as []

[
  {
    "name": "Topic Name",
    "category": "Core Java",
    "subjectId": "",
    "description": "2-3 sentence explanation of core concepts and interview relevance.",
    "status": "Not Started",
    "confidenceScore": 30,
    "recallScore": 20,
    "notes": "Specific subtopic or tip to focus on during revision.",
    "dependencyIds": []
  }
]`
  },
  Questions: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['question', 'answer'],
    optionalFields: ['difficulty', 'tags', 'source', 'topicId'],
    example: [
      {
        question: 'How does Garbage Collection handle memory recovery in G1 GC?',
        answer: 'G1 GC divides the heap into equal-sized regions. It targets regions with the most garbage first using parallel threads to compact memory and meet latency-bound targets.',
        difficulty: 'Hard',
        tags: ['java', 'garbage-collection', 'jvm'],
        source: 'Interview',
        topicId: ''
      },
      {
        question: 'Explain the difference between optimistic and pessimistic locking.',
        answer: 'Optimistic locking assumes conflicts are rare and uses version numbers (CAS) upon commit. Pessimistic locking locks the database rows immediately via SELECT FOR UPDATE to block other writers.',
        difficulty: 'Medium',
        tags: ['databases', 'locking', 'concurrency'],
        source: 'Personal Notes',
        topicId: ''
      }
    ],
    prompt: `You are a principal software engineer and technical interviewer at a FAANG-level company.

Generate a JSON array of 25 interview-grade technical flashcard questions with complete, authoritative answers. Cover topics like Java internals, concurrency, system design, Spring Boot, databases, REST APIs, and DSA.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "question" must be specific and exactly as an interviewer would ask it
- "answer" must be complete, technically accurate, and at least 3–5 sentences
- "difficulty" must be exactly one of: Easy | Medium | Hard
- "tags" must be a JSON ARRAY of lowercase strings (e.g., ["java", "jvm", "memory"]) — NOT a comma-separated string
- "source" must be exactly one of: Interview | Course | Book | Internet | Personal Notes
- Leave "topicId" as "" — it will be linked manually after import

[
  {
    "question": "Specific technical question as an interviewer would ask",
    "answer": "Complete, accurate, multi-sentence answer with details and examples.",
    "difficulty": "Medium",
    "tags": ["tag1", "tag2", "tag3"],
    "source": "Interview",
    "topicId": ""
  }
]`
  },
  'Interview Questions': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['company', 'question', 'answer'],
    optionalFields: ['difficulty', 'topic', 'result', 'dateAsked'],
    example: [
      {
        company: 'Google',
        question: 'Design a distributed metrics aggregator that can ingest 10M events per second with high availability.',
        answer: 'Use an ingest fleet backed by Apache Kafka for buffer zoning, processed by Apache Flink streaming clusters, aggregated in sliding time windows, and recorded in a columnar time-series database like ClickHouse.',
        difficulty: 'Hard',
        topic: 'System Design',
        result: 'Struggled',
        dateAsked: '2026-05-15'
      }
    ],
    prompt: `You are simulating a technical interview debrief database for a senior backend engineer.

Generate a JSON array of 20 realistic interview intelligence questions asked by companies like Google, Amazon, Meta, Microsoft, Apple, Netflix, or Flipkart.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "company" must be a real tech company name
- "question" must sound exactly like it was asked in a real interview round
- "answer" must be a complete, expert-level answer (minimum 4 sentences)
- "difficulty" must be exactly one of: Easy | Medium | Hard
- "topic" must be one of: System Design | DSA | Core Java | Databases | Concurrency | Behavioral | Spring Boot | OS & Networking | Cloud
- "result" must be exactly one of: Answered Correctly | Struggled | Failed
- "dateAsked" must be in YYYY-MM-DD format

[
  {
    "company": "Google",
    "question": "Exact question asked in the interview",
    "answer": "Expert-level, complete answer a strong candidate would give.",
    "difficulty": "Hard",
    "topic": "System Design",
    "result": "Struggled",
    "dateAsked": "2026-05-15"
  }
]`
  },
  'Mistake Journals': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['companyName', 'reason'],
    optionalFields: ['missedQuestions', 'date'],
    example: [
      {
        companyName: 'Netflix',
        reason: 'Failed to properly scale the Kafka partition indexer in system modeling block. Did not account for partition rebalancing latency overheads.',
        missedQuestions: 'How do you avoid rebalancing freezes in large consumer group topologies?,Explain partition offset committing strategies.',
        date: '2026-05-12'
      }
    ],
    prompt: `You are helping a backend engineer create a mistake journal to track conceptual gaps revealed during mock or real interviews.

Generate a JSON array of 10 realistic interview failure post-mortems documenting what went wrong, why, and which specific questions were missed.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "companyName" must be a real or realistic company name
- "reason" must be a 3–4 sentence honest post-mortem: what concept was missed, what you said wrong, and what you should have said
- "missedQuestions" must be a comma-separated string of the actual questions that were asked and not answered well
- "date" must be in YYYY-MM-DD format

[
  {
    "companyName": "Company Name",
    "reason": "3-4 sentence honest post-mortem of what went wrong and what you should have known.",
    "missedQuestions": "Question one that was missed,Question two that was missed",
    "date": "YYYY-MM-DD"
  }
]`
  },
  'Activity Plans': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['title', 'targetHours', 'category'],
    optionalFields: ['startDate', 'endDate', 'repeatType'],
    example: [
      {
        title: 'LeetCode Daily Medium Grind',
        targetHours: 1.5,
        category: 'DSA',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        repeatType: 'Daily'
      }
    ],
    prompt: `You are a structured study coach helping a backend developer create a 30-day interview preparation activity plan.

Generate a JSON array of 10 realistic, balanced study activity plans covering DSA, system design, core Java, Spring Boot revision, mock interviews, and health habits.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "title" must be specific and actionable
- "targetHours" must be a realistic decimal number (e.g., 1.5, 2.0, 0.5)
- "category" must be EXACTLY one of: Technical | Communication | Interview Preparation | DSA | Reading | Writing | Speaking | Listening | Fitness | Custom
- "startDate" and "endDate" must be real future dates in YYYY-MM-DD format
- "repeatType" must be exactly one of: Daily | Weekly | Custom

[
  {
    "title": "Specific, actionable activity title",
    "targetHours": 1.5,
    "category": "DSA",
    "startDate": "2026-06-01",
    "endDate": "2026-06-30",
    "repeatType": "Daily"
  }
]`
  },
  Roadmaps: {
    format: 'JSON ONLY',
    requiredFields: ['title', 'topics'],
    optionalFields: ['description'],
    example: [
      {
        title: 'Kubernetes Cloud Masterclass',
        description: 'From containers fundamentals up to multi-cluster service fabrics and canary operators deployment patterns.',
        topics: [
          { name: 'Container Runtimes & Docker namespaces', completed: false, dependencies: [] },
          { name: 'Pods lifecycle, Replicasets & Deployments', completed: false, dependencies: ['Container Runtimes & Docker namespaces'] },
          { name: 'Service mesh routing protocols & Istio Gateways', completed: false, dependencies: ['Pods lifecycle, Replicasets & Deployments'] }
        ]
      }
    ],
    prompt: `You are a senior software architect creating a structured, dependency-ordered learning roadmap for a backend developer preparing for FAANG-level interviews.

Generate a JSON array containing 1 complete, detailed learning roadmap with at least 12 logically ordered topics that build on each other.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "title" must describe the full track (e.g., "Complete System Design Mastery Roadmap")
- "description" must be 2–3 sentences explaining the goal and target audience
- "topics" must be an ordered array of topic nodes where each topic has:
  - "name": a specific topic title
  - "completed": always false for new imports
  - "dependencies": an array of other topic "name" values that must be completed FIRST

[
  {
    "title": "Full Roadmap Title",
    "description": "2-3 sentence description of scope and goal.",
    "topics": [
      { "name": "Foundation Topic", "completed": false, "dependencies": [] },
      { "name": "Intermediate Topic", "completed": false, "dependencies": ["Foundation Topic"] }
    ]
  }
]`
  },
  'Journal Entries': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['title', 'content'],
    optionalFields: ['type', 'tags', 'createdAt'],
    example: [
      {
        title: 'Active Spacing Recovery Reflection',
        content: 'Studied System Design patterns. Felt strong with load balancers, but need to re-read persistent hashing algorithms.',
        type: 'Learning Journal',
        tags: 'retention,system-design',
        createdAt: '2026-05-29T10:15:00Z'
      }
    ],
    prompt: `You are a developer journaling their software engineering interview preparation journey.

Generate a JSON array of 8 realistic, personal, and emotionally authentic study journal entries reflecting daily learning sessions, interview experiences, and weekly progress reviews.

STRICT RULES:
- Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
- "title" must be descriptive and personal
- "content" must be a genuine, first-person reflection of at least 4–5 sentences
- "type" must be EXACTLY one of: Daily Reflection | Interview Reflection | Learning Journal | Weekly Review Journal
- "tags" must be a comma-separated lowercase string (e.g., "java,concurrency,interview-prep")
- "createdAt" must be a valid ISO 8601 timestamp

[
  {
    "title": "Descriptive, personal journal title",
    "content": "4-5 sentence first-person reflection with specific concepts, insights, and emotional context.",
    "type": "Learning Journal",
    "tags": "topic1,topic2,topic3",
    "createdAt": "2026-06-01T09:00:00Z"
  }
]`
  },
  'Simulator Questions': {
    format: 'JSON / CSV / Excel',
    requiredFields: ['question', 'idealConcept', 'roundType'],
    optionalFields: ['expectedKeywords'],
    example: [
      {
        question: 'Explain the difference between optimistic locking and pessimistic locking database strategies.',
        expectedKeywords: 'version column, db locks, locking overhead, database collision, serializability',
        idealConcept: 'Optimistic locking assumes collisions are rare and verifies that the version column of the record is unchanged before executing updates. Pessimistic locking locks the records at database level immediately, preventing concurrent updates until release.',
        roundType: 'Technical'
      }
    ],
    prompt: `You are an expert interviewer coach. Generate a JSON array of 8 challenging interview questions.
    
    STRICT RULES:
    - Output ONLY a valid JSON array. No markdown, no code fences.
    - "question" must be a deep scenario-based or conceptual technical question.
    - "expectedKeywords" must be a comma-separated lowercase string of key terms.
    - "idealConcept" must be a 3-4 sentence detailed expert answer definition.
    - "roundType" must be exactly one of: Technical | HR | System Design | Behavioral`
  },
  Vocabulary: {
    format: 'JSON / CSV / Excel',
    requiredFields: ['word', 'englishMeaning', 'marathiMeaning'],
    optionalFields: ['pronunciation', 'exampleSentence', 'status', 'reviewCount', 'lastReviewDate', 'createdDate', 'isAiGenerated'],
    example: [
      {
        word: 'Although',
        pronunciation: 'ऑल्दो',
        englishMeaning: 'Even though; in spite of the fact that.',
        marathiMeaning: 'जरी / तरीसुद्धा',
        exampleSentence: 'Although it was raining, I went outside.',
        status: 'Learning',
        reviewCount: 0,
        lastReviewDate: '2026-07-01T10:00:00Z',
        createdDate: '2026-07-01T10:00:00Z',
        isAiGenerated: false
      }
    ],
    prompt: `You are an expert bilingual lexicographer. Generate a JSON array of 15 advanced English vocabulary words that frequently appear in technical interviews, product management documents, or professional communication.
    
    STRICT RULES:
    - Output ONLY a valid JSON array. No markdown, no explanation, no code fences.
    - "word" must be a useful English word
    - "pronunciation" must be the phonetic spelling in Devanagari script (e.g. ऑल्दो, सेरेनडिपिटी)
    - "englishMeaning" must be a clear explanation (1-2 sentences)
    - "marathiMeaning" must be 1-3 synonyms in Devanagari script separated by /
    - "exampleSentence" must be a natural professional example using the word
    - "status" must be "Learning"
    - "reviewCount" must be 0
    - "isAiGenerated" must be false`
  }
};

// ─── SANITIZER ───────────────────────────────────────────────────────────────

const sanitizeRecord = (type: string, rec: any): any => {
  const r = { ...rec };
  switch (type) {
    case 'Subjects':
      r.name = r.name || '';
      r.description = r.description || '';
      r.color = r.color || 'bg-indigo-500';
      break;
    case 'Topics':
      r.description = r.description || '';
      r.status = r.status || 'Not Started';
      r.confidenceScore = Number(r.confidenceScore ?? 50);
      r.recallScore = Number(r.recallScore ?? 50);
      r.revisionCount = Number(r.revisionCount ?? 0);
      r.forgotCount = Number(r.forgotCount ?? 0);
      r.notes = r.notes || '';
      r.dependencyIds = Array.isArray(r.dependencyIds) ? r.dependencyIds : [];
      r.subjectId = r.subjectId || '';
      break;
    case 'Questions':
      r.difficulty = r.difficulty || 'Medium';
      r.source = r.source || 'Personal Notes';
      r.topicId = r.topicId || '';
      r.askedCount = Number(r.askedCount ?? 0);
      if (typeof r.tags === 'string') {
        // Could be "[tag1,tag2]" from JSON stringified or "tag1,tag2" from CSV
        const clean = r.tags.replace(/[\[\]"]/g, '').trim();
        r.tags = clean ? clean.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      } else if (!Array.isArray(r.tags)) {
        r.tags = [];
      }
      break;
    case 'Mistake Journals':
      r.date = r.date || new Date().toISOString().split('T')[0];
      if (typeof r.missedQuestions === 'string') {
        r.missedQuestions = r.missedQuestions.split(',').map((q: string) => q.trim()).filter(Boolean);
      } else if (!Array.isArray(r.missedQuestions)) {
        r.missedQuestions = [];
      }
      break;
    case 'Activity Plans':
      r.targetHours = Number(r.targetHours ?? 1);
      r.category = r.category || 'Technical';
      r.repeatType = r.repeatType || 'Daily';
      r.startDate = r.startDate || new Date().toISOString().split('T')[0];
      r.endDate = r.endDate || new Date().toISOString().split('T')[0];
      break;
    case 'Roadmaps':
      r.description = r.description || '';
      r.isPrebuilt = false;
      r.isActive = r.isActive ?? false;
      r.createdAt = r.createdAt || new Date().toISOString();
      if (!Array.isArray(r.topics)) r.topics = [];
      r.topics = r.topics.map((t: any) => ({
        name: t.name || '',
        completed: t.completed ?? false,
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : []
      }));
      break;
    case 'Journal Entries':
      r.type = r.type || 'Learning Journal';
      r.createdAt = r.createdAt || new Date().toISOString();
      r.updatedAt = new Date().toISOString();
      if (typeof r.tags === 'string') {
        r.tags = r.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (!Array.isArray(r.tags)) {
        r.tags = [];
      }
      break;
    case 'Simulator Questions':
      r.question = r.question || '';
      r.idealConcept = r.idealConcept || '';
      r.roundType = r.roundType || 'Technical';
      if (typeof r.expectedKeywords === 'string') {
        r.expectedKeywords = r.expectedKeywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      } else if (!Array.isArray(r.expectedKeywords)) {
        r.expectedKeywords = [];
      }
      break;
    case 'Vocabulary':
      r.word = r.word || '';
      r.pronunciation = r.pronunciation || '';
      r.englishMeaning = r.englishMeaning || '';
      r.marathiMeaning = r.marathiMeaning || '';
      r.exampleSentence = r.exampleSentence || '';
      r.status = r.status || 'Learning';
      r.reviewCount = Number(r.reviewCount ?? 0);
      r.createdDate = r.createdDate || new Date().toISOString();
      r.lastReviewDate = r.lastReviewDate || new Date().toISOString();
      r.isAiGenerated = r.isAiGenerated ?? false;
      break;
  }
  return r;
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function BulkImportExportCenter({
  userId, topics, questions, intelliQuestions, mistakes, plans, roadmaps, journals, interviews, subjects,
  mockPresetQuestions,
  userSettings, vocabularyWords, onUpdateCerebrasKey, onUpdateTheme, onBulkImport
}: BulkImportExportCenterProps) {

  const [activeSubTab, setActiveSubTab] = useState<'import' | 'templates' | 'export' | 'settings'>('import');

  // ── Gesture context global controls ──
  const { state: gestureState, updateSettings } = useGestureContext();


  // ── Gesture scroll + subtab switching ──
  useScrollGesture({
    activeTab: 'Backup & Data Settings',
    onSwipeLeft: () => {
      const idx = BACKUP_SUBTABS.indexOf(activeSubTab);
      if (idx < BACKUP_SUBTABS.length - 1) { setActiveSubTab(BACKUP_SUBTABS[idx + 1]); }
    },
    onSwipeRight: () => {
      const idx = BACKUP_SUBTABS.indexOf(activeSubTab);
      if (idx > 0) { setActiveSubTab(BACKUP_SUBTABS[idx - 1]); }
    },
  });


  // Key configurations states
  const [localKey, setLocalKey] = useState(userSettings?.cerebrasApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  React.useEffect(() => {
    if (userSettings) {
      setLocalKey(userSettings.cerebrasApiKey);
    }
  }, [userSettings]);

  // Import state
  const [targetType, setTargetType] = useState<keyof typeof TEMPLATES>('Topics');
  const [rawText, setRawText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'replace' | 'keep'>('skip');

  // Validation state
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  // Export state
  const [stripIds, setStripIds] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Real Firestore counts for Topics, Questions, & Vocabulary (props are limited to 50 for UI perf)
  const [realTopicCount, setRealTopicCount] = useState<number>(topics.length);
  const [realQuestionCount, setRealQuestionCount] = useState<number>(questions.length);
  const [realVocabularyCount, setRealVocabularyCount] = useState<number>(vocabularyWords.length);

  useEffect(() => {
    if (!userId) return;
    const fetchRealCounts = async () => {
      try {
        const [topicsSnap, questionsSnap, vocabSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'topics'), where('userId', '==', userId))),
          getCountFromServer(query(collection(db, 'questions'), where('userId', '==', userId))),
          getCountFromServer(query(collection(db, 'vocabularyWords'), where('userId', '==', userId)))
        ]);
        setRealTopicCount(topicsSnap.data().count);
        setRealQuestionCount(questionsSnap.data().count);
        setRealVocabularyCount(vocabSnap.data().count);
      } catch (err) {
        console.error('Failed to fetch real counts for export display:', err);
      }
    };
    fetchRealCounts();
  }, [userId]);

  // Template copy state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateRecord = (type: string, record: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const def = TEMPLATES[type as keyof typeof TEMPLATES];
    if (!def) return { isValid: false, errors: ['Unknown template type'] };

    def.requiredFields.forEach(field => {
      if (record[field] === undefined || record[field] === null || String(record[field]).trim() === '') {
        errors.push(`Missing required field: "${field}"`);
      }
    });

    if (type === 'Roadmaps' && record.topics) {
      if (!Array.isArray(record.topics)) {
        errors.push('"topics" must be a JSON array');
      } else {
        record.topics.forEach((t: any, idx: number) => {
          if (!t.name) errors.push(`Roadmap topic at index ${idx} is missing "name"`);
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleParseData = (inputArray: any[]) => {
    try {
      if (!Array.isArray(inputArray)) throw new Error('Parsed data is not an array');

      const validated: any[] = [];
      let valid = 0;
      let invalid = 0;
      const logs: string[] = [];

      inputArray.forEach((item, idx) => {
        const sanitized = sanitizeRecord(targetType, item);
        const { isValid, errors } = validateRecord(targetType, sanitized);
        if (isValid) {
          valid++;
          validated.push({ ...sanitized, __validated: true });
        } else {
          invalid++;
          logs.push(`Record #${idx + 1}: ${errors.join(', ')}`);
          validated.push({ ...sanitized, __validated: false, __errors: errors });
        }
      });

      setParsedRecords(validated);
      setValidCount(valid);
      setInvalidCount(invalid);
      setErrorLogs(logs);
      setParseStatus('success');
      setImportResult(null);
    } catch (e: any) {
      setParseStatus('error');
      setErrorLogs([`Parse error: ${e.message}`]);
      setParsedRecords([]);
      setValidCount(0);
      setInvalidCount(0);
    }
  };

  // ── Parsers ─────────────────────────────────────────────────────────────────

  const parseCsvString = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error('CSV must contain a header row and at least 1 data row.');

    const parseRow = (row: string) => {
      const result: string[] = [];
      let col = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '"') { inQuotes = !inQuotes; }
        else if (row[i] === ',' && !inQuotes) { result.push(col.trim()); col = ''; }
        else { col += row[i]; }
      }
      result.push(col.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    return lines.slice(1).map(line => {
      const cols = parseRow(line);
      const obj: any = {};
      headers.forEach((h, i) => {
        let v: any = cols[i] !== undefined ? cols[i] : '';
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v !== '' && !isNaN(v)) obj[h] = Number(v);
        else if (v === 'true') obj[h] = true;
        else if (v === 'false') obj[h] = false;
        else obj[h] = v;
      });
      return obj;
    });
  };

  const handlePasteParse = () => {
    if (!rawText.trim()) return;
    setErrorLogs([]); setParseStatus('idle');
    if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
      try {
        let parsed = JSON.parse(rawText);
        if (!Array.isArray(parsed)) parsed = [parsed];
        handleParseData(parsed);
      } catch (err: any) { setParseStatus('error'); setErrorLogs([`JSON Syntax Error: ${err.message}`]); }
    } else {
      try { handleParseData(parseCsvString(rawText)); }
      catch (err: any) { setParseStatus('error'); setErrorLogs([`CSV Parse Error: ${err.message}`]); }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setErrorLogs([]); setParseStatus('idle');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'json') {
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          handleParseData(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (err: any) { setParseStatus('error'); setErrorLogs([`JSON File Error: ${err.message}`]); }
      };
      reader.readAsText(file);
    } else if (ext === 'csv') {
      reader.onload = evt => {
        try { handleParseData(parseCsvString(evt.target?.result as string)); }
        catch (err: any) { setParseStatus('error'); setErrorLogs([`CSV File Error: ${err.message}`]); }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      reader.onload = evt => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          handleParseData(XLSX.utils.sheet_to_json(ws));
        } catch (err: any) { setParseStatus('error'); setErrorLogs([`Excel File Error: ${err.message}`]); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseStatus('error');
      setErrorLogs([`Unsupported format: .${ext}. Use .json, .csv, or .xlsx`]);
    }
  };

  const handleResetWorkspace = () => {
    setRawText(''); setImportFile(null); setParsedRecords([]);
    setParseStatus('idle'); setErrorLogs([]); setValidCount(0); setInvalidCount(0); setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyPrompt = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(key);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // ── Import ──────────────────────────────────────────────────────────────────

  const triggerImportAction = async () => {
    const validOnly = parsedRecords.filter(r => r.__validated).map(r => {
      const copy = { ...r };
      delete copy.__validated;
      delete copy.__errors;
      return copy;
    });

    if (validOnly.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await onBulkImport(targetType, validOnly, duplicatePolicy);
      setImportResult(result);
      handleResetWorkspace();
      setImportResult(result);
    } catch (e: any) {
      setErrorLogs([`Import failed: ${e.message}`]);
      setParseStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanExport = (item: any) => {
    const copy = { ...item };
    delete copy.userId;
    if (stripIds) delete copy.id;
    return copy;
  };

  /**
   * Fetches ALL records for collections that may be paginated in the UI
   * (topics, questions, vocabularyWords). Other collections are passed in as props directly.
   */
  const fetchAllForExport = async (): Promise<{
    allTopics: any[];
    allQuestions: any[];
    allVocabulary: any[];
  }> => {
    const [topicsSnap, questionsSnap, vocabSnap] = await Promise.all([
      getDocs(query(collection(db, 'topics'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'questions'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'vocabularyWords'), where('userId', '==', userId)))
    ]);
    const allTopics: any[] = [];
    topicsSnap.forEach(doc => allTopics.push(doc.data()));
    const allQuestions: any[] = [];
    questionsSnap.forEach(doc => allQuestions.push(doc.data()));
    const allVocabulary: any[] = [];
    vocabSnap.forEach(doc => allVocabulary.push(doc.data()));
    return { allTopics, allQuestions, allVocabulary };
  };

  const triggerDataExport = async (type: string, format: 'json' | 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      // For Topics, Questions, and Vocabulary, fetch ALL records from Firestore (bypass UI scroll limit)
      let allTopics = topics;
      let allQuestions = questions;
      let allVocabulary = vocabularyWords;
      if (type === 'Topics' || type === 'Questions' || type === 'Vocabulary') {
        const fetched = await fetchAllForExport();
        allTopics = fetched.allTopics;
        allQuestions = fetched.allQuestions;
        allVocabulary = fetched.allVocabulary;
      }

      const dataMap: Record<string, any[]> = {
        Subjects: subjects,
        Topics: allTopics,
        Questions: allQuestions,
        'Interview Questions': intelliQuestions,
        Mistakes: mistakes,
        'Activity Plans': plans,
        Journals: journals,
        Roadmaps: roadmaps,
        'Simulator Questions': mockPresetQuestions,
        Vocabulary: allVocabulary
      };

      const sourceData = dataMap[type];
      if (!sourceData || sourceData.length === 0) {
        alert(`No records found for ${type}.`);
        return;
      }

      const cleaned = sourceData.map(cleanExport);
      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `PrepMaster_${type}_${dateStr}.json`);
      } else if (format === 'csv') {
        const headers = Object.keys(cleaned[0] || {}).filter(k => typeof cleaned[0][k] !== 'object');
        const csvContent = [
          headers.join(','),
          ...cleaned.map(row => headers.map(f => `"${String(row[f] ?? '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), `PrepMaster_${type}_${dateStr}.csv`);
      } else if (format === 'xlsx') {
        let xlsxData = cleaned;
        if (type === 'Roadmaps') {
          xlsxData = cleaned.map(r => ({
            ...(!stripIds && { id: r.id }),
            title: r.title,
            description: r.description,
            total_topics: r.topics?.length || 0,
            topics_summary: r.topics?.map((t: any) => `${t.name} (${t.completed ? '✓' : '○'})`).join(' → ') || '',
            isActive: r.isActive,
            createdAt: r.createdAt
          }));
        }
        const ws = XLSX.utils.json_to_sheet(xlsxData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, type.slice(0, 31));
        XLSX.writeFile(wb, `PrepMaster_${type}_${dateStr}.xlsx`);
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerFullBackup = async () => {
    setIsExporting(true);
    try {
      // Always fetch ALL topics, questions, and vocabulary from Firestore for a complete backup
      const { allTopics, allQuestions, allVocabulary } = await fetchAllForExport();

      const backup = {
        exportedAt: new Date().toISOString(),
        version: '2.0',
        data: {
          subjects: subjects.map(cleanExport),
          topics: allTopics.map(cleanExport),
          questions: allQuestions.map(cleanExport),
          intelliQuestions: intelliQuestions.map(cleanExport),
          mistakes: mistakes.map(cleanExport),
          plans: plans.map(cleanExport),
          journals: journals.map(cleanExport),
          roadmaps: roadmaps.map(cleanExport),
          mockPresetQuestions: mockPresetQuestions.map(cleanExport),
          vocabulary: allVocabulary.map(cleanExport)
        }
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `PrepMaster_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const totalExportRecords = subjects.length + realTopicCount + realQuestionCount + intelliQuestions.length + mistakes.length + plans.length + journals.length + roadmaps.length + mockPresetQuestions.length + realVocabularyCount;

  // ── Export cards config ──────────────────────────────────────────────────────

  const exportCards = [
    { type: 'Subjects', count: subjects.length, desc: 'Subject groups that organize your topics', icon: Tag, color: 'indigo' },
    { type: 'Topics', count: realTopicCount, desc: 'Spacing repetition nodes with metrics', icon: BookOpen, color: 'violet' },
    { type: 'Questions', count: realQuestionCount, desc: 'Flashcards, difficulties & tag lists', icon: HelpCircle, color: 'sky' },
    { type: 'Interview Questions', count: intelliQuestions.length, desc: 'Company-tagged intelligence questions', icon: Zap, color: 'amber' },
    { type: 'Mistakes', count: mistakes.length, desc: 'Post-mortem tracking & failure diagnostics', icon: AlertTriangle, color: 'rose' },
    { type: 'Activity Plans', count: plans.length, desc: 'Strategic weekly targets and durations', icon: CheckCircle, color: 'emerald' },
    { type: 'Journals', count: journals.length, desc: 'Reflective learning summaries', icon: FileJson, color: 'teal' },
    { type: 'Roadmaps', count: roadmaps.length, desc: 'Hierarchical learning tracks & dependency links', icon: Database, color: 'pink' },
    { type: 'Simulator Questions', count: mockPresetQuestions.length, desc: 'Custom and seeded mock interview simulation pools', icon: RefreshCw, color: 'indigo' },
    { type: 'Vocabulary', count: realVocabularyCount, desc: 'Your personal vocabulary builder library with Marathi definitions', icon: BookMarked, color: 'sky' }
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-300'
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <span>Data Control Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bulk import, export, and backup your entire preparation workspace with AI-ready templates.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 self-start md:self-auto">
          {(['import', 'templates', 'export', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                activeSubTab === tab ? 'bg-indigo-650 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'import' ? 'Import Data' : tab === 'templates' ? 'AI Prompts' : tab === 'export' ? 'Export Backup' : 'Config'}
            </button>
          ))}
        </div>
      </div>

      {/* ── IMPORT TAB ─────────────────────────────────────────────────────── */}
      {activeSubTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Import result success banner */}
            {importResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 text-sm block">Import Completed Successfully!</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {importResult.imported} saved · {importResult.updated} updated · {importResult.skipped} skipped
                    </span>
                  </div>
                </div>
                <button onClick={() => setImportResult(null)} className="text-slate-500 hover:text-white text-xs cursor-pointer">✕</button>
              </div>
            )}

            <div className="glass-card p-6 space-y-5">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 font-bold">
                {['Select Entity', 'Set Policy', 'Load Data', 'Confirm Import'].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className={`px-2 py-0.5 rounded-md border ${i < 2 ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/5'}`}>
                      {i + 1}. {step}
                    </span>
                    {i < 3 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Step 1: Target Entity</label>
                  <p className="text-[10px] text-slate-500">Choose what catalog to populate.</p>
                  <select
                    value={targetType}
                    onChange={e => { setTargetType(e.target.value as any); handleResetWorkspace(); }}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-200 cursor-pointer"
                  >
                    {Object.keys(TEMPLATES).map(opt => (
                      <option key={opt} value={opt} className="bg-[#111827] text-white">{opt}</option>
                    ))}
                  </select>
                  {/* Required fields preview */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {TEMPLATES[targetType].requiredFields.map(f => (
                      <span key={f} className="text-[9px] font-mono bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">{f} *</span>
                    ))}
                    {TEMPLATES[targetType].optionalFields.map(f => (
                      <span key={f} className="text-[9px] font-mono bg-white/5 border border-white/5 text-slate-500 px-1.5 py-0.5 rounded uppercase">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Step 2: Duplicate Policy</label>
                  <p className="text-[10px] text-slate-500">What happens if a record already exists?</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'skip', label: 'Skip', desc: 'Keep existing' },
                      { key: 'replace', label: 'Replace', desc: 'Overwrite' },
                      { key: 'keep', label: 'Keep Both', desc: 'Add duplicate' }
                    ].map(pol => (
                      <button
                        key={pol.key}
                        onClick={() => setDuplicatePolicy(pol.key as any)}
                        className={`py-2 px-1 border rounded-xl text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                          duplicatePolicy === pol.key
                            ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-bold text-[10px]">{pol.label}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{pol.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Input area */}
              <div className="space-y-2">
                <span className="text-slate-300 text-xs font-bold block">Step 3: Paste JSON / CSV or upload a file</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={rawText}
                      onChange={e => { setRawText(e.target.value); setImportFile(null); setParseStatus('idle'); }}
                      placeholder={`Paste JSON array or CSV here...\n\nExample:\n${JSON.stringify(TEMPLATES[targetType].example.slice(0, 1), null, 2).slice(0, 120)}...`}
                      className="w-full p-3 font-mono text-[10px] bg-[#111827]/40 text-slate-300 rounded-xl border border-white/5 focus:ring-1 focus:ring-indigo-500 resize-none h-44"
                    />
                    <button
                      onClick={handlePasteParse}
                      disabled={!rawText.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Parse & Validate
                    </button>
                  </div>

                  <div className="border border-dashed border-white/10 hover:border-indigo-500/30 transition rounded-xl bg-white/3 p-5 flex flex-col items-center justify-center text-center space-y-2 h-44 cursor-pointer relative group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,.csv,.xlsx,.xls"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-white">Upload File</span>
                    <span className="text-[10px] text-slate-400">Supports .json, .csv, .xlsx</span>
                    {importFile && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">{importFile.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Parse result */}
              {parseStatus === 'success' && (
                <div className="border-t border-white/10 pt-4 space-y-4 animate-fade-in">

                  {/* Summary banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">Step 4: Validation Results</span>
                      <span className="text-sm font-extrabold text-white">{parsedRecords.length} records analyzed</span>
                    </div>
                    <div className="flex items-center gap-6 text-center font-mono">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">Total</span>
                        <span className="font-black text-white text-base">{parsedRecords.length}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-emerald-400 uppercase">Valid</span>
                        <span className="font-black text-emerald-400 text-base">{validCount}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-rose-400 uppercase">Invalid</span>
                        <span className="font-black text-rose-400 text-base">{invalidCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Error log */}
                  {errorLogs.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl space-y-1.5">
                      <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        {errorLogs.length} validation issue{errorLogs.length > 1 ? 's' : ''} detected
                      </span>
                      <div className="max-h-24 overflow-y-auto font-mono text-[10px] text-rose-350 space-y-0.5">
                        {errorLogs.map((log, i) => <div key={i}>• {log}</div>)}
                      </div>
                    </div>
                  )}

                  {/* Records preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Preview Records</span>
                    <div className="max-h-52 overflow-y-auto border border-white/5 bg-[#111827]/40 rounded-xl divide-y divide-white/5 text-xs">
                      {parsedRecords.map((rec, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-mono bg-white/5 border border-white/5 text-slate-400 px-1.5 py-0.5 rounded shrink-0">#{idx + 1}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-white text-[11px] truncate block">{rec.name || rec.question || rec.title || rec.companyName || rec.company || '—'}</span>
                              <span className="text-[9px] text-slate-500 font-mono truncate block">{rec.category || rec.difficulty || rec.type || rec.color || ''}</span>
                            </div>
                          </div>
                          {rec.__validated ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold shrink-0">✓ PASS</span>
                          ) : (
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold shrink-0">✗ FAIL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm */}
                  <div className="flex gap-3">
                    <button
                      onClick={triggerImportAction}
                      disabled={isProcessing || validCount === 0}
                      className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {isProcessing ? 'Writing to database...' : `Import ${validCount} Valid Records`}
                    </button>
                    <button onClick={handleResetWorkspace} className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition">
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {parseStatus === 'error' && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Parse Error
                  </span>
                  <p className="font-mono text-[10px] text-rose-350">{errorLogs[0]}</p>
                  <button onClick={handleResetWorkspace} className="py-1.5 px-3 bg-white/5 border border-white/5 rounded-md text-[10px] text-slate-300 cursor-pointer hover:bg-white/10">
                    Clear & Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Import Tips</h3>
              <div className="space-y-3 text-xs font-sans">
                <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                  <span className="font-bold text-white block mb-1">🤖 AI Prompt Workflow</span>
                  <p className="text-[10px] text-slate-400">Go to the AI Prompts tab → copy a prompt → paste into ChatGPT or Gemini → copy the JSON array result → paste here and click Parse.</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <span className="font-bold text-amber-300 block mb-1">📋 Auto-Sanitization</span>
                  <p className="text-[10px] text-slate-400">Missing fields like <code className="bg-white/5 px-1 rounded">revisionCount</code>, <code className="bg-white/5 px-1 rounded">tags</code>, and <code className="bg-white/5 px-1 rounded">forgotCount</code> are automatically seeded with safe defaults before validation.</p>
                </div>
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                  <span className="font-bold text-emerald-300 block mb-1">📊 CSV Support</span>
                  <p className="text-[10px] text-slate-400">Header row must match field names exactly. Array fields (tags, dependencyIds) are auto-split from comma-separated strings.</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Entity Quick-Ref</h3>
              <div className="space-y-2 text-[10px] font-mono">
                {Object.entries(TEMPLATES).map(([key, def]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">{key}</span>
                    <span className="text-slate-500">{def.requiredFields.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI PROMPTS TAB ──────────────────────────────────────────────────── */}
      {activeSubTab === 'templates' && (
        <div className="space-y-5">
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl text-xs flex items-start gap-3 font-sans">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-indigo-200 block">How to use AI Prompt Templates</span>
              <p className="text-slate-400 leading-relaxed">Copy a prompt from any card below → paste it into ChatGPT, Gemini, or Claude → copy the JSON array from the response → switch to <strong className="text-white">Import Data</strong> tab → paste and import.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(TEMPLATES).map(([key, def]) => (
              <div key={key} className="glass-card p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{key} Template</h4>
                      <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Format: {def.format}</span>
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(key, JSON.stringify(def.example, null, 2))}
                      className="px-2 py-1.5 border border-white/5 bg-white/5 text-[10px] font-semibold text-slate-300 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedType === key ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                      {copiedType === key ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {def.requiredFields.map(f => (
                      <span key={f} className="text-[9px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">{f} (req)</span>
                    ))}
                    {def.optionalFields.map(f => (
                      <span key={f} className="text-[9px] font-mono bg-white/5 border border-white/5 text-slate-500 px-1.5 py-0.5 rounded uppercase">{f}</span>
                    ))}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] font-semibold block mb-1">JSON Example:</span>
                    <pre className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono text-slate-350 max-h-28 overflow-y-auto leading-relaxed">
                      {JSON.stringify(def.example[0], null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-semibold">AI Prompt:</span>
                    <button
                      onClick={() => handleCopyPrompt(key + '-prompt', def.prompt)}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold cursor-pointer"
                    >
                      {copiedType === key + '-prompt' ? '✓ Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                  <div className="bg-[#111827]/50 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-slate-400 max-h-20 overflow-y-auto leading-relaxed">
                    {def.prompt.trim().split('\n').slice(0, 6).join('\n')}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXPORT TAB ─────────────────────────────────────────────────────── */}
      {activeSubTab === 'export' && (
        <div className="space-y-5">

          {/* Full Backup + Controls */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <PackageOpen className="w-4 h-4 text-indigo-400" />
                  Full Workspace Backup
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Export everything — subjects, topics, questions, mistakes, plans, journals, roadmaps — in a single JSON bundle.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                  <div
                    onClick={() => setStripIds(!stripIds)}
                    className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${stripIds ? 'bg-indigo-600' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${stripIds ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  Strip IDs
                </label>
                <button
                  onClick={triggerFullBackup}
                  disabled={totalExportRecords === 0 || isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Fetching all data...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Full Backup ({totalExportRecords} records)
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 border-t border-white/5 pt-4">
              {exportCards.map(c => (
                <div key={c.type} className={`text-center p-2 rounded-xl border text-[9px] font-mono font-bold ${colorMap[c.color]}`}>
                  <span className="block text-base font-black">{c.count}</span>
                  <span className="block opacity-80">{c.type.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual export cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportCards.map(item => {
              const Icon = item.icon;
              const colorCls = colorMap[item.color];
              return (
                <div key={item.type} className="glass-card p-4 flex flex-col justify-between space-y-3 hover:border-white/10 transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colorCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{item.type}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{item.count} items</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5 font-mono text-[10px]">
                    {(['json', 'csv', 'xlsx'] as const).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => triggerDataExport(item.type, fmt)}
                        disabled={item.count === 0 || isExporting}
                        className={`py-1.5 rounded-lg text-center font-bold transition cursor-pointer disabled:opacity-30 ${
                          fmt === 'xlsx'
                            ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                        }`}
                      >
                        {isExporting && (item.type === 'Topics' || item.type === 'Questions') ? (
                          <Loader className="w-3 h-3 animate-spin mx-auto" />
                        ) : (
                          fmt === 'xlsx' ? '.xlsx' : fmt.toUpperCase()
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Card 1: API Key Config */}
          <div className="glass-card p-6 border border-white/5 space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Cerebras AI Integrations Config</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Manage token keys used for real-time evaluations and hints.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Cerebras API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={localKey}
                    onChange={e => setLocalKey(e.target.value)}
                    placeholder="Enter csk-..."
                    className="w-full pl-3 pr-10 py-2.5 border rounded-xl glass-input text-slate-200 bg-[#111827]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 text-slate-500 hover:text-white cursor-pointer select-none text-[10px] font-bold"
                  >
                    {showKey ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Don't have a key? Sign up at <a href="https://cloud.cerebras.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-305">cloud.cerebras.ai</a> to get a free developer key.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!localKey.trim()) {
                    alert('Key cannot be empty.');
                    return;
                  }
                  setIsSavingKey(true);
                  try {
                    await onUpdateCerebrasKey(localKey);
                  } finally {
                    setIsSavingKey(false);
                  }
                }}
                disabled={isSavingKey}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow transition disabled:opacity-50"
              >
                {isSavingKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing API Settings...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Cerebras Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Theme Selector */}
          <div className="glass-card p-6 border border-white/5 space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Theme Customization</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Select a custom color palette and mesh-gradient glow for your preparation space.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              {[
                {
                  id: 'cyber-midnight',
                  name: 'Cyber Midnight',
                  desc: 'Futuristic Indigo & Slate',
                  accentBg: 'bg-indigo-500',
                  previewBg: 'bg-[#0d131f]'
                },
                {
                  id: 'emerald-aurora',
                  name: 'Emerald Aurora',
                  desc: 'Focus Mint & Deep Teal',
                  accentBg: 'bg-emerald-500',
                  previewBg: 'bg-[#031417]'
                },
                {
                  id: 'solar-sunset',
                  name: 'Solar Sunset',
                  desc: 'Vibrant Amber & Crimson',
                  accentBg: 'bg-amber-500',
                  previewBg: 'bg-[#120a06]'
                },
                {
                  id: 'amethyst-nebula',
                  name: 'Amethyst Nebula',
                  desc: 'Royal Cosmic Purple Glow',
                  accentBg: 'bg-purple-500',
                  previewBg: 'bg-[#0b0518]'
                },
                {
                  id: 'slate-minimalist',
                  name: 'Slate Minimalist',
                  desc: 'Monochromatic Steel & Gray',
                  accentBg: 'bg-sky-400',
                  previewBg: 'bg-[#0a0b0d]'
                },
                {
                  id: 'polaris-light',
                  name: 'Polaris Light',
                  desc: 'Crisp Cloud Light Mode',
                  accentBg: 'bg-indigo-650',
                  previewBg: 'bg-[#f8fafc] border border-slate-200'
                }
              ].map(themeItem => {
                const currentTheme = userSettings?.theme || 'cyber-midnight';
                const isActive = currentTheme === themeItem.id;
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => onUpdateTheme(themeItem.id)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between items-start gap-2.5 transition text-left cursor-pointer relative hover:scale-[1.01] ${
                      isActive 
                        ? 'bg-indigo-650/5 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.08)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-white text-xs tracking-wide">{themeItem.name}</span>
                      {isActive && (
                        <div className="w-4 h-4 rounded-full bg-indigo-650 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-8 h-5 rounded-md flex gap-0.5 p-0.5 items-center shrink-0 ${themeItem.previewBg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${themeItem.accentBg}`} />
                        <div className="w-1 h-1 rounded-full bg-white/30" />
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{themeItem.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: AI Gesture Control master switcher toggle */}
          <div className="glass-card p-6 border border-white/5 space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Hand className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">AI Gesture Controls</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Control the application, scroll and navigate tabs using hand movements and camera gestures.</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-sans">
              <div className="space-y-1">
                <span className="text-slate-300 font-bold block">Enable Camera Gestures</span>
                <p className="text-[10px] text-slate-500 max-w-sm leading-normal">
                  Turn this setting ON to activate the air-cursor mouse and camera classification overlay HUD. Keep OFF for traditional keyboard/mouse tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ enabled: !gestureState.settings.enabled })}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition cursor-pointer border ${
                  gestureState.settings.enabled
                    ? 'bg-emerald-600/10 text-emerald-450 border-emerald-500/20'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {gestureState.settings.enabled ? 'ON (Activated)' : 'OFF (Deactivated)'}
              </button>
            </div>
          </div>

        </div>

      )}
    </div>
  );
}
