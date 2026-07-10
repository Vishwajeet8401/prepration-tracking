import React from 'react';
import { Play, Send, RefreshCw, AlignLeft, CheckCircle2, Terminal, Layers, History, HelpCircle } from 'lucide-react';

export type BottomTabType = 'testcases' | 'custominput' | 'console' | 'results' | 'history';

interface TestCaseTabsProps {
  activeTab: BottomTabType;
  setActiveTab: (tab: BottomTabType) => void;
  testResultsCount: number;
  testPassedCount: number;
  hasErrors: boolean;
}

export default function TestCaseTabs({
  activeTab,
  setActiveTab,
  testResultsCount,
  testPassedCount,
  hasErrors,
}: TestCaseTabsProps) {
  const tabs = [
    { id: 'testcases' as BottomTabType, label: 'Test Cases', icon: HelpCircle },
    { id: 'custominput' as BottomTabType, label: 'Custom Input', icon: AlignLeft },
    { id: 'console' as BottomTabType, label: 'Console', icon: Terminal },
    { id: 'results' as BottomTabType, label: 'Results', icon: CheckCircle2 },
    { id: 'history' as BottomTabType, label: 'History', icon: History },
  ];

  return (
    <div className="flex items-center justify-between border-b border-slate-700/50 bg-[#111827] px-4 py-1.5 shrink-0">
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          // Status Badge indicators
          let badge = null;
          if (t.id === 'results' && testResultsCount > 0) {
            const isAllPassed = testPassedCount === testResultsCount;
            badge = (
              <span className={`ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none ${
                isAllPassed 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {testPassedCount}/{testResultsCount}
              </span>
            );
          } else if (t.id === 'console' && hasErrors) {
            badge = (
              <span className="ml-1.5 flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            );
          }

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                isActive
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
              {badge}
            </button>
          );
        })}
      </div>
    </div>
  );
}
