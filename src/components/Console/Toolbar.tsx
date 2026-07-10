import React from 'react';
import { Trash2, Copy, Download, Maximize2, Minimize2, Split, ArrowUpRight } from 'lucide-react';

interface ToolbarProps {
  isSplitView: boolean;
  setIsSplitView: (val: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  showToggleOption?: boolean;
}

export default function Toolbar({
  isSplitView,
  setIsSplitView,
  isFullscreen,
  setIsFullscreen,
  onClear,
  onCopy,
  onDownload,
  showToggleOption = true,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-[#161f30]/30 border-b border-slate-800 shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Diagnostics Console</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Split View toggle */}
        {showToggleOption && (
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`p-1.5 rounded transition cursor-pointer border ${
              isSplitView 
                ? 'bg-violet-600/10 border-violet-500/20 text-violet-400' 
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
            title="Split Console View (Side-by-side output & AI)"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onClear}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
          title="Clear logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onCopy}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
          title="Copy output"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDownload}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
          title="Download execution logs"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer ml-1"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
