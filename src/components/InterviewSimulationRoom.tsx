import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Mic, Cpu, Play, Loader, ShieldAlert, Sparkles, Check, CheckCircle2,
  MicOff, Send, HelpCircle, AlertCircle, RefreshCw, Star, Info, Download, X, VideoOff
} from 'lucide-react';
import { callAI } from '../utils/aiService';
import { Subject, Topic, Question, InterviewIntelligenceQuestion, MockPresetQuestion, MockInterview } from '../types';

interface InterviewSimulationRoomProps {
  roundType: 'Technical' | 'HR' | 'System Design' | 'Behavioral';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionSource: 'Presets' | 'Question Bank' | 'Intelligence DB' | 'AI Generated';
  subjectId: string;
  topicId: string;
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Staff';
  companyType: string;
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  intelliQuestions: InterviewIntelligenceQuestion[];
  mockPresetQuestions: MockPresetQuestion[];
  onAddInterview: (int: Omit<MockInterview, 'id' | 'userId'>) => Promise<void>;
  onClose: () => void;
  cerebrasApiKey?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
  cerebrasModel?: string;
  geminiModel?: string;
  groqModel?: string;
  localPersonaPrompt?: string;
  vocalPrompts: boolean;
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
    }
  ],
  'System Design': [
    {
      id: 's1',
      question: 'How would you design a scalable distributed rate limiter for an API gateway serving millions of users?',
      expectedKeywords: ['token bucket', 'sliding window', 'redis', 'lua scripts', 'fallback', 'middleware', 'latency'],
      idealConcept: 'Implement a Token Bucket or Sliding Window log algorithm using Redis to hold rate limit counters dynamically. Use Redis Lua scripts to execute queries atomically, keeping latency below 5ms with back-up local fallback headers.'
    }
  ],
  Behavioral: [
    {
      id: 'b1',
      question: 'Describe a time you failed to meet a target deadline. What did you learn and how did you manage expectations?',
      expectedKeywords: ['proactive communication', 'transparency', 'prioritization', 'agile', 'timeline modification', 'velocity'],
      idealConcept: 'Highlight proactive communication with stakeholders the moment risks were discovered. Detail how you re-prioritized features, shipped MVP core functionality on time, and adjusted sprint velocity estimations for future projects.'
    }
  ]
};

const REACTIONS = [
  "Interesting.",
  "Okay.",
  "Thanks.",
  "Good.",
  "Let's continue."
];

