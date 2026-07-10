import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import { ExecutionResult } from '../../services/compilerApi';

interface OutputPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  isSplitView: boolean;
}

export default function OutputPanel({ result, isRunning, isSplitView }: OutputPanelProps) {
  const content = (
    <div className="flex-1 min-h-[140px] max-h-[220px] overflow-auto font-mono text-xs text-slate-100 bg-[#1e1e1e] p-3 rounded-lg border border-slate-800">
      {isRunning ? (
        <div className="flex items-center gap-2 py-6 text-slate-500 justify-center">
          <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
          <span>Executing program streams...</span>
        </div>
      ) : result ? (
        <div className="space-y-2">
          {result.stdout && (
            <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed">{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className="whitespace-pre-wrap text-rose-400">{result.stderr}</pre>
          )}
          {result.status === 'compilation_error' && result.compilationOutput && (
            <pre className="whitespace-pre-wrap text-rose-400">{result.compilationOutput}</pre>
          )}
          {!result.stdout && !result.stderr && !result.compilationOutput && (
            <div className="text-slate-600 italic">Program execution yielded no stream outputs.</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-600 font-sans">
          <Terminal className="w-5 h-5 mb-1.5" />
          <div>Ready to run your solution. Press Run or Submit.</div>
        </div>
      )}
    </div>
  );

  const aiFeedback = (
    <div className="flex-1 min-h-[140px] max-h-[220px] overflow-auto font-sans text-xs bg-violet-600/5 text-slate-300 p-3.5 rounded-lg border border-violet-500/15 space-y-2.5">
      <div className="flex items-center gap-1.5 font-bold text-violet-300">
        <Sparkles className="w-4 h-4 text-violet-400" />
        AI Optimization Feedback
      </div>
      {result ? (
        <div className="space-y-2 leading-relaxed">
          <p>Time Complexity: <code className="bg-slate-850 px-1 py-0.5 rounded text-violet-300 font-mono">O(N)</code></p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>Logic executes in linear time.</li>
            <li>HashMap handles duplicates efficiently.</li>
            <li>Variable naming matches common clean practices.</li>
          </ul>
        </div>
      ) : (
        <p className="text-slate-650 italic">Execute code to trigger logic evaluation advice.</p>
      )}
    </div>
  );

  if (isSplitView) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-[#0f172a]">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Standard Output</div>
          {content}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">AI Review Analysis</div>
          {aiFeedback}
        </div>
      </div>
    );
  }

  return <div className="p-3 bg-[#0f172a]">{content}</div>;
}
