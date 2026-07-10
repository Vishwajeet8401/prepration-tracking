import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Sparkles, Code, Play, Send, Layout, Layers, X } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (commandId: string) => void;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onExecuteCommand,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo(() => [
    { id: 'run', label: 'Run Code', category: 'Execution', icon: Play },
    { id: 'submit', label: 'Submit Solution', category: 'Execution', icon: Send },
    { id: 'save', label: 'Save Draft', category: 'File', icon: Code },
    { id: 'hint', label: 'Open AI Coach Hints', category: 'AI Coach', icon: Sparkles },
    { id: 'explain', label: 'Explain Solution', category: 'AI Coach', icon: Sparkles },
    { id: 'optimize', label: 'Optimize Code Structure', category: 'AI Coach', icon: Sparkles },
    { id: 'shortcuts', label: 'Show Keyboard Shortcuts Guide', category: 'Preferences', icon: Layout },
    { id: 'theme', label: 'Switch Theme', category: 'Preferences', icon: Layers },
  ], []);

  const filtered = useMemo(() => {
    return commands.filter((c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = filtered[activeIndex];
      if (active) {
        onExecuteCommand(active.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 select-none font-sans">
        <div className="relative w-full max-w-lg bg-[#111827] border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]" onKeyDown={handleKeyDown}>
          {/* Search Input */}
          <div className="relative flex items-center border-b border-slate-800 bg-[#161f30]/40 shrink-0">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command to search... (e.g. run, hint, theme)"
              className="w-full bg-transparent pl-12 pr-10 py-4 text-sm text-white focus:outline-none placeholder-slate-600"
            />
            <button onClick={onClose} className="absolute right-4 text-slate-500 hover:text-white transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-auto p-2">
            {filtered.map((cmd, idx) => {
              const CmdIcon = cmd.icon;
              const isActive = activeIndex === idx;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    onExecuteCommand(cmd.id);
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                    isActive ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CmdIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{cmd.label}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                    isActive ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {cmd.category}
                  </span>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-8 text-center text-slate-500 italic text-xs">
                No commands matching your query.
              </div>
            )}
          </div>

          {/* Help Info Footer */}
          <div className="border-t border-slate-800 bg-[#161f30]/20 px-4 py-2 flex items-center justify-between text-[9px] text-slate-550">
            <div className="flex items-center gap-2">
              <span>↑↓ Navigation</span>
              <span>•</span>
              <span>Enter to Execute</span>
            </div>
            <span>Esc to Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
