import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDatabase } from '../context/DatabaseContext';
import { playSuccessChime } from '../utils/audio';
import { Play, Pause, CheckCircle, Square, Clock, GlassWater, Flame, Compass } from 'lucide-react';

export default function FloatingTimer() {
  const { activeTaskTimer, setActiveTaskTimer, handleUpdateTaskInApp, tasks } = useDatabase();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Interactive study companion states
  const [waterCups, setWaterCups] = useState(0);

  // Auto-restore maximized view when a new task is started
  useEffect(() => {
    if (activeTaskTimer) {
      setIsMinimized(false);
    }
  }, [activeTaskTimer?.taskId]);

  if (!activeTaskTimer) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTaskTimer(prev => {
      if (!prev) return null;
      if (!prev.isPaused) {
        const wallSeconds = Math.floor((Date.now() - prev.startTime) / 1000);
        return { ...prev, isPaused: true, elapsed: prev.elapsed + wallSeconds, displaySeconds: prev.elapsed + wallSeconds };
      } else {
        return { ...prev, isPaused: false, startTime: Date.now() };
      }
    });
  };

  const handleStopAndDiscard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("Are you sure you want to stop and discard this active mission timer? Progress will not be saved.")) {
      setActiveTaskTimer(null);
    }
  };

  const handleManualComplete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const elapsedHours = Number((activeTaskTimer.displaySeconds / 3600).toFixed(2));
      const fallbackHours = Number(activeTaskTimer.task.targetHours) || 1;
      const finalHours = elapsedHours > 0 ? elapsedHours : fallbackHours;
      
      const formattedTime = formatTime(activeTaskTimer.displaySeconds);

      await handleUpdateTaskInApp({
        ...activeTaskTimer.task,
        status: 'Completed',
        completedAt: new Date().toISOString()
      }, finalHours, `Completed via timer. Time spent: ${formattedTime}`);

      playSuccessChime();
      setActiveTaskTimer(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Progress percentage calculation
  const targetSeconds = (activeTaskTimer.task.targetHours || 0) * 3600;
  const progressPercent = targetSeconds > 0 
    ? Math.min(100, Math.round((activeTaskTimer.displaySeconds / targetSeconds) * 100)) 
    : 0;

  // Filter tasks to show today's checklist in sidebar
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayTasksList = tasks.filter(t => t.date === todayDateStr);

  return (
    <AnimatePresence>
      {!isMinimized ? (
        /* ================= MAXIMIZED MODE (Full Screen Overlay Canvas) ================= */
        <motion.div
          key="maximized-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#070b13] p-3 md:p-4 overflow-hidden select-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)'
          }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full h-full bg-slate-900/90 backdrop-blur-3xl border border-white/15 overflow-hidden flex flex-col rounded-2xl md:rounded-[2rem]"
            style={{
              boxShadow: 'inset 0 1.5px 0 rgba(255, 255, 255, 0.12), 0 30px 100px rgba(0, 0, 0, 0.75)'
            }}
          >
            {/* Ambient inner soft lighting */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none -z-10" />

            {/* macOS Style Title Bar */}
            <nav className="relative flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-slate-950/60 shrink-0">
              {/* Traffic Lights */}
              <div className="flex items-center gap-[8px] group/tl">
                {/* Red - Stop */}
                <button
                  onClick={handleStopAndDiscard}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center relative cursor-pointer border-0"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, #ff8a7a, #ff5f57)',
                    boxShadow: '0 1px 2px rgba(255,95,87,0.4), inset 0 0.5px 0 rgba(255,255,255,0.2)'
                  }}
                  title="Stop & Discard"
                >
                  <span className="opacity-0 group-hover/tl:opacity-100 text-[8px] font-bold text-red-900 select-none">✕</span>
                </button>
                {/* Yellow - Minimize */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center relative cursor-pointer border-0"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, #ffd86b, #febc2e)',
                    boxShadow: '0 1px 2px rgba(254,188,46,0.4), inset 0 0.5px 0 rgba(255,255,255,0.2)'
                  }}
                  title="Minimize View"
                >
                  <span className="opacity-0 group-hover/tl:opacity-100 text-[8px] font-bold text-amber-900 select-none">−</span>
                </button>
                {/* Green - Disabled */}
                <button
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center relative opacity-55 cursor-not-allowed border-0"
                  style={{
                    background: 'radial-gradient(circle at 40% 35%, #5de576, #28c840)',
                    boxShadow: '0 1px 2px rgba(40,200,64,0.4), inset 0 0.5px 0 rgba(255,255,255,0.2)'
                  }}
                  title="Already Full Screen"
                >
                  <span className="opacity-0 text-[8px] font-bold text-green-900 select-none">+</span>
                </button>
              </div>

              {/* Title Text */}
              <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center pointer-events-none px-12">
                <span className="text-[10px] sm:text-xs font-bold text-slate-355 tracking-tight font-display truncate max-w-xs sm:max-w-md">
                  Active Mission Workspace — {activeTaskTimer.taskTitle}
                </span>
              </div>

              {/* Tag Status */}
              <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-indigo-500/20 shadow-inner shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${activeTaskTimer.isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[8px] sm:text-[9px] text-indigo-305 font-mono font-bold uppercase tracking-widest">
                  {activeTaskTimer.isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </nav>

            {/* Main view container split */}
            <div className="flex-1 flex min-h-0">
              
              {/* Left sidebar - Hidden on mobile/tab, visible on lg+ */}
              <aside className="w-64 lg:w-72 bg-slate-950/40 border-r border-white/5 flex flex-col p-5 gap-5 overflow-y-auto hidden lg:flex shrink-0">
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Mission Target</span>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{activeTaskTimer.taskTitle}</h3>
                    <span className="text-[10px] sm:text-xs text-slate-450 font-mono block">Category: {activeTaskTimer.task.category}</span>
                    {activeTaskTimer.task.targetHours > 0 && (
                      <span className="text-[10px] sm:text-xs text-indigo-355 font-bold font-mono block flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Target: {activeTaskTimer.task.targetHours}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Today's Goals</span>
                  <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto min-h-0">
                    {todayTasksList.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-6">No tasks scheduled.</div>
                    ) : (
                      todayTasksList.map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-[11px] text-slate-350 py-1.5 border-b border-white/5 last:border-0">
                          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                            t.status === 'Completed' 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                              : t.id === activeTaskTimer.taskId 
                                ? 'border-indigo-500/40 animate-pulse text-indigo-405'
                                : 'border-slate-700 text-transparent'
                          }`}>
                            {t.status === 'Completed' && <span className="text-[8px]">✓</span>}
                            {t.id === activeTaskTimer.taskId && t.status !== 'Completed' && <span className="text-[8px]">•</span>}
                          </div>
                          <span className={`truncate ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                            {t.title}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>

              {/* Center workspace main view - structured study cockpit */}
              <main className="flex-1 flex flex-col items-center justify-between p-6 sm:p-8 md:p-10 overflow-y-auto relative">
                

                {/* Flat Clock Face - Responsive layout with mobile-stacked vertical clock and desktop horizontal display */}
                <div className="w-full my-auto flex items-center justify-center py-4 sm:py-6">
                  {/* Mobile Stacked Vertical Clock */}
                  <div className="flex sm:hidden flex-col items-center justify-center font-display font-black tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-cyan-400 drop-shadow-[0_15px_35px_rgba(56,189,248,0.25)] leading-[0.75] select-none py-2">
                    <span className="text-[6.5rem] xs:text-[7.5rem]">{formatTime(activeTaskTimer.displaySeconds).split(':')[0]}</span>
                    <span className="text-[6.5rem] xs:text-[7.5rem] mt-1">{formatTime(activeTaskTimer.displaySeconds).split(':')[1]}</span>
                    <span className="text-4xl xs:text-5xl text-cyan-400/95 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] mt-3">
                      {formatTime(activeTaskTimer.displaySeconds).split(':')[2]}
                    </span>
                  </div>

                  {/* Tablet & Desktop Horizontal Clock */}
                  <div className="hidden sm:flex items-baseline justify-center font-display font-black tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-cyan-400 drop-shadow-[0_20px_50px_rgba(56,189,248,0.28)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] whitespace-nowrap">
                    <span className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] xl:text-[13rem] 2xl:text-[15rem] leading-none">
                      {formatTime(activeTaskTimer.displaySeconds).split(':')[0]}:{formatTime(activeTaskTimer.displaySeconds).split(':')[1]}
                    </span>
                    <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[6rem] xl:text-[7.5rem] 2xl:text-[8.5rem] leading-none text-cyan-400/90 drop-shadow-[0_0_30px_rgba(34,211,238,0.55)] ml-1.5 md:ml-3">
                      :{formatTime(activeTaskTimer.displaySeconds).split(':')[2]}
                    </span>
                  </div>
                </div>

                {/* 3. High-Fidelity Study Cockpit Metric Cards */}
                <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-4">
                  
                  {/* Card 1: Study Quest Progress */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 uppercase font-bold"><Flame className="w-3.5 h-3.5 text-orange-400" /> Focus Quest</span>
                      <span className="font-bold text-indigo-305">{progressPercent}%</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-450 block font-mono">Goal Duration: {activeTaskTimer.task.targetHours || 0} hrs</span>
                      <span className="text-[11px] text-slate-300 block font-mono font-bold">Elapsed: {(activeTaskTimer.displaySeconds / 3600).toFixed(2)} hrs</span>
                    </div>
                    {targetSeconds > 0 && (
                      <div className="h-1.5 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/5 p-0.5 relative">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card 2: Session Insights */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 uppercase font-bold"><Compass className="w-3.5 h-3.5 text-violet-400" /> Insights</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTaskTimer.isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-[9px] uppercase font-mono">{activeTaskTimer.isPaused ? 'Paused' : 'Ticking'}</span>
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-450">Started At:</span>
                        <span className="text-slate-300 font-bold">
                          {new Date(activeTaskTimer.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-455">Total Seconds:</span>
                        <span className="text-slate-300 font-bold">{activeTaskTimer.displaySeconds}s</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-sans block mt-1">Status logs automatically back up.</span>
                  </div>

                  {/* Card 3: Hydration / Water Quest (Interactive!) */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 uppercase font-bold"><GlassWater className="w-3.5 h-3.5 text-sky-400" /> Hydration Fuel</span>
                      <span className="font-bold text-sky-400">{waterCups}/8 Cups</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-sans leading-snug">Keep your focus sharp. Log study fuel!</span>
                      <button
                        onClick={() => setWaterCups(c => Math.min(8, c + 1))}
                        className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                      >
                        + 1 Cup
                      </button>
                    </div>
                    {/* Visual cup ticks */}
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            i < waterCups ? 'bg-sky-405 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-slate-800'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* 4. Dock Control Bar */}
                <div className="bg-slate-955/70 backdrop-blur-2xl px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 sm:gap-4 shrink-0 max-w-full mb-2">
                  {/* Play/Pause */}
                  <button
                    onClick={handleTogglePlayPause}
                    title={activeTaskTimer.isPaused ? "Resume" : "Pause"}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 text-slate-100 flex items-center justify-center border border-white/5 transition cursor-pointer hover:scale-105 active:scale-95 shrink-0 animate-none"
                  >
                    {activeTaskTimer.isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-305 ml-0.5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-amber-305" />}
                  </button>

                  {/* Stop / Discard */}
                  <button
                    onClick={handleStopAndDiscard}
                    title="Stop Mission"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-rose-500/10 text-rose-350 border border-white/5 hover:border-rose-500/20 flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300" />
                  </button>

                  <div className="w-px h-6 bg-white/10 mx-0.5 sm:mx-1 shrink-0" />

                  {/* Complete Mission */}
                  <button
                    onClick={handleManualComplete}
                    className="px-4 py-2.5 sm:px-6 sm:h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-900 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 border-0 shrink-0"
                  >
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Complete Mission</span>
                  </button>
                </div>
              </main>

            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* ================= MINIMIZED MODE (Top-Center Dynamic Island Dock) ================= */
        <motion.div
          key="minimized-dynamic-island"
          initial={{ y: -50, x: "-50%", opacity: 0, scale: 0.8 }}
          animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
          exit={{ y: -50, x: "-50%", opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsMinimized(false)}
          className="fixed top-4 left-1/2 z-[70] rounded-full bg-slate-955/95 backdrop-blur-2xl px-5 py-2.5 flex items-center gap-4 border border-white/15 hover:border-white/25 select-none cursor-pointer"
          style={{
            minWidth: '220px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 40px rgba(0, 0, 0, 0.65)'
          }}
        >
          {/* macOS Traffic Lights (Mini style) */}
          <div className="flex items-center gap-[5px] group/mini shrink-0" onClick={e => e.stopPropagation()}>
            {/* Red - Stop */}
            <button
              onClick={handleStopAndDiscard}
              className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center relative cursor-pointer border-0"
              title="Stop timer"
            >
              <span className="opacity-0 group-hover/mini:opacity-100 text-[6px] font-bold text-red-900 select-none">✕</span>
            </button>
            {/* Yellow - Expanded view */}
            <button
              onClick={() => setIsMinimized(false)}
              className="w-2.5 h-2.5 rounded-full bg-amber-500 flex items-center justify-center relative cursor-pointer border-0"
              title="Restore"
            >
              <span className="opacity-0 group-hover/mini:opacity-100 text-[6px] font-bold text-amber-905 select-none">−</span>
            </button>
          </div>

          {/* Task title & Timer display */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] text-indigo-305 font-bold font-mono tracking-tight shrink-0 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${activeTaskTimer.isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
              Active
            </span>
            <div className="w-px h-3 bg-white/10 shrink-0" />
            <span className="font-display text-sm font-black text-white shrink-0 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] tracking-tight tabular-nums">
              {formatTime(activeTaskTimer.displaySeconds)}
            </span>
          </div>

          {/* Hover Expansion Area */}
          <motion.div
            animate={{ width: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex items-center gap-2 overflow-hidden shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />
            <button
              onClick={handleTogglePlayPause}
              title={activeTaskTimer.isPaused ? "Resume" : "Pause"}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-305 transition cursor-pointer border-0 flex items-center justify-center animate-none"
            >
              {activeTaskTimer.isPaused ? <Play className="w-3.5 h-3.5 text-indigo-300" /> : <Pause className="w-3.5 h-3.5 text-amber-300" />}
            </button>

            <button
              onClick={() => handleManualComplete()}
              title="Complete Mission"
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer flex items-center justify-center animate-none"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Maximized Indicator */}
          {!isHovered && (
            <span className="text-[9px] text-slate-500 font-bold tracking-tight uppercase shrink-0 font-sans ml-auto hover:text-white transition">
              Click to View
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
