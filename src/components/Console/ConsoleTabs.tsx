import React from 'react';
import { Terminal, FlaskConical, HelpCircle, Layers, ShieldAlert, History } from 'lucide-react';

export type ConsoleTabId = 'output' | 'testcases' | 'logs' | 'aidebug' | 'history';

interface ConsoleTabsProps {
  activeTab: ConsoleTabId;
  setActiveTab: (tab: ConsoleTabId) => void;
  passedCount: number;
  totalCount: number;
  hasCompileError: boolean;
}

export default function ConsoleTabs({
  activeTab,
  setActiveTab,
  passedCount,
  totalCount,
  hasCompileError,
}: ConsoleTabsProps) {
  const tabs = [
    { id: 'output' as ConsoleTabId, label: 'Output', icon: Terminal },
    { id: 'testcases' as ConsoleTabId, label: 'Test Cases', icon: FlaskConical },
    { id: 'logs' as ConsoleTabId, label: 'Logs', icon: Layers },
    { id: 'aidebug' as ConsoleTabId, label: 'AI Debug', icon: ShieldAlert },
    { id: 'history' as ConsoleTabId, label: 'History', icon: History },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-slate-800 bg-[#111827] px-3 py-1 shrink-0 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        // Dynamic badges
        let badge = null;
        if (tab.id === 'testcases' && totalCount > 0) {
          badge = (
            <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
              passedCount === totalCount
                ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/25 text-rose-400 border-rose-500/20'
            }`}>
              {passedCount}/{totalCount}
            </span>
          );
        } else if (tab.id === 'aidebug' && hasCompileError) {
          badge = (
            <span className="ml-1.5 flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none border ${
              isActive
                ? 'bg-[#1e1e1e] text-violet-400 border-slate-700/50'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}
