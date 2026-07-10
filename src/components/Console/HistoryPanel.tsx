import React from 'react';
import { CodeSubmission } from '../../types';
import { History, CheckCircle, XCircle, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { LANGUAGE_CONFIG } from '../../data/codeQuestions';

interface HistoryPanelProps {
  submissions: CodeSubmission[];
  onRestore: (sub: CodeSubmission) => void;
  onRestoreOutput: (output: string) => void;
}

export default function HistoryPanel({
  submissions,
  onRestore,
  onRestoreOutput,
}: HistoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-3 text-slate-300">
      <div className="overflow-y-auto max-h-[220px] space-y-1.5">
        {submissions.map((sub) => {
          const lang = LANGUAGE_CONFIG[sub.language];
          const isAC = sub.status === 'Accepted';

          return (
            <div
              key={sub.id}
              className="flex items-center justify-between px-3 py-2 bg-[#111827]/50 border border-slate-800 hover:border-slate-700/40 rounded-lg transition"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-xs font-bold ${isAC ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isAC ? '🟢 Accepted' : '🔴 Wrong Answer'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono">
                  {lang?.icon} {lang?.label || sub.language}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {sub.executionTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRestoreOutput(sub.output)}
                  className="text-[10px] font-bold text-violet-400 hover:text-violet-300 px-2 py-0.5 bg-violet-500/5 hover:bg-violet-500/10 rounded border border-violet-500/10 cursor-pointer"
                >
                  View Output
                </button>
                <button
                  onClick={() => onRestore(sub)}
                  className="p-1 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded transition cursor-pointer"
                  title="Restore Code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
            <History className="w-6 h-6 text-slate-700 mb-1.5 animate-pulse" />
            <p className="text-[11px]">No submission records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
