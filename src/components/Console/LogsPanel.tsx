import React from 'react';
import { Layers, Info, CheckCircle, Wifi, Play, Server } from 'lucide-react';

interface LogsPanelProps {
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' }>;
  apiTiming?: string;
  isOnline: boolean;
}

export default function LogsPanel({ logs, apiTiming = '45 ms', isOnline }: LogsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 border-b border-slate-800 bg-[#111827] text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          API Ping: <span className="text-slate-300 font-bold">{apiTiming}</span>
        </span>
        <span className="flex items-center gap-1">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          Network Status: <span className="text-slate-300 font-bold">{isOnline ? 'Online' : 'Offline'}</span>
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2 max-h-[220px] font-mono text-[11px] leading-relaxed">
        {logs.map((log, idx) => {
          let color = 'text-slate-500';
          let Icon = Info;
          if (log.type === 'success') {
            color = 'text-emerald-400';
            Icon = CheckCircle;
          } else if (log.type === 'error') {
            color = 'text-rose-400';
            Icon = Info;
          }

          return (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-[10px] text-slate-600 tracking-wider font-mono shrink-0 select-none">
                {log.timestamp}
              </span>
              <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600" />
              <span className={color}>{log.message}</span>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-sans">
            <Layers className="w-5 h-5 text-slate-700 mb-1.5" />
            <p>No lifecycle logs captured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
