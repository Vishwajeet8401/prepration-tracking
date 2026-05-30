/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { StudySession, Question, Interview, JobApplication, DailyTask } from '../types';
import { Award, CheckCircle2, Lock, Sparkles, BookOpen, Flame, HelpCircle, Briefcase, Send, Target, Calendar, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';

interface AchievementsViewProps {
  sessions: StudySession[];
  questions: Question[];
  interviews: Interview[];
  applications: JobApplication[];
  streakDays: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'study' | 'recall' | 'streak' | 'interview' | 'application';
  target: number;
  currentValue: number;
  isUnlocked: boolean;
  progressPercent: number;
  icon: any;
}

export default function AchievementsView({
  sessions,
  questions,
  interviews,
  applications,
  streakDays
}: AchievementsViewProps) {

  const [celebratedBadge, setCelebratedBadge] = useState<Achievement | null>(null);

  const totalStudyHours = useMemo(() => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [sessions]);

  const totalQuestionsReviewed = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.askedCount || 0), 0);
  }, [questions]);

  const achievementsList = useMemo<Achievement[]>(() => {
    const specs = [
      { id: 'study-1', name: 'First Study step', desc: 'Complete your first high-focus study session', cat: 'study', target: 0.1, val: totalStudyHours, icon: BookOpen },
      { id: 'study-10', name: '10 Study Hours', desc: 'Commit 10 high-focus hours to topics mastery', cat: 'study', target: 10, val: totalStudyHours, icon: BookOpen },
      { id: 'study-50', name: '50 Study Hours', desc: 'Unwavering commitment: 50 logged hours', cat: 'study', target: 50, val: totalStudyHours, icon: BookOpen },
      { id: 'study-100', name: '100 Study Hours', desc: 'Prepping Specialist: 100 study hours achieved', cat: 'study', target: 100, val: totalStudyHours, icon: BookOpen },
      { id: 'study-500', name: '500 Study Hours', desc: 'Mastery Veteran: Glorious 500 study hours', cat: 'study', target: 500, val: totalStudyHours, icon: BookOpen },

      { id: 'recall-1', name: 'First Recall Session', desc: 'Review your first active spacing flashcard', cat: 'recall', target: 1, val: totalQuestionsReviewed, icon: HelpCircle },
      { id: 'recall-100', name: '100 Questions Reviewed', desc: 'Reinvigorated focus: 100 active flashcard repetitions', cat: 'recall', target: 100, val: totalQuestionsReviewed, icon: HelpCircle },
      { id: 'recall-500', name: '500 Questions Reviewed', desc: 'Deep Memory: 500 spaced repetition questions reviewed', cat: 'recall', target: 500, val: totalQuestionsReviewed, icon: HelpCircle },
      { id: 'recall-1000', name: '1000 Questions Reviewed', desc: 'Unbreakable Recall: 1000 spacing repetitions logged', cat: 'recall', target: 1000, val: totalQuestionsReviewed, icon: HelpCircle },

      { id: 'streak-7', name: '7 Day Streak', desc: 'Launch consistency: Maintain a 7-day preparation streak', cat: 'streak', target: 7, val: streakDays, icon: Flame },
      { id: 'streak-15', name: '15 Day Streak', desc: 'Unstoppable Momentum: 15 consecutive active days', cat: 'streak', target: 15, val: streakDays, icon: Flame },
      { id: 'streak-30', name: '30 Day Streak', desc: 'Habit Mastery: Anchor your efforts for 30 consecutive days', cat: 'streak', target: 30, val: streakDays, icon: Flame },
      { id: 'streak-60', name: '60 Day Streak', desc: 'Elite Endurance: 60 continuous days of focus', cat: 'streak', target: 60, val: streakDays, icon: Flame },
      { id: 'streak-100', name: '100 Day Streak', desc: 'Centurion Prep: 100 days of pure preparation discipline', cat: 'streak', target: 100, val: streakDays, icon: Flame },

      { id: 'interview-1', name: 'First Interview Logged', desc: 'Log your first interview slot or review notes', cat: 'interview', target: 1, val: interviews.length, icon: Calendar },
      { id: 'interview-10', name: '10 Interviews Logged', desc: 'Interview Veteran: Handle 10 corporate panels', cat: 'interview', target: 10, val: interviews.length, icon: Calendar },
      { id: 'interview-25', name: '25 Interviews Logged', desc: 'Offer Magnet: Compete in 25 technical panels', cat: 'interview', target: 25, val: interviews.length, icon: Calendar },

      { id: 'application-1', name: 'First Application', desc: 'Initiate search: Submit your first job application', cat: 'application', target: 1, val: applications.length, icon: Send },
      { id: 'application-50', name: '50 Applications', desc: 'Active Candidate: 50 resumes sent across opportunities', cat: 'application', target: 50, val: applications.length, icon: Send },
      { id: 'application-100', name: '100 Applications', desc: 'Market Specialist: 100 active outreach submissions', cat: 'application', target: 100, val: applications.length, icon: Send }
    ];

    return specs.map(s => {
      const isUnlocked = s.val >= s.target;
      const progressPercent = Math.min(100, Math.floor((s.val / s.target) * 100));
      return {
        id: s.id,
        name: s.name,
        description: s.desc,
        category: s.cat as any,
        target: s.target,
        currentValue: s.val,
        isUnlocked,
        progressPercent,
        icon: s.icon
      };
    });
  }, [totalStudyHours, totalQuestionsReviewed, streakDays, interviews, applications]);

  const unlockedCount = useMemo(() => {
    return achievementsList.filter(a => a.isUnlocked).length;
  }, [achievementsList]);

  const totalPossible = achievementsList.length;

  const handleInspectBadge = (badge: Achievement) => {
    if (badge.isUnlocked) {
      setCelebratedBadge(badge);
    }
  };

  useEffect(() => {
    if (celebratedBadge) {
      // Trigger a brilliant GSAP rotation celebrate effect on the popup badge element!
      const ctx = gsap.context(() => {
        gsap.fromTo(".celebrate-trophy", 
          { scale: 0.1, rotation: -200, opacity: 0 }, 
          { scale: 1, rotation: 0, opacity: 1, duration: 0.85, ease: "back.out(1.5)" }
        );
        gsap.fromTo(".celebrate-particle", 
          { scale: 0, x: 0, y: 0, opacity: 1 }, 
          { scale: 1.2, x: () => (Math.random() - 0.5) * 180, y: () => (Math.random() - 0.5) * 180, opacity: 0, duration: 1.2, stagger: 0.05, ease: "slow(0.7, 0.7, false)" }
        );
      });
      return () => ctx.revert();
    }
  }, [celebratedBadge]);

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Header Hero Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden rounded-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/5">
            <Trophy className="w-7 h-7 text-emerald-400 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>Your Career Milestone Achievements</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-405 border border-emerald-500/20 rounded-full">
                Interactive Badges Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl font-sans">
              Consistent preparation triggers dynamic reward flags. Clicking any unlocked badge reveals an interactive high-fidelity 3D celebrations sequence.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 px-5 py-3.5 rounded-2xl text-center shrink-0 w-full md:w-auto shadow-md">
          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono">Completed Badges</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
            {unlockedCount} <span className="text-xs text-slate-500">/ {totalPossible}</span>
          </div>
          <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto mt-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-indigo-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(unlockedCount / totalPossible) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Standard Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Study */}
        <div className="glass-card p-5 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-7 h-7 bg-indigo-550/10 text-indigo-400 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white font-display">Focus Endurance</h4>
              <span className="text-[10px] text-slate-400 font-mono">Sessions: {totalStudyHours} hrs</span>
            </div>
          </div>
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {achievementsList.filter(a => a.category === 'study').map(a => (
              <AchievementCard key={a.id} a={a} onClick={() => handleInspectBadge(a)} />
            ))}
          </div>
        </div>

        {/* Spaced Recall */}
        <div className="glass-card p-5 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-7 h-7 bg-indigo-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white font-display">Memory Spacing Retention</h4>
              <span className="text-[10px] text-slate-400 font-mono">Flashcards repetitions: {totalQuestionsReviewed}</span>
            </div>
          </div>
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {achievementsList.filter(a => a.category === 'recall').map(a => (
              <AchievementCard key={a.id} a={a} onClick={() => handleInspectBadge(a)} />
            ))}
          </div>
        </div>

        {/* Consistency Streaks */}
        <div className="glass-card p-5 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-7 h-7 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white font-display">Consistency Streaks</h4>
              <span className="text-[10px] text-slate-400 font-mono">Streak count: {streakDays} days</span>
            </div>
          </div>
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {achievementsList.filter(a => a.category === 'streak').map(a => (
              <AchievementCard key={a.id} a={a} onClick={() => handleInspectBadge(a)} />
            ))}
          </div>
        </div>

        {/* Job Interviews */}
        <div className="glass-card p-5 space-y-4 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-7 h-7 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white font-display">Interviews Prep Channels</h4>
              <span className="text-[10px] text-slate-400 font-mono">Interviews: {interviews.length} logged</span>
            </div>
          </div>
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {achievementsList.filter(a => a.category === 'interview').map(a => (
              <AchievementCard key={a.id} a={a} onClick={() => handleInspectBadge(a)} />
            ))}
          </div>
        </div>

        {/* Career Applications trackers */}
        <div className="glass-card p-5 space-y-4 rounded-2xl md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <div className="w-7 h-7 bg-pink-500/10 text-pink-400 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white font-display">Resumes & Application</h4>
              <span className="text-[10px] text-slate-400 font-mono">Resumes: {applications.length} sent</span>
            </div>
          </div>
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {achievementsList.filter(a => a.category === 'application').map(a => (
              <AchievementCard key={a.id} a={a} onClick={() => handleInspectBadge(a)} />
            ))}
          </div>
        </div>

      </div>

      {/* 3. Celebration Dialog Modal (GSAP and Particle Celebration Layer) */}
      <AnimatePresence>
        {celebratedBadge && (
          <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-sm p-6 text-center rounded-2xl relative overflow-hidden"
            >
              {/* Star Particles Burst indicators */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i} 
                    className="celebrate-particle absolute w-3 h-3 text-amber-400"
                  >
                    <Star className="w-full h-full fill-current" />
                  </div>
                ))}
              </div>

              {/* Glowing Halo Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex justify-center pt-4">
                  <div className="celebrate-trophy w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 relative">
                    <Trophy className="w-10 h-10" />
                    <Sparkles className="absolute top-2 right-2 w-4 h-4 text-amber-300 animate-spin" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-widest font-extrabold text-indigo-400 uppercase">Milestone Achieved</span>
                  <h3 className="text-lg font-bold text-white font-display">{celebratedBadge.name}</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-sans px-3">
                    {celebratedBadge.description}
                  </p>
                </div>

                <div className="bg-[#1e293b]/50 border border-white/5 p-3 rounded-xl font-mono text-center text-xs">
                  <span className="text-slate-400 uppercase tracking-wider block text-[8px] mb-1">Metrics verified</span>
                  <span className="text-white font-extrabold text-sm">{Math.round(celebratedBadge.currentValue * 10) / 10} / {celebratedBadge.target} reached</span>
                </div>

                <button 
                  onClick={() => setCelebratedBadge(null)}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-605 text-white font-bold text-xs rounded-xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                  Fabulous! Close Celebration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function AchievementCard({ a, onClick }: { a: Achievement; onClick: () => void; key?: string }) {
  const Icon = a.icon;
  return (
    <motion.div 
      whileHover={a.isUnlocked ? { scale: 1.015, borderColor: 'rgba(16, 185, 129, 0.3)' } : {}}
      onClick={onClick}
      className={`p-3.5 rounded-xl border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
        a.isUnlocked 
          ? 'bg-emerald-500/5 border-emerald-500/10 cursor-pointer group' 
          : 'bg-white/5 border-white/5 opacity-80'
      }`}
    >
      <div className="flex items-start gap-3">
        
        {/* Left icon bubble indicator */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
          a.isUnlocked 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:rotate-12' 
            : 'bg-white/5 text-slate-500 border-white/5'
        }`}>
          {a.isUnlocked ? <Icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
        </div>

        {/* Data section */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h5 className={`text-xs font-bold font-display truncate ${a.isUnlocked ? 'text-white' : 'text-slate-400'}`}>
              {a.name}
            </h5>
            {a.isUnlocked && (
              <span className="text-[10px] font-mono font-black text-emerald-400 flex items-center shrink-0">
                <CheckCircle2 className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 pr-2 font-sans">
            {a.description}
          </p>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-[9px] font-mono">
              <span className="text-slate-405 font-bold">
                {Math.round(a.currentValue * 10) / 10} / {a.target}
              </span>
              <span className={a.isUnlocked ? 'text-emerald-400 font-extrabold' : 'text-indigo-405'}>
                {a.progressPercent}%
              </span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  a.isUnlocked ? 'bg-emerald-400' : 'bg-indigo-400'
                }`}
                style={{ width: `${a.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
