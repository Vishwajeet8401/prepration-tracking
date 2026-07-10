import React from 'react';
import { X, Keyboard, Play, FileCode, Layers, ShieldAlert } from 'lucide-react';

interface ShortcutCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutCheatSheetModal({ isOpen, onClose }: ShortcutCheatSheetModalProps) {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Execution Controls',
      icon: Play,
      shortcuts: [
        { keys: ['Ctrl', 'Enter'], action: 'Run code' },
        { keys: ['Ctrl', 'Shift', 'Enter'], action: 'Submit solution' },
        { keys: ['F5'], action: 'Run current test case' },
      ],
    },
    {
      title: 'Editor & File Actions',
      icon: FileCode,
      shortcuts: [
        { keys: ['Ctrl', 'S'], action: 'Save draft code' },
        { keys: ['Ctrl', '/'], action: 'Toggle comments' },
        { keys: ['Ctrl', 'Space'], action: 'Trigger autocomplete' },
        { keys: ['Ctrl', 'G'], action: 'Go to line' },
      ],
    },
    {
      title: 'Workspace Navigation',
      icon: Layers,
      shortcuts: [
        { keys: ['Alt', '1'], action: 'Select Problem Description' },
        { keys: ['Alt', '2'], action: 'Focus Monaco Editor' },
        { keys: ['Alt', '3'], action: 'Select Console panel' },
        { keys: ['Alt', '4'], action: 'Select Output logs' },
        { keys: ['Alt', '5'], action: 'Open AI progressive coach' },
      ],
    },
    {
      title: 'AI Coach Commands',
      icon: ShieldAlert,
      shortcuts: [
        { keys: ['Ctrl', 'I'], action: 'Progressive Hints' },
        { keys: ['Ctrl', 'Shift', 'I'], action: 'Explain active code' },
        { keys: ['Ctrl', 'B'], action: 'Debug compiler messages' },
        { keys: ['Ctrl', 'K'], action: 'Optimize logic patterns' },
      ],
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none font-sans">
        <div className="relative w-full max-w-lg bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#1b2330] border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">Keyboard Shortcut Guide</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-5 space-y-5">
            {sections.map((sect, sIdx) => {
              const SectionIcon = sect.icon;
              return (
                <div key={sIdx} className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-1">
                    <SectionIcon className="w-3.5 h-3.5 text-slate-650" />
                    <span>{sect.title}</span>
                  </div>

                  <div className="space-y-1.5">
                    {sect.shortcuts.map((sc, scIdx) => (
                      <div key={scIdx} className="flex items-center justify-between py-1 hover:bg-slate-800/10 rounded px-1 transition text-xs">
                        <span className="text-slate-400 font-semibold">{sc.action}</span>
                        <div className="flex items-center gap-1">
                          {sc.keys.map((key, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 bg-[#1e1f29] border border-slate-750 text-slate-300 rounded text-[10px] font-mono shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-[#161f30]/30 border-t border-slate-700/30 px-5 py-3 text-[10px] text-slate-500 font-medium">
            Press <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono text-[9px]">F1</kbd> or click the keyboard icon to show this guide anytime.
          </div>
        </div>
      </div>
    </>
  );
}
