import React, { useRef, useEffect } from 'react';
import { ExecutionResult } from '../../services/compilerApi';
import { Terminal, Clock, Trash2, AlertTriangle, CheckCircle, XCircle, Timer } from 'lucide-react';

interface OutputConsoleProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
}

export default function OutputConsole({ result, isRunning, onClear }: OutputConsoleProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [result]);

  const getStatusConfig = () => {
    if (!result) return null;
    switch (result.status) {
      case 'success':
        return { icon: CheckCircle, label: 'Executed Successfully', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'compilation_error':
        return { icon: AlertTriangle, label: 'Compilation Error', color: 'text-rose-400', bg: 'bg-rose-500/10' };
      case 'error':
        return { icon: XCircle, label: 'Runtime Error', color: 'text-rose-400', bg: 'bg-rose-500/10' };
      case 'timeout':
        return { icon: Timer, label: 'Time Limit Exceeded', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div ref={outputRef} className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed">
      {/* Status Bar */}
      {statusConfig && (
        <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${statusConfig.bg}`}>
          <div className={`flex items-center gap-2 ${statusConfig.color}`}>
            <statusConfig.icon className="w-4 h-4" />
            <span className="font-bold text-[12px]">{statusConfig.label}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {result && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Runtime: <span className="text-slate-300 font-semibold">{result.executionTime}</span>
                </span>
                <span>
                  Memory: <span className="text-slate-300 font-semibold">{result.memory}</span>
                </span>
              </>
            )}
            <button
              onClick={onClear}
              className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-300 transition cursor-pointer"
              title="Clear"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isRunning ? (
        <div className="flex items-center gap-3 py-6 justify-center">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
          <span className="text-slate-500 text-[11px]">Executing code...</span>
        </div>
      ) : result ? (
        <div className="space-y-2">
          {result.status === 'compilation_error' && result.compilationOutput && (
            <pre className="text-rose-400 whitespace-pre-wrap">{result.compilationOutput}</pre>
          )}
          {result.stderr && (
            <pre className="text-rose-400 whitespace-pre-wrap">{result.stderr}</pre>
          )}
          {result.stdout && (
            <pre className="text-emerald-300 whitespace-pre-wrap">{result.stdout}</pre>
          )}
          {!result.stdout && !result.stderr && !result.compilationOutput && (
            <p className="text-slate-600 italic">No output produced.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          <p className="text-[11px] text-slate-600">
            Click <span className="text-violet-400 font-semibold">Run</span> to see output
          </p>
        </div>
      )}
    </div>
  );
}
