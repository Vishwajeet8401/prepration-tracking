import React from 'react';
import { Terminal, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { ExecutionResult } from '../../services/compilerApi';

interface ConsoleProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
}

export default function Console({ result, isRunning, onClear }: ConsoleProps) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-slate-700/30">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-slate-200">Terminal Log</span>
        </div>
        {result && (
          <button
            onClick={onClear}
            className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="flex-1 p-4 font-mono text-xs overflow-auto max-h-[300px]">
        {isRunning ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
            <span className="text-slate-500 text-[11px] font-sans">Compiling & Running...</span>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Status overview */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                result.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {result.status === 'success' ? 'Compilation Successful' : 'Execution Failed'}
              </span>

              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Execution Time: <span className="text-slate-300 font-bold">{result.executionTime}</span>
              </span>

              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Cpu className="w-3.5 h-3.5" />
                Memory: <span className="text-slate-300 font-bold">{result.memory || '15 MB'}</span>
              </span>
            </div>

            {/* Error view */}
            {result.status === 'compilation_error' && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-sans">
                  <ShieldAlert className="w-4 h-4" />
                  Compilation Error
                </div>
                <pre className="text-rose-300 whitespace-pre-wrap leading-relaxed text-[11px] bg-black/30 p-2.5 rounded-lg border border-slate-800">
                  {result.compilationOutput || result.stderr}
                </pre>
              </div>
            )}

            {result.stderr && result.status !== 'compilation_error' && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-sans">
                  <ShieldAlert className="w-4 h-4" />
                  Runtime Error
                </div>
                <pre className="text-rose-300 whitespace-pre-wrap leading-relaxed text-[11px] bg-black/30 p-2.5 rounded-lg border border-slate-800">
                  {result.stderr}
                </pre>
              </div>
            )}

            {/* Standard Output */}
            {result.stdout && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Output</div>
                <pre className="bg-[#111827] rounded-xl p-3 border border-slate-800 text-emerald-300 whitespace-pre-wrap max-h-[160px] overflow-auto">
                  {result.stdout}
                </pre>
              </div>
            )}

            {!result.stdout && !result.stderr && !result.compilationOutput && (
              <p className="text-slate-600 italic">No output produced.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-sans">
            <Terminal className="w-6 h-6 text-slate-700 mb-2" />
            <p className="text-[11px]">No compiler logs recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
