import React, { useState } from 'react';
import { CodeQuestion } from '../../types';
import { Tag, AlertCircle, Lightbulb, Lock, ChevronDown, ChevronRight } from 'lucide-react';

interface QuestionPanelProps {
  question: CodeQuestion;
}

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const config: Record<string, string> = {
    Easy: 'bg-emerald-500/15 text-emerald-400',
    Medium: 'bg-amber-500/15 text-amber-400',
    Hard: 'bg-rose-500/15 text-rose-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${config[difficulty] || 'text-slate-400'}`}>
      {difficulty}
    </span>
  );
};

export default function QuestionPanel({ question }: QuestionPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* ── Title + Difficulty ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 leading-tight mb-2">{question.title}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-[11px] text-slate-500">
            Acceptance: <span className="text-slate-300 font-semibold">54%</span>
          </span>
        </div>
      </div>

      {/* ── Tags ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {question.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-[10px] font-medium text-violet-300 bg-violet-500/10 rounded-md px-2 py-0.5"
          >
            <Tag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div className="text-[13px] text-slate-300 leading-relaxed">
        {question.description.split('\n').map((paragraph, pIdx) => (
          <p key={pIdx} className="mb-2.5">
            {paragraph.split('`').map((part, i) =>
              i % 2 === 1 ? (
                <code key={i} className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[12px] font-mono">
                  {part}
                </code>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        ))}
      </div>

      {/* ── Examples ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {question.examples.map((example, idx) => (
          <div key={idx}>
            <h4 className="text-xs font-bold text-slate-400 mb-2">Example {idx + 1}</h4>
            <div className="bg-[#111827] rounded-lg border-l-[3px] border-violet-500/40 pl-4 pr-4 py-3 space-y-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500">Input: </span>
                <pre className="text-[12px] font-mono text-slate-200 whitespace-pre-wrap mt-0.5">{example.input}</pre>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500">Output: </span>
                <pre className="text-[12px] font-mono text-emerald-300 whitespace-pre-wrap mt-0.5">{example.output}</pre>
              </div>
              {example.explanation && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500">Explanation: </span>
                  <p className="text-[12px] text-slate-400 mt-0.5 leading-relaxed">{example.explanation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Constraints ─────────────────────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 mb-2">Constraints</h4>
        <ul className="space-y-1.5">
          {question.constraints.map((c, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[12px] text-slate-400 font-mono">
              <span className="text-violet-400 mt-0.5 shrink-0">•</span>
              <code className="bg-slate-800/60 px-1 py-0.5 rounded">{c}</code>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Hints (Locked) ──────────────────────────────────────────────── */}
      <button
        onClick={() => setHintsOpen(!hintsOpen)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-[#111827] rounded-lg border border-slate-700/30 text-xs font-semibold text-slate-400 hover:text-slate-300 hover:border-slate-600/40 transition cursor-pointer"
      >
        {hintsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Lock className="w-3.5 h-3.5 text-amber-500/60" />
        <span>Hints</span>
      </button>
      {hintsOpen && (
        <div className="bg-[#111827] rounded-lg border border-slate-700/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400/60" />
            <span>Try using a hash map to store complements for O(n) time complexity.</span>
          </div>
        </div>
      )}
    </div>
  );
}
