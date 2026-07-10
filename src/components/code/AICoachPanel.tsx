import React, { useState, useEffect } from 'react';
import { CodeQuestion, CodeLanguage } from '../../types';
import { getHint, getCoachFeedback, AICoachResponse } from '../../services/aiCoachService';
import {
  Lightbulb, Brain, Bug, Zap, BookOpen, Layers, PlayCircle, MessageSquare,
  Sparkles, CheckCircle2, ChevronRight, User, AlertCircle, ArrowUpRight
} from 'lucide-react';

interface AICoachPanelProps {
  question: CodeQuestion;
  code: string;
  language: CodeLanguage;
  compileError?: string;
  lastSubmissionPassed?: boolean;
  onSelectProblem?: (title: string) => void;
}

export default function AICoachPanel({
  question,
  code,
  language,
  compileError,
  lastSubmissionPassed,
  onSelectProblem
}: AICoachPanelProps) {
  // Navigation & interaction state
  const [activeTab, setActiveTab] = useState<'coach' | 'chat'>('coach');
  const [hintIndex, setHintIndex] = useState(0);
  const [feedback, setFeedback] = useState<AICoachResponse | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Chat queries
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hi! Ask me any questions about this coding challenge. I will help guide you without spoiling the answer.' }
  ]);

  // Reset helper state when question changes
  useEffect(() => {
    setHintIndex(0);
    setFeedback(null);
    setActiveAction(null);
    setChatHistory([
      { sender: 'ai', text: `Hi! Let's work on "${question.title}" together. Ask me anything or select one of the tools above.` }
    ]);
  }, [question]);

  const handleAction = (action: string) => {
    setActiveAction(action);
    if (action === 'hint') {
      const hintRes = getHint(question.id, hintIndex);
      setFeedback(hintRes);
      setHintIndex((prev) => prev + 1);
    } else {
      const coachRes = getCoachFeedback(action, question, code, language, compileError);
      setFeedback(coachRes);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    // Generate responsive feedback
    setTimeout(() => {
      let aiText = "I see. Let's look closer at the problem statement. Which part of the strategy are you exploring?";
      const lower = userMsg.toLowerCase();
      
      if (lower.includes('hashmap') || lower.includes('map')) {
        aiText = "A HashMap lets you look up values you've seen in O(1) average time. This is excellent for avoiding nested iterations. Try writing a quick loop to inspect elements one by one.";
      } else if (lower.includes('complexity') || lower.includes('o(')) {
        aiText = "To determine the complexity, look at how many times your loop iterates relative to input size N. A single loop is O(N). Nested loops checking all pairs is O(N^2).";
      } else if (lower.includes('why') || lower.includes('explain')) {
        aiText = "We use this technique to trade memory space (storing visited elements) for execution speed. It's one of the most common trade-offs in technical interviews.";
      }

      setChatHistory((prev) => [...prev, { sender: 'ai', text: aiText }]);
    }, 400);
  };

  const actions = [
    { id: 'hint', label: 'Progressive Hint', icon: Lightbulb, color: 'text-amber-400 hover:bg-amber-500/10' },
    { id: 'explain', label: 'Explain Code', icon: Brain, color: 'text-indigo-400 hover:bg-indigo-500/10' },
    { id: 'debug', label: 'Find Bugs', icon: Bug, color: 'text-rose-400 hover:bg-rose-500/10' },
    { id: 'optimize', label: 'Optimize', icon: Zap, color: 'text-emerald-400 hover:bg-emerald-500/10' },
    { id: 'complexity', label: 'Complexity', icon: Layers, color: 'text-cyan-400 hover:bg-cyan-500/10' },
    { id: 'dryrun', label: 'Dry Run', icon: PlayCircle, color: 'text-violet-400 hover:bg-violet-500/10' },
    { id: 'learn', label: 'Learn Concept', icon: BookOpen, color: 'text-teal-400 hover:bg-teal-500/10' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#111827] select-none text-slate-300">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1b2330] border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">AI progressive mentor</span>
        </div>
        <div className="flex bg-slate-800/80 rounded-md p-0.5 border border-slate-700/40">
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
              activeTab === 'coach' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Coach
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
              activeTab === 'chat' ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {activeTab === 'coach' ? (
          <>
            {/* Grid of Task-focused Actions */}
            <div className="grid grid-cols-2 gap-1.5">
              {actions.map((act) => {
                const Icon = act.icon;
                const isSelected = activeAction === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleAction(act.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] font-semibold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-500/50 text-white'
                        : 'bg-slate-800/30 border-slate-700/20 text-slate-400 hover:border-slate-600/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${act.color}`} />
                    <span className="truncate">{act.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Results Display */}
            {feedback ? (
              <div className="bg-[#0f172a] border border-slate-700/40 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-700/20 text-slate-200 text-xs font-bold">
                  {feedback.title}
                </div>

                {/* Main feedback content */}
                <div className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {feedback.content}
                </div>

                {/* Dry Run Steps */}
                {feedback.metadata?.dryRun && (
                  <div className="space-y-2 mt-2">
                    {feedback.metadata.dryRun.map((step) => (
                      <div key={step.step} className="bg-slate-900/60 rounded-lg p-2 border border-slate-800 font-mono text-[10px]">
                        <div className="flex items-center gap-1 text-violet-400 font-bold mb-1">
                          <ChevronRight className="w-3.5 h-3.5" />
                          Step {step.step}
                        </div>
                        <div className="text-slate-300 bg-slate-950/80 px-2 py-1 rounded mb-1">{step.state}</div>
                        <div className="text-slate-400 font-sans leading-normal">{step.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Concept recommendations */}
                {feedback.metadata?.concepts && feedback.metadata.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {feedback.metadata.concepts.map((concept) => (
                      <span key={concept} className="text-[9px] font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {concept}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested related problems */}
                {feedback.metadata?.suggestedProblems && (
                  <div className="pt-2 border-t border-slate-700/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Try Next:</span>
                    {feedback.metadata.suggestedProblems.map((prob) => (
                      <button
                        key={prob.title}
                        onClick={() => onSelectProblem?.(prob.title)}
                        className="w-full flex items-center justify-between px-2 py-1 bg-slate-800/40 hover:bg-slate-800/80 rounded text-[11px] text-slate-300 transition cursor-pointer"
                      >
                        <span className="truncate">{prob.title}</span>
                        <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                          {prob.difficulty} <ArrowUpRight className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <Sparkles className="w-8 h-8 text-slate-700 mb-2.5 animate-pulse" />
                <p className="text-[12px] font-bold">Progressive Mentorship Mode</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
                  Select an option above to generate hints, debug syntax, or inspect complexity metrics.
                </p>
              </div>
            )}
          </>
        ) : (
          /* Chat Box Tab */
          <div className="h-full flex flex-col min-h-[220px]">
            {/* History */}
            <div className="flex-1 overflow-auto space-y-3 pr-1 text-[11.5px] max-h-[300px]">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex items-start gap-2 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {chat.sender === 'ai' && (
                    <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`rounded-xl px-3 py-2 max-w-[85%] leading-relaxed ${
                    chat.sender === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    {chat.text}
                  </div>
                  {chat.sender === 'user' && (
                    <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="mt-3 flex items-center gap-1.5 bg-[#0f172a] rounded-lg border border-slate-700/40 p-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about technique, big-O..."
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-slate-600"
              />
              <button
                type="submit"
                className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-md transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
