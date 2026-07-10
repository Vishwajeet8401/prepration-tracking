import React, { useState } from 'react';
import { CodeQuestion } from '../../types';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';

interface TestCasePanelProps {
  question: CodeQuestion;
  testResults: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean }>;
  isRunning: boolean;
  onSelectInput: (input: string) => void;
}

export default function TestCasePanel({
  question,
  testResults,
  isRunning,
  onSelectInput,
}: TestCasePanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex-1 overflow-auto p-4 space-y-3.5 max-h-[220px]">
        {isRunning && (
          <div className="flex items-center gap-2 py-4 justify-center text-slate-500 font-sans text-xs">
            <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
            <span>Evaluating test cases...</span>
          </div>
        )}

        {testResults.length > 0 ? (
          <div className="space-y-2">
            {testResults.map((res, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/10">
                  <button
                    onClick={() => handleToggle(idx)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-850/20 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                      )}
                      <span className="text-xs font-semibold">Test Case {idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {res.passed ? 'Passed' : 'Failed'}
                      </span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 font-mono text-[11px] space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans font-semibold">Input:</span>
                          <button
                            onClick={() => onSelectInput(res.input)}
                            className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-bold font-sans cursor-pointer"
                          >
                            <span>Load this case</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="text-slate-300 bg-[#111827] rounded p-2 mt-0.5 whitespace-pre-wrap">{res.input}</pre>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-500 font-sans font-semibold">Expected:</span>
                          <pre className="text-emerald-300 bg-[#111827] rounded p-2 mt-0.5 whitespace-pre-wrap">{res.expectedOutput}</pre>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans font-semibold">Received:</span>
                          <pre className={`rounded p-2 mt-0.5 whitespace-pre-wrap ${res.passed ? 'text-emerald-300 bg-[#111827]' : 'text-rose-300 bg-rose-500/5 border border-rose-500/10'}`}>
                            {res.actualOutput || '(no output)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-sans">
            <HelpCircle className="w-6 h-6 text-slate-700 mb-1.5" />
            <p>Ready to run test cases. Press Run or Submit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
