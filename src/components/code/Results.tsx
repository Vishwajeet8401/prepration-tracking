import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, HelpCircle, EyeOff } from 'lucide-react';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface ResultsProps {
  testResults: TestResult[];
  isRunning: boolean;
  publicCasesCount: number;
}

export default function Results({ testResults, isRunning, publicCasesCount }: ResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const publicResults = testResults.slice(0, publicCasesCount);
  const hiddenResults = testResults.slice(publicCasesCount);

  const publicPassed = publicResults.filter((r) => r.passed).length;
  const hiddenPassed = hiddenResults.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#111827] border-b border-slate-700/30">
        <CheckCircle2 className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold text-slate-200">Execution Results</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 max-h-[350px]">
        {isRunning && (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
            <span className="text-slate-500 text-[11px]">Evaluating test suites...</span>
          </div>
        )}

        {testResults.length > 0 ? (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-[#1b2330] rounded-xl border border-slate-800 p-3 flex flex-wrap gap-6 text-xs justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Public Test Cases:</span>
                <span className={`font-bold ${publicPassed === publicResults.length ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {publicPassed} / {publicResults.length} Passed
                </span>
              </div>
              {hiddenResults.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Hidden Test Cases:</span>
                  <span className={`font-bold ${hiddenPassed === hiddenResults.length ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hiddenPassed} / {hiddenResults.length} Passed
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                <span className="text-slate-400 font-bold">Overall Score:</span>
                <span className={`font-black ${testResults.every((r) => r.passed) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testResults.filter((r) => r.passed).length} / {testResults.length} Passed
                </span>
              </div>
            </div>

            {/* Public Cases List */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <HelpCircle className="w-3.5 h-3.5" />
                Public Cases
              </div>
              {publicResults.map((res, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/10">
                    <button
                      onClick={() => toggleExpand(idx)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/20 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="text-xs font-semibold">Test Case {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${res.passed ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {res.passed ? 'Passed' : 'Failed'}
                        </span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 text-[11px] font-mono space-y-2">
                        <div>
                          <span className="text-slate-500 font-sans font-semibold">Input:</span>
                          <pre className="text-slate-300 bg-slate-900/30 rounded p-2 mt-0.5 whitespace-pre-wrap">{res.input}</pre>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500 font-sans font-semibold">Expected:</span>
                            <pre className="text-emerald-300 bg-[#111827] rounded p-2 mt-0.5 whitespace-pre-wrap">{res.expectedOutput}</pre>
                          </div>
                          <div>
                            <span className="text-slate-500 font-sans font-semibold">Received:</span>
                            <pre className={`rounded p-2 mt-0.5 whitespace-pre-wrap ${res.passed ? 'text-emerald-300 bg-[#111827]' : 'text-rose-300 bg-rose-500/5 border border-rose-500/10'}`}>
                              {res.actualOutput || '(no output)'}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hidden Cases List */}
            {hiddenResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
                  <EyeOff className="w-3.5 h-3.5" />
                  Hidden Cases
                </div>
                {hiddenResults.map((res, idx) => {
                  const globalIdx = idx + publicCasesCount;
                  const isExpanded = expandedIndex === globalIdx;
                  return (
                    <div key={globalIdx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/10">
                      <button
                        onClick={() => toggleExpand(globalIdx)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/20 transition text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {res.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className="text-xs font-semibold">Hidden Test Case {idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${res.passed ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                            {res.passed ? 'Passed' : 'Failed'}
                          </span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 text-[11px] font-mono space-y-2">
                          {res.passed ? (
                            <div className="text-slate-500 font-sans italic">Test case details are hidden for evaluation integrity.</div>
                          ) : (
                            /* Even for hidden cases, we show received info so they can debug target values */
                            <div className="space-y-2">
                              <div>
                                <span className="text-slate-500 font-sans font-semibold">Expected:</span>
                                <pre className="text-emerald-300 bg-[#111827] rounded p-2 mt-0.5 whitespace-pre-wrap">{res.expectedOutput}</pre>
                              </div>
                              <div>
                                <span className="text-slate-500 font-sans font-semibold">Received:</span>
                                <pre className="text-rose-300 bg-rose-500/5 border border-rose-500/10 rounded p-2 mt-0.5 whitespace-pre-wrap">{res.actualOutput || '(no output)'}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-slate-700 mb-2" />
            <p className="text-[11px]">Click <span className="text-violet-400 font-bold">Submit</span> to evaluate all test cases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
