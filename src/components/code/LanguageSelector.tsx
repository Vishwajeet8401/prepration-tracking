import React from 'react';
import { CodeLanguage } from '../../types';
import { LANGUAGE_CONFIG } from '../../data/codeQuestions';
import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  selected: CodeLanguage;
  onChange: (lang: CodeLanguage) => void;
}

export default function LanguageSelector({ selected, onChange }: LanguageSelectorProps) {
  return (
    <div className="relative">
      <select
        id="language-selector"
        value={selected}
        onChange={(e) => onChange(e.target.value as CodeLanguage)}
        className="appearance-none cursor-pointer bg-slate-800/80 border border-slate-700/50 text-slate-200 text-[12px] font-semibold rounded-md px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition hover:bg-slate-700/80 hover:border-slate-600/60"
      >
        {Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.icon} {cfg.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
    </div>
  );
}
