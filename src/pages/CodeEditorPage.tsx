import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { CodeLanguage, CodeSubmission, EditorTheme } from '../types';
import { CODE_QUESTIONS } from '../data/codeQuestions';
import { ExecutionResult } from '../services/compilerApi';
import { callAI } from '../utils/aiService';
import { saveSubmission, getSubmissions, deleteSubmission } from '../services/firestoreCodeService';
import { useAuth } from '../context/AuthContext';

import { useDatabase } from '../context/DatabaseContext';
import AddCodingQuestionModal from '../components/code/AddCodingQuestionModal';

import MonacoEditorWrapper from '../components/code/MonacoEditorWrapper';
import LanguageSelector from '../components/code/LanguageSelector';
import QuestionPanel from '../components/code/QuestionPanel';
import AICoachPanel from '../components/code/AICoachPanel';

import SubmissionHistory from '../components/code/SubmissionHistory';

import IntegratedConsole from '../components/Console/IntegratedConsole';

import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShortcutCheatSheetModal from '../components/code/ShortcutCheatSheetModal';
import CommandPaletteModal from '../components/code/CommandPaletteModal';

import {
  Code2, Play, Send, Loader, ChevronDown, RotateCcw,
  Timer, Moon, Sun, CheckCircle, Keyboard, ArrowLeft,
  FileText, MessageSquare, History, ListChecks, Sparkles,
  Clock, Plus, Settings, Pencil, BarChart2, X
} from 'lucide-react';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

const getCodeStorageKey = (questionId: string, language: CodeLanguage) =>
  `prepflow_code_${questionId}_${language}`;

// ── Resize Handle ─────────────────────────────────────────────────────────────
function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  return (
    <Separator
      className={`group relative flex items-center justify-center transition-colors ${direction === 'horizontal'
          ? 'w-[6px] hover:bg-violet-500/20 active:bg-violet-500/30'
          : 'h-[6px] hover:bg-violet-500/20 active:bg-violet-500/30'
        }`}
    >
      <div
        className={`rounded-full bg-slate-600 group-hover:bg-violet-400 group-active:bg-violet-300 transition-colors ${direction === 'horizontal' ? 'w-[3px] h-8' : 'h-[3px] w-8'
          }`}
      />
    </Separator>
  );
}

