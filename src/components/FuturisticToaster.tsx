/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { 
  X, Radio, Sparkles, Volume2, VolumeX, Bell, 
  ShieldAlert, Clock, Calendar, AlertTriangle, Book, Flame, Activity, Zap, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FuturisticToasterProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onExecuteAction?: (notif: AppNotification) => void;
}

export default function FuturisticToaster({
  toasts,
  onDismiss,
  onExecuteAction
}: FuturisticToasterProps) {
  const [audioMuted, setAudioMuted] = useState(() => localStorage.getItem('pref_audio_muted') === 'true');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissionStatus(res);
        playCyberSound('low');
      } catch (e) {
        console.error("Failed to request native notification permissions:", e);
      }
    }
  };

  const playCyberSound = (priority: string) => {
    if (audioMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      if (priority === 'high') {
        // High alert sweep (dual-oscillator alarm)
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(330, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.15);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(990, ctx.currentTime + 0.15);
      } else {
        // Futuristic cyber blip
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
        osc2.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.25); // A5
      }

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Web Audio blocked by user gesture:", e);
    }
  };

  // Play cyber chime when a new toast arrives
  useEffect(() => {
    if (toasts.length > 0) {
      const newest = toasts[toasts.length - 1];
      playCyberSound(newest.priority || 'medium');
    }
  }, [toasts.length]);

  const toggleMute = () => {
    const nextVal = !audioMuted;
    setAudioMuted(nextVal);
    localStorage.setItem('pref_audio_muted', nextVal.toString());
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
      
      {/* Native Desktop Notification Request Banner - only shown when permission is default */}
      {permissionStatus === 'default' && toasts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto bg-[#0a0f1d]/90 backdrop-blur-md border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-500" />
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider">Telemetry Desktop Sync</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Enable native operating system notifications to receive critical interview alerts when PrepMaster is in the background.
          </p>
          <div className="flex gap-2 justify-end mt-1">
            <button
              onClick={requestDesktopPermission}
              className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/20 text-white rounded-lg text-[9px] font-mono font-bold transition cursor-pointer flex items-center gap-1 shadow-sm shadow-indigo-600/30"
            >
              <Bell className="w-2.5 h-2.5" />
              <span>Authorize OS Alerts</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Futuristic Toasts Array Stack */}
      <AnimatePresence>
        {toasts.map((toast) => {
          const isHigh = toast.priority === 'high';
          const isMedium = toast.priority === 'medium';
          
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: 100, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-2xl relative overflow-hidden group backdrop-blur-lg ${
                isHigh 
                  ? 'bg-rose-950/80 border-rose-500/35 shadow-[0_0_25px_rgba(244,63,94,0.25)]' 
                  : isMedium
                  ? 'bg-amber-950/80 border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0d1324]/90 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
              }`}
            >
              {/* Sci-fi Overlay scanning lines and glitched grid */}
              <div className="absolute inset-0 pointer-events-none opacity-4 z-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(99,102,241,0.15)_50%)] bg-[length:100%_4px]" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
              
              {/* Top Accent Tech Stripe Bar */}
              <div className={`absolute top-0 inset-x-0 h-[2px] ${
                isHigh ? 'bg-gradient-to-r from-rose-500 to-red-400 animate-pulse' :
                isMedium ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                'bg-gradient-to-r from-teal-400 to-indigo-500'
              }`} />

              {/* Toast Header Info Row */}
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${
                    isHigh ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' :
                    isMedium ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    {toast.type === 'revision' && <Clock className="w-3.5 h-3.5" />}
                    {toast.type === 'interview' && <Calendar className="w-3.5 h-3.5" />}
                    {toast.type === 'weakness' && <AlertTriangle className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '3s' }} />}
                    {toast.type === 'daily' && <Book className="w-3.5 h-3.5" />}
                    {toast.type === 'streak' && <Flame className="w-3.5 h-3.5 animate-pulse" />}
                    {toast.type === 'mock' && <Activity className="w-3.5 h-3.5" />}
                    {!toast.type && <Bell className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block leading-none mb-1">
                      {toast.type || 'SYSTEM'} CUE // {toast.priority || 'MEDIUM'}
                    </span>
                    <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-wide leading-none">
                      {toast.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Small mute audio icon in toast */}
                  <button
                    onClick={toggleMute}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-350 transition pointer-events-auto"
                    title={audioMuted ? "Unmute alarm blips" : "Mute alarm blips"}
                  >
                    {audioMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-200 transition pointer-events-auto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification Message Content */}
              <div className="mt-2.5 text-[10.5px] text-slate-300 font-sans leading-relaxed text-left relative z-10 pr-2">
                {toast.message}
              </div>

              {/* Interactive Footer Row */}
              <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2 relative z-10">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  Telemetry Live Sync
                </span>

                {toast.actionUrl && onExecuteAction && (
                  <button
                    onClick={() => onExecuteAction(toast)}
                    className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 text-indigo-300 rounded-lg text-[9px] font-mono font-bold transition flex items-center gap-1 cursor-pointer pointer-events-auto"
                  >
                    <span>{toast.actionText || 'Execute'}</span>
                    <Zap className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
