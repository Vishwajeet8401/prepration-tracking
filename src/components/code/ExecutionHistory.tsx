import React from 'react';
import { CodeSubmission } from '../../types';
import { CheckCircle, XCircle, AlertTriangle, Clock, Trash2, RotateCcw, History } from 'lucide-react';
import { LANGUAGE_CONFIG } from '../../data/codeQuestions';

interface ExecutionHistoryProps {
  submissions: CodeSubmission[];
  onRestore: (submission: CodeSubmission) => void;
  onDelete: (submissionId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'Accepted':
      return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'Wrong Answer':
      return { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' };
    case 'Compilation Error':
      return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'Runtime Error':
      return { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' };
    case 'Time Limit Exceeded':
      return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    default:
      return { icon: History, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
}

export default function ExecutionHistory({ submissions, onRestore, onDelete }: ExecutionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <History className="w-8 h-8 text-slate-700 mb-3" />
        <p className="text-sm font-semibold text-slate-500">No submissions yet</p>
        <p className="text-xs text-slate-600 mt-1">Submit code to track your progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {submissions.slice(0, 30).map((sub) => {
        const sc = getStatusConfig(sub.status);
        const lang = LANGUAGE_CONFIG[sub.language];
        const StatusIcon = sc.icon;

        return (
          <div
            key={sub.id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/40 transition"
          >
            {/* Status icon */}
            <div className={`w-7 h-7 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
              <StatusIcon className={`w-3.5 h-3.5 ${sc.color}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className={`text-[12px] font-bold ${sc.color}`}>{sub.status}</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>{lang?.icon} {lang?.label || sub.language}</span>
                <span>•</span>
                <span className="font-mono">{sub.executionTime}</span>
                <span>•</span>
                <span>{timeAgo(sub.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onRestore(sub)}
                className="p-1.5 rounded-md text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition cursor-pointer"
                title="Restore code"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(sub.id)}
                className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
