/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AppNotification } from '../types';
import { 
  Bell, Check, Trash2, Calendar, AlertTriangle, Book, Clock, Star, Info
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onClearAll
}: NotificationCenterProps) {

  // Unread tally
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return (
    <div className="glass-card p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-indigo-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.1 bg-rose-600 text-white font-mono text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100">Active Notifications Hub</h3>
            <p className="text-[10px] text-slate-400 block font-mono">Simulated system updates</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-[11px] text-rose-400 font-bold hover:underline font-sans cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Notifications list mapping */}
      <div className="space-y-3.5 max-h-80 overflow-y-auto">
        {notifications.map(n => {
          return (
            <div 
              key={n.id} 
              className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-normal relative ${
                n.read ? 'bg-white/2 border-white/5 opacity-60' : 'bg-white/5 border-indigo-500/20 shadow-xs'
              }`}
            >
              {/* Type Icons */}
              <div className={`p-2 rounded-lg shrink-0 ${
                n.type === 'revision' ? 'bg-red-500/15 text-red-400 border border-red-500/10' :
                n.type === 'interview' ? 'bg-indigo-500/15 text-indigo-305 border border-indigo-500/10' :
                n.type === 'weakness' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' :
                'bg-blue-500/15 text-blue-400 border border-blue-500/10'
              }`}>
                {n.type === 'revision' && <Clock className="w-4 h-4" />}
                {n.type === 'interview' && <Calendar className="w-4 h-4" />}
                {n.type === 'weakness' && <AlertTriangle className="w-4 h-4 animate-bounce" />}
                {n.type === 'daily' && <Book className="w-4 h-4" />}
              </div>

              {/* Message */}
              <div className="space-y-1 pr-6 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-slate-100 text-xs leading-tight">{n.title}</h4>
                  <span className="text-[9px] font-mono text-slate-400">
                    {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {n.message}
                </p>
              </div>

              {/* Unread dot click action */}
              {!n.read && (
                <button 
                  onClick={() => onMarkRead(n.id)}
                  className="absolute top-3.5 right-3 p-1 rounded bg-white/5 border border-white/10 text-slate-350 hover:border-emerald-650 hover:text-emerald-450 transition cursor-pointer"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-white/10 bg-white/2 rounded-xl">
            Hub cleared! No critical active notifications flagged.
          </div>
        )}
      </div>

    </div>
  );
}