export default function InterviewSimulationRoom({
  roundType,
  difficulty,
  questionSource,
  subjectId,
  topicId,
  experienceLevel,
  companyType,
  subjects,
  topics,
  questions,
  intelliQuestions,
  mockPresetQuestions,
  onAddInterview,
  onClose,
  cerebrasApiKey,
  geminiApiKey,
  groqApiKey,
  cerebrasModel,
  geminiModel,
  groqModel,
  localPersonaPrompt,
  vocalPrompts
}: InterviewSimulationRoomProps) {
  
  // Phase state: 'waiting' | 'connecting' | 'active' | 'thinking' | 'complete'
  const [phase, setPhase] = useState<'waiting' | 'connecting' | 'active' | 'thinking' | 'complete'>('waiting');
  
  // Setup room check states
  const [checks, setChecks] = useState({ camera: false, mic: false, ai: false });
  const [isPreparing, setIsPreparing] = useState(false);
  
  // Loader status messages
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionMessage, setConnectionMessage] = useState('Connecting to interviewer...');
  
  // Session states
  const [questionsList, setQuestionsList] = useState<Array<{ id: string; question: string; expectedKeywords: string[]; idealConcept: string }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reactionText, setReactionText] = useState<string | null>(null);
  const [thinkingMessage, setThinkingMessage] = useState('');
  
  // Realism States: Camera stream, Interviewer expression, Sound typing
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sarahExpression, setSarahExpression] = useState<'neutral' | 'speaking' | 'thinking' | 'approving' | 'concerned'>('neutral');
  const [isSarahTyping, setIsSarahTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Speed Limit per Question
  const limitSecondsPerQuestion = difficulty === 'Easy' ? 180 : difficulty === 'Medium' ? 120 : 60;
  const [timerSeconds, setTimerSeconds] = useState(limitSecondsPerQuestion);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Track mount status
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Loading questions indicator
  const [isGenInProgress, setIsGenInProgress] = useState(false);

  // Synthesized Sound Effects
  const playSoundEffect = (type: 'join' | 'click' | 'mic-on' | 'mic-off' | 'typing') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'join') {
        // Meet Double Chime Tone
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.1, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        const now = ctx.currentTime;
        playTone(400, now, 0.35);
        playTone(550, now + 0.12, 0.4);
      } else if (type === 'click' || type === 'typing') {
        // Soft keyboard tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 60, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } else if (type === 'mic-on' || type === 'mic-off') {
        // Mic alert tones
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'mic-on' ? 600 : 350, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {
      console.warn("Synth audio context error:", e);
    }
  };

  // Keyboard typing interval simulator
  useEffect(() => {
    if (isSarahTyping) {
      const typeKey = () => {
        playSoundEffect('typing');
        const nextDelay = 120 + Math.random() * 200;
        typingTimerRef.current = setTimeout(typeKey, nextDelay);
      };
      typeKey();
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [isSarahTyping]);

  // Request Webcam stream and set sequential checks
  useEffect(() => {
    if (phase === 'waiting') {
      const initCamera = async () => {
        try {
          const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (mountedRef.current) {
            setStream(userStream);
            setChecks(prev => ({ ...prev, camera: true }));
          }
          
          // Connect stream to video preview box
          setTimeout(() => {
            if (mountedRef.current && videoRef.current) {
              videoRef.current.srcObject = userStream;
            }
          }, 100);
        } catch (e) {
          console.warn("Webcam blocked or not available:", e);
          // Fail gracefully but mark checks done so user can still test with simulated stream
          if (mountedRef.current) {
            setChecks(prev => ({ ...prev, camera: true }));
          }
        }
      };
      
      initCamera();
      const micTimer = setTimeout(() => {
        if (mountedRef.current) setChecks(prev => ({ ...prev, mic: true }));
      }, 1600);
      const aiTimer = setTimeout(() => {
        if (mountedRef.current) setChecks(prev => ({ ...prev, ai: true }));
      }, 2400);

      return () => {
        clearTimeout(micTimer);
        clearTimeout(aiTimer);
      };
    }
  }, [phase]);

  // Connect active stream to video element when stream is created or toggled
  useEffect(() => {
    if (videoRef.current && stream && cameraEnabled) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraEnabled, phase]);

  // Ensure webcam turns off when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
        // Interviewer note taking typing trigger
        setIsSarahTyping(true);
        setTimeout(() => setIsSarahTyping(false), 1200);
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

  // Web Speech recognition & synthesis unmount cleanup
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Text-To-Speech implementation
  const speakQuestion = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    
    utterance.onstart = () => {
      if (mountedRef.current) {
        setIsSpeaking(true);
        setSarahExpression('speaking');
      }
    };
    utterance.onend = () => {
      if (mountedRef.current) {
        setIsSpeaking(false);
        setSarahExpression('neutral');
      }
    };
    utterance.onerror = () => {
      if (mountedRef.current) {
        setIsSpeaking(false);
        setSarahExpression('neutral');
      }
    };
    
    window.speechSynthesis.speak(utterance);
    
    // Safety check to clear speaking status
    setTimeout(() => {
      if (mountedRef.current) {
        setIsSpeaking(false);
        setSarahExpression('neutral');
      }
    }, 15000);
  };

  // Toggle voice listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      playSoundEffect('mic-off');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        playSoundEffect('mic-on');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Prep Questions on Start click
  const handleStartClicked = async () => {
    setIsPreparing(true);
    let list: Array<{ id: string; question: string; expectedKeywords: string[]; idealConcept: string }> = [];

    // Question loading logic
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
      setIsGenInProgress(true);
      const subjectName = subjectId ? (subjects.find(s => s.id === subjectId)?.name || '') : '';
      const topicName = topicId ? (topics.find(t => t.id === topicId)?.name || '') : '';
      const focusText = [
        subjectName && `Subject Focus: ${subjectName}`,
        topicName && `Topic Focus: ${topicName}`
      ].filter(Boolean).join('. ');

      try {
        const defaultPrompt = `You are an expert technical interviewer at a top-tier tech company.
Your task is to generate exactly 3 challenging, thinking-based, scenario-oriented interview questions for a candidate.
Avoid simple definitions like "what is oops" or "what is a class". 
Generate scenario-based questions that test deep technical/conceptual knowledge, system design choices, or soft skills/problem-solving based on the stream.`;
        
        const systemPrompt = `${localPersonaPrompt || defaultPrompt}
        
Strict formatting requirements:
You must return a JSON array containing exactly 3 objects. Each object must have these fields:
- "id": a unique string ID (e.g. "ai-q1")
- "question": the scenario-based question text
- "expectedKeywords": an array of 5-8 lowercase strings representing key technical terms/concepts candidate should reference in their response
- "idealConcept": a 3-4 sentence detailed ideal answer that represents an expert/mastered response

Format the response strictly as a valid JSON array. Do not wrap the JSON output in markdown backticks or explanation text.`;

        const userPrompt = `Generate questions for a ${roundType} round targeting ${difficulty} difficulty. ${focusText ? `${focusText}. ` : ''}Target seniority level: ${experienceLevel}. Focus style matching this company profile: ${companyType}.`;

        const raw = await callAI({
          systemPrompt,
          userPrompt,
          temperature: 0.7,
          maxTokens: 800,
          cerebrasApiKey,
          geminiApiKey,
          groqApiKey,
          cerebrasModel,
          geminiModel,
          groqModel,
          responseMimeType: "application/json"
        });

        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        list = JSON.parse(cleaned);
      } catch (err) {
        console.warn("AI generation failed, fallback to presets", err);
        list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
      } finally {
        setIsGenInProgress(false);
      }
    }

    if (list.length === 0) {
      list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
    }

    // Shuffle and take up to 4 questions
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setQuestionsList(shuffled.slice(0, 4));
    setIsPreparing(false);
    
    // Move to connecting phase
    setPhase('connecting');
  };

  // Connecting Screen Animation Loader
  useEffect(() => {
    if (phase === 'connecting') {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 2.5;
        setConnectionProgress(currentProgress);
        
        if (currentProgress < 30) {
          setConnectionMessage('Connecting to interviewer...');
        } else if (currentProgress < 60) {
          setConnectionMessage('Loading candidate profile...');
        } else if (currentProgress < 85) {
          setConnectionMessage('Preparing questions...');
        } else {
          setConnectionMessage('Interviewer joined.');
        }

        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (mountedRef.current) {
              playSoundEffect('join');
              setPhase('active');
              setTimerSeconds(limitSecondsPerQuestion);
              setTotalTimerSeconds(0);
            }
          }, 600);
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Main countdown timer for active interview questions
  useEffect(() => {
    if (phase === 'active' && !reactionText) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleSubmitAnswer(true);
            return limitSecondsPerQuestion;
          }
          return prev - 1;
        });
        setTotalTimerSeconds(prev => prev + 1);
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [phase, currentQuestionIndex, reactionText]);

  // Read current question when active phase opens or shifts index
  useEffect(() => {
    if (phase === 'active' && questionsList[currentQuestionIndex] && vocalPrompts && !reactionText) {
      const speechTimer = setTimeout(() => {
        speakQuestion(questionsList[currentQuestionIndex].question);
      }, 600);
      return () => clearTimeout(speechTimer);
    }
  }, [phase, currentQuestionIndex, reactionText]);

  // Submit Answer
  const handleSubmitAnswer = async (forceAutoSubmit = false) => {
    if (!userAnswer.trim() && !forceAutoSubmit) {
      alert('Please speak or type an answer before submitting.');
      return;
    }

    // Stop speaking & listening
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentQ = questionsList[currentQuestionIndex];
    if (!currentQ) return;

    const answerText = userAnswer.trim() || '[No Answer Provided / Time Out]';
    const answerLower = answerText.toLowerCase();

    // Match expected keywords
    const matched = currentQ.expectedKeywords.filter(kw => answerLower.includes(kw.toLowerCase()));
    const missed = currentQ.expectedKeywords.filter(kw => !answerLower.includes(kw.toLowerCase()));
    const matchRatio = currentQ.expectedKeywords.length > 0 ? matched.length / currentQ.expectedKeywords.length : 1;

    let score = Math.round(matchRatio * 75);
    if (answerText.length > 150) {
      score += 25;
    } else if (answerText.length > 60) {
      score += 15;
    } else if (answerText.length > 10) {
      score += 5;
    }

    if (forceAutoSubmit && !userAnswer.trim()) {
      score = 0;
    }
    score = Math.min(100, Math.max(0, score));

    // Filler word count
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'literally', 'so', 'essentially'];
    const words = answerText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);
    let fillerCount = 0;
    const spottedFillers: string[] = [];
    words.forEach(w => {
      if (fillers.includes(w)) {
        fillerCount++;
        if (!spottedFillers.includes(w)) spottedFillers.push(w);
      }
    });

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

    // AI Evaluation if API connected
    try {
      if (cerebrasApiKey || geminiApiKey || groqApiKey) {
        const evalSystemPrompt = `You are an expert technical interviewer evaluating a candidate's answer for a mock interview question.
You must return a JSON object with these exact fields:
- "score": a number from 0 to 100 representing overall answer accuracy and quality.
- "evaluation": a 3-4 sentence detailed review explaining what they did well, what concepts they missed, and how to improve.
- "accuracy": a number 0-100 evaluating conceptual and technical accuracy.
- "modeling": a number 0-100 evaluating structural and systems thinking logic.
- "clarity": a number 0-100 evaluating explanation structure and communication clarity.
- "depth": a number 0-100 evaluating comprehensive detail level.

Strictly output valid JSON only. Do not wrap in markdown or markdown code blocks.`;

        const evalUserPrompt = `Question: ${currentQ.question}
Expected Key Concepts/Keywords: ${currentQ.expectedKeywords.join(', ')}
Ideal/Better Answer Reference: ${currentQ.idealConcept}
Candidate Answer: ${answerText}`;

        const rawEval = await callAI({
          systemPrompt: evalSystemPrompt,
          userPrompt: evalUserPrompt,
          temperature: 0.1,
          maxTokens: 500,
          cerebrasApiKey,
          geminiApiKey,
          groqApiKey,
          cerebrasModel,
          geminiModel,
          groqModel,
          responseMimeType: "application/json"
        });

        const cleanedEval = rawEval.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedEval);
        if (typeof parsed.score === 'number' && parsed.evaluation) {
          score = Math.min(100, Math.max(0, parsed.score));
          evaluation = parsed.evaluation;
          dynamicScores = {
            accuracy: typeof parsed.accuracy === 'number' ? parsed.accuracy : score,
            modeling: typeof parsed.modeling === 'number' ? parsed.modeling : score,
            clarity: typeof parsed.clarity === 'number' ? parsed.clarity : score,
            depth: typeof parsed.depth === 'number' ? parsed.depth : score
          };
        }
      }
    } catch (e) {
      console.warn("AI scorecard generation failed, using fallback heuristic.", e);
    }

    const elapsedSeconds = limitSecondsPerQuestion - timerSeconds;
    const currentEntry = {
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
      scores: dynamicScores
    };

    const nextHistory = [...sessionHistory, currentEntry];
    setSessionHistory(nextHistory);

    // Dynamic expressions reaction logic
    if (score >= 70) {
      setSarahExpression('approving');
    } else if (score < 50 || forceAutoSubmit) {
      setSarahExpression('concerned');
    } else {
      setSarahExpression('neutral');
    }

    // Phase 8 — Display random small reaction
    const randomReaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setReactionText(randomReaction);
    speakQuestion(randomReaction);

    // Pause timer and clear input
    setUserAnswer('');

    // Wait 1.8 seconds displaying reaction, then switch to Phase 6 — Thinking loading delay
    setTimeout(() => {
      if (mountedRef.current) {
        setReactionText(null);
        setPhase('thinking');
        setSarahExpression('thinking');
        setIsSarahTyping(true); // Start note-typing keystrokes audio
        
        // Sub-phases of thinking
        setThinkingMessage('Analyzing your answer...');
        setTimeout(() => {
          if (mountedRef.current) {
            setThinkingMessage('Sarah is reviewing your answer...');
            setTimeout(() => {
              if (mountedRef.current) {
                setThinkingMessage('Preparing next question...');
                setTimeout(() => {
                  if (mountedRef.current) {
                    setIsSarahTyping(false); // Stop typing keystrokes audio
                    setSarahExpression('neutral');
                    // Next Question or End Game
                    if (currentQuestionIndex + 1 < questionsList.length) {
                      setCurrentQuestionIndex(prev => prev + 1);
                      setTimerSeconds(limitSecondsPerQuestion);
                      setPhase('active');
                    } else {
                      handleFinishInterview(nextHistory);
                    }
                  }
                }, 1000);
              }
            }, 1200);
          }
        }, 1200);
      }
    }, 1800);
  };

  // Complete and save mock interview
  const handleFinishInterview = async (finalHistory: any[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const overallScore = Math.round(finalHistory.reduce((sum, h) => sum + h.score, 0) / finalHistory.length);
    const avgTime = Math.round(totalTimerSeconds / finalHistory.length);
    
    const overallFeedback = overallScore >= 80
      ? `Selected! Outstanding communication and subject precision under ${difficulty} time metrics. Good job!`
      : overallScore >= 60
      ? `Pending Decision. Strong details, but review targeted improvements to master your Java microservice definitions.`
      : `Rejected. Multiple conceptual gaps spotted. Practice the study flashcards in topic revise cycles to reinforce foundation layers.`;

    const topicsCovered = Array.from(new Set(
      questionsList.map(q => {
        const qbQuestion = questions.find(qi => qi.question === q.question);
        if (qbQuestion && qbQuestion.topicId) {
          const matchedTopic = topics.find(t => t.id === qbQuestion.topicId);
          if (matchedTopic) return matchedTopic.name;
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
      answeredCount: finalHistory.length,
      totalQuestions: questionsList.length,
      score: overallScore,
      averageAnswerTime: avgTime,
      confidenceScore: overallScore,
      feedback: overallFeedback,
      history: finalHistory,
      createdAt: new Date().toISOString()
    });

    setPhase('complete');
  };

  // Export report
  const downloadReport = () => {
    const overallScore = Math.round(sessionHistory.reduce((sum, h) => sum + h.score, 0) / sessionHistory.length);
    let reportText = `=========================================\n`;
    reportText += `   PREPFLOW PREMIUM MOCK SCORECARD       \n`;
    reportText += `=========================================\n\n`;
    reportText += `Interviewer: Sarah Johnson (Senior Engineer, Google)\n`;
    reportText += `Interview Category: ${roundType}\n`;
    reportText += `Seniority Level: ${experienceLevel}\n`;
    reportText += `Difficulty Constraints: ${difficulty}\n`;
    reportText += `Total Questions: ${questionsList.length}\n`;
    reportText += `Overall Performance Score: ${overallScore}%\n\n`;
    reportText += `-----------------------------------------\n`;
    reportText += `Detailed Breakdown:\n`;
    
    sessionHistory.forEach((item, index) => {
      reportText += `\nQuestion ${index + 1}: ${item.question}\n`;
      reportText += `Answer Provided: ${item.answer}\n`;
      reportText += `Keywords Matched: ${item.matchedKeywords?.join(', ') || 'None'}\n`;
      reportText += `Keywords Missed: ${item.missedKeywords?.join(', ') || 'None'}\n`;
      reportText += `Evaluation: ${item.evaluation}\n`;
      reportText += `Individual Score: ${item.score}%\n`;
      reportText += `-----------------------------------------\n`;
    });

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrepFlow_Simulation_${roundType}_Report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate scores for Phase 10 Feedback
  const calculatedRatings = () => {
    if (sessionHistory.length === 0) return { comm: 4, tech: 4, conf: 4, score: 80 };
    const avgScore = sessionHistory.reduce((sum, h) => sum + h.score, 0) / sessionHistory.length;
    const avgFillers = sessionHistory.reduce((sum, h) => sum + h.fillerWordsCount, 0) / sessionHistory.length;
    
    const commStars = Math.max(1, Math.min(5, Math.round(5 - avgFillers * 0.8)));
    const techStars = Math.max(1, Math.min(5, Math.round((avgScore / 100) * 5)));
    const confStars = Math.max(1, Math.min(5, Math.round(avgScore >= 80 ? 5 : avgScore >= 60 ? 4 : 3)));
    
    return {
      comm: commStars,
      tech: techStars,
      conf: confStars,
      score: Math.round(avgScore)
    };
  };

  const getStrengthsAndWeaknesses = () => {
    const strengths: string[] = [];
    const weak: string[] = [];

    sessionHistory.forEach(item => {
      if (item.score >= 75) {
        strengths.push(...item.matchedKeywords.slice(0, 2));
      } else {
        weak.push(...item.missedKeywords.slice(0, 2));
      }
    });

    const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 3);
    const uniqueWeak = Array.from(new Set(weak)).slice(0, 3);

    return {
      strengths: uniqueStrengths.length > 0 ? uniqueStrengths : ['Good basic concepts', 'Clear speaking rate'],
      needsImprovement: uniqueWeak.length > 0 ? uniqueWeak : ['Spring Framework details', 'Exception Handling patterns']
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 overflow-y-auto font-sans antialiased text-slate-100 select-none pb-8">
      {/* CSS Keyframes for Avatar and WebCam */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes speak-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); border-color: rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8), 0 0 15px rgba(139, 92, 246, 0.5); border-color: rgba(99, 102, 241, 0.8); }
        }
        @keyframes approving-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); border-color: rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.8), 0 0 15px rgba(52, 211, 153, 0.5); border-color: rgba(16, 185, 129, 0.8); }
        }
        @keyframes concerned-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); border-color: rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8), 0 0 15px rgba(251, 191, 36, 0.5); border-color: rgba(245, 158, 11, 0.8); }
        }
        @keyframes subtle-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .simulation-bg-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.4) 0%, rgba(3, 7, 18, 1) 100%);
        }
        .animated-mesh {
          background: linear-gradient(-45deg, #0f172a, #1e1b4b, #111827, #020617);
          background-size: 400% 400%;
          animation: subtle-shimmer 15s ease infinite;
        }
      `}</style>

      {/* Mesh Background */}
      <div className="absolute inset-0 animated-mesh opacity-90 -z-10" />
      <div className="absolute inset-0 simulation-bg-gradient -z-10" />

      {/* Top macOS Style title bar Control */}
      <div className="max-w-4xl w-full mx-auto px-4 py-4 flex items-center justify-between border-b border-white/5 relative z-10 shrink-0 select-none">
        {/* macOS traffic light window dots */}
        <div className="flex items-center gap-2 group/dots">
          <button 
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition flex items-center justify-center text-[7px] text-rose-950 font-bold select-none cursor-pointer border border-rose-600/30"
            title="Close Interview"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 transition-opacity">×</span>
          </button>
          <div 
            className="w-3.5 h-3.5 rounded-full bg-amber-500 transition flex items-center justify-center text-[7px] text-amber-950 font-bold select-none border border-amber-600/30"
            title="Minimize (Inactive)"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 transition-opacity">-</span>
          </div>
          <div 
            className="w-3.5 h-3.5 rounded-full bg-emerald-500 transition flex items-center justify-center text-[7px] text-emerald-950 font-bold select-none border border-emerald-600/30"
            title="Maximize (Fullscreen Mode)"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 transition-opacity">+</span>
          </div>
        </div>

        {/* Central Title */}
        <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-full px-3 py-1 text-[10px] text-slate-400 font-mono">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>PrepFlow-Simulator-{roundType}.app</span>
        </div>

        {/* Status indicator on the right */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>CONNECTED</span>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 flex flex-col justify-center relative z-10 py-6 min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          
          {/* Phase 1 — Premium Waiting Room */}
          {phase === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
            >
              {/* Webcam Preview Left Side */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center relative min-h-[300px]">
                <span className="text-[10px] font-mono tracking-wider text-slate-450 uppercase mb-3">Live Video Device Check</span>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center">
                  {stream && cameraEnabled ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center space-y-2 text-slate-500">
                      <Camera className="w-10 h-10 mx-auto opacity-40 animate-pulse" />
                      <p className="text-[11px]">Connecting camera input stream...</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2 w-full justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400">Position yourself centrally under clean lighting.</span>
                  <button 
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-slate-350 hover:text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    {cameraEnabled ? <VideoOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{cameraEnabled ? 'Hide Camera' : 'Show Camera'}</span>
                  </button>
                </div>
              </div>

              {/* Waiting Room configuration specs right side */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="text-center mb-6">
                  <span className="text-[10px] font-mono tracking-widest bg-indigo-500/10 text-indigo-350 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase font-bold">Company Interview</span>
                  <h2 className="text-xl font-extrabold text-white mt-3 font-sans leading-none">{roundType} Stream</h2>
                  <p className="text-xs text-slate-400 mt-1 font-sans">{companyType}</p>
                </div>

                <div className="border-t border-b border-white/5 py-4 space-y-3.5 my-5 text-xs text-slate-300 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Interviewer</span>
                    <span className="font-semibold text-white">Sarah Johnson</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Experience Required</span>
                    <span className="font-semibold text-white">
                      {experienceLevel === 'Junior' ? '0-2 Years' : experienceLevel === 'Mid' ? '2-4 Years' : experienceLevel === 'Senior' ? '5-8 Years' : '8+ Years'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Duration Limit</span>
                    <span className="font-semibold text-white">30 Minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Difficulty Scale</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>{difficulty}</span>
                  </div>
                </div>

                {/* Status Checks List */}
                <div className="space-y-2.5 mb-6 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Camera className="w-4 h-4 text-indigo-400" /> Camera Check
                    </span>
                    {checks.camera ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Ready</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1.5"><Loader className="w-3.5 h-3.5 animate-spin" /> Verifying</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Mic className="w-4 h-4 text-indigo-400" /> Microphone Check
                    </span>
                    {checks.mic ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Configured</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1.5"><Loader className="w-3.5 h-3.5 animate-spin" /> Calibrating</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Cpu className="w-4 h-4 text-indigo-400" /> AI Joining...
                    </span>
                    {checks.ai ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Connected</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1.5"><Loader className="w-3.5 h-3.5 animate-spin" /> Joining</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleStartClicked}
                  disabled={!checks.camera || !checks.mic || !checks.ai || isPreparing}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer flex items-center justify-center gap-2 font-sans"
                >
                  {isPreparing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-white" />
                      <span>Preparing workspace questions...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Interview</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 2 — Connecting Loader */}
          {phase === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm mx-auto text-center font-sans space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <Cpu className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{connectionMessage}</h3>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                    style={{ width: `${connectionProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{Math.round(connectionProgress)}%</span>
              </div>
            </motion.div>
          )}

          {/* Phase 3 & 5 & 7 — Live Interview Area */}
          {phase === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full space-y-6 relative"
            >
              {/* Phase 9 — Progress Indicator */}
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span>Progress</span>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${((currentQuestionIndex + 1) / questionsList.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{Math.round(((currentQuestionIndex + 1) / questionsList.length) * 100)}%</span>
                </div>
                <div>
                  <span>Est. Remaining: {Math.max(1, Math.round((questionsList.length - currentQuestionIndex) * 3))} Mins</span>
                </div>
              </div>

              {/* Character Box */}
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative">
                
                {/* Visual Avatar Frame with animated effects */}
                <div className="relative shrink-0">
                  <div 
                    className="w-24 h-24 rounded-full overflow-hidden border-2 bg-slate-950 flex items-center justify-center transition-all duration-300 relative"
                    style={{
                      animation: 
                        sarahExpression === 'speaking' ? 'speak-pulse 1.8s infinite' :
                        sarahExpression === 'approving' ? 'approving-pulse 1.8s infinite' :
                        sarahExpression === 'concerned' ? 'concerned-pulse 1.8s infinite' :
                        'float 4s ease-in-out infinite, breathe 3s ease-in-out infinite'
                    }}
                  >
                    <img 
                      src="/interviewer-sarah.png" 
                      alt="Interviewer Sarah"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="text-3xl">👩</div>

                    {/* Emoji Expression Badge Overlays */}
                    {sarahExpression === 'approving' && (
                      <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center text-2xl animate-pulse">😊</div>
                    )}
                    {sarahExpression === 'concerned' && (
                      <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center text-2xl animate-pulse">🤔</div>
                    )}
                    {sarahExpression === 'thinking' && (
                      <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-[1px] flex items-center justify-center text-2xl animate-pulse">🧐</div>
                    )}
                  </div>
                  
                  {/* Speaker indicator badge */}
                  {isSpeaking && (
                    <span className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-1 border border-slate-950 animate-bounce">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Conversation Bubble */}
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="font-extrabold text-white text-sm font-sans flex items-center gap-2 justify-center md:justify-start">
                        <span>Sarah Johnson</span>
                        {sarahExpression === 'thinking' && <span className="text-[9px] bg-indigo-500/10 text-indigo-350 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">Thinking</span>}
                        {sarahExpression === 'approving' && <span className="text-[9px] bg-emerald-500/10 text-emerald-455 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">Smiling</span>}
                        {sarahExpression === 'concerned' && <span className="text-[9px] bg-amber-500/10 text-amber-350 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">Puzzled</span>}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">Senior Backend Engineer &bull; Google</p>
                    </div>
                    
                    {/* Time limit badge */}
                    <div className="flex items-center gap-1.5 self-center sm:self-auto bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-mono text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${timerSeconds <= 15 ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />
                      <span>Remaining: {timerSeconds}s</span>
                    </div>
                  </div>

                  {/* Question Bubble content */}
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 mt-2 text-xs leading-relaxed text-indigo-100 font-medium font-sans relative">
                    {reactionText ? (
                      <p className="italic text-indigo-300 font-bold">"{reactionText}"</p>
                    ) : (
                      <p>"{questionsList[currentQuestionIndex]?.question}"</p>
                    )}
                  </div>

                  {/* Status subtitle */}
                  <div className="text-[9px] font-mono text-slate-500 flex items-center justify-center md:justify-start gap-1">
                    {isSpeaking ? (
                      <span className="text-indigo-400 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 animate-spin" /> Speaking...
                      </span>
                    ) : isListening ? (
                      <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                        <Mic className="w-2.5 h-2.5" /> Listening to voice input...
                      </span>
                    ) : (
                      <span>Microphone idle</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phase 7 — User Answer panel */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Your Answer</span>
                  {isSarahTyping && (
                    <span className="text-[10px] text-indigo-350 font-mono animate-pulse flex items-center gap-1.5">
                      <Loader className="w-3 h-3 animate-spin" /> Sarah is typing notes...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Dictate your response or type here..."
                    className="w-full h-32 p-4 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  />
                  
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 px-2 py-0.5 rounded-full text-[9px] font-mono animate-pulse">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span>Live Speech</span>
                    </div>
                  )}
                </div>

                {/* Voice triggers */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition select-none w-full sm:w-auto ${
                      isListening 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mute Dictation</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Speak Answer</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSubmitAnswer(false)}
                    disabled={!userAnswer.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 font-sans"
                  >
                    <span>Submit Answer</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Floating PiP Candidate Webcam Stream */}
              {stream && cameraEnabled && (
                <div className="fixed bottom-6 right-6 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-indigo-500/40 bg-black/80 shadow-2xl z-50 flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Subtle video label overlay */}
                  <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-[7px] text-white/80 font-mono">YOU</div>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase 6 — Thinking loading delay */}
          {phase === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm mx-auto text-center font-sans space-y-6"
            >
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">{thinkingMessage}</h3>
                <p className="text-[10px] text-indigo-300 font-mono animate-pulse">Sarah is typing notes & evaluation logs...</p>
              </div>

              {/* Mini Webcam PiP still visible during thinking transitions */}
              {stream && cameraEnabled && (
                <div className="fixed bottom-6 right-6 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-indigo-500/40 bg-black/80 shadow-2xl z-50">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Phase 10 & 12 — End Screen & Simple Feedback */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg mx-auto"
            >
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="text-center mb-6">
                  <span className="text-[10px] font-mono tracking-widest bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-2.5 py-1 rounded-full uppercase font-bold">Congratulations!</span>
                  <h2 className="text-xl font-extrabold text-white mt-3 font-sans leading-none">Interview Completed</h2>
                  <p className="text-xs text-slate-400 mt-1.5 font-sans">You successfully finished the simulated technical panel.</p>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-2.5 text-center mb-5">
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-mono">Duration</span>
                    <span className="block text-sm font-extrabold text-white mt-1 font-mono">{Math.round(totalTimerSeconds / 60) || 1} Mins</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-mono">Questions</span>
                    <span className="block text-sm font-extrabold text-white mt-1 font-mono">{questionsList.length}</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-mono">Overall Score</span>
                    <span className="block text-sm font-extrabold text-indigo-300 mt-1 font-mono">{calculatedRatings().score}%</span>
                  </div>
                </div>

                {/* Phase 10 — Simple ratings breakdown */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-xs space-y-3 mb-5 font-sans">
                  <h4 className="font-bold text-white text-[11px] uppercase tracking-wider font-mono">Skill Matrix Evaluation</h4>
                  
                  <div className="flex justify-between items-center text-slate-350">
                    <span>Communication</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < calculatedRatings().comm ? 'text-indigo-400 fill-indigo-400' : 'text-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-350">
                    <span>Technical Accuracy</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < calculatedRatings().tech ? 'text-indigo-400 fill-indigo-400' : 'text-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-350">
                    <span>Confidence & Pace</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < calculatedRatings().conf ? 'text-indigo-400 fill-indigo-400' : 'text-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strengths & Weakness */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs mb-6 font-sans">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5">
                    <span className="font-bold text-emerald-450 block mb-2 font-mono text-[10px] uppercase">Strengths</span>
                    <ul className="space-y-1.5 text-slate-300">
                      {getStrengthsAndWeaknesses().strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">&bull;</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5">
                    <span className="font-bold text-rose-350 block mb-2 font-mono text-[10px] uppercase">Needs Improvement</span>
                    <ul className="space-y-1.5 text-slate-300">
                      {getStrengthsAndWeaknesses().needsImprovement.map((nd, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-450 mt-0.5">&bull;</span>
                          <span>{nd}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={downloadReport}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>

                  <button
                    onClick={() => {
                      setChecks({ camera: false, mic: false, ai: false });
                      setQuestionsList([]);
                      setCurrentQuestionIndex(0);
                      setUserAnswer('');
                      setSessionHistory([]);
                      setPhase('waiting');
                    }}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Start New Interview</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
