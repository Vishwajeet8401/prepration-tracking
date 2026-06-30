/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Topic, StudySession, ActivityPlan, DailyTask, Subject } from '../types';
import { GlobalStats } from '../hooks/useGlobalStats';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Clock, Play, Pause, Square, TrendingUp, Calendar, BookOpen, 
  CheckCircle, Plus, Dumbbell, Activity, Save, Sparkles, Award
} from 'lucide-react';

interface AnalyticsProps {
  sessions: StudySession[];
  subjects: Subject[];
  topics: Topic[];
  onAddSession: (session: Omit<StudySession, 'id'>) => void;
  plans: ActivityPlan[];
  tasks: DailyTask[];
  globalStats?: GlobalStats;
  initialActiveTopicId?: string | null;
  clearInitialActiveTopicId?: () => void;
}

const Analytics = React.memo(function Analytics({
  sessions,
  subjects,
  topics,
  onAddSession,
  plans,
  tasks,
  globalStats,
  initialActiveTopicId,
  clearInitialActiveTopicId
}: AnalyticsProps) {

  // Active sub tab: 'charts' | 'timer-tracker'
  const [activeSubTab, setActiveSubTab] = useState<'charts' | 'timer-tracker'>('charts');

  // STUDY TIMER STATES
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTopicId, setTimerTopicId] = useState(topics[0]?.id || '');
  const [timerNotes, setTimerNotes] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [timerStartTimeMs, setTimerStartTimeMs] = useState<number>(0);
  const [timerAccumulatedMs, setTimerAccumulatedMs] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle automatic timer start when navigated from dashboard with active topic ID
  useEffect(() => {
    if (initialActiveTopicId) {
      setActiveSubTab('timer-tracker');
      setTimerTopicId(initialActiveTopicId);
      // Directly start timer with selected topic ID
      setTimerActive(true);
      setTimerPaused(false);
      setSessionStartTime(new Date().toISOString());
      const now = Date.now();
      setTimerStartTimeMs(now);
      setTimerAccumulatedMs(0);
      setTimerSeconds(0);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((Date.now() - now) / 1000));
      }, 500);

      if (clearInitialActiveTopicId) {
        clearInitialActiveTopicId();
      }
    }
  }, [initialActiveTopicId, clearInitialActiveTopicId]);

  // START STUDY TIMER
  const startTimer = () => {
    setTimerActive(true);
    setTimerPaused(false);
    setSessionStartTime(new Date().toISOString());
    const now = Date.now();
    setTimerStartTimeMs(now);
    setTimerAccumulatedMs(0);
    setTimerSeconds(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - now) / 1000));
    }, 500);
  };

  // PAUSE RESUME
  const togglePause = () => {
    if (timerPaused) {
      setTimerPaused(false);
      const now = Date.now();
      setTimerStartTimeMs(now);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimerSeconds(Math.floor((timerAccumulatedMs + Date.now() - now) / 1000));
      }, 500);
    } else {
      setTimerPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerAccumulatedMs(prev => prev + (Date.now() - timerStartTimeMs));
    }
  };

  // STOP TIMER AND SAVE
  const stopAndLogSession = () => {
    if (!sessionStartTime) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));

    // Save
    onAddSession({
      topicId: timerTopicId,
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      duration: durationMinutes,
      notes: timerNotes || 'Interactive active recall stopwatch log.'
    });

    // Reset
    setTimerActive(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    setTimerAccumulatedMs(0);
    setTimerStartTimeMs(0);
    setTimerNotes('');
    setSessionStartTime(null);

    alert(`Successfully registered a ${durationMinutes}-minute study session track! Your dashboard streak and time matrices updated.`);
  };

  // ANALYTIC TOTALS E.G. WEEKLY AND DAILY SUMS
  const statsSummary = useMemo(() => {
    // Use globalStats if available for total duration, else fallback to locally loaded sessions
    const totalStudyTimeSeconds = globalStats 
      ? globalStats.totalStudyTimeSeconds 
      : sessions.reduce((sum, s) => sum + (s.duration * 60), 0);
    const totalDuration = Math.round(totalStudyTimeSeconds / 60);
    const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
    
    // Study time per subject map
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => {
      const topic = topics.find(t => t.id === s.topicId);
      let subjectName = 'Uncategorized';
      if (topic && topic.subjectId) {
        const subject = subjects.find(sub => sub.id === topic.subjectId);
        if (subject) subjectName = subject.name;
      }
      subjectMap[subjectName] = (subjectMap[subjectName] || 0) + s.duration;
    });

    return {
      totalDuration,
      avgDuration,
      subjectMap
    };
  }, [sessions, topics, subjects]);

  // Current month active plans consistency calculation
  const monthlyConsistencyData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[currentMonth];

    // Total days in current month
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Initialize mapping
    const planReport: Record<string, { completed: number; total: number; name: string }> = {};

    // Standard plans
    plans.forEach(p => {
      planReport[p.id] = { completed: 0, total: 0, name: p.title };
    });

    // System tasks (always present or created as required by spacing scheduler, checking if any tasks actually exist)
    const hasRecallTasks = tasks.some(t => t.planId === 'system-recall');
    const hasRevisionTasks = tasks.some(t => t.planId === 'system-revision');

    if (hasRecallTasks) {
      planReport['system-recall'] = { completed: 0, total: 0, name: 'Recall Session' };
    }
    if (hasRevisionTasks) {
      planReport['system-revision'] = { completed: 0, total: 0, name: 'Revision Queue' };
    }

    // Fill dates status
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      // Check standard plans
      plans.forEach(p => {
        if (dateStr >= p.startDate && dateStr <= p.endDate) {
          planReport[p.id].total++;
          const matchingTask = tasks.find(t => t.planId === p.id && t.date === dateStr);
          if (matchingTask?.status === 'Completed') {
            planReport[p.id].completed++;
          }
        }
      });

      // System tasks check
      if (hasRecallTasks) {
        const recallVal = tasks.find(t => t.planId === 'system-recall' && t.date === dateStr);
        if (recallVal) {
          planReport['system-recall'].total++;
          if (recallVal.status === 'Completed') {
            planReport['system-recall'].completed++;
          }
        }
      }

      if (hasRevisionTasks) {
        const revisionVal = tasks.find(t => t.planId === 'system-revision' && t.date === dateStr);
        if (revisionVal) {
          planReport['system-revision'].total++;
          if (revisionVal.status === 'Completed') {
            planReport['system-revision'].completed++;
          }
        }
      }
    }

    // Convert keys to array for Recharts
    const data = Object.entries(planReport)
      .filter(([_, stats]) => stats.total > 0)
      .map(([id, stats]) => {
        const percentage = Math.round((stats.completed / stats.total) * 100);
        return {
          id,
          name: stats.name,
          completed: stats.completed,
          total: stats.total,
          percentage: percentage
        };
      });

    return {
      data,
      currentMonthName,
      currentYear
    };
  }, [plans, tasks]);

  // Formatter for elapsed live counter
  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">

      {/* Internal Navigation Sub-header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-2.5 gap-2">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Analytics & Logging Studios</h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold">
          <button 
            onClick={() => { setActiveSubTab('charts'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'charts' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Study Progress Graphs
          </button>
          <button 
            onClick={() => { setActiveSubTab('timer-tracker'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'timer-tracker' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Live Study stopwatch
          </button>
        </div>
      </div>

      {/* TAB 1: PROGRESS GRAPHS */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          
          {/* Bento grids showing quick aggregates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-card p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Learning Volume</span>
                <span className="text-3xl font-extrabold text-white font-mono">
                  {statsSummary.totalDuration} <span className="text-xs text-slate-400 font-normal shadow-none">mins</span>
                </span>
                <p className="text-[10px] text-slate-400">Sum of overall active study sessions.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-500/10">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="glass-card p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Completed Sessions</span>
                <span className="text-3xl font-extrabold text-white font-mono">
                  {sessions.length} <span className="text-xs text-slate-400 font-normal shadow-none">rounds</span>
                </span>
                <p className="text-[10px] text-slate-400">Individual intervals logged securely.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-500/10">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Session Yield</span>
                <span className="text-3xl font-extrabold text-white font-mono">
                  {statsSummary.avgDuration} <span className="text-xs text-slate-400 font-normal shadow-none">mins</span>
                </span>
                <p className="text-[10px] text-slate-400">Duration balance per logged focus.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center border border-purple-500/10">
                <Dumbbell className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* TWO MAIN VISUALLY MAGNIFICENT SVG CHARTS SCREEN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Study Yield Time Trend (Custom glowing line vector design) */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-white leading-none">Weekly Study Time Trend</h4>
                  <span className="text-[10px] text-slate-400 block">Duration curves across last 7 sessions</span>
                </div>
                <span className="text-xs bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold font-sans border border-indigo-500/10">
                  Time Minutes
                </span>
              </div>

              {/* High-fidelity Custom responsive SVG Line chart */}
              <div className="h-56 w-full bg-slate-950/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px]" />
                
                <svg className="w-full h-full relative z-10" viewBox="0 0 100 40" preserveAspectRatio="none">
                  {/* Glowing vertical grids */}
                  <line x1="20" y1="0" x2="20" y2="40" stroke="#ffffff08" strokeWidth="0.2" />
                  <line x1="40" y1="0" x2="40" y2="40" stroke="#ffffff08" strokeWidth="0.2" />
                  <line x1="60" y1="0" x2="60" y2="40" stroke="#ffffff08" strokeWidth="0.2" />
                  <line x1="80" y1="0" x2="80" y2="40" stroke="#ffffff08" strokeWidth="0.2" />

                  {/* Shading fill area */}
                  <path 
                    d="M 5,30 Q 20,20 40,25 T 70,12 T 95,15 L 95,40 L 5,40 Z" 
                    fill="url(#indigoGrad)" 
                    opacity="0.2" 
                  />

                  {/* Glowing main vector line path */}
                  <path 
                    d="M 5,30 Q 20,20 40,25 T 70,12 T 95,15" 
                    fill="none" 
                    stroke="#818CF8" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    filter="url(#glow)"
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Coordinate Dot markers */}
                  <circle cx="5" cy="30" r="1.1" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="20" cy="20" r="1.1" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="40" cy="25" r="1.1" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="70" cy="12" r="1.1" fill="#818CF8" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="95" cy="15" r="1.1" fill="#818CF8" stroke="#FFFFFF" strokeWidth="0.3" />
                </svg>

                {/* Legend scales */}
                <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1 relative z-10 select-none border-t border-white/5">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Recall Retention & overall consistency index (ICI trend) */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-white leading-none">Interview Confidence Index Trend (ICI)</h4>
                  <span className="text-[10px] text-slate-404 block">Calculated weekly accuracy aggregate curve</span>
                </div>
                <span className="text-xs bg-emerald-555/15 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold font-sans border border-emerald-500/10">
                  Index Score %
                </span>
              </div>

              {/* High-fidelity Custom responsive SVG Area chart */}
              <div className="h-56 w-full bg-slate-950/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:12px_12px]" />
                
                <svg className="w-full h-full relative z-10" viewBox="0 0 100 40" preserveAspectRatio="none">
                  {/* Glowing vertical grids */}
                  <line x1="25" y1="0" x2="25" y2="40" stroke="#ffffff08" strokeWidth="0.2" />
                  <line x1="50" y1="0" x2="50" y2="40" stroke="#ffffff08" strokeWidth="0.2" />
                  <line x1="75" y1="0" x2="75" y2="40" stroke="#ffffff08" strokeWidth="0.2" />

                  {/* Shading fill area */}
                  <path 
                    d="M 5,26 Q 30,22 55,16 T 95,8 L 95,40 L 5,40 Z" 
                    fill="url(#emeraldGrad)" 
                    opacity="0.2" 
                  />

                  {/* Glowing main vector line path */}
                  <path 
                    d="M 5,26 Q 30,22 55,16 T 95,8" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                    filter="url(#emeraldGlow)"
                  />

                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                    <filter id="emeraldGlow">
                      <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Coordinate Dot markers */}
                  <circle cx="5" cy="26" r="1.1" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="30" cy="22" r="1.1" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="55" cy="16" r="1.1" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.3" />
                  <circle cx="95" cy="8" r="1.1" fill="#34D399" stroke="#FFFFFF" strokeWidth="0.3" />
                </svg>

                {/* Legend scales */}
                <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1 relative z-10 select-none border-t border-white/5">
                  <span>Week 1 (45%)</span>
                  <span>Week 2 (55%)</span>
                  <span>Week 3 (68%)</span>
                  <span>Week 4 (82%)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recharts Overall Consistency Bar Chart */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-white/10 gap-2">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-none">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Activity Plan Current Month Consistency Summary</span>
                </h4>
                <span className="text-[10px] text-slate-400 block">
                  Overall execution consistency percentages for {monthlyConsistencyData.currentMonthName} {monthlyConsistencyData.currentYear}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 select-none shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Excellent (&gt;=80%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-400" /> Good (&gt;=50%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Needs Work (&lt;50%)
                </span>
              </div>
            </div>

            <div className="pt-2">
              {monthlyConsistencyData.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center px-4">
                  <Calendar className="w-8 h-8 text-indigo-400 mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-white">No active planner activities recorded for this month</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Set up your spaced learning goals or general preparation habits in the Activity Planner. Your daily checks will compile here in real-time.
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={monthlyConsistencyData.data}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        dx={-5}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                <span className="font-extrabold text-white block">{item.name}</span>
                                <span className="text-indigo-300 font-semibold block">Consistency: {item.percentage}%</span>
                                <span className="text-slate-400 block text-[10px]">
                                  {item.completed} of {item.total} days completed this month
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="percentage" 
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                      >
                        {monthlyConsistencyData.data.map((entry, index) => {
                          let fill = '#818cf8';
                          if (entry.percentage >= 80) {
                            fill = '#10b981';
                          } else if (entry.percentage < 50) {
                            fill = '#f43f5e';
                          }
                          return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.85} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Allocation by Subject study time map */}
          <div className="glass-card p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-white pb-2 border-b border-white/10 uppercase tracking-wide text-xs">
              Study Time Allocation by Subject Focus (Minutes)
            </h4>

            <div className="space-y-3">
              {Object.entries(statsSummary.subjectMap).map(([name, mins]) => {
                const minsVal = mins as number;
                const percentage = statsSummary.totalDuration > 0
                  ? Math.min(100, Math.round((minsVal / statsSummary.totalDuration) * 100))
                  : 0;
                return (
                  <div key={name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300">{name}</span>
                      <span className="font-bold text-slate-100 font-mono">
                        {minsVal} mins ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}

              {Object.keys(statsSummary.subjectMap).length === 0 && (
                <div className="text-center py-6 text-slate-450">
                  No allocation metrics. Try logging a study session using the study stopwatch tracker!
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ACTIVE STUDY CHRONO STOPWATCH TIMER */}
      {activeSubTab === 'timer-tracker' && (
        <div className="glass-card p-6 space-y-6">
          
          <div className="max-w-xl mx-auto text-center space-y-6 py-6">
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-white text-lg">Active Study Session Recorder</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Time yourself while learning, reviewing core documentation, or practicing questions.
              </p>
            </div>

            {/* Stopwatch layout */}
            <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center space-y-4 transition-all ${
              timerActive 
                ? 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]' 
                : 'bg-white/5 border-white/5'
            }`}>
              {/* Digit metrics */}
              <span className="text-5xl font-black font-mono tracking-wider text-white">
                {formatTime(timerSeconds)}
              </span>

              {/* Topic targets selector */}
              <div className="w-full max-w-xs space-y-3 text-xs text-left pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Select Target study topic</label>
                  <select 
                    value={timerTopicId}
                    onChange={(e) => setTimerTopicId(e.target.value)}
                    disabled={timerActive}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans disabled:opacity-50 cursor-pointer glass-input"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                    ))}
                  </select>
                </div>

                {timerActive && (
                  <div className="space-y-1 pt-1.5 animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-300">Notes / study highlights for this session</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cleared 10 collections flash questions..."
                      value={timerNotes}
                      onChange={(e) => setTimerNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-3">
                {!timerActive ? (
                  <button 
                    onClick={startTimer}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start study</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={togglePause}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {timerPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{timerPaused ? 'Resume' : 'Pause'}</span>
                    </button>

                    <button 
                      onClick={stopAndLogSession}
                      className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop & Log</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="border border-indigo-500/10 bg-indigo-500/5 text-slate-300 p-4 rounded-xl text-xs leading-normal">
              <span className="font-extrabold text-indigo-305 block mb-0.5">Why track time?</span>
              Tracking actual minutes prevents passive reading habits, keeping study records highly disciplined and focused.
            </div>

          </div>
        </div>
      )}

    </div>
  );
});
export default Analytics;
