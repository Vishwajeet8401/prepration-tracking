import React from 'react';
import { CodeQuestion } from '../../types';
import { HelpCircle, ArrowRight, Play } from 'lucide-react';

interface TestCaseListProps {
  question: CodeQuestion;
  onLoadIntoCustom: (input: string) => void;
  activeCaseIndex: number;
  setActiveCaseIndex: (index: number) => void;
  testResults: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean }>;
}

export default function TestCaseList({
  question,
  onLoadIntoCustom,
  activeCaseIndex,
  setActiveCaseIndex,
  testResults,
}: TestCaseListProps) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#111827] border-b border-slate-700/30">
        <HelpCircle className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold text-slate-200">Sample Test Cases</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 max-h-[350px]">
        {question.testCases.map((tc, idx) => {
          const result = testResults.find((r) => r.input === tc.input);
          const isSelected = activeCaseIndex === idx;

          // Status indicator
          let statusLabel = '⚪ Waiting';
          let statusColor = 'text-slate-500 bg-slate-500/10 border-slate-500/20';
          if (result) {
            if (result.passed) {
              statusLabel = '🟢 Passed';
              statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            } else {
              statusLabel = '🔴 Failed';
              statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            }
          }

          return (
            <div
              key={idx}
              onClick={() => setActiveCaseIndex(idx)}
              className={`group border rounded-xl p-3.5 transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/30 border-violet-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Case {idx + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadIntoCustom(tc.input);
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 px-2 py-1 bg-violet-500/5 hover:bg-violet-500/10 rounded-md border border-violet-500/10 transition"
                >
                  <span>Load Into Custom</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Input</div>
                  <pre className="bg-[#111827] rounded-lg p-2.5 overflow-x-auto border border-slate-800 max-h-[80px] text-slate-200">
                    {tc.input}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Expected Output</div>
                  <pre className="bg-[#111827] rounded-lg p-2.5 overflow-x-auto border border-slate-800 max-h-[80px] text-emerald-300">
                    {tc.expectedOutput}
                  </pre>
                </div>
              </div>

              {result && !result.passed && (
                <div className="mt-3 border-t border-slate-800/60 pt-3">
                  <div className="text-[10px] font-bold text-rose-400/80 uppercase mb-1">Received Output</div>
                  <pre className="bg-rose-500/5 border border-rose-500/10 text-rose-300 rounded-lg p-2.5 font-mono text-[11px] overflow-x-auto max-h-[80px]">
                    {result.actualOutput || '(no output)'}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
