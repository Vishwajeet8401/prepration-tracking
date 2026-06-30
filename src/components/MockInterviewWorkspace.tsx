import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { MockInterview, Topic, Subject, Question, InterviewIntelligenceQuestion, MockPresetQuestion } from '../types';
import { 
  Play, Square, Sparkles, Clock, ListTodo, Award, RefreshCw, 
  ChevronRight, CheckCircle2, AlertCircle, HelpCircle, Flame, BarChart2, BookOpen, Send,
  Mic, MicOff, Check, X, Info, Zap, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { speakNativeText, stopNativeSpeech, startNativeSpeechToText, stopNativeSpeechToText } from '../utils/mobileScheduler';

interface MockInterviewWorkspaceProps {
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  intelliQuestions: InterviewIntelligenceQuestion[];
  mockPresetQuestions: MockPresetQuestion[];
  customInterviewPrompt?: string;
  onUpdateCustomPrompt: (prompt: string) => Promise<void>;
  onAddMockPresetQuestion: (q: Omit<MockPresetQuestion, 'id' | 'userId'>) => Promise<void>;
  onDeleteMockPresetQuestion: (id: string) => Promise<void>;
  interviews: MockInterview[];
  cerebrasApiKey?: string;
  onAddInterview: (int: Omit<MockInterview, 'id' | 'userId'>) => Promise<void>;
  onDeleteInterview: (id: string) => Promise<void>;
}

const PRESET_QUESTIONS = {
  Technical: [
    {
      id: 't1',
      question: 'How does the ConcurrentHashMap achieve high concurrency compared to a synchronized Hashtable?',
      expectedKeywords: ['segment', 'bucket', 'reentrant lock', 'cas', 'compare and swap', 'synchronized blocks', 'node-level locking'],
      idealConcept: 'ConcurrentHashMap in modern Java uses CAS (Compare-And-Swap) operations for empty buckets, and locking at the single bucket node level. This avoids locking the entire map, allowing multiple reader threads and distinct bucket writer threads to operate simultaneously without interference.'
    },
    {
      id: 't2',
      question: 'What are the key differences between heap memory and stack memory in the Java Virtual Machine?',
      expectedKeywords: ['heap', 'stack', 'allocation', 'garbage collection', 'reference', 'thread safety', 'scope'],
      idealConcept: 'Stack memory is used for local variable storage, method execution frames, and object references. It is thread-safe and faster with LIFO structure. Heap memory stores all actual object instances, is shared across threads, and is managed dynamically by the Garbage Collector.'
    },
    {
      id: 't3',
      question: 'Explain the N+1 select query problem in Hibernate or JPA, and how can you solve it?',
      expectedKeywords: ['join fetch', 'entity graph', 'batch size', 'n+1', 'lazy loading', 'eager loading'],
      idealConcept: 'The N+1 problem occurs when Hibernate executes 1 query to retrieve parent entities and then executes N separate queries to retrieve child associations for each parent. It is solved using JOIN FETCH queries, JPA Entity Graphs, or setting a subselect/batch fetch size in configuration.'
    },
    {
      id: 't4',
      question: 'How do you ensure cache consistency between a distributed cache (like Redis) and your primary SQL database?',
      expectedKeywords: ['cache aside', 'write through', 'write behind', 'eviction', 'ttl', 'transactional', 'message queue'],
      idealConcept: 'Cache consistency is commonly maintained using the Cache-Aside pattern (write database, delete cache). Advanced systems use Write-Through, transactional cache invalidation, short TTL boundaries, or CDC (Change Data Capture) via message queues for asynchronous caching sync.'
    },
    {
      id: 't5',
      question: 'Explain the Javascript Event Loop, Call Stack, Microtask queue, and Macrotask queue hierarchy.',
      expectedKeywords: ['call stack', 'event loop', 'microtask', 'macrotask', 'promise', 'settimeout', 'callback queue'],
      idealConcept: 'The JavaScript event loop coordinates execution. Synchronous code runs on the call stack first. Once cleared, the loop processes the microtask queue (Promises, MutationObservers) to completion. Only then does it poll the macrotask queue (setTimeout, I/O tasks) for one callback per tick, ensuring non-blocking operations.'
    },
    {
      id: 't6',
      question: 'How does indexing speed up database queries, and what are the trade-offs of having too many indexes?',
      expectedKeywords: ['b-tree', 'index', 'scan', 'seek', 'insert', 'update', 'write overhead', 'disk space'],
      idealConcept: 'Database indexes (typically B-Trees) provide quick lookup pointers to avoid full table scans, converting O(N) operations to O(log N) seeks. However, indexes introduce write overhead because insert, update, and delete statements must modify the index trees, consuming extra disk space.'
    },
    {
      id: 't7',
      question: 'Explain the virtual DOM reconciliation process in React, including keys and diffing algorithm.',
      expectedKeywords: ['reconciliation', 'virtual dom', 'diffing', 'keys', 'fiber', 'render', 'complexity'],
      idealConcept: 'React uses a Virtual DOM to minimize direct browser reflows. During reconciliation, React walks old and new element trees, matching nodes. By using unique keys, React can track elements across renders, reducing updates from O(N^3) to O(N) by mapping matching tree elements efficiently.'
    }
  ],
  HR: [
    {
      id: 'h1',
      question: 'Tell me about a time when you had a technical disagreement with a colleague. How did you handle it?',
      expectedKeywords: ['listen', 'empathy', 'trade-offs', 'data-driven', 'collaboration', 'consensus', 'respect'],
      idealConcept: 'Explain a specific disagreement calmly, highlighting active listening, objectifying trade-offs using proof-of-concept benchmarks or official documentation, and collaborating constructive guidelines rather than arguing personal styles.'
    },
    {
      id: 'h2',
      question: 'Describe a challenging bug you encountered in production, your troubleshooting workflow, and how you hotfixed it.',
      expectedKeywords: ['logs', 'apm', 'root cause', 'hotfix', 'regression testing', 'post-mortem', 'monitoring'],
      idealConcept: 'Illustrate your systematic troubleshooting loop: gathering telemetry error logs, isolating the state, deploying a verified patch, executing safety regression tests, and conducting post-mortem tracking to avoid future leaks.'
    },
    {
      id: 'h3',
      question: 'Where do you see your technical career in five years?',
      expectedKeywords: ['architectural', 'mentoring', 'domain master', 'continuous learning', 'system design', 'impact'],
      idealConcept: 'Emphasize your intent to master high-availability backend microservices, lead architectural designs, mentor junior contributors, and translate product visions into scalable cloud-native architectures.'
    },
    {
      id: 'h4',
      question: 'How do you manage stress and prioritize tasks when faced with tight release deadlines?',
      expectedKeywords: ['prioritize', 'communication', 'scope', 'time management', 'delegation', 'incremental'],
      idealConcept: 'I prioritize tasks using the MoSCoW method, identifying critical dependencies. I maintain transparent communication with stakeholders to scope down optional requirements, and focus on delivering high-quality incremental updates instead of rushing large features.'
    },
    {
      id: 'h5',
      question: 'Why do you want to join our organization, and what value do you expect to bring?',
      expectedKeywords: ['culture', 'scale', 'domain', 'problem solving', 'alignment', 'contribution'],
      idealConcept: 'I am highly aligned with your focus on building high-availability, user-centric systems at scale. I bring a strong background in backend performance optimization, a solid problem-solving mindset, and a commitment to collaborative, continuous improvement.'
    }
  ],
  'System Design': [
    {
      id: 's1',
      question: 'How would you design a scalable distributed rate limiter for an API gateway serving millions of users?',
      expectedKeywords: ['token bucket', 'sliding window', 'redis', 'lua scripts', 'fallback', 'middleware', 'latency'],
      idealConcept: 'Implement a Token Bucket or Sliding Window log algorithm using Redis to hold rate limit counters dynamically. Use Redis Lua scripts to execute queries atomically, keeping latency below 5ms with back-up local fallback headers.'
    },
    {
      id: 's2',
      question: 'How would you design a highly consistent, fault-tolerant distributed transaction system?',
      expectedKeywords: ['two-phase commit', '2pc', 'saga pattern', 'compensation', 'outbox pattern', 'idempotency'],
      idealConcept: 'For strict consistency, two-phase commit is used but limits performance. In microservices, the Saga Pattern is preferred: using orchestration or choreographies with compensating events, backed by transactional outbox pipelines and idempotency guards.'
    },
    {
      id: 's3',
      question: 'How would you design a scalable distributed unique ID generator (like Snowflake)?',
      expectedKeywords: ['snowflake', 'timestamp', 'worker id', 'sequence', 'uuid', 'collision', 'coordination'],
      idealConcept: 'A distributed ID generator can use Twitter Snowflake structure: 41 bits for timestamp, 10 bits for worker/node ID, and 12 bits for a sequence number. This allows generating 64-bit sortable unique IDs locally on each server without central coordination databases, avoiding latency bottlenecks.'
    },
    {
      id: 's4',
      question: 'How would you design a high-throughput video uploading and encoding service like YouTube?',
      expectedKeywords: ['transcoding', 'chunking', 'object storage', 'cdn', 'queue', 'metadata', 'scalability'],
      idealConcept: 'The design uploads videos in chunks to Object Storage, triggering async jobs in a message queue. Worker pools process chunks in parallel, transcoding them into multiple formats (1080p, 720p, etc.). Video metadata is saved to a database, and encoded files are pushed to Edge CDNs for low-latency playback.'
    }
  ],
  Behavioral: [
    {
      id: 'b1',
      question: 'Describe a time you failed to meet a target deadline. What did you learn and how did you manage expectations?',
      expectedKeywords: ['proactive communication', 'transparency', 'prioritization', 'agile', 'timeline modification', 'velocity'],
      idealConcept: 'Highlight proactive communication with stakeholders the moment risks were discovered. Detail how you re-prioritized features, shipped MVP core functionality on time, and adjusted sprint velocity estimations for future projects.'
    },
    {
      id: 'b2',
      question: 'Tell me about a time you had to take lead on a project with ambiguous or incomplete requirements.',
      expectedKeywords: ['ambiguity', 'stakeholders', 'requirements', 'proactive', 'feedback loop', 'prototype'],
      idealConcept: 'When requirements were ambiguous, I took initiative by organizing meetings with key stakeholders to define core goals. I built a simple, low-fidelity prototype to visualize the flow, gather early feedback, and iteratively document refined product specs, reducing scope risks.'
    },
    {
      id: 'b3',
      question: 'Describe a time you received constructive criticism that impacted your development style. How did you react?',
      expectedKeywords: ['feedback', 'listening', 'growth mindset', 'improvement', 'refactoring', 'code review'],
      idealConcept: 'During a code review, a lead developer pointed out that my architecture was overly complex for the feature requirements. I listened with a growth mindset, worked with them to refactor the module for simplicity and readability, and now actively focus on writing simpler, more maintainable code.'
    }
  ]
};

const MockInterviewWorkspace = React.memo(function MockInterviewWorkspace({
  subjects,
  topics,
  questions,
  intelliQuestions,
  mockPresetQuestions,
  customInterviewPrompt,
  onUpdateCustomPrompt,
  onAddMockPresetQuestion,
  onDeleteMockPresetQuestion,
  interviews,
  cerebrasApiKey,
  onAddInterview,
  onDeleteInterview
}: MockInterviewWorkspaceProps) {
  const DEFAULT_PERSONA_PROMPT = `You are an expert technical interviewer at a top-tier tech company.
Your task is to generate exactly 3 challenging, thinking-based, scenario-oriented interview questions for a candidate.
Avoid simple definitions like "what is oops" or "what is a class". 
Generate scenario-based questions that test deep technical/conceptual knowledge, system design choices, or soft skills/problem-solving based on the stream.`;

  const [localPersonaPrompt, setLocalPersonaPrompt] = useState(customInterviewPrompt || DEFAULT_PERSONA_PROMPT);
  const [showPersonaPromptEditor, setShowPersonaPromptEditor] = useState(false);
  const [isSavingPersonaPrompt, setIsSavingPersonaPrompt] = useState(false);

  useEffect(() => {
    if (customInterviewPrompt) {
      setLocalPersonaPrompt(customInterviewPrompt);
    }
  }, [customInterviewPrompt]);

  // Config state
  const [roundType, setRoundType] = useState<'Technical' | 'HR' | 'System Design' | 'Behavioral'>('Technical');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionSource, setQuestionSource] = useState<'Presets' | 'Question Bank' | 'Intelligence DB' | 'AI Generated'>('Presets');
  const [subjectId, setSubjectId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<'Junior' | 'Mid' | 'Senior' | 'Staff'>('Senior');
  const [companyType, setCompanyType] = useState<'FAANG / Tier 1' | 'Startup / High-Growth' | 'Enterprise / Fintech' | 'General Tech'>('FAANG / Tier 1');

  // Reset topicId if the selected topic doesn't belong to the newly selected subject
  useEffect(() => {
    if (subjectId) {
      const selectedTopicObj = topics.find(t => t.id === topicId);
      if (selectedTopicObj && selectedTopicObj.subjectId !== subjectId) {
        setTopicId('');
      }
    }
  }, [subjectId, topics, topicId]);

  // Ensure questionSource is not 'AI Generated' if there is no api key
  useEffect(() => {
    if (!cerebrasApiKey && questionSource === 'AI Generated') {
      setQuestionSource('Presets');
    }
  }, [cerebrasApiKey, questionSource]);
  
  // Active session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionsList, setQuestionsList] = useState<Array<{ id: string; question: string; expectedKeywords: string[]; idealConcept: string }>>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [vocalPrompts, setVocalPrompts] = useState(true);

  // Hint states
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [activeHintLoading, setActiveHintLoading] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // Stop speaking when session terminates
  useEffect(() => {
    if (!isSessionActive) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopNativeSpeech();
    }
  }, [isSessionActive]);

  
  // Session logs list for active run
  const [sessionHistory, setSessionHistory] = useState<Array<{
    question: string;
    answer: string;
    evaluation: string;
    score: number;
    answerTime: number;
    matchedKeywords: string[];
    missedKeywords: string[];
    idealConcept?: string;
    fillerWordsCount?: number;
    fillerWordsSpotted?: string[];
    scores?: { accuracy: number; modeling: number; clarity: number; depth: number };
    hintUsed?: boolean;
  }>>([]);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Time boundaries per question
  const limitSecondsPerQuestion = useMemo(() => {
    if (difficulty === 'Easy') return 180; // 3 min
    if (difficulty === 'Medium') return 120; // 2 min
    return 60; // 1 min countdown
  }, [difficulty]);

  // Timing states
  const [timerSeconds, setTimerSeconds] = useState(limitSecondsPerQuestion);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stats computed
  const avgPerformanceScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length)
    : 0;

  const totalAnsweredCount = interviews.reduce((sum, i) => sum + i.answeredCount, 0);

  // Web Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        setUserAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + text);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    // 1. Native Mobile speech-to-text route
    if (Capacitor.isNativePlatform()) {
      if (isListening) {
        stopNativeSpeechToText();
        setIsListening(false);
      } else {
        setIsListening(true);
        startNativeSpeechToText((text) => {
          // Callback that receives transcribed text
          setUserAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + text);
        });
      }
      return;
    }

    // 2. Web browser speech-to-text route
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [isEvaluating, setIsEvaluating] = useState(false);

  // Text to Speech logic
  const speakQuestion = (text: string) => {
    // Try native mobile speech engine first
    speakNativeText(text);

    if (!window.speechSynthesis) {
      console.warn('Text-to-speech is not supported in this environment.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Auto-read question on load/change
  useEffect(() => {
    if (isSessionActive && questionsList[currentQuestionIndex] && vocalPrompts) {
      const timer = setTimeout(() => {
        speakQuestion(questionsList[currentQuestionIndex].question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSessionActive, currentQuestionIndex, questionsList, vocalPrompts]);

  // Real-time hint generator from Cerebras Llama 3.3 70b
  const requestHint = async () => {
    const currentQ = questionsList[currentQuestionIndex];
    if (!currentQ) return;
    setActiveHintLoading(true);
    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cerebrasApiKey || 'csk-42tvmeyxc9mkpjdwm2hp556whrhvme63hh9wnypctt82vtj2'}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "You are an expert tech interviewer coach. Provide a short, constructive, one-sentence hint to help the candidate structure their answer to the question. Do not answer it directly; give a helpful structural tip."
            },
            {
              role: "user",
              content: `Question: ${currentQ.question}`
            }
          ],
          temperature: 0.5,
          max_completion_tokens: 80
        })
      });
      if (response.ok) {
        const resData = await response.json();
        const hintText = resData.choices[0].message.content.trim();
        setActiveHint(hintText);
        setHintUsed(true);
      } else {
        throw new Error("Failed response status");
      }
    } catch (e) {
      console.warn("Cerebras hint generation failed, generating local fallback hint:", e);
      setActiveHint(`Focus on structuring your thoughts around: ${currentQ.expectedKeywords.slice(0, 3).join(', ')}.`);
      setHintUsed(true);
    } finally {
      setActiveHintLoading(false);
    }
  };



  // Start Session handler
  const startInterview = async () => {
    const shuffleArray = <T,>(array: T[]): T[] => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    let list: Array<{ id: string; question: string; expectedKeywords: string[]; idealConcept: string }> = [];

    if (questionSource === 'Presets') {
      const dbPresets = mockPresetQuestions.filter(q => q.roundType === roundType);
      if (dbPresets.length > 0) {
        list = dbPresets.map(q => ({
          id: q.id,
          question: q.question,
          expectedKeywords: q.expectedKeywords,
          idealConcept: q.idealConcept
        }));
      } else {
        list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
      }
    } else if (questionSource === 'Question Bank') {
      const filtered = questions.filter(q => {
        const diffMatch = q.difficulty === difficulty;
        const topicMatch = !topicId || q.topicId === topicId;
        const subjectMatch = !subjectId || (() => {
          const t = topics.find(tp => tp.id === q.topicId);
          return t ? t.subjectId === subjectId : false;
        })();
        return diffMatch && topicMatch && subjectMatch;
      });
      list = filtered.map((q, idx) => ({
        id: q.id || `qb-${idx}`,
        question: q.question,
        expectedKeywords: q.tags && q.tags.length > 0 ? q.tags : ['concept', 'explanation'],
        idealConcept: q.answer
      }));
    } else if (questionSource === 'Intelligence DB') {
      const filtered = intelliQuestions.filter(q => {
        const diffMatch = q.difficulty === difficulty;
        const selectedTopicObj = topics.find(t => t.id === topicId);
        const topicMatch = !topicId || (selectedTopicObj ? q.topic.toLowerCase() === selectedTopicObj.name.toLowerCase() : true);
        return diffMatch && topicMatch;
      });
      list = filtered.map((q, idx) => ({
        id: q.id || `iq-${idx}`,
        question: q.question,
        expectedKeywords: [q.topic.toLowerCase(), 'architecture', 'implementation'],
        idealConcept: q.answer
      }));
    } else {
      // AI Generated
      setIsGeneratingQuestions(true);
      const subjectName = subjectId ? (subjects.find(s => s.id === subjectId)?.name || '') : '';
      const topicName = topicId ? (topics.find(t => t.id === topicId)?.name || '') : '';
      const focusText = [
        subjectName && `Subject Focus: ${subjectName}`,
        topicName && `Topic Focus: ${topicName}`
      ].filter(Boolean).join('. ');

      try {
        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cerebrasApiKey || 'csk-42tvmeyxc9mkpjdwm2hp556whrhvme63hh9wnypctt82vtj2'}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages: [
              {
                role: "system",
                content: `${localPersonaPrompt}
                
                Strict formatting requirements:
                You must return a JSON array containing exactly 3 objects. Each object must have these fields:
                - "id": a unique string ID (e.g. "ai-q1")
                - "question": the scenario-based question text
                - "expectedKeywords": an array of 5-8 lowercase strings representing key technical terms/concepts candidate should reference in their response
                - "idealConcept": a 3-4 sentence detailed ideal answer that represents an expert/mastered response
                
                Format the response strictly as a valid JSON array. Do not wrap the JSON output in markdown backticks or explanation text.`
              },
              {
                role: "user",
                content: `Generate questions for a ${roundType} round targeting ${difficulty} difficulty. ${focusText ? `${focusText}. ` : ''}Target seniority level: ${experienceLevel}. Focus style matching this company profile: ${companyType}.`
              }
            ],
            temperature: 0.7,
            max_completion_tokens: 800
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const text = resData.choices[0].message.content.trim();
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          list = JSON.parse(cleaned);
        } else {
          throw new Error("Failed to contact Cerebras AI");
        }
      } catch (err) {
        console.warn("Cerebras question generation failed, falling back to presets:", err);
        const dbPresets = mockPresetQuestions.filter(q => q.roundType === roundType);
        if (dbPresets.length > 0) {
          list = dbPresets.map(q => ({
            id: q.id,
            question: q.question,
            expectedKeywords: q.expectedKeywords,
            idealConcept: q.idealConcept
          }));
        } else {
          list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
        }
      } finally {
        setIsGeneratingQuestions(false);
      }
    }

    if (list.length === 0) {
      alert(`No questions found in ${questionSource} matching ${difficulty} difficulty. Falling back to presets.`);
      list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
    }

    // Shuffle the loaded questions so they aren't in the same order/duplicates
    list = shuffleArray(list);

    // limit to max 4 questions for high-intensity timed simulator
    setQuestionsList(list.slice(0, 4));
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setSessionHistory([]);
    setTimerSeconds(limitSecondsPerQuestion);
    setTotalTimerSeconds(0);
    setIsSessionActive(true);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          triggerAutoSubmit();
          return limitSecondsPerQuestion;
        }
        return prev - 1;
      });
      setTotalTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  const triggerAutoSubmit = () => {
    alert('Time limit reached for this question! Auto-submitting response.');
    submitAnswer(true);
  };

  // Submit Answer handler
  const submitAnswer = async (forceAutoSubmit = false) => {
    if (!userAnswer.trim() && !forceAutoSubmit) {
      alert('Please type or dictate an answer before submitting, or wait for the timer to expire.');
      return;
    }

    // Stop speech recognition if listening
    if (isListening) {
      if (Capacitor.isNativePlatform()) {
        stopNativeSpeechToText();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }

    const currentQ = questionsList[currentQuestionIndex];
    if (!currentQ) return;

    const answerText = userAnswer.trim() || '[No Answer Provided / Time Out]';
    const answerLower = answerText.toLowerCase();

    // Matching Engine
    const matched = currentQ.expectedKeywords.filter(kw => answerLower.includes(kw.toLowerCase()));
    const missed = currentQ.expectedKeywords.filter(kw => !answerLower.includes(kw.toLowerCase()));
    const matchRatio = currentQ.expectedKeywords.length > 0 ? matched.length / currentQ.expectedKeywords.length : 1;

    // Strict evaluation rules
    let score = Math.round(matchRatio * 75);
    
    // Detailed length bonus
    if (answerText.length > 150) {
      score += 25;
    } else if (answerText.length > 60) {
      score += 15;
    } else if (answerText.length > 10) {
      score += 5;
    }

    // Filler word analysis
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'literally', 'so', 'essentially'];
    const words = answerText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    const spottedFillers: string[] = [];
    let fillerCount = 0;
    words.forEach(w => {
      if (fillers.includes(w)) {
        fillerCount++;
        if (!spottedFillers.includes(w)) spottedFillers.push(w);
      }
    });
    const youKnowMatches = (answerText.toLowerCase().match(/you know/g) || []).length;
    if (youKnowMatches > 0) {
      fillerCount += youKnowMatches;
      if (!spottedFillers.includes('you know')) spottedFillers.push('you know');
    }

    // Skip/Empty penalty
    if (forceAutoSubmit && !userAnswer.trim()) {
      score = 0;
    }

    score = Math.min(100, Math.max(0, score));

    let evaluation = '';
    if (score >= 80) {
      evaluation = `Superb explanation. You successfully matched key concepts: ${matched.join(', ')}. Your response demonstrates clear production authority on the subject. Expected keywords were thoroughly covered aligned with ideal architectural standards.`;
    } else if (score >= 50) {
      evaluation = `Solid answer but can be enhanced. You hit core concepts: ${matched.join(', ')}. However, to move into Mastered level, make sure to explicitly cite: ${missed.join(', ')}. Try to expand your details with practical application instances of these definitions.`;
    } else {
      evaluation = `Conceptual gaps identified. You mentioned few descriptors: ${matched.length > 0 ? matched.join(', ') : 'none'}. For high-tier selections, you must incorporate essential terms like: ${currentQ.expectedKeywords.join(', ')}. Review the ideal definition framework carefully.`;
    }

    let dynamicScores = {
      accuracy: Math.round(score * 1.05 > 100 ? 100 : score * 1.05),
      modeling: Math.round(score * 0.95),
      clarity: Math.max(20, Math.round(score - (fillerCount * 5))),
      depth: Math.round(score)
    };

    // Attempt AI evaluation via Cerebras Llama 3.3 70b
    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cerebrasApiKey || 'csk-42tvmeyxc9mkpjdwm2hp556whrhvme63hh9wnypctt82vtj2'}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: `You are an expert technical interviewer evaluating a candidate's answer for a mock interview question.
              You must return a JSON object with these exact fields:
              - "score": a number from 0 to 100 representing overall answer accuracy and quality.
              - "evaluation": a 3-4 sentence detailed review explaining what they did well, what concepts they missed, and how to improve.
              - "accuracy": a number 0-100 evaluating conceptual and technical accuracy.
              - "modeling": a number 0-100 evaluating structural and systems thinking logic.
              - "clarity": a number 0-100 evaluating explanation structure and communication clarity.
              - "depth": a number 0-100 evaluating comprehensive detail level.
              
              Strictly output valid JSON only. Do not wrap in markdown or markdown code blocks.`
            },
            {
              role: "user",
              content: `Question: ${currentQ.question}
              Expected Key Concepts/Keywords: ${currentQ.expectedKeywords.join(', ')}
              Ideal/Better Answer Reference: ${currentQ.idealConcept}
              Candidate Answer: ${answerText}`
            }
          ],
          temperature: 0.1,
          max_completion_tokens: 220
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const text = resData.choices[0].message.content.trim();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiEval = JSON.parse(cleaned);
        if (typeof aiEval.score === 'number' && aiEval.evaluation) {
          score = Math.min(100, Math.max(0, aiEval.score));
          evaluation = aiEval.evaluation;
          dynamicScores = {
            accuracy: typeof aiEval.accuracy === 'number' ? aiEval.accuracy : score,
            modeling: typeof aiEval.modeling === 'number' ? aiEval.modeling : score,
            clarity: typeof aiEval.clarity === 'number' ? aiEval.clarity : score,
            depth: typeof aiEval.depth === 'number' ? aiEval.depth : score
          };
        }
      }
    } catch (err) {
      console.warn("Cerebras evaluation failed, falling back to keyword heuristic evaluation", err);
    }

    setIsEvaluating(false);

    const elapsedSeconds = limitSecondsPerQuestion - timerSeconds;

    // Capture entry
    const entry = {
      id: currentQ.id,
      question: currentQ.question,
      answer: answerText,
      evaluation,
      score,
      answerTime: elapsedSeconds,
      matchedKeywords: matched,
      missedKeywords: missed,
      idealConcept: currentQ.idealConcept,
      fillerWordsCount: fillerCount,
      fillerWordsSpotted: spottedFillers,
      scores: dynamicScores,
      hintUsed: hintUsed
    };

    const nextHistory = [...sessionHistory, entry];
    setSessionHistory(nextHistory);

    // Reset hint states for next question
    setActiveHint(null);
    setHintUsed(false);

    // Stop listening on answer submission
    if (isListening) {
      if (Capacitor.isNativePlatform()) {
        stopNativeSpeechToText();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
    }

    // Advance
    if (currentQuestionIndex + 1 < questionsList.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setTimerSeconds(limitSecondsPerQuestion); // reset countdown timer
    } else {
      // Finished!
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Save overall mock report
      const overallScore = Math.round(nextHistory.reduce((sum, h) => sum + h.score, 0) / nextHistory.length);
      const avgTime = Math.round(totalTimerSeconds / nextHistory.length);
      
      const overallFeedback = overallScore >= 80
        ? `Selected! Excellent simulated interview under standard ${difficulty} timing limits. You hit high evaluation standard bounds on ${roundType} elements.`
        : overallScore >= 60
        ? `Pending Decision. Strong attempt on ${roundType}, but gaps in specific conceptual segments should be resolved prior to live panels.`
        : `Rejected. Found multiple gaps across essential keywords. Review custom revisions and study weak sections to consolidate foundational tracks.`;

      // Extract actual topics covered dynamically
      const topicsCovered = Array.from(new Set(
        questionsList.map(q => {
          if (questionSource === 'Question Bank') {
            const qbQuestion = questions.find(questionItem => questionItem.question === q.question);
            if (qbQuestion && qbQuestion.topicId) {
              const matchedTopic = topics.find(t => t.id === qbQuestion.topicId);
              if (matchedTopic) return matchedTopic.name;
            }
          } else if (questionSource === 'Intelligence DB') {
            const intellQ = intelliQuestions.find(iq => iq.question === q.question);
            if (intellQ) return intellQ.topic;
          }
          return roundType;
        }).filter(Boolean)
      )) as string[];

      await onAddInterview({
        roundType,
        difficulty,
        subjectId: subjectId || undefined,
        experienceLevel,
        companyType,
        topicsCovered: topicsCovered.length > 0 ? topicsCovered : ['Enterprise Architecture'],
        answeredCount: nextHistory.length,
        totalQuestions: questionsList.length,
        score: overallScore,
        averageAnswerTime: avgTime,
        confidenceScore: overallScore,
        feedback: overallFeedback,
        history: nextHistory,
        createdAt: new Date().toISOString()
      });

      setIsSessionActive(false);
      alert(`Completed mock interview session! Formulated complete scorecard feedback: ${overallScore}% score saved successfully.`);
    }
  };

  // Close early
  const terminateSessionEarly = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSessionActive(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS AND KPI CHIPS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>Mock Interview Simulator</span>
          </h2>
          <p className="text-xs text-slate-404 mt-0.5">Evaluate your live communication and memory retrieval accuracy in simulation rounds.</p>
        </div>

        {/* Top KPI trackers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div className="text-left font-sans">
              <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none">Rounds Complete</span>
              <span className="text-sm font-extrabold text-white font-mono leading-none">{interviews.length}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <div className="text-left font-sans">
              <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none">Avg Scorecard Accuracy</span>
              <span className="text-sm font-extrabold text-indigo-300 font-mono leading-none">{avgPerformanceScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      {!isSessionActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SETUP CONTROL PANEL (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Configure Simulation Round</h3>

              {/* AI Status Indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                cerebrasApiKey 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cerebrasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div className="text-left font-sans">
                    <span className="font-bold block">
                      {cerebrasApiKey ? 'AI Engine: Connected' : 'AI Engine: Local Fallback Mode'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {cerebrasApiKey 
                        ? 'Cerebras Llama-3.3-70b active for custom question generation and detailed grading.' 
                        : 'Using keyword matcher and local presets. Add your Cerebras API key in Backup & Data Settings to enable AI.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom AI prompt editor */}
              <div className="border border-white/5 bg-white/5 rounded-xl overflow-hidden text-xs">
                <div 
                  onClick={() => setShowPersonaPromptEditor(!showPersonaPromptEditor)}
                  className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-white/10 transition"
                >
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>AI Interviewer Prompt Persona Settings</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showPersonaPromptEditor ? 'rotate-90' : ''}`} />
                </div>
                
                {showPersonaPromptEditor && (
                  <div className="p-3.5 border-t border-white/5 space-y-3">
                    <p className="text-[10px] text-slate-400 font-sans">
                      Customize the behavior, constraints, and instructions of the AI interviewer. Llama 3.3 will use this prompt template to design scenario questions and evaluate your responses.
                    </p>
                    <textarea
                      value={localPersonaPrompt}
                      onChange={e => setLocalPersonaPrompt(e.target.value)}
                      rows={4}
                      className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 leading-normal"
                      placeholder="Enter custom interviewer instructions..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setLocalPersonaPrompt(DEFAULT_PERSONA_PROMPT)}
                        className="px-2.5 py-1.5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white rounded-lg cursor-pointer transition hover:bg-white/5"
                      >
                        Reset Default
                      </button>
                      <button
                        type="button"
                        disabled={isSavingPersonaPrompt}
                        onClick={async () => {
                          setIsSavingPersonaPrompt(true);
                          try {
                            await onUpdateCustomPrompt(localPersonaPrompt);
                          } finally {
                            setIsSavingPersonaPrompt(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-[10px] font-bold text-white rounded-lg cursor-pointer transition flex items-center gap-1"
                      >
                        {isSavingPersonaPrompt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Select Round Stream</label>
                  <p className="text-[10px] text-slate-500">Each category targets a distinct selection framework.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Technical', 'HR', 'System Design', 'Behavioral'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setRoundType(opt as any)}
                        className={`py-2 px-3 rounded-lg border text-left font-bold transition cursor-pointer ${
                          roundType === opt
                            ? 'bg-indigo-650 text-white border-indigo-500/50 shadow-md'
                            : 'bg-white/5 text-slate-350 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Question Pool Source</label>
                  <p className="text-[10px] text-slate-500">Select where the questions should be loaded from.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Presets', 'Question Bank', 'Intelligence DB', 'AI Generated']
                      .filter(src => src !== 'AI Generated' || !!cerebrasApiKey)
                      .map(src => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setQuestionSource(src as any)}
                          className={`py-2 px-1 rounded-lg border text-center font-bold text-[10px] transition cursor-pointer ${
                            questionSource === src
                              ? 'bg-violet-650 text-white border-violet-500/50 shadow'
                              : 'bg-white/5 text-slate-350 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {src}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Simulation Difficulty (Time constraints)</label>
                  <p className="text-[10px] text-slate-500">Countdown speed per response target.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'Easy', time: '3m' },
                      { key: 'Medium', time: '2m' },
                      { key: 'Hard', time: '1m' }
                    ].map(dopt => (
                      <button
                        key={dopt.key}
                        type="button"
                        onClick={() => setDifficulty(dopt.key as any)}
                        className={`py-2 px-1 rounded-lg border text-center font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          difficulty === dopt.key
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                            : 'bg-white/5 text-slate-350 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-[11px]">{dopt.key}</span>
                        <span className="text-[8px] opacity-70 font-mono">{dopt.time} limit</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Target Subject Focus (Optional)</label>
                  <p className="text-[10px] text-slate-500">Record subject alignment in historic profiles.</p>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-205 cursor-pointer bg-[#111827]"
                  >
                    <option value="" className="bg-[#111827]">General / Mixed</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#111827]">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Target Topic Focus (Optional)</label>
                  <p className="text-[10px] text-slate-500">Focus the simulation round on a specific topic.</p>
                  <select
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-205 cursor-pointer bg-[#111827]"
                  >
                    <option value="" className="bg-[#111827]">General / Mixed</option>
                    {topics
                      .filter(t => !subjectId || t.subjectId === subjectId)
                      .map(t => (
                        <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Target Experience Level</label>
                  <p className="text-[10px] text-slate-500">Tailors question complexities & expectations.</p>
                  <select
                    value={experienceLevel}
                    onChange={e => setExperienceLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-205 cursor-pointer bg-[#111827]"
                  >
                    <option value="Junior" className="bg-[#111827]">Junior / Associate (0-2 YOE)</option>
                    <option value="Mid" className="bg-[#111827]">Mid-Level (3-5 YOE)</option>
                    <option value="Senior" className="bg-[#111827]">Senior Engineer (5-8 YOE)</option>
                    <option value="Staff" className="bg-[#111827]">Staff / Principal Architect (8+ YOE)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Company Style Profile</label>
                  <p className="text-[10px] text-slate-500">Aligns questions with specific company structures.</p>
                  <select
                    value={companyType}
                    onChange={e => setCompanyType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl glass-input text-slate-205 cursor-pointer bg-[#111827]"
                  >
                    <option value="FAANG / Tier 1" className="bg-[#111827]">FAANG / Tier 1 (Scale, latency, theory)</option>
                    <option value="Startup / High-Growth" className="bg-[#111827]">Startup / Fast Growth (Speed, deployment)</option>
                    <option value="Enterprise / Fintech" className="bg-[#111827]">Enterprise / Fintech (Security, compliance, reliability)</option>
                    <option value="General Tech" className="bg-[#111827]">General Tech Companies</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-1">
                  <div 
                    onClick={() => setVocalPrompts(!vocalPrompts)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/5 cursor-pointer select-none hover:bg-white/10 transition"
                  >
                    <input 
                      type="checkbox" 
                      checked={vocalPrompts} 
                      onChange={() => {}} 
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-500"
                    />
                    <div className="text-left">
                      <span className="block text-[11px] font-bold text-white leading-tight">Interviewer Vocal Prompts</span>
                      <span className="block text-[8px] text-slate-400">Auto-read questions aloud</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Brief */}
              <div className="bg-[#111827]/40 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-xs leading-normal text-slate-350">
                <span className="font-bold text-white flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>How Mock Simulator Evaluation Works</span>
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>You will be presented a sequence of up to 4 high-frequency questions.</li>
                  <li>Use the **hands-free microphone dictation** or type your response clearly in the text box.</li>
                  <li>Our matching algorithm scores your answer against expected keywords with a strict countdown timer.</li>
                  <li>If the timer expires, the answer will be auto-submitted to test your pressure-retention metrics.</li>
                </ul>
              </div>

              {/* Start Trigger */}
              <button
                type="button"
                onClick={startInterview}
                disabled={isGeneratingQuestions}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingQuestions ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Cerebras AI generating custom scenario questions...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Begin Real-Time Mock Interview Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* RECENT SCORECARDS HISTORY */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider block font-mono">Simulated Historic Scorecards</h3>
              
              <div className="space-y-3">
                {interviews.map(item => (
                  <div key={item.id} className="glass-card p-4 space-y-3 border border-white/5 hover:border-white/10 transition text-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-widest block">
                          {item.roundType} &bull; {item.difficulty}
                          {item.experienceLevel ? ` • ${item.experienceLevel}` : ''}
                          {item.companyType ? ` • ${item.companyType}` : ''}
                          {item.subjectId && subjects.find(s => s.id === item.subjectId) ? ` • ${subjects.find(s => s.id === item.subjectId)?.name}` : ''}
                        </span>
                        <h4 className="font-bold text-white text-sm">{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} Scorecard</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono">Avg time: {item.averageAnswerTime}s</span>
                        <span className={`text-base font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                          item.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          item.score >= 55 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'text-rose-400 bg-red-500/10 border border-red-500/20'
                        }`}>
                          {item.score}% Acc
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic">"{item.feedback}"</p>

                    {/* Historical breakdown nested drawers */}
                    <details className="text-xs font-sans text-slate-400 group">
                      <summary className="cursor-pointer text-[10px] font-mono text-indigo-400 hover:text-indigo-305 font-bold select-none outline-none">
                        View Detailed Questions Breakdown &rarr;
                      </summary>
                      <div className="space-y-3 pt-3.5 pl-3 border-l border-white/10 mt-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {item.history?.map((hist, idx) => (
                          <div key={idx} className="space-y-2.5 p-3.5 rounded-xl bg-white/5 border border-white/5 text-left">
                            <div className="flex justify-between items-center text-[8px] font-mono text-slate-450">
                              <div className="flex items-center gap-1.5">
                                <span>Question {idx + 1} &bull; {hist.answerTime}s</span>
                                {hist.hintUsed && (
                                  <span className="text-[7.5px] bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1 rounded font-bold uppercase tracking-wider">
                                    ⚠️ Hint Used
                                  </span>
                                )}
                                {hist.id?.startsWith('ai-') && (
                                  <span className="text-[7.5px] bg-violet-500/10 border border-violet-500/25 text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5 font-mono">
                                    ✨ AI Generated
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-indigo-300">Score: {hist.score}%</span>
                            </div>
                            <p className="font-bold text-white text-xs leading-normal">{hist.question}</p>
                            
                            {/* Key matching feedback badge grid */}
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono uppercase text-slate-500 block">Keywords Checked:</span>
                              <div className="flex flex-wrap gap-1">
                                {hist.matchedKeywords?.map(kw => (
                                  <span key={kw} className="text-[8px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5"><Check className="w-2 h-2" />{kw}</span>
                                ))}
                                {hist.missedKeywords?.map(kw => (
                                  <span key={kw} className="text-[8px] font-mono bg-rose-500/10 border border-rose-500/20 text-rose-350 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5"><X className="w-2 h-2" />{kw}</span>
                                ))}
                              </div>
                            </div>

                            {/* Filler words alert */}
                            {hist.fillerWordsCount !== undefined && hist.fillerWordsCount > 0 && (
                              <div className="bg-[#111827] border border-rose-500/10 p-2 rounded-xl text-[10px] text-rose-350 leading-relaxed font-sans mt-1.5">
                                🎙️ <span className="font-semibold">Filler words spotted:</span> {hist.fillerWordsCount} times. Spotted: <span className="font-mono text-rose-300">{hist.fillerWordsSpotted?.join(', ')}</span>.
                              </div>
                            )}

                            {/* Multi-dimensional grading scores */}
                            {hist.scores && (
                              <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2.5 rounded-xl border border-white/5 mt-1.5">
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-400 font-mono">Technical Accuracy</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                                      <div className="bg-indigo-500 h-full" style={{ width: `${hist.scores.accuracy}%` }} />
                                    </div>
                                    <span className="text-[8px] font-bold text-white font-mono">{hist.scores.accuracy}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-400 font-mono">Systems Thinking</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                                      <div className="bg-violet-500 h-full" style={{ width: `${hist.scores.modeling}%` }} />
                                    </div>
                                    <span className="text-[8px] font-bold text-white font-mono">{hist.scores.modeling}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-400 font-mono">Communication Clarity</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                                      <div className="bg-emerald-500 h-full" style={{ width: `${hist.scores.clarity}%` }} />
                                    </div>
                                    <span className="text-[8px] font-bold text-white font-mono">{hist.scores.clarity}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-400 font-mono">Detail Depth</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                                      <div className="bg-amber-500 h-full" style={{ width: `${hist.scores.depth}%` }} />
                                    </div>
                                    <span className="text-[8px] font-bold text-white font-mono">{hist.scores.depth}%</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <p className="text-[10px] bg-black/30 p-2.5 rounded-lg italic text-slate-400 border border-white/5 mt-2">Your raw answer: "{hist.answer}"</p>
                            
                            {hist.idealConcept && (
                              <div className="space-y-1.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-left mt-2">
                                <span className="block text-[8.5px] font-mono uppercase text-emerald-400 font-bold">💡 Better Reference Answer (To Upgrade Your Response):</span>
                                <p className="text-[11px] text-slate-205 leading-relaxed font-sans">{hist.idealConcept}</p>
                              </div>
                            )}

                            <p className="text-emerald-400 text-[11px] leading-relaxed mt-1 font-medium bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 mt-2">{hist.evaluation}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}

                {interviews.length === 0 && (
                  <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4">
                    <Award className="w-8 h-8 text-indigo-400 opacity-60 mb-2" />
                    <span className="text-xs font-semibold text-white">No simulated scorecards generated yet</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Start your first simulated interview above to pop study KPI scores here.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR KPI FEEDBACK */}
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Workspace Analytics Insights</h3>
              
              <div className="space-y-3 text-xs leading-relaxed font-sans text-slate-300">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Evaluation Average:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{avgPerformanceScore}%</span>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Completed Rounds:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{interviews.length}</span>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Questions Answered:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{totalAnsweredCount} qs</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-300 block">💡 Core Selection Pro-Tip</span>
                <p className="text-[10px] leading-relaxed text-slate-450">
                  Leading organizations value concise structural answers over highly verbose descriptions. Highlight the core technology framework, mention architectural trade-offs, and state a tangible benchmark metric when possible.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ACTIVE TIMED APPLICATION FRAMEWORK */
        <div className="max-w-3xl mx-auto glass-card p-6 border border-indigo-500/20 space-y-6 animate-fade-in text-slate-300 text-left">
          
          {/* Active run Header */}
          <div className="border-b border-white/10 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400">
                  ACTIVE ROUND: {roundType} ({difficulty})
                </span>
                <h3 className="font-extrabold text-white text-base">
                  Question {currentQuestionIndex + 1} of {questionsList.length}
                </h3>
              </div>

              {/* Timers */}
              <div className="flex items-center gap-3 font-mono text-xs font-bold text-slate-300">
                <button
                  type="button"
                  onClick={() => setTimerSeconds(prev => prev + 15)}
                  className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-bold flex items-center transition cursor-pointer"
                  title="Extend time limit by 15 seconds"
                >
                  +15s
                </button>
                <span className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  timerSeconds <= 15 
                    ? 'bg-rose-500/20 border-rose-500/35 text-rose-350 animate-pulse' 
                    : 'bg-white/5 border-white/5 text-slate-305'
                }`}>
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Timer: {timerSeconds}s</span>
                </span>
                <span className="text-slate-500">|</span>
                <span>Total: {totalTimerSeconds}s</span>
              </div>
            </div>

            {/* Time pressure shrinking bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  timerSeconds <= 15 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'
                }`}
                style={{ width: `${(timerSeconds / limitSecondsPerQuestion) * 100}%` }}
              />
            </div>
          </div>

          {/* Interviewer State Avatar & Active Question Box */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-550/20 ${isListening ? 'animate-ping absolute inset-0' : ''}`} />
                  <div className="w-8 h-8 rounded-full bg-indigo-650 flex items-center justify-center text-[10px] font-bold text-white border border-indigo-400/20 relative z-10">
                    AI
                  </div>
                </div>
                <div className="text-left font-sans">
                  <span className="block text-[10px] font-bold text-white">Interviewer Sim</span>
                  <span className="text-[8px] text-indigo-300 font-mono font-bold uppercase tracking-wider block mt-0.5">
                    {isListening ? '🎙️ Listening to vocal response...' : '⏱️ Awaiting candidate input'}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => speakQuestion(questionsList[currentQuestionIndex]?.question)}
                className="p-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 rounded-xl flex items-center justify-center gap-1.5 font-bold transition cursor-pointer text-[10px]"
                title="Speak Question aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Repeat Question</span>
              </button>
            </div>

            <div className="bg-indigo-500/5 md:flex items-start gap-4 p-5 rounded-2xl border border-indigo-500/10 space-y-2 md:space-y-0">
              <HelpCircle className="w-8 h-8 text-indigo-455 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-black">Simulation Prompt</span>
                  {(questionSource === 'AI Generated' || questionsList[currentQuestionIndex]?.id?.startsWith('ai-')) && (
                    <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-2 h-2 text-violet-400" />
                      AI Generated
                    </span>
                  )}
                </div>
                <p className="text-sm font-extrabold text-white leading-relaxed">
                  {questionsList[currentQuestionIndex]?.question}
                </p>
              </div>
            </div>
          </div>

          {/* Input text prompt */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-slate-300 font-semibold block">Type or dictate your response below:</label>
              
              <div className="flex items-center gap-2">
                {/* Request Hint button */}
                <button
                  type="button"
                  onClick={requestHint}
                  disabled={activeHintLoading || activeHint !== null}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold bg-white/5 border-white/10 hover:bg-white/10 text-amber-300 transition cursor-pointer disabled:opacity-50"
                  title="Receive a structural hint from the interviewer"
                >
                  {activeHintLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span>{activeHint ? 'Hint Provided' : 'Request Hint'}</span>
                    </>
                  )}
                </button>

                {/* Hands-free Voice Dictation controller */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition duration-300 cursor-pointer ${
                    isListening 
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                      <span>Listening (Click to Stop)</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Voice Dictate Answering</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Structure your answer, cite expected keywords, explain your system design choices..."
              className="w-full p-4 rounded-2xl text-xs leading-relaxed glass-input focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            {/* Hint Display */}
            {activeHint && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-350 flex items-start gap-2 mt-1">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed italic">" {activeHint} "</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-500 gap-1.5 px-1">
              <span>Expected keywords to reference: <span className="font-mono text-indigo-300 font-bold">{questionsList[currentQuestionIndex]?.expectedKeywords?.join(', ')}</span></span>
              <span>Count: {userAnswer.length} characters</span>
            </div>
          </div>

          {/* Core submit buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              onClick={() => submitAnswer(false)}
              disabled={isEvaluating}
              className="w-full sm:flex-1 py-3 bg-gradient-to-r from-indigo-650 to-indigo-700 hover:from-indigo-600 hover:to-indigo-650 text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2 cursor-pointer shadow transition disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cerebras AI Evaluating response...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {currentQuestionIndex + 1 === questionsList.length ? 'Finalize Scorecard' : 'Submit Answer & Proceed'}
                  </span>
                </>
              )}
            </button>


            <button
              onClick={terminateSessionEarly}
              className="w-full sm:w-auto px-5 py-3 bg-rose-650/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/20 rounded-xl font-bold font-sans text-xs cursor-pointer text-center"
            >
              Cancel Interview
            </button>
          </div>

        </div>
      )}

    </div>
  );
});

export default MockInterviewWorkspace;