// ── Timer Display ─────────────────────────────────────────────────────────────
function TimerDisplay() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <button
      onClick={() => setIsRunning((r) => !r)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition cursor-pointer border ${isRunning
          ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
          : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
        }`}
      title={isRunning ? 'Pause timer' : 'Start timer'}
    >
      <Timer className="w-3.5 h-3.5" />
      <span>{fmt(seconds)}</span>
    </button>
  );
}



// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface CodeEditorPageProps {
  onBackToDashboard?: () => void;
}

export default function CodeEditorPage({ onBackToDashboard }: CodeEditorPageProps) {
  const { user } = useAuth();
  const {
    topics,
    codingQuestions,
    codingProgress,
    userSettings,
    handleAddCodingQuestion,
    handleRecordCodingRecall,
    handleLinkCodingQuestionToTopic
  } = useDatabase();

  // ── Merged questions list (built-in + custom) ────────────────────────────────
  const allCodingQuestions = useMemo(() => {
    const seedMapped = CODE_QUESTIONS.map(q => {
      const prog = codingProgress.find(p => p.questionId === q.id);
      return {
        ...q,
        topicId: prog?.topicId || '',
        easeFactor: prog?.easeFactor ?? 2.5,
        intervalDays: prog?.intervalDays ?? 1,
        revisionCount: prog?.revisionCount ?? 0,
        lastRevisedDate: prog?.lastRevisedDate || undefined,
        nextRevisionDate: prog?.nextRevisionDate || undefined,
      };
    });

    const customMapped = codingQuestions.map(q => ({
      ...q,
      isCustom: true
    }));

    return [...seedMapped, ...customMapped];
  }, [codingProgress, codingQuestions]);

  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allCodingQuestions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(t => tagsSet.add(t));
      }
    });
    return ['All', ...Array.from(tagsSet).sort()];
  }, [allCodingQuestions]);

  // ── Core state ───────────────────────────────────────────────────────────
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(CODE_QUESTIONS[0].id);
  const [language, setLanguage] = useState<CodeLanguage>('java');
  const [theme, setTheme] = useState<EditorTheme>('vs-dark');
  const [code, setCode] = useState<string>('');
  const [fontSize, setFontSize] = useState(14);

  // ── Custom Modals and filter states ──────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showRecallOverlay, setShowRecallOverlay] = useState(false);
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'difficulty-asc' | 'difficulty-desc' | 'title'>('default');

  // ── Execution state ──────────────────────────────────────────────────────
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [customTestCases, setCustomTestCases] = useState<{ input: string; expectedOutput: string }[]>([]);

  // ── History state ────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);

  // ── UI tabs ──────────────────────────────────────────────────────────────
  type SidebarTabType = 'problem' | 'submissions' | 'discussion' | 'ai' | 'notes' | 'progress' | 'settings';
  const [activeSidebar, setActiveSidebar] = useState<SidebarTabType | null>('problem');
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [mobileView, setMobileView] = useState<'problem' | 'code' | 'output' | 'ai'>('code');
  const [notes, setNotes] = useState<string>('');

  // Keyboard & Command Palette states
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const editorRef = useRef<any>(null);

  useKeyboardShortcuts({
    onRun: () => handleRun(),
    onSubmit: () => handleSubmit(),
    onSave: () => {
      localStorage.setItem(getCodeStorageKey(selectedQuestionId, language), code);
      alert('Draft code saved to local browser template storage.');
    },
    onNavigateTab: (index) => {
      if (index === 1) {
        setActiveSidebar('problem');
      } else if (index === 2) {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      } else if (index === 5) {
        setActiveSidebar('ai');
      }
    },
    onAIAction: (actionId) => {
      setActiveSidebar('ai');
      // Simulates focusing onto the AI actions
    },
    onToggleTheme: () => {
      setTheme(theme === 'vs-dark' ? 'light' : theme === 'light' ? 'dracula' : 'vs-dark');
    },
    onOpenCommandPalette: () => setIsPaletteOpen(true),
    onOpenCheatSheet: () => setIsCheatSheetOpen(true),
  });

  const handleExecuteCommand = (cmdId: string) => {
    switch (cmdId) {
      case 'run':
        handleRun();
        break;
      case 'submit':
        handleSubmit();
        break;
      case 'save':
        localStorage.setItem(getCodeStorageKey(selectedQuestionId, language), code);
        alert('Draft code saved to local browser template storage.');
        break;
      case 'hint':
      case 'explain':
      case 'optimize':
        setActiveSidebar('ai');
        break;
      case 'shortcuts':
        setIsCheatSheetOpen(true);
        break;
      case 'theme':
        setTheme(theme === 'vs-dark' ? 'light' : theme === 'light' ? 'dracula' : 'vs-dark');
        break;
    }
  };

  const question = useMemo(
    () => allCodingQuestions.find((q) => q.id === selectedQuestionId) || allCodingQuestions[0] || CODE_QUESTIONS[0],
    [allCodingQuestions, selectedQuestionId]
  );

  // ── Load / save code ────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(getCodeStorageKey(selectedQuestionId, language));
    setCode(saved || question.starterCode[language] || '');
  }, [selectedQuestionId, language, question]);

  useEffect(() => {
    if (code) localStorage.setItem(getCodeStorageKey(selectedQuestionId, language), code);
  }, [code, selectedQuestionId, language]);

  // Load notes for current question
  useEffect(() => {
    const savedNotes = localStorage.getItem(`prepflow_notes_${selectedQuestionId}`);
    setNotes(savedNotes || '');
  }, [selectedQuestionId]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(`prepflow_notes_${selectedQuestionId}`, val);
  };

  // ── Load history ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.uid) {
      getSubmissions(user.uid, selectedQuestionId).then(setSubmissions).catch(() => setSubmissions([]));
    }
  }, [user?.uid, selectedQuestionId]);

  // ── Reset on question change ─────────────────────────────────────────────
  useEffect(() => {
    setExecutionResult(null);
    setTestResults([]);
    setCustomTestCases([]);
  }, [selectedQuestionId, question]);

  const handleLanguageChange = (newLang: CodeLanguage) => {
    const saved = localStorage.getItem(getCodeStorageKey(selectedQuestionId, newLang));
    setLanguage(newLang);
    setCode(saved || question.starterCode[newLang] || '');
  };

  const handleResetCode = () => {
    setCode(question.starterCode[language] || '');
    localStorage.removeItem(getCodeStorageKey(selectedQuestionId, language));
  };

  // ── AI Execution Simulator ────────────────────────────────────────────────
  const executeCodeWithAI = useCallback(async (lang: string, sourceCode: string, stdin: string): Promise<ExecutionResult> => {
    const systemPrompt = `You are a strict, sandboxed compiler and runtime execution simulator for coding challenges.
Your job is to read the user's code, compile it mentally, and execute it against the provided input (stdin).
Analyze the code for syntax/compile errors. If there are syntax errors (e.g. missing semicolons in Java/C++, type errors, undefined variables, missing imports), return status "compilation_error" and describe the compiler error in "stderr".
If there are no compile errors, simulate running the program with the given "stdin" input.
- If it runs successfully, return the exact stdout in "stdout", set "status" to "success", and set "exitCode" to 0.
- If a runtime error occurs (e.g. index out of bounds, null pointer, division by zero, infinite loop/stack overflow), return status "error" and put the exception stack trace or error message in "stderr". Set "exitCode" to 1.
- Provide a realistic executionTime (e.g., "12ms") and memory (e.g., "15MB").

Return strictly a JSON object with the following schema:
{
  "stdout": string,
  "stderr": string,
  "exitCode": number,
  "executionTime": string,
  "memory": string,
  "status": "success" | "error" | "compilation_error" | "timeout"
}`;

    const userPrompt = `Language: ${lang}
Input (stdin): ${stdin}

Challenge Title: ${question.title}
Challenge Description:
${question.description}

User Source Code:
\`\`\`${lang}
${sourceCode}
\`\`\``;

    try {
      const geminiKey = userSettings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
      const rawRes = await callAI({
        systemPrompt,
        userPrompt,
        temperature: 0.0, // strict evaluation
        maxTokens: 1000,
        cerebrasApiKey: userSettings?.cerebrasApiKey,
        geminiApiKey: geminiKey,
        groqApiKey: userSettings?.groqApiKey,
        cerebrasModel: userSettings?.cerebrasModel,
        geminiModel: userSettings?.geminiModel,
        groqModel: userSettings?.groqModel,
        responseMimeType: 'application/json'
      });

      // Parse JSON from response
      const cleanJsonStr = rawRes.replace(/```json\s*|```\s*/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr) as ExecutionResult;
      return parsed;
    } catch (err) {
      console.error('[executeCodeWithAI] Simulation failed, falling back to basic mock:', err);
      return {
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Unknown AI simulation error',
        exitCode: 1,
        executionTime: '0ms',
        memory: 'N/A',
        status: 'error'
      };
    }
  }, [question, userSettings]);

  // ── Run (first test case) ────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);

    try {
      const stdin = question.testCases[0]?.input || '';
      const result = await executeCodeWithAI(language, code, stdin);
      setExecutionResult(result);
      localStorage.setItem('prep_quest_compile_code', 'true');
    } catch (err) {
      setExecutionResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Unknown error',
        exitCode: 1,
        executionTime: '0ms',
        memory: 'N/A',
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, question, isRunning, isSubmitting, executeCodeWithAI]);



  // ── Format Code ──────────────────────────────────────────────────────────
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  // ── Submit (all test cases) ──────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (isRunning || isSubmitting || !user?.uid) return;
    setIsSubmitting(true);

    const allTests = [...question.testCases, ...customTestCases];
    const results: TestResult[] = [];
    let lastResult: ExecutionResult | null = null;

    try {
      for (const tc of allTests) {
        const result = await executeCodeWithAI(language, code, tc.input);
        const actualOutput = result.stdout.trim();
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
          passed: actualOutput === tc.expectedOutput.trim(),
        });
        lastResult = result;
      }

      setTestResults(results);
      if (lastResult) setExecutionResult(lastResult);
      localStorage.setItem('prep_quest_compile_code', 'true');

      const allPassed = results.every((r) => r.passed);
      const status = lastResult?.status === 'compilation_error'
        ? 'Compilation Error'
        : lastResult?.status === 'timeout'
          ? 'Time Limit Exceeded'
          : lastResult?.status === 'error'
            ? 'Runtime Error'
            : allPassed
              ? 'Accepted'
              : 'Wrong Answer';

      const submissionId = await saveSubmission(user.uid, {
        questionId: selectedQuestionId,
        language,
        sourceCode: code,
        output: lastResult?.stdout || '',
        status: status as CodeSubmission['status'],
        executionTime: lastResult?.executionTime || '0ms',
        memory: lastResult?.memory || 'N/A',
      });

      setSubmissions((prev) => [
        {
          id: submissionId,
          userId: user.uid,
          questionId: selectedQuestionId,
          language,
          sourceCode: code,
          output: lastResult?.stdout || '',
          status: status as CodeSubmission['status'],
          executionTime: lastResult?.executionTime || '0ms',
          memory: lastResult?.memory || 'N/A',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      if (allPassed) {
        setShowRecallOverlay(true);
      }
    } catch (err) {
      setExecutionResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Submission failed',
        exitCode: 1,
        executionTime: '0ms',
        memory: 'N/A',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, language, question, customTestCases, user?.uid, selectedQuestionId, isRunning, isSubmitting]);

  const handleRestore = (sub: CodeSubmission) => {
    setCode(sub.sourceCode);
    if (sub.language !== language) setLanguage(sub.language);
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteSubmission(user.uid, id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* silent */ }
  };

  const handleRecallSubmit = async (response: 'Remembered' | 'Partially' | 'Forgot') => {
    if (!question.topicId) {
      alert("Please map this coding question to a Study Topic (in Left Sidebar or overlay select) before logging recall!");
      return;
    }
    await handleRecordCodingRecall(question.id, question.topicId, response);
    setShowRecallOverlay(false);
  };

  const filteredQuestions = useMemo(() => {
    let list = [...allCodingQuestions];

    // 1. Filter by Due Only
    if (filterDueOnly) {
      const now = new Date();
      list = list.filter(q => {
        if (!q.nextRevisionDate) return true;
        return new Date(q.nextRevisionDate) <= now;
      });
    }

    // 2. Filter by Difficulty
    if (difficultyFilter !== 'All') {
      list = list.filter(q => q.difficulty === difficultyFilter);
    }

    // 3. Filter by Tag
    if (selectedTagFilter !== 'All') {
      list = list.filter(q => q.tags && q.tags.includes(selectedTagFilter));
    }

    // 4. Sort
    if (sortBy === 'difficulty-asc') {
      const diffWeight = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => diffWeight[a.difficulty] - diffWeight[b.difficulty]);
    } else if (sortBy === 'difficulty-desc') {
      const diffWeight = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => diffWeight[b.difficulty] - diffWeight[a.difficulty]);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [allCodingQuestions, filterDueOnly, difficultyFilter, selectedTagFilter, sortBy]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) handleSubmit();
        else handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // auto-saved already
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);



  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  const isStandalone = !!onBackToDashboard;

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`flex flex-col select-none bg-[#070b13] ${isStandalone ? 'h-[calc(100vh-64px)] w-screen overflow-hidden' : 'h-[calc(100vh-140px)] min-h-[500px] -mx-4 -mt-6'
        }`}
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-slate-700/50 shrink-0">
        {/* Left: Logo + Problem Selector */}
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/40 rounded-lg text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Return to home dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}


          {/* Problem Selector */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowQuestionDropdown(!showQuestionDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 rounded-lg text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5 text-violet-400" />
              <span className="max-w-[160px] truncate">{question.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 border border-violet-500/30 rounded-lg text-xs font-bold text-white transition cursor-pointer"
              title="Create Custom Problem"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Add Custom</span>
            </button>

            {showQuestionDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuestionDropdown(false)} />
                <div className="absolute top-full mt-1 left-0 z-50 w-96 bg-[#1e293b] border border-slate-600/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Problem</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-400">
                      <input
                        type="checkbox"
                        checked={filterDueOnly}
                        onChange={(e) => setFilterDueOnly(e.target.checked)}
                        className="rounded border-slate-700 text-violet-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 w-3 h-3 cursor-pointer"
                      />
                      <span>Due Only</span>
                    </label>
                  </div>

                  {/* Filters & Sorting Controls */}
                  <div className="px-3 py-2 border-b border-slate-700/40 bg-slate-800/40 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Tag Filter */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Filter by Tag</label>
                        <select
                          value={selectedTagFilter}
                          onChange={(e) => setSelectedTagFilter(e.target.value)}
                          className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {uniqueTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty Filter */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Difficulty</label>
                        <select
                          value={difficultyFilter}
                          onChange={(e) => setDifficultyFilter(e.target.value as any)}
                          className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          <option value="All">All</option>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-end">
                      {/* Sort By */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Sort by</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          <option value="default">Default Order</option>
                          <option value="difficulty-asc">Difficulty (Easy first)</option>
                          <option value="difficulty-desc">Difficulty (Hard first)</option>
                          <option value="title">Alphabetical</option>
                        </select>
                      </div>

                      {/* Clear filters button */}
                      <div className="text-right pb-1">
                        {(selectedTagFilter !== 'All' || difficultyFilter !== 'All' || sortBy !== 'default' || filterDueOnly) && (
                          <button
                            onClick={() => {
                              setSelectedTagFilter('All');
                              setDifficultyFilter('All');
                              setSortBy('default');
                              setFilterDueOnly(false);
                            }}
                            className="text-[9px] text-violet-400 hover:text-violet-300 font-semibold transition cursor-pointer underline decoration-dotted"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[320px] overflow-auto p-1.5">
                    {filteredQuestions.map((q, idx) => {
                      const diffColor = { Easy: 'text-emerald-400', Medium: 'text-amber-400', Hard: 'text-rose-400' }[q.difficulty];
                      const isSelected = selectedQuestionId === q.id;
                      const isDue = q.nextRevisionDate ? new Date(q.nextRevisionDate) <= new Date() : true;
                      return (
                        <button
                          key={q.id}
                          onClick={() => { setSelectedQuestionId(q.id); setShowQuestionDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition cursor-pointer ${isSelected ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-slate-700/50 border border-transparent'
                            }`}
                        >
                          <span className="w-5 h-5 rounded bg-slate-700/80 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`flex-1 text-left font-medium ${isSelected ? 'text-white' : 'text-slate-300'} flex flex-col`}>
                            <span>{q.title}</span>
                            {q.topicId && (
                              <span className="text-[9px] text-slate-500 font-normal">
                                Topic: {topics.find(t => t.id === q.topicId)?.name || 'Mapped'}
                              </span>
                            )}
                          </span>
                          {isDue && (
                            <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">Due</span>
                          )}
                          <span className={`text-[10px] font-bold ${diffColor} shrink-0`}>{q.difficulty}</span>
                          {submissions.some((s) => s.questionId === q.id && s.status === 'Accepted') && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Timer + Actions */}
        <div className="flex items-center gap-2">
          {/* AI Coach Toggle */}
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'ai' ? null : 'ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${activeSidebar === 'ai'
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-300'
                : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
              }`}
            title="Toggle AI Coach Panel"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          {/* Keyboard Shortcuts Guide */}
          <button
            onClick={() => setIsCheatSheetOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg border border-transparent transition cursor-pointer"
            title="Keyboard Shortcuts Guide (F1)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <TimerDisplay />
        </div>
      </nav>

      {/* ── Mobile Tab Switcher (visible below lg) ──────────────────────────── */}
      <div className="flex lg:hidden bg-[#111827] border-b border-slate-700/50 shrink-0">
        {(['problem', 'code', 'output', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileView(tab)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${mobileView === tab
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            {tab === 'problem' ? 'Problem' : tab === 'code' ? 'Code' : tab === 'output' ? 'Output' : '🤖 Coach'}
          </button>
        ))}
      </div>

      {/* ── Desktop Split Layout ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 hidden lg:flex overflow-hidden">
        {/* Left Side Rail & Panel */}
        <div className="flex h-full shrink-0 select-none">
          {/* Icon Rail */}
          <div className="w-[56px] bg-[#111827] border-r border-slate-800/80 flex flex-col items-center py-4 justify-between select-none">
            <div className="flex flex-col gap-2 w-full px-2">
              {[
                { id: 'problem' as const, label: 'Problem', icon: FileText },
                { id: 'submissions' as const, label: 'Submissions', icon: History },
                { id: 'discussion' as const, label: 'Discussion', icon: MessageSquare },
                { id: 'ai' as const, label: 'AI Coach', icon: Sparkles },
                { id: 'notes' as const, label: 'Notes', icon: Pencil },
                { id: 'progress' as const, label: 'Progress', icon: BarChart2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSidebar === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSidebar(activeSidebar === tab.id ? null : tab.id)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center transition cursor-pointer relative group ${isActive
                        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5" />
                    {/* Tooltip on hover */}
                    <div className="absolute left-14 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 px-2 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                      {tab.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom settings icon */}
            <div className="w-full px-2">
              <button
                onClick={() => setActiveSidebar(activeSidebar === 'settings' ? null : 'settings')}
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition cursor-pointer relative group ${activeSidebar === 'settings'
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
                <div className="absolute left-14 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 px-2 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  Settings
                </div>
              </button>
            </div>
          </div>

          {/* Sidebar Content Panel */}
          <div
            className="bg-[#0f172a] border-r border-slate-800/80 flex flex-col transition-all duration-200 ease-in-out overflow-hidden"
            style={{ width: activeSidebar ? '380px' : '0px' }}
          >
            {activeSidebar && (
              <div className="w-[380px] h-full flex flex-col min-w-[380px] text-slate-300">
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-slate-850 flex items-center justify-between shrink-0 bg-[#111827]/30">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    {activeSidebar === 'problem' && <FileText className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'submissions' && <History className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'discussion' && <MessageSquare className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'ai' && <Sparkles className="w-4.5 h-4.5 text-violet-400 animate-pulse" />}
                    {activeSidebar === 'notes' && <Pencil className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'progress' && <BarChart2 className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'settings' && <Settings className="w-4.5 h-4.5 text-violet-400" />}
                    {activeSidebar === 'problem' && 'Problem Description'}
                    {activeSidebar === 'submissions' && 'Submissions'}
                    {activeSidebar === 'discussion' && 'Discussion'}
                    {activeSidebar === 'ai' && 'AI Coach'}
                    {activeSidebar === 'notes' && 'Personal Notes'}
                    {activeSidebar === 'progress' && 'Revision & Progress'}
                    {activeSidebar === 'settings' && 'Editor Settings'}
                  </span>
                  <button
                    onClick={() => setActiveSidebar(null)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Panel Body Content */}
                <div className="flex-1 overflow-auto p-5">
                  {activeSidebar === 'problem' && (
                    <QuestionPanel question={question} />
                  )}

                  {activeSidebar === 'submissions' && (
                    <SubmissionHistory
                      submissions={submissions}
                      onRestore={handleRestore}
                      onDelete={handleDeleteSubmission}
                    />
                  )}

                  {activeSidebar === 'discussion' && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="w-10 h-10 text-slate-700 mb-3 animate-bounce" />
                      <p className="text-sm font-semibold text-slate-400">Community Discussion</p>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[240px]">
                        Discuss and share your solution code with other users. Coming soon.
                      </p>
                    </div>
                  )}

                  {activeSidebar === 'ai' && (
                    <AICoachPanel
                      question={question}
                      code={code}
                      language={language}
                      compileError={executionResult?.status === 'compilation_error' ? executionResult.compilationOutput || executionResult.stderr : undefined}
                      lastSubmissionPassed={testResults.length > 0 && testResults.every((r) => r.passed)}
                      onSelectProblem={(title) => {
                        const found = allCodingQuestions.find((q) => q.title.toLowerCase() === title.toLowerCase());
                        if (found) setSelectedQuestionId(found.id);
                      }}
                    />
                  )}

                  {activeSidebar === 'notes' && (
                    <div className="h-full flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Draft saved locally</span>
                        {notes && (
                          <button
                            onClick={() => { if (confirm("Clear notes?")) handleNotesChange(''); }}
                            className="text-[10px] text-rose-450 hover:text-rose-400 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <textarea
                        value={notes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Write down your solution thoughts, constraints, or key ideas here..."
                        className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500 font-sans resize-none placeholder-slate-600 focus:ring-1 focus:ring-violet-500/25 leading-relaxed"
                      />
                    </div>
                  )}

                  {activeSidebar === 'progress' && (
                    <div className="space-y-6">
                      {/* Spaced Repetition Stats & Topic Linker */}
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-violet-400" />
                            Spaced Repetition Stats
                          </span>
                          {question.revisionCount !== undefined && question.revisionCount > 0 && (
                            <span className="text-[10px] font-bold bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full">
                              Revised {question.revisionCount}x
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ease Factor</span>
                            <span className="text-slate-300 font-mono">{(question.easeFactor || 2.5).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Interval Days</span>
                            <span className="text-slate-300 font-mono">{question.intervalDays || 1} day(s)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last Revised</span>
                            <span className="text-slate-300">
                              {question.lastRevisedDate ? new Date(question.lastRevisedDate).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Next Revision</span>
                            <span className="text-slate-300 font-semibold text-violet-400">
                              {question.nextRevisionDate ? new Date(question.nextRevisionDate).toLocaleDateString() : 'Not scheduled'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-850 pt-3">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Linked Topic</label>
                          <select
                            value={question.topicId || ''}
                            onChange={(e) => handleLinkCodingQuestionToTopic(question.id, e.target.value)}
                            className="w-full bg-slate-850 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition cursor-pointer"
                          >
                            <option value="">-- Mapped to No Topic --</option>
                            {topics.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Question Metadata Summary */}
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-slate-200 tracking-wide block">Question Details</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Difficulty:</span>
                            <span className={`font-bold ${{ Easy: 'text-emerald-400', Medium: 'text-amber-400', Hard: 'text-rose-400' }[question.difficulty]}`}>
                              {question.difficulty}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Solve Status:</span>
                            <span className="font-mono">
                              {submissions.some(s => s.status === 'Accepted') ? (
                                <span className="text-emerald-400 font-bold">Solved</span>
                              ) : (
                                <span className="text-slate-400">Unsolved</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSidebar === 'settings' && (
                    <div className="space-y-6">
                      {/* Editor Preferences */}
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-4">
                        <span className="text-xs font-bold text-slate-200 tracking-wide block">Editor Preferences</span>

                        {/* Font size */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Font Size:</span>
                          <div className="flex items-center gap-2 bg-slate-800 rounded-md border border-slate-700/40 px-2 py-1">
                            <button
                              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
                              className="text-slate-300 hover:text-white px-1.5 cursor-pointer font-bold"
                            >
                              −
                            </button>
                            <span className="text-xs text-white font-mono w-6 text-center">{fontSize}px</span>
                            <button
                              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                              className="text-slate-300 hover:text-white px-1.5 cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Theme */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Theme:</span>
                          <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value as EditorTheme)}
                            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            <option value="vs-dark">VS Dark</option>
                            <option value="light">Light</option>
                            <option value="dracula">Dracula</option>
                          </select>
                        </div>

                        {/* Reset Code */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-850">
                          <span className="text-slate-400">Restore starter template:</span>
                          <button
                            onClick={() => { if (confirm("Reset code to default?")) handleResetCode(); }}
                            className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-450 hover:text-rose-400 px-3 py-1.5 rounded-lg transition text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Starter Code</span>
                          </button>
                        </div>
                      </div>

                      {/* Keyboard Shortcuts Reference */}
                      <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                          <Keyboard className="w-3.5 h-3.5 text-violet-400" />
                          Quick Keyboard Shortcuts
                        </span>
                        <div className="space-y-2.5 text-xs text-slate-400">
                          <div className="flex justify-between items-center">
                            <span>Run Code:</span>
                            <kbd className="bg-slate-850 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">⌃ ↵</kbd>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Submit Solution:</span>
                            <kbd className="bg-slate-850 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">⌃ ⇧ ↵</kbd>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Save Draft:</span>
                            <kbd className="bg-slate-850 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">⌘ S</kbd>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Open Palette:</span>
                            <kbd className="bg-slate-850 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">⌘ P</kbd>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>View All Shortcuts:</span>
                            <button
                              onClick={() => setIsCheatSheetOpen(true)}
                              className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                            >
                              Show list
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Editor & Console panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <Group orientation="vertical" className="h-full">
            {/* ── Editor Section ───────────────────────────────────────────── */}
            <Panel defaultSize={75} minSize={45} maxSize={85}>
              <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
                  <div className="flex items-center gap-2">
                    <LanguageSelector selected={language} onChange={handleLanguageChange} />

                    {/* Compact layout feedback text */}
                    <span className="text-[10px] text-slate-500 font-mono ml-2 hidden xl:inline">
                      Language: {language} | Font: {fontSize}px
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Theme toggle */}
                    <button
                      onClick={() => setTheme(theme === 'vs-dark' ? 'light' : theme === 'light' ? 'dracula' : 'vs-dark')}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
                      title={`Theme: ${theme}`}
                    >
                      {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>

                    {/* Reset */}
                    <button
                      onClick={handleResetCode}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
                      title="Reset to default code"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Monaco */}
                <div className="flex-1 min-h-0">
                  <MonacoEditorWrapper
                    language={language}
                    theme={theme}
                    value={code}
                    onChange={setCode}
                    onRun={handleRun}
                    fontSize={fontSize}
                    onEditorMount={(ed) => { editorRef.current = ed; }}
                  />
                </div>
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            {/* ── Bottom Console Section ───────────────────────────────────── */}
            <Panel defaultSize={25} minSize={15} maxSize={55}>
              <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
                <div className="flex-1 min-h-0">
                  <IntegratedConsole
                    question={question}
                    result={executionResult}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                    testResults={testResults}
                    submissions={submissions}
                    language={language}
                    onRestore={handleRestore}
                    onSelectInput={() => { }}
                    onClear={() => setExecutionResult(null)}
                    onNavigateToLine={(line) => {
                      if (editorRef.current) {
                        editorRef.current.revealLine(line);
                        editorRef.current.setPosition({ lineNumber: line, column: 1 });
                        editorRef.current.focus();
                      }
                    }}
                  />
                </div>

                {/* Bottom Action Toolbar */}
                <div className="flex items-center justify-between border-t border-slate-700/50 bg-[#111827] px-4 py-2 shrink-0 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleResetCode}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition border border-transparent cursor-pointer"
                      title="Reset code"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={handleFormatCode}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition border border-transparent cursor-pointer"
                      title="Format Code"
                    >
                      Format Code
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRun}
                      disabled={isRunning || isSubmitting}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${isRunning || isSubmitting
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border-transparent'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50 hover:border-slate-600/60'
                        }`}
                    >
                      {isRunning ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>Run</span>
                      <kbd className="text-[9px] text-slate-500 ml-0.5 hidden sm:inline">⌃↵</kbd>
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={isRunning || isSubmitting}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${isRunning || isSubmitting
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/30'
                        }`}
                    >
                      {isSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Submit</span>
                      <kbd className="text-[9px] text-emerald-200/50 ml-0.5 hidden sm:inline">⌃⇧↵</kbd>
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </Group>
        </div>
      </div>

      {/* ── Mobile Stacked Layout ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 lg:hidden flex flex-col overflow-hidden">
        {mobileView === 'problem' && (
          <div className="flex-1 overflow-auto p-4 bg-[#0f172a] space-y-6">
            <QuestionPanel question={question} />

            {/* Spaced Repetition Stats & Topic Linker */}
            <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Spaced Repetition Stats
                </span>
                {question.revisionCount !== undefined && question.revisionCount > 0 && (
                  <span className="text-[10px] font-bold bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full">
                    Revised {question.revisionCount}x
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ease Factor</span>
                  <span className="text-slate-300 font-mono">{(question.easeFactor || 2.5).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Interval Days</span>
                  <span className="text-slate-300 font-mono">{question.intervalDays || 1} day(s)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last Revised</span>
                  <span className="text-slate-300">
                    {question.lastRevisedDate ? new Date(question.lastRevisedDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Next Revision</span>
                  <span className="text-slate-300 font-semibold text-violet-400">
                    {question.nextRevisionDate ? new Date(question.nextRevisionDate).toLocaleDateString() : 'Not scheduled'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Linked Topic</label>
                <select
                  value={question.topicId || ''}
                  onChange={(e) => handleLinkCodingQuestionToTopic(question.id, e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition cursor-pointer"
                >
                  <option value="">-- Mapped to No Topic --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {mobileView === 'code' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Mobile editor toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
              <LanguageSelector selected={language} onChange={handleLanguageChange} />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTheme(theme === 'vs-dark' ? 'light' : theme === 'light' ? 'dracula' : 'vs-dark')}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
                <button onClick={handleResetCode} className="p-1.5 rounded-md text-slate-400 hover:text-white transition cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditorWrapper language={language} theme={theme} value={code} onChange={setCode} onRun={handleRun} fontSize={fontSize} />
            </div>
          </div>
        )}

        {mobileView === 'output' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0f172a]">
            <IntegratedConsole
              question={question}
              result={executionResult}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              testResults={testResults}
              submissions={submissions}
              language={language}
              onRestore={handleRestore}
              onSelectInput={() => { }}
              onClear={() => setExecutionResult(null)}
              onNavigateToLine={(line) => {
                setMobileView('code');
                setTimeout(() => {
                  if (editorRef.current) {
                    editorRef.current.revealLine(line);
                    editorRef.current.setPosition({ lineNumber: line, column: 1 });
                    editorRef.current.focus();
                  }
                }, 100);
              }}
            />
          </div>
        )}

        {mobileView === 'ai' && (
          <div className="flex-1 overflow-auto bg-[#111827]">
            <AICoachPanel
              question={question}
              code={code}
              language={language}
              compileError={executionResult?.status === 'compilation_error' ? executionResult.compilationOutput || executionResult.stderr : undefined}
              lastSubmissionPassed={testResults.length > 0 && testResults.every((r) => r.passed)}
              onSelectProblem={(title) => {
                const found = allCodingQuestions.find((q) => q.title.toLowerCase() === title.toLowerCase());
                if (found) setSelectedQuestionId(found.id);
              }}
            />
          </div>
        )}
      </div>

      <ShortcutCheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />

      <AddCodingQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        topics={topics}
        onAddQuestion={handleAddCodingQuestion}
      />

      {showRecallOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-6 space-y-5 text-center text-slate-300">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">All Test Cases Passed!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Great job! Rate your recall difficulty to optimize your revision schedule.
              </p>
            </div>

            {/* If the question is not linked to a topic, prompt selection */}
            {!question.topicId ? (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Map to Study Topic First</label>
                <select
                  value={question.topicId || ''}
                  onChange={(e) => handleLinkCodingQuestionToTopic(question.id, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition cursor-pointer"
                >
                  <option value="">-- Select Study Topic --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-650 block">Note: Spaced repetition requires a mapped topic to sync theory and practical schedules.</span>
              </div>
            ) : (
              <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
                <span>Linked Topic:</span>
                <span className="font-bold text-violet-400">{topics.find(t => t.id === question.topicId)?.name}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleRecallSubmit('Remembered')}
                disabled={!question.topicId}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/30 rounded-xl text-left text-xs font-semibold text-emerald-300 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div>
                  <span className="block font-bold text-[13px]">Easy (Remembered)</span>
                  <span className="text-[10px] text-emerald-450 font-normal">Solved quickly with full confidence.</span>
                </div>
                <span className="bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">SM-2</span>
              </button>

              <button
                type="button"
                onClick={() => handleRecallSubmit('Partially')}
                disabled={!question.topicId}
                className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 rounded-xl text-left text-xs font-semibold text-amber-300 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div>
                  <span className="block font-bold text-[13px]">Medium (Partially)</span>
                  <span className="text-[10px] text-amber-450 font-normal">Understood concept but struggled with implementation details.</span>
                </div>
                <span className="bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">SM-2</span>
              </button>

              <button
                type="button"
                onClick={() => handleRecallSubmit('Forgot')}
                disabled={!question.topicId}
                className="w-full flex items-center justify-between p-3.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-left text-xs font-semibold text-rose-300 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div>
                  <span className="block font-bold text-[13px]">Hard (Forgot)</span>
                  <span className="text-[10px] text-rose-450 font-normal">Struggled a lot, forgot basic details. Revise tomorrow!</span>
                </div>
                <span className="bg-rose-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">SM-2</span>
              </button>
            </div>

            <div className="flex justify-end items-center text-[10px] text-slate-500 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowRecallOverlay(false)}
                className="text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
              >
                Skip Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
