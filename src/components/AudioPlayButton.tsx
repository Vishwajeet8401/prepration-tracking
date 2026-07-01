import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speechService } from '../utils/speechService';

interface AudioPlayButtonProps {
  text: string;
  className?: string;
  tooltip?: string;
}

export default function AudioPlayButton({ text, className = '', tooltip = 'Speak answer aloud' }: AudioPlayButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleSpeechStateChange = (speaking: boolean, speakingText: string) => {
      setIsSpeaking(speaking && speakingText === text);
    };

    // Sync initial state
    setIsSpeaking(speechService.getIsSpeaking() && speechService.getSpeakingText() === text);

    speechService.addListener(handleSpeechStateChange);
    return () => {
      speechService.removeListener(handleSpeechStateChange);
      if (speechService.getIsSpeaking() && speechService.getSpeakingText() === text) {
        speechService.stop();
      }
    };

  }, [text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    speechService.speak(text);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-lg transition duration-200 cursor-pointer flex items-center justify-center ${
        isSpeaking
          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:bg-white/10 shadow-xs'
      } ${className}`}
      title={isSpeaking ? 'Stop speaking' : tooltip}
      type="button"
    >
      {isSpeaking ? (
        <span className="flex items-end gap-[2px] h-[13px] px-[2px] pb-[1px]">
          {/* Custom audio equalizer wave animation from index.css */}
          <span className="w-[3px] h-[8px] bg-indigo-400 rounded-full animate-audio-wave-1" />
          <span className="w-[3px] h-[12px] bg-indigo-400 rounded-full animate-audio-wave-2" />
          <span className="w-[3px] h-[6px] bg-indigo-400 rounded-full animate-audio-wave-3" />
        </span>
      ) : (
        <Volume2 className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  );
}
