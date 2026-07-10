import React from 'react';
import { Wifi, Info, Clock, Cpu } from 'lucide-react';

interface StatusBarProps {
  status: 'idle' | 'running' | 'success' | 'error' | 'timeout';
  language: string;
  runtime?: string;
  memory?: string;
  isOnline: boolean;
}

export default function StatusBar({
  status,
  language,
  runtime = '--',
  memory = '--',
  isOnline,
}: StatusBarProps) {
  // Translate status state labels
  const statusLabels = {
    idle: { text: 'Ready', color: 'text-slate-400' },
    running: { text: 'Executing...', color: 'text-yellow-400' },
    success: { text: '✓ Execution Completed', color: 'text-emerald-400' },
    error: { text: 'Runtime Error', color: 'text-rose-400' },
    timeout: { text: 'Time Limit Exceeded', color: 'text-rose-400' },
  }[status] || { text: 'Ready', color: 'text-slate-400' };

  return (
    <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-[#111827] px-4 py-1 text-[10px] text-slate-500 font-sans tracking-wide select-none shrink-0">
      <div className="flex items-center gap-4.5">
        <span className={`font-bold ${statusLabels.color}`}>
          {statusLabels.text}
        </span>
        <span>|</span>
        <span className="font-semibold text-slate-400">
          {language.toUpperCase()}
        </span>
        <span>|</span>
        <span>UTF-8</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Runtime: <span className="text-slate-400 font-semibold">{runtime}</span>
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          Memory: <span className="text-slate-400 font-semibold">{memory}</span>
        </span>
        <span className="flex items-center gap-1 border-l border-slate-800 pl-4">
          Server: <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
            Connected <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
        </span>
      </div>
    </div>
  );
}
