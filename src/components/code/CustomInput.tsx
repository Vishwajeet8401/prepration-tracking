import React from 'react';
import { AlignLeft, Play, Info } from 'lucide-react';

interface CustomInputProps {
  input: string;
  setInput: (val: string) => void;
  onRunCustom: () => void;
  isRunning: boolean;
  questionId: string;
}

export default function CustomInput({
  input,
  setInput,
  onRunCustom,
  isRunning,
  questionId,
}: CustomInputProps) {
  // Let's offer some parameters guides to look extra polished
  const guides: Record<string, string> = {
    'two-sum': 'nums = [2,7,11,15]\ntarget = 9\n\n(Format as lines: \n4\n2 7 11 15\n9)',
    'reverse-string': 's = ["h","e","l","l","o"]\n\n(Format: \nh e l l o)',
    'palindrome-number': 'x = 121\n\n(Format: \n121)',
  };

  const guideText = guides[questionId] || 'Provide inputs matching the problem statement.';

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-slate-700/30">
        <div className="flex items-center gap-1.5">
          <AlignLeft className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-slate-200">Custom Input</span>
        </div>
        <button
          onClick={onRunCustom}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[11px] font-bold rounded-lg border border-violet-500/25 transition cursor-pointer"
        >
          <Play className="w-3 h-3" />
          <span>Run Custom Test</span>
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3 min-h-[150px]">
        <div className="flex items-start gap-2 bg-[#1b2330] rounded-lg p-2.5 border border-slate-800">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-400 leading-normal">
            <span className="font-bold text-slate-200 block mb-0.5">Parameters Guide:</span>
            <span className="font-mono whitespace-pre-line">{guideText}</span>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 w-full bg-[#111827] border border-slate-800 hover:border-slate-700/60 focus:border-violet-500/50 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none resize-none placeholder-slate-700 leading-relaxed"
          placeholder="Enter custom inputs here..."
          rows={5}
        />
      </div>
    </div>
  );
}
