import React, { useState } from 'react';
import { ShieldAlert, Sparkles, BookOpen, Navigation, ArrowRight } from 'lucide-react';

interface AIDebugPanelProps {
  compileError?: string;
  onNavigateToLine?: (line: number) => void;
}

export default function AIDebugPanel({ compileError, onNavigateToLine }: AIDebugPanelProps) {
  const [explainMore, setExplainMore] = useState(false);

  // Simple heuristic parser for compiler errors:
  // e.g. "Line 12: ';' expected"
  const errorDetails = React.useMemo(() => {
    if (!compileError) return null;
    
    // Check if error contains line numbers
    const lineMatch = compileError.match(/(?:line\s+|Line\s+|:\s*)(\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : 12;

    let explanation = "The compiler detected a syntactic structure mismatch.";
    let currentSnippet = "return ans";
    let correctSnippet = "return ans;";

    if (compileError.includes('expected') || compileError.includes(';')) {
      explanation = "A statement syntax is missing a terminating semicolon ';'.";
    } else if (compileError.includes('cannot find symbol') || compileError.includes('cannot resolve')) {
      explanation = "A variable or method was used without being declared in scope.";
      currentSnippet = "x = 5;";
      correctSnippet = "int x = 5;";
    } else if (compileError.includes('incompatible types')) {
      explanation = "An assigned value does not match the variable's declared type.";
      currentSnippet = "int val = \"hello\";";
      correctSnippet = "String val = \"hello\";";
    }

    return {
      line,
      explanation,
      currentSnippet,
      correctSnippet
    };
  }, [compileError]);

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex-1 overflow-auto p-4 space-y-4 max-h-[220px]">
        {compileError && errorDetails ? (
          <div className="space-y-3.5">
            {/* Error Nav Card */}
            <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/15 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-rose-400 font-bold block">Compiler Error</span>
                  <span className="text-[10px] text-slate-500 font-mono">Line {errorDetails.line}</span>
                </div>
              </div>

              {onNavigateToLine && (
                <button
                  onClick={() => onNavigateToLine(errorDetails.line)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold rounded border border-rose-500/20 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Jump to Line</span>
                </button>
              )}
            </div>

            {/* AI Advisor Panel */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-200 text-xs font-bold font-sans">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  AI Coach Insight
                </div>
                <button
                  onClick={() => setExplainMore(!explainMore)}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-bold transition cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  {explainMore ? 'Show Less' : 'Explain More'}
                </button>
              </div>

              <div className="text-[11.5px] leading-relaxed text-slate-400">
                {errorDetails.explanation}
              </div>

              {/* Snippet Comparison code */}
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 font-sans block mb-1">Current Code</span>
                  <pre className="bg-rose-500/5 text-rose-300 border border-rose-500/10 rounded p-2 overflow-auto whitespace-pre-wrap">{errorDetails.currentSnippet}</pre>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block mb-1">Suggested Fix</span>
                  <pre className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 rounded p-2 overflow-auto whitespace-pre-wrap">{errorDetails.correctSnippet}</pre>
                </div>
              </div>

              {explainMore && (
                <div className="bg-violet-600/5 border border-violet-500/10 rounded-lg p-3 text-[11px] text-slate-400 leading-normal space-y-1">
                  <span className="font-bold text-violet-300 block mb-0.5">Under the hood:</span>
                  <p>Compilers scan tokens linearly. If a closing token or semi-colon is missed, parsing state breaks, and subsequent lines can throw phantom compile issues. Fixing the exact line reported first usually resolves these.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-sans">
            <Sparkles className="w-6 h-6 text-slate-700 mb-1.5" />
            <p>No compiler issues detected. Solution compiles cleanly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
