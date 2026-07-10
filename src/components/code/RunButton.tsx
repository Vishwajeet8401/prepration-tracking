import React from 'react';
import { Play, Send, Loader } from 'lucide-react';
import { motion } from 'motion/react';

interface RunButtonProps {
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
}

export default function RunButton({ onRun, onSubmit, isRunning, isSubmitting }: RunButtonProps) {
  const isDisabled = isRunning || isSubmitting;

  return (
    <div className="flex items-center gap-2">
      {/* Run Code Button */}
      <motion.button
        whileHover={!isDisabled ? { scale: 1.03, y: -1 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        onClick={onRun}
        disabled={isDisabled}
        id="code-run-btn"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          isDisabled
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 hover:shadow-emerald-500/35'
        }`}
      >
        {isRunning ? (
          <Loader className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
        <span>{isRunning ? 'Running...' : 'Run Code'}</span>
        {!isDisabled && (
          <span className="text-emerald-200/70 text-[10px] font-mono ml-1 hidden sm:inline">Ctrl+Enter</span>
        )}
      </motion.button>

      {/* Submit Button */}
      <motion.button
        whileHover={!isDisabled ? { scale: 1.03, y: -1 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        onClick={onSubmit}
        disabled={isDisabled}
        id="code-submit-btn"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          isDisabled
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 hover:shadow-indigo-500/35'
        }`}
      >
        {isSubmitting ? (
          <Loader className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
      </motion.button>
    </div>
  );
}
