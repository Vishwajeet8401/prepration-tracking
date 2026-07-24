import React, { useState, useMemo, useEffect } from 'react';
import { Routine, RoutineCategory, RepeatType, UserSettings } from '../types';
import { 
  X, Sparkles, FileJson, Copy, Check, AlertTriangle, 
  Clock, Play, HelpCircle, Layers, CheckCircle2, RotateCcw,
  Wand2, ChevronRight, Zap, Info, ShieldCheck, ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORY_OPTIONS, COLOR_SWATCHES } from './RoutineModal';
import { calculateDurationMinutes, formatTime12h, formatDuration } from '../utils/routineUtils';
import { callAI } from '../utils/aiService';

interface RoutineAiJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRoutines: (routines: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>[], replaceExisting: boolean) => Promise<void>;
  userSettings?: UserSettings | null;
}

// Preset Prompts for AI Generator
const PRESET_AI_PROMPTS = [
  {
    label: '💻 9-to-5 Job + Evening Prep',
    prompt: 'I am a software engineer working 9 AM to 5 PM. I want to wake up at 7 AM, do 1 hour of morning DSA, work from 9 to 5, take a break, study System Design for 1.5 hours, do 30 min revision, and sleep by 11 PM.'
  },
  {
    label: '🚀 Hardcore 10-Hour Bootcamp',
    prompt: 'Create an intensive full-day study routine for FAANG interview preparation. Include morning workout, 4 hours of DSA practice, 2 hours System Design, mock interview session, Java & Spring Boot revision, and healthy meal breaks.'
  },
  {
    label: '🎓 Student CS Prep Schedule',
    prompt: 'I am a computer science student preparing for campus placements. Create a balanced daily schedule with morning meditation, college classes, 2 hours coding practice, 1 hour aptitude practice, and evening workout.'
  },
  {
    label: '🧘 Mindful Work & Health Balance',
    prompt: 'Create a healthy developer daily schedule with 7:00 AM wake up, morning yoga, office work hours, dedicated 1.5 hours study time, hydration/walk breaks, reading time, and 10:30 PM wind down for sleep.'
  }
];

