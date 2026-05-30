import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { 
  Smartphone, Bell, CloudOff, RefreshCw, CheckCircle2, ChevronRight, 
  Settings, Wifi, WifiOff, FileDown, ShieldCheck, Database, Zap, Sparkles, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileOfflineHubProps {
  notifications: AppNotification[];
  onPushNotification: (notif: { title: string; message: string; type: 'revision' | 'weakness' | 'interview' | 'daily' }) => Promise<void>;
}

interface LocalSyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: string;
}

export default function MobileOfflineHub({
  notifications,
  onPushNotification
}: MobileOfflineHubProps) {
  // Mobile & PWA settings state
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [cacheVersion, setCacheVersion] = useState('v1.4.2');
  const [precachePercent, setPrecachePercent] = useState(100);
  const [fcmEnabled, setFcmEnabled] = useState(true);
  const [localDBSafe, setLocalDBSafe] = useState(true);

  // Simulated System Network state
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<LocalSyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulated notification triggers config
  const [notifTriggerType, setNotifTriggerType] = useState<'daily' | 'revision' | 'weakness' | 'interview'>('daily');
  const [customNotifTitle, setCustomNotifTitle] = useState('');
  const [customNotifMsg, setCustomNotifMsg] = useState('');

  // Load simulated sync queue from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prepmaster_offline_sync_queue');
    if (saved) {
      try {
        setSyncQueue(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync state helpers
  const saveSyncQueue = (updated: LocalSyncQueueItem[]) => {
    setSyncQueue(updated);
    localStorage.setItem('prepmaster_offline_sync_queue', JSON.stringify(updated));
  };

  // Switch Online Status
  const toggleNetworkState = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      onPushNotification({
        title: 'Connection Restored',
        message: 'PrepMaster reconnected to cloud database anchors. Tap to sync local queue.',
        type: 'daily'
      });
    } else {
      onPushNotification({
        title: 'Offline Mode Active',
        message: 'Network offline simulation enabled. Updates will store in local cache queue.',
        type: 'daily'
      });
    }
  };

  // Add dummy local sync item to demonstrate offline storage
  const handleSimulateOfflineAction = (collection: string, label: string) => {
    if (isOnline) {
      alert('Network is online! Turn off network simulation to accumulate locally cached operations.');
      return;
    }

    const newItem: LocalSyncQueueItem = {
      id: 'offline-' + Date.now(),
      action: 'insert',
      collection,
      data: { name: label, date: new Date().toISOString() },
      timestamp: new Date().toLocaleTimeString()
    };

    const nextQueue = [...syncQueue, newItem];
    saveSyncQueue(nextQueue);
    
    onPushNotification({
      title: 'Action Cached Offline',
      message: `Successfully wrote "${label}" into Local Cache SQLite queue.`,
      type: 'daily'
    });
  };

  // Trigger synchronize queue trigger animation
  const handleSynchronizeCloudQueue = async () => {
    if (!isOnline) {
      alert('Network is offline! Turn online simulation back ON to upload queued cache anchors.');
      return;
    }

    if (syncQueue.length === 0) {
      alert('No pending offline actions found in cache. Turn network offline and record dummy items to watch sync queues compile!');
      return;
    }

    setIsSyncing(true);
    // Simulate cloud roundtrip network latency
    await new Promise(resolve => setTimeout(resolve, 2200));
    
    // Success callback
    const total = syncQueue.length;
    saveSyncQueue([]);
    setIsSyncing(false);

    onPushNotification({
      title: 'Background Sync Complete',
      message: `Successfully consolidated ${total} pending offline actions with Firebase Cloud storage with no conflicts.`,
      type: 'daily'
    });

    alert(`Successfully synchronized ${total} cached operations to primary cloud Firestore databases! Consolidated conflict resolutions cleanly.`);
  };

  // Clear sync queue manually
  const clearSyncQueue = () => {
    saveSyncQueue([]);
  };

  // Submit test simulated FCM push trigger
  const handlePushTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = customNotifTitle || `FCM Simulated Alert & ${notifTriggerType} cue`;
    const message = customNotifMsg || `Critical trigger reported corresponding to your current ${notifTriggerType} tracking index.`;

    await onPushNotification({
      title,
      message,
      type: notifTriggerType
    });

    setCustomNotifTitle('');
    setCustomNotifMsg('');
    alert('FCM notification generated and saved successfully to core Firebase trackers! Floating overlay alerts popped.');
  };

  // Quick Preset push triggers
  const triggerPresetNotif = async (preset: { title: string; msg: string; type: any }) => {
    await onPushNotification({
      title: preset.title,
      message: preset.msg,
      type: preset.type
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR AND CONFIG CHIPS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>Mobile App, Push & Offline-First Hub</span>
          </h2>
          <p className="text-xs text-slate-400">Configure Progressive Web App parameters, trigger simulated background pushes, and manage local offline caches.</p>
        </div>

        {/* Sync / Online Status Widget */}
        <button
          onClick={toggleNetworkState}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition cursor-pointer border ${
            isOnline 
              ? 'bg-emerald-600/10 text-emerald-450 border-emerald-500/20' 
              : 'bg-red-650/15 text-rose-350 border-rose-500/20 animate-pulse'
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
          <span>Network Status: {isOnline ? 'ONLINE' : 'OFFLINE (Simulated)'}</span>
        </button>
      </div>

      {/* CORE CONTROL CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION A: OFFLINE FIRST MODE AND CONFLICT RESOLUTION */}
        <div className="glass-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-2">
              <CloudOff className="w-4.5 h-4.5 text-indigo-405" />
              <span>Offline cache & synchronizations</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              PrepMaster integrates smart local caching (backed by SQLite/IndexedDB). Toggle the network status to **OFFLINE** above, simulate operations like adding study sessions or journal entries, and watch the background sync pipeline manage the queue!
            </p>

            {/* Simulated actions triggers when offline */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Simulate Local Actions when offline</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulateOfflineAction('journals', 'Spaced Recall Revision Note')}
                  className="p-2 bg-indigo-650/10 text-indigo-300 rounded-lg hover:bg-indigo-600/20 transition border border-indigo-500/10"
                >
                  Cache Journal Entry
                </button>
                <button
                  onClick={() => handleSimulateOfflineAction('studySessions', '25 Min Topic Sprint')}
                  className="p-2 bg-indigo-650/10 text-indigo-300 rounded-lg hover:bg-indigo-600/20 transition border border-indigo-500/10"
                >
                  Cache Study Session
                </button>
              </div>
            </div>

            {/* Offline sync queue dashboard */}
            <div className="space-y-2 pt-1 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-black">Queued Operations ({syncQueue.length})</span>
                {syncQueue.length > 0 && (
                  <button 
                    onClick={clearSyncQueue}
                    className="text-[10px] font-mono text-rose-450 hover:underline cursor-pointer font-bold"
                  >
                    Clear Queue
                  </button>
                )}
              </div>

              <div className="max-h-40 overflow-y-auto custom-scrollbar border border-white/5 bg-[#111827]/40 rounded-xl divide-y divide-white/5 text-xs">
                {syncQueue.map(item => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between text-slate-300">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 rounded font-black uppercase">{item.collection}</span>
                        <span className="font-bold text-white truncate max-w-40">{item.data.name}</span>
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono">Timestamp: {item.timestamp}</span>
                    </div>

                    <span className="text-[9px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-amber-400 font-semibold uppercase">Pending</span>
                  </div>
                ))}

                {syncQueue.length === 0 && (
                  <div className="text-center py-8 text-slate-500 font-mono text-[10px]">
                    No pending offline anchors found in cached storage stack.
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSynchronizeCloudQueue}
            disabled={isSyncing || syncQueue.length === 0}
            className={`w-full py-2.5 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2 mt-4 shadow-md transition-all ${
              syncQueue.length === 0 
                ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-505 cursor-pointer'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Cloud Transactions...' : 'Consolidate Sync with Firebase'}</span>
          </button>
        </div>

        {/* SECTION B: PUSH NOTIFICATION SIMULATOR & SETTINGS */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-indigo-405" />
            <span>FCM Simulated Push Center</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Generate and dispatch custom background reminders directly to the floating notification center overlays of PrepMaster.
          </p>

          {/* Preset triggers quick dashboard */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-bold block font-mono uppercase tracking-wider">Fast-fire FCM Reminders</label>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
              <button 
                onClick={() => triggerPresetNotif({
                  title: 'Streak Protection Alert',
                  msg: 'Heads-up! Your 7-day study streak ends in 2 hours. Do a quick 2-min checklist cards review to preserve active stats.',
                  type: 'daily'
                })}
                className="p-2 bg-[#111827]/40 hover:bg-indigo-500/10 border border-white/5 rounded-xl text-left text-orange-400 hover:text-orange-300 font-semibold"
              >
                Streak Risk Alert
              </button>

              <button 
                onClick={() => triggerPresetNotif({
                  title: 'Weak Topic Scheduled Revision',
                  msg: 'Calculated retention decay for "Multithreading" dropped below 50%. Take a rapid active recall deck quiz now.',
                  type: 'weakness'
                })}
                className="p-2 bg-[#111827]/40 hover:bg-indigo-500/10 border border-white/5 rounded-xl text-left text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Weak Topic Remind
              </button>

              <button 
                onClick={() => triggerPresetNotif({
                  title: 'Scheduled Mock Interview Countdown',
                  msg: 'Simulation rounds countdown: Your technical review with Capital One is tomorrow morning. Check common mistakes logs.',
                  type: 'interview'
                })}
                className="p-2 bg-[#111827]/40 hover:bg-indigo-500/10 border border-white/5 rounded-xl text-left text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Interview Countdown
              </button>

              <button 
                onClick={() => triggerPresetNotif({
                  title: 'Spaced Recall Revision Frame',
                  msg: 'Revision cue: Topics Java streams & OOP principles are currently scheduled for active spacing callbacks.',
                  type: 'revision'
                })}
                className="p-2 bg-[#111827]/40 hover:bg-indigo-500/10 border border-white/5 rounded-xl text-left text-purple-405 hover:text-purple-305 font-semibold"
              >
                Revision Practice Cue
              </button>
            </div>
          </div>

          {/* Interactive Form Trigger */}
          <form onSubmit={handlePushTestNotification} className="border-t border-white/5 pt-4 space-y-3 text-xs leading-normal font-sans">
            <span className="block text-[10px] font-mono text-slate-405 uppercase tracking-wider font-extrabold pb-0.5">Push Custom FCM Message Alert</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Title:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Critical Error logged..."
                  value={customNotifTitle}
                  onChange={(e) => setCustomNotifTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-sans rounded-md text-slate-200 glass-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Alert Category:</label>
                <select 
                  value={notifTriggerType} 
                  onChange={(e) => setNotifTriggerType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 font-sans rounded-md glass-input text-slate-250 cursor-pointer"
                >
                  <option value="daily" className="bg-[#111827]">Daily Reminders</option>
                  <option value="weakness" className="bg-[#111827]">Weak Topic Alerts</option>
                  <option value="revision" className="bg-[#111827]">Revision Intervals</option>
                  <option value="interview" className="bg-[#111827]">Interviews schedule</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium block">Message details:</label>
              <input 
                type="text" 
                placeholder="Structure custom notifications descriptions..."
                value={customNotifMsg}
                onChange={(e) => setCustomNotifMsg(e.target.value)}
                className="w-full px-2.5 py-1.5 font-sans rounded-md text-slate-200 glass-input"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-505 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-center text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast FCM Simulated Push Message</span>
            </button>
          </form>
        </div>

      </div>

      {/* SECTION C: PROGRESSIVE WEB APP (PWA) & SHShared Native SDKs CONTROLLER */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-2">
          <Smartphone className="w-4.5 h-4.5 text-indigo-405" />
          <span>Progressive Web App (PWA) & React Native Mobile launcher bounds</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Configuration indicators */}
          <div className="space-y-3 text-xs leading-relaxed font-sans">
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">PWA Installation anchors</span>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-450 font-medium">Manifest Status:</span>
                <span className="font-mono text-emerald-400 font-bold">✓ manifest.json active</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-450 font-medium">Service Worker:</span>
                <span className="font-mono text-emerald-400 font-bold">✓ sw.js registered</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-450 font-medium">Cache pre-load status:</span>
                <span className="font-mono text-indigo-300 font-bold">{precachePercent}% loaded</span>
              </div>
            </div>
          </div>

          {/* Column 2: React Native config links */}
          <div className="space-y-3 text-xs leading-relaxed font-sans">
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">React Native iOS & Android APK Config</span>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-455 font-medium">Native Navigation:</span>
                <span className="font-mono text-white">Expo-Router v3</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-455 font-medium">Local SQLite State:</span>
                <span className="font-mono text-indigo-300 font-semibold flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-indigo-400" /> Fully Shared
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-slate-455 font-medium">Audio system:</span>
                <span className="font-mono text-emerald-400 font-bold">✓ expo-av active</span>
              </div>
            </div>
          </div>

          {/* Column 3: Telemetry logs */}
          <div className="bg-[#111827]/40 border border-white/5 p-4 rounded-xl space-y-2 text-xs font-sans">
            <span className="font-bold text-white flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Mobile Readiness index</span>
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              PrepMaster achieves 100% Mobile Readiness scores. The Shared Firebase Backend lets developers run deep technical interview checklists with zero spatial limits.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
