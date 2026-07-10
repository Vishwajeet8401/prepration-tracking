import React, { useState } from 'react';
import { CodeQuestion } from '../../types';
import { CheckCircle, XCircle, Plus, Trash2, Loader } from 'lucide-react';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface TestCasesPanelProps {
  question: CodeQuestion;
  testResults: TestResult[];
  isRunning: boolean;
  customTestCases: { input: string; expectedOutput: string }[];
  onAddCustomTestCase: (input: string, expectedOutput: string) => void;
  onRemoveCustomTestCase: (index: number) => void;
}

export default function TestCasesPanel({
  question,
  testResults,
  isRunning,
  customTestCases,
  onAddCustomTestCase,
  onRemoveCustomTestCase,
}: TestCasesPanelProps) {
  const [activeCase, setActiveCase] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');

  const allTestCases = [...question.testCases, ...customTestCases];

  const handleAdd = () => {
    if (newInput.trim() && newExpected.trim()) {
      onAddCustomTestCase(newInput.trim(), newExpected.trim());
      setNewInput('');
      setNewExpected('');
      setShowAddForm(false);
    }
  };

  const currentTC = allTestCases[activeCase];
  const currentResult = testResults.find(
    (r) => currentTC && r.input === currentTC.input && r.expectedOutput === currentTC.expectedOutput
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Case Tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700/30 shrink-0 overflow-x-auto">
        {allTestCases.map((tc, idx) => {
          const result = testResults.find(
            (r) => r.input === tc.input && r.expectedOutput === tc.expectedOutput
          );
          const isCustom = idx >= question.testCases.length;

          return (
            <button
              key={idx}
              onClick={() => setActiveCase(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeCase === idx
                  ? 'bg-slate-700/60 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              {result && (
                result.passed
                  ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                  : <XCircle className="w-3 h-3 text-rose-400" />
              )}
              Case {idx + 1}
              {isCustom && <span className="text-violet-400 text-[9px]">★</span>}
            </button>
          );
        })}

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isRunning && (
        <div className="flex items-center gap-2 px-4 py-3 bg-violet-500/5 border-b border-violet-500/10">
          <Loader className="w-3.5 h-3.5 animate-spin text-violet-400" />
          <span className="text-[11px] text-violet-300 font-medium">Running test cases...</span>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
        {/* Add Custom Form */}
        {showAddForm && (
          <div className="mb-4 bg-[#111827] rounded-lg border border-slate-700/30 p-3 space-y-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Input</label>
              <textarea
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/40 rounded-lg p-2.5 text-[12px] font-mono text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
                rows={2}
                placeholder="Enter test input..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expected Output</label>
              <textarea
                value={newExpected}
                onChange={(e) => setNewExpected(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/40 rounded-lg p-2.5 text-[12px] font-mono text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
                rows={2}
                placeholder="Enter expected output..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-bold rounded-lg transition cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        {/* Active Test Case */}
        {currentTC && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-500">Input</label>
                {activeCase >= question.testCases.length && (
                  <button
                    onClick={() => {
                      onRemoveCustomTestCase(activeCase - question.testCases.length);
                      setActiveCase(Math.max(0, activeCase - 1));
                    }}
                    className="flex items-center gap-1 text-[10px] text-rose-400/60 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
              <pre className="bg-[#111827] rounded-lg px-4 py-3 text-[12px] font-mono text-slate-200 whitespace-pre-wrap overflow-auto border border-slate-700/20">
                {currentTC.input}
              </pre>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Expected Output</label>
              <pre className="bg-[#111827] rounded-lg px-4 py-3 text-[12px] font-mono text-emerald-300 whitespace-pre-wrap overflow-auto border border-slate-700/20">
                {currentTC.expectedOutput}
              </pre>
            </div>

            {/* Actual Output (after execution) */}
            {currentResult && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500">Actual Output</label>
                  {currentResult.passed ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                      <XCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                </div>
                <pre className={`rounded-lg px-4 py-3 text-[12px] font-mono whitespace-pre-wrap overflow-auto border ${
                  currentResult.passed
                    ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/5 border-rose-500/15 text-rose-300'
                }`}>
                  {currentResult.actualOutput || '(empty)'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