// Preset JSON Templates
const PRESET_JSON_TEMPLATES = {
  standard: `[
  {
    "title": "Morning Meditation & Hydration",
    "startTime": "07:00",
    "endTime": "07:30",
    "category": "Meditation",
    "priority": "Low",
    "repeatType": "Daily",
    "description": "Mindfulness breathing, 500ml water, and mental preparation for the day."
  },
  {
    "title": "LeetCode & DSA Problem Solving",
    "startTime": "07:30",
    "endTime": "09:00",
    "category": "DSA",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Solve 2 LeetCode Medium problems (Arrays/Trees/Graphs)."
  },
  {
    "title": "Office / Core Work Hours",
    "startTime": "09:30",
    "endTime": "17:30",
    "category": "Office",
    "priority": "Medium",
    "repeatType": "Weekdays",
    "description": "Day job responsibilities and company projects."
  },
  {
    "title": "System Design & Architecture",
    "startTime": "18:30",
    "endTime": "20:00",
    "category": "System Design",
    "priority": "High",
    "repeatType": "Weekdays",
    "description": "Study distributed systems, caching strategies, and database partitioning."
  },
  {
    "title": "Evening Workout & Walk",
    "startTime": "20:00",
    "endTime": "21:00",
    "category": "Exercise",
    "priority": "Medium",
    "repeatType": "Daily",
    "description": "30 mins cardio or weight training followed by a light walk."
  },
  {
    "title": "Revision & Flashcards",
    "startTime": "21:30",
    "endTime": "22:30",
    "category": "Revision",
    "priority": "Medium",
    "repeatType": "Daily",
    "description": "Review key concepts, mistake notes, and starred interview questions."
  }
]`,

  intensive: `[
  {
    "title": "Morning Workout & Energy Boost",
    "startTime": "06:30",
    "endTime": "07:30",
    "category": "Exercise",
    "priority": "Medium",
    "repeatType": "Daily",
    "description": "Gym workout, shower, and high-protein breakfast."
  },
  {
    "title": "DSA Sprint 1: Dynamic Programming",
    "startTime": "08:00",
    "endTime": "10:30",
    "category": "DSA",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Deep dive into DP patterns, 1D/2D memoization problems."
  },
  {
    "title": "Java & Spring Boot Core Internals",
    "startTime": "10:45",
    "endTime": "12:45",
    "category": "Coding Practice",
    "priority": "High",
    "repeatType": "Daily",
    "description": "JVM memory model, concurrency, multithreading, and Spring Bean lifecycle."
  },
  {
    "title": "Lunch & Hydration Break",
    "startTime": "12:45",
    "endTime": "13:45",
    "category": "Break",
    "priority": "Low",
    "repeatType": "Daily",
    "description": "Nutritious lunch and rest."
  },
  {
    "title": "System Design High Level Architecture",
    "startTime": "14:00",
    "endTime": "16:30",
    "category": "System Design",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Design Uber / Microservices / Message Queues (Kafka) with diagrams."
  },
  {
    "title": "Mock Interview Session",
    "startTime": "17:00",
    "endTime": "18:30",
    "category": "Mock Interview",
    "priority": "High",
    "repeatType": "Weekdays",
    "description": "Peer mock interview or timed behavioral/technical simulation."
  },
  {
    "title": "Daily Reflection & Next Day Prep",
    "startTime": "21:30",
    "endTime": "22:15",
    "category": "Revision",
    "priority": "Medium",
    "repeatType": "Daily",
    "description": "Log achievements, review mistakes, and set tomorrow's targets."
  }
]`,

  minimal: `[
  {
    "title": "Morning Focus DSA Practice",
    "startTime": "07:30",
    "endTime": "08:45",
    "category": "DSA",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Solve 1 Hard or 2 Medium DSA problems."
  },
  {
    "title": "System Design Study Block",
    "startTime": "19:00",
    "endTime": "20:15",
    "category": "System Design",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Read 1 System Design chapter or article."
  },
  {
    "title": "Daily Mistake Log Review",
    "startTime": "21:00",
    "endTime": "21:45",
    "category": "Revision",
    "priority": "Medium",
    "repeatType": "Daily",
    "description": "Review yesterday's failed questions and flashcards."
  }
]`
};

export default function RoutineAiJsonModal({
  isOpen,
  onClose,
  onImportRoutines,
  userSettings
}: RoutineAiJsonModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'json'>('ai');
  const [promptInput, setPromptInput] = useState('');
  const [jsonInput, setJsonInput] = useState(PRESET_JSON_TEMPLATES.standard);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Automatically select all valid parsed items when jsonInput updates
  useEffect(() => {
    try {
      const cleaned = cleanJsonString(jsonInput);
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      setSelectedIndices(new Set(arr.map((_, i) => i)));
    } catch (e) {
      // ignore JSON error on type
    }
  }, [jsonInput]);

  // Clean JSON helper (strips markdown ```json wrapper if present)
  function cleanJsonString(str: string): string {
    let clean = str.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
    }
    return clean;
  }

  // Parse and normalize JSON routines
  const parseResult = useMemo(() => {
    if (!jsonInput.trim()) {
      return { routines: [], error: null };
    }

    try {
      const cleaned = cleanJsonString(jsonInput);
      const parsed = JSON.parse(cleaned);
      const items: any[] = Array.isArray(parsed) ? parsed : [parsed];

      const normalized: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>[] = items.map((item, idx) => {
        const title = item.title || item.name || item.task || `Routine Task #${idx + 1}`;
        const startTime = item.startTime || item.start || '08:00';
        const endTime = item.endTime || item.end || '09:00';
        
        // Find matching category or fallback
        const rawCat = (item.category || item.type || '').toString().toLowerCase();
        let matchedCategory: RoutineCategory = 'Custom';
        
        const matchingCatObj = CATEGORY_OPTIONS.find(c => 
          c.name.toLowerCase() === rawCat || 
          rawCat.includes(c.name.toLowerCase())
        );

        if (matchingCatObj) {
          matchedCategory = matchingCatObj.name;
        } else if (rawCat.includes('dsa') || rawCat.includes('code') || rawCat.includes('leetcode')) {
          matchedCategory = 'DSA';
        } else if (rawCat.includes('design') || rawCat.includes('system') || rawCat.includes('arch')) {
          matchedCategory = 'System Design';
        } else if (rawCat.includes('work') || rawCat.includes('office') || rawCat.includes('job')) {
          matchedCategory = 'Office';
        } else if (rawCat.includes('gym') || rawCat.includes('workout') || rawCat.includes('exercise')) {
          matchedCategory = 'Exercise';
        } else if (rawCat.includes('sleep') || rawCat.includes('bed')) {
          matchedCategory = 'Sleep';
        } else if (rawCat.includes('break') || rawCat.includes('lunch') || rawCat.includes('dinner')) {
          matchedCategory = 'Break';
        } else if (rawCat.includes('meditat') || rawCat.includes('yoga')) {
          matchedCategory = 'Meditation';
        } else if (rawCat.includes('mock') || rawCat.includes('interview')) {
          matchedCategory = 'Mock Interview';
        } else if (rawCat.includes('rev') || rawCat.includes('notes')) {
          matchedCategory = 'Revision';
        }

        // Color and icon resolution
        const categoryConfig = CATEGORY_OPTIONS.find(c => c.name === matchedCategory) || CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
        const color = item.color || categoryConfig.defaultColor;
        const icon = item.icon || categoryConfig.icon;

        // Repeat type
        let repeatType: RepeatType = 'Daily';
        if (item.repeatType) {
          const r = item.repeatType.toString();
          if (['One Time', 'Daily', 'Weekdays', 'Weekends', 'Weekly', 'Monthly'].includes(r)) {
            repeatType = r as RepeatType;
          }
        }

        // Priority
        let priority: 'High' | 'Medium' | 'Low' = 'Medium';
        if (item.priority && ['High', 'Medium', 'Low'].includes(item.priority)) {
          priority = item.priority;
        }

        const duration = calculateDurationMinutes(startTime, endTime);

        return {
          title,
          description: item.description || item.notes || '',
          category: matchedCategory,
          color,
          icon,
          startTime,
          endTime,
          duration: duration > 0 ? duration : 30,
          repeatType,
          alarmEnabled: item.alarmEnabled !== undefined ? Boolean(item.alarmEnabled) : true,
          alarmMinutesBefore: Number(item.alarmMinutesBefore) || 5,
          notificationSound: item.notificationSound || 'default',
          vibration: item.vibration !== undefined ? Boolean(item.vibration) : true,
          snoozeEnabled: item.snoozeEnabled !== undefined ? Boolean(item.snoozeEnabled) : true,
          snoozeDuration: Number(item.snoozeDuration) || 5,
          status: 'Upcoming',
          priority
        };
      });

      return { routines: normalized, error: null };
    } catch (err: any) {
      return { routines: [], error: err.message || 'Invalid JSON format' };
    }
  }, [jsonInput]);

  // Construct copyable AI prompt
  const copyableAiPrompt = useMemo(() => {
    const userGoal = promptInput.trim() || 'Create a high-efficiency daily routine schedule for a software developer preparing for technical coding interviews.';
    return `Generate a structured daily routine schedule in strict JSON format based on the following user request:

"${userGoal}"

CRITICAL RULES:
1. Output ONLY a valid JSON array of objects. Do NOT include markdown code blocks, explanation text, or extra commentary.
2. Ensure time intervals do not overlap where possible and cover morning to night smoothly (using 24-hour HH:mm format, e.g. "07:00", "18:30").
3. Each object in the array MUST strictly follow this JSON schema:

[
  {
    "title": "Morning DSA & LeetCode Practice",
    "startTime": "07:30",
    "endTime": "09:00",
    "category": "DSA",
    "priority": "High",
    "repeatType": "Daily",
    "description": "Solve 2 Medium graph/array problems with dry run notes."
  }
]

Allowed "category" values: DSA, System Design, Java, Spring Boot, Coding Practice, Mock Interview, Revision, Exercise, Meditation, Office, Break, Sleep, Custom.
Allowed "priority" values: High, Medium, Low.
Allowed "repeatType" values: Daily, Weekdays, Weekends, One Time.`;
  }, [promptInput]);

  // Direct AI Generation Call
  const handleGenerateWithAI = async () => {
    if (!promptInput.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    const systemPrompt = `You are a world-class time-management and interview prep routine generator AI. 
Generate a list of daily routine items as a raw JSON array.
Strictly adhere to valid 24h HH:mm time format (e.g., "07:00", "14:30") and allowed category values.
Return ONLY valid JSON string representation of array. No markdown code blocks, no explanations.`;

    try {
      const response = await callAI({
        systemPrompt,
        userPrompt: copyableAiPrompt,
        temperature: 0.3,
        maxTokens: 1200,
        geminiApiKey: userSettings?.geminiApiKey,
        geminiModel: userSettings?.geminiModel,
        cerebrasApiKey: userSettings?.cerebrasApiKey,
        cerebrasModel: userSettings?.cerebrasModel,
        groqApiKey: userSettings?.groqApiKey,
        groqModel: userSettings?.groqModel,
        responseMimeType: 'application/json'
      });

      if (response && response.trim()) {
        const cleaned = cleanJsonString(response);
        // Verify JSON parse
        JSON.parse(cleaned);
        setJsonInput(cleaned);
        setActiveTab('json');
      } else {
        throw new Error('AI returned empty response.');
      }
    } catch (err: any) {
      console.error('AI Routine generation error:', err);
      setGenerationError(
        err?.message?.includes('API key') 
          ? 'No AI API key found. Please add a Gemini/Cerebras key in Settings, or click "Copy AI Prompt" to use ChatGPT/Claude web interface!'
          : `AI Generation failed: ${err.message || 'Unknown error'}. You can click "Copy AI Prompt" to use ChatGPT or Gemini.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(copyableAiPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === parseResult.routines.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parseResult.routines.map((_, i) => i)));
    }
  };

  const handleToggleIndex = (idx: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleImportSubmit = async () => {
    const selected = parseResult.routines.filter((_, idx) => selectedIndices.has(idx));
    if (selected.length === 0) return;

    await onImportRoutines(selected, replaceExisting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-card w-full max-w-4xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] bg-slate-900/95"
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-sans">
                  AI & JSON Routine Import Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Bulk Processing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate custom routine schedules via AI prompts or import direct JSON objects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl glass-card hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/60 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>1. Generate with AI Prompt</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileJson className="w-4 h-4 text-cyan-300" />
              <span>2. Direct JSON Paste & Preview</span>
            </button>
          </div>

          {parseResult.routines.length > 0 && !parseResult.error && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{parseResult.routines.length} routines ready</span>
            </div>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* TAB 1: AI Prompt Generator */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Preset Quick Prompts */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose a Quick Starter Prompt:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_AI_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPromptInput(item.prompt)}
                      className="p-3 rounded-2xl bg-white/5 hover:bg-indigo-600/15 border border-white/10 hover:border-indigo-500/40 text-left transition group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {item.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Describe your ideal daily schedule in natural text:</span>
                  <span className="text-[11px] text-slate-500">Mention times, study subjects, workout, breaks</span>
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g., I wake up at 7:00 AM. Study DSA for 2 hours, work from 9:30 AM to 5:30 PM, study System Design from 6:30 PM to 8:00 PM, workout for 45 mins, and sleep at 11:00 PM..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-white/15 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition resize-none font-sans"
                />
              </div>

              {/* Generation Actions & AI Banner */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Generate JSON directly or copy prompt template
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Use in-app AI or copy prompt to paste into ChatGPT / Claude / Gemini
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="px-3.5 py-2.5 rounded-xl glass-card hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Copy formatted prompt to clipboard for ChatGPT / Gemini"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy AI Prompt'}</span>
                  </button>

                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !promptInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>AI Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Generate Routine JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error banner if any */}
              {generationError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">AI Generation Notice</div>
                    <div>{generationError}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct JSON Paste & Sample Templates */}
          {activeTab === 'json' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Preset Sample Buttons & Helper Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Quick Templates:</span>
                  <button
                    onClick={() => setJsonInput(PRESET_JSON_TEMPLATES.standard)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Standard 9-to-5 + Prep
                  </button>
                  <button
                    onClick={() => setJsonInput(PRESET_JSON_TEMPLATES.intensive)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Full-Day Intensive
                  </button>
                  <button
                    onClick={() => setJsonInput(PRESET_JSON_TEMPLATES.minimal)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition cursor-pointer"
                  >
                    Minimal 3-Block Focus
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(cleanJsonString(jsonInput));
                        setJsonInput(JSON.stringify(parsed, null, 2));
                      } catch (e) {
                        // ignore if invalid
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg glass-card hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10 transition cursor-pointer"
                  >
                    Format JSON
                  </button>

                  <button
                    onClick={() => setJsonInput('')}
                    className="px-2.5 py-1 rounded-lg glass-card hover:bg-white/10 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-white/10 transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* JSON Textarea */}
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your AI-generated JSON array here..."
                  rows={10}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-white/15 text-emerald-400 font-mono text-xs focus:outline-none focus:border-indigo-500 transition resize-none custom-scrollbar leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SECTION (Always visible if JSON valid) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Parsed Routines Preview ({parseResult.routines.length})</span>
                </h3>
                {parseResult.error && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    JSON Error
                  </span>
                )}
              </div>

              {parseResult.routines.length > 0 && !parseResult.error && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    {selectedIndices.size === parseResult.routines.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-slate-400">
                    Selected: <strong className="text-white">{selectedIndices.size}</strong> of {parseResult.routines.length}
                  </span>
                </div>
              )}
            </div>

            {/* Validation Error Banner */}
            {parseResult.error ? (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <strong>Invalid JSON syntax:</strong> {parseResult.error}. Please check bracket closure or quotes.
                </div>
              </div>
            ) : parseResult.routines.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center text-slate-500 text-xs">
                No routines parsed yet. Type a prompt above or paste a JSON array into the editor.
              </div>
            ) : (
              /* Routines Preview Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
                {parseResult.routines.map((routine, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleIndex(idx)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 relative ${
                        isChecked 
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10' 
                          : 'bg-white/5 border-white/10 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleIndex(idx)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-slate-900 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {routine.title}
                          </span>
                          <span 
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: routine.color }}
                          >
                            {routine.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <span className="font-mono text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {routine.startTime} - {routine.endTime}
                          </span>
                          <span>•</span>
                          <span className="text-indigo-300 font-medium">
                            {formatDuration(routine.duration)}
                          </span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            routine.priority === 'High' ? 'bg-rose-500/20 text-rose-300' :
                            routine.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {routine.priority}
                          </span>
                        </div>

                        {routine.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-sans">
                            {routine.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Replace vs Append Option */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-white/20 bg-slate-900"
            />
            <span>Replace all existing routines (Overwrite current schedule)</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleImportSubmit}
              disabled={selectedIndices.size === 0 || !!parseResult.error}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Import {selectedIndices.size} Routines</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
