/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JobApplication, Interview, Mistake, Topic } from '../types';
import { 
  Building2, Calendar, FileText, CheckCircle, AlertTriangle, Play, Plus, 
  Trash2, Edit2, Search, ArrowRight, ShieldAlert, BadgeInfo, Check, Save, Sparkles, BookOpen,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useScrollGesture } from '../hooks/useScrollGesture';

const TRACKER_SUBTABS: Array<'apps' | 'interview-scheduler' | 'mistake-journal'> = ['apps', 'interview-scheduler', 'mistake-journal'];

interface InterviewTrackerProps {
  applications: JobApplication[];
  interviews: Interview[];
  mistakes: Mistake[];
  topics: Topic[];
  onAddApplication: (app: Omit<JobApplication, 'id'>) => void;
  onUpdateApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onAddInterview: (int: Omit<Interview, 'id'>) => void;
  onUpdateInterview: (int: Interview) => void;
  onDeleteInterview: (id: string) => void;
  onAddMistake: (mistake: Omit<Mistake, 'id'>) => void;
  onDeleteMistake: (id: string) => void;
}

export default React.memo(function InterviewTracker({
  applications,
  interviews,
  mistakes,
  topics,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onAddInterview,
  onUpdateInterview,
  onDeleteInterview,
  onAddMistake,
  onDeleteMistake
}: InterviewTrackerProps) {

  // Tabs: 'apps' | 'interview-scheduler' | 'mistake-journal'
  const [activeTab, setActiveTab] = useState<'apps' | 'interview-scheduler' | 'mistake-journal'>('apps');

  // Track expanded cards for long notes
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleExpandNote = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Gesture scroll + subtab switching ──
  useScrollGesture({
    activeTab: 'Goals & Applications',
    onSwipeLeft: () => {
      const idx = TRACKER_SUBTABS.indexOf(activeTab);
      if (idx < TRACKER_SUBTABS.length - 1) { setActiveTab(TRACKER_SUBTABS[idx + 1]); }
    },
    onSwipeRight: () => {
      const idx = TRACKER_SUBTABS.indexOf(activeTab);
      if (idx > 0) { setActiveTab(TRACKER_SUBTABS[idx - 1]); }
    },
  });

  // Form toggles
  const [appFormOpen, setAppFormOpen] = useState(false);
  const [appEditingId, setAppEditingId] = useState<string | null>(null);
  const [appCompany, setAppCompany] = useState('');
  const [appPosition, setAppPosition] = useState('');
  const [appAppliedDate, setAppAppliedDate] = useState('');
  const [appStatus, setAppStatus] = useState<JobApplication['status']>('Applied');
  const [appNotes, setAppNotes] = useState('');

  // Interview Form toggles
  const [intFormOpen, setIntFormOpen] = useState(false);
  const [intEditingId, setIntEditingId] = useState<string | null>(null);
  const [intCompany, setIntCompany] = useState('');
  const [intDate, setIntDate] = useState('');
  const [intStatus, setIntStatus] = useState<Interview['status']>('Scheduled');
  const [intQuestionsAskedString, setIntQuestionsAskedString] = useState('');
  const [intQuestionsMissedString, setIntQuestionsMissedString] = useState('');
  const [intFeedback, setIntFeedback] = useState('');
  const [intResult, setIntResult] = useState<Interview['result']>('Pending');

  // Mistake Form toggles
  const [mistakeFormOpen, setMistakeFormOpen] = useState(false);
  const [mistakeCompany, setMistakeCompany] = useState('');
  const [mistakeMissedQuestionsString, setMistakeMissedQuestionsString] = useState('');
  const [mistakeReason, setMistakeReason] = useState('');

  // APP FORM SUBMIT HANDLER
  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCompany || !appPosition || !appAppliedDate) return;

    if (appEditingId) {
      onUpdateApplication({
        id: appEditingId,
        company: appCompany,
        position: appPosition,
        appliedDate: appAppliedDate,
        status: appStatus,
        notes: appNotes
      });
    } else {
      onAddApplication({
        company: appCompany,
        position: appPosition,
        appliedDate: appAppliedDate,
        status: appStatus,
        notes: appNotes
      });
    }

    // Reset Form
    setAppFormOpen(false);
    setAppEditingId(null);
    setAppCompany('');
    setAppPosition('');
    setAppAppliedDate('');
    setAppStatus('Applied');
    setAppNotes('');
  };

  const triggerAppEdit = (app: JobApplication) => {
    setAppEditingId(app.id);
    setAppCompany(app.company);
    setAppPosition(app.position);
    setAppAppliedDate(app.appliedDate);
    setAppStatus(app.status);
    setAppNotes(app.notes || '');
    setAppFormOpen(true);
  };

  // INTERVIEW FORM SUBMIT HANDLER
  const handleIntSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intCompany || !intDate) return;

    const asked = intQuestionsAskedString.split(',').map(s => s.trim()).filter(Boolean);
    const missed = intQuestionsMissedString.split(',').map(s => s.trim()).filter(Boolean);

    if (intEditingId) {
      onUpdateInterview({
        id: intEditingId,
        companyName: intCompany,
        date: intDate,
        status: intStatus,
        questionsAsked: asked,
        questionsMissed: missed,
        feedback: intFeedback,
        result: intResult
      });
    } else {
      onAddInterview({
        companyName: intCompany,
        date: intDate,
        status: intStatus,
        questionsAsked: asked,
        questionsMissed: missed,
        feedback: intFeedback,
        result: intResult
      });
    }

    // Reset
    setIntFormOpen(false);
    setIntEditingId(null);
    setIntCompany('');
    setIntDate('');
    setIntStatus('Scheduled');
    setIntQuestionsAskedString('');
    setIntQuestionsMissedString('');
    setIntFeedback('');
    setIntResult('Pending');
  };

  const triggerIntEdit = (int: Interview) => {
    setIntEditingId(int.id);
    setIntCompany(int.companyName);
    setIntDate(int.date);
    setIntStatus(int.status);
    setIntQuestionsAskedString(int.questionsAsked.join(', '));
    setIntQuestionsMissedString(int.questionsMissed.join(', '));
    setIntFeedback(int.feedback);
    setIntResult(int.result);
    setIntFormOpen(true);
  };

  // MISTAKE FORM SUBMIT HANDLER
  const handleMistakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeCompany || !mistakeReason) return;

    const missed = mistakeMissedQuestionsString.split(',').map(s => s.trim()).filter(Boolean);

    onAddMistake({
      companyName: mistakeCompany,
      date: new Date().toISOString().split('T')[0],
      missedQuestions: missed,
      reason: mistakeReason
    });

    // Reset
    setMistakeFormOpen(false);
    setMistakeCompany('');
    setMistakeMissedQuestionsString('');
    setMistakeReason('');
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Navigation Sub Tab Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#f8fafc] tracking-tight">Hiring Trackers & Mistake Journals</h2>
            <p className="text-xs text-slate-400">Track job applications, tech round evaluations & recurring gaps</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/60 border border-white/10 rounded-2xl text-xs font-semibold overflow-x-auto scrollbar-none">
          <button 
            onClick={() => { setActiveTab('apps'); }}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'apps' ? 'bg-indigo-650 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Job Applications
          </button>
          <button 
            onClick={() => { setActiveTab('interview-scheduler'); }}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'interview-scheduler' ? 'bg-indigo-650 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Interviews Review
          </button>
          <button 
            onClick={() => { setActiveTab('mistake-journal'); }}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${activeTab === 'mistake-journal' ? 'bg-indigo-650 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mistake Journal
          </button>
        </div>
      </div>

      {/* TAB 1: JOB APPLICATIONS TRACKER */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          
          {appFormOpen ? (
            <form onSubmit={handleAppSubmit} className="glass-card p-5 space-y-4 max-w-2xl rounded-2xl border border-white/15">
              <h3 className="font-extrabold text-sm text-white border-b border-white/10 pb-2">
                {appEditingId ? 'Modify Registered Job Application' : 'Register New Job Application'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Company Name</label>
                  <input 
                    type="text" 
                    value={appCompany}
                    onChange={(e) => setAppCompany(e.target.value)}
                    placeholder="e.g. OpenAI Inc"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Job Role / Position</label>
                  <input 
                    type="text" 
                    value={appPosition}
                    onChange={(e) => setAppPosition(e.target.value)}
                    placeholder="Senior Backend Lead"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Applied Date</label>
                  <input 
                    type="date" 
                    value={appAppliedDate}
                    onChange={(e) => setAppAppliedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono cursor-pointer focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Current Progress Status</label>
                  <select 
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as JobApplication['status'])}
                    className="w-full px-3 py-2 rounded-xl text-xs cursor-pointer glass-input focus:outline-none"
                  >
                    <option value="Applied" className="bg-slate-900 text-white">Applied</option>
                    <option value="Interview Scheduled" className="bg-slate-900 text-white">Interview Scheduled</option>
                    <option value="Rejected" className="bg-slate-900 text-white">Rejected</option>
                    <option value="Offer Received" className="bg-slate-900 text-white">Offer Received</option>
                    <option value="Joined" className="bg-slate-900 text-white">Joined</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Additional Details / Notes</label>
                  <textarea 
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    placeholder="Referral contacts, salary expectations, notes on tech stack..."
                    className="w-full px-3 py-2 rounded-xl text-xs h-24 glass-input focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => { setAppFormOpen(false); setAppEditingId(null); }}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl text-xs hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setAppFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Job Application</span>
            </button>
          )}

          {/* Job application grid mapping - Height constrained to prevent blowout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">
            {applications.map(app => {
              const isExpanded = !!expandedNotes[app.id];
              const hasLongNotes = app.notes && app.notes.length > 100;

              return (
                <div key={app.id} className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between border border-white/10 shadow-lg relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Applied: {app.appliedDate}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        app.status === 'Joined' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' :
                        app.status === 'Offer Received' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20' :
                        app.status === 'Interview Scheduled' ? 'bg-purple-500/15 text-purple-300 border-purple-500/20' :
                        app.status === 'Rejected' ? 'bg-rose-500/15 text-rose-300 border-rose-500/20' :
                        'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base mb-0.5">{app.company}</h3>
                    <p className="text-slate-400 text-xs font-semibold uppercase font-mono tracking-wider mb-3">
                      {app.position}
                    </p>

                    {/* Height-constrained scrollable notes block */}
                    {app.notes && (
                      <div className="mb-4">
                        <div 
                          className={`text-xs text-slate-300 italic bg-slate-900/60 border border-white/10 p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                            isExpanded ? 'max-h-60 overflow-y-auto' : 'max-h-24 overflow-y-auto'
                          }`}
                        >
                          {app.notes}
                        </div>
                        {hasLongNotes && (
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(app.id)}
                            className="text-[11px] text-indigo-400 hover:underline mt-1 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show Less</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>Show Full Notes</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1.5 border-t border-white/10 pt-3 mt-auto">
                    <button 
                      onClick={() => triggerAppEdit(app)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-white/10 transition cursor-pointer"
                      title="Edit Application"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteApplication(app.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {applications.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 glass-card rounded-2xl text-slate-400 text-xs">
                No job applications registered yet. Click "Register Job Application" above to add your target roles!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INTERVIEWS Review & experience MODULE */}
      {activeTab === 'interview-scheduler' && (
        <div className="space-y-4">
          
          {intFormOpen ? (
            <form onSubmit={handleIntSubmit} className="glass-card p-5 space-y-4 max-w-2xl rounded-2xl border border-white/15">
              <h3 className="font-extrabold text-sm text-white border-b border-white/10 pb-2">
                {intEditingId ? 'Modify Interview Details' : 'Schedule New Technical Interview'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Company Name</label>
                  <input 
                    type="text" 
                    value={intCompany}
                    onChange={(e) => setIntCompany(e.target.value)}
                    placeholder="e.g. OpenAI Inc"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Round Calendar Date</label>
                  <input 
                    type="datetime-local" 
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input font-mono cursor-pointer focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Round Status</label>
                  <select 
                    value={intStatus}
                    onChange={(e) => setIntStatus(e.target.value as Interview['status'])}
                    className="w-full px-3 py-2 rounded-xl text-xs cursor-pointer glass-input focus:outline-none"
                  >
                    <option value="Scheduled" className="bg-slate-900 text-white">Scheduled</option>
                    <option value="Completed" className="bg-slate-900 text-white">Completed</option>
                    <option value="Cancelled" className="bg-slate-900 text-white">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Final Selection Result</label>
                  <select 
                    value={intResult}
                    onChange={(e) => setIntResult(e.target.value as Interview['result'])}
                    className="w-full px-3 py-2 rounded-xl text-xs cursor-pointer glass-input focus:outline-none"
                  >
                    <option value="Pending" className="bg-slate-900 text-white">Pending</option>
                    <option value="Selected" className="bg-slate-900 text-white">Selected / Passed</option>
                    <option value="Rejected" className="bg-slate-900 text-white">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1 border-t border-white/10 pt-2.5">
                  <label className="block text-xs font-extrabold text-indigo-400">Interview Experience logger (Post-interview)</label>
                  <p className="text-[10px] text-slate-400 block mb-2 font-mono">Input details to feed your weakness tracking system.</p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Questions Asked (separated by comma)</label>
                  <input 
                    type="text" 
                    value={intQuestionsAskedString}
                    onChange={(e) => setIntQuestionsAskedString(e.target.value)}
                    placeholder="Fail-fast iterator exception, Spring Proxy Bean Lifecycle"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Questions Missed / Struggled (separated by comma)</label>
                  <input 
                    type="text" 
                    value={intQuestionsMissedString}
                    onChange={(e) => setIntQuestionsMissedString(e.target.value)}
                    placeholder="Write here if you couldn't respond cleanly"
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Overall Recruiter Feedback & Self-Reflection</label>
                  <textarea 
                    value={intFeedback}
                    onChange={(e) => setIntFeedback(e.target.value)}
                    placeholder="Recruiter comments on system design or details on what concepts were requested..."
                    className="w-full px-3 py-2 rounded-xl text-xs h-24 glass-input focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => { setIntFormOpen(false); setIntEditingId(null); }}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl text-xs hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Save Interview
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIntFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Tech Round</span>
            </button>
          )}

          {/* List technical round reviews with height constraints */}
          <div className="space-y-4 pt-2">
            {interviews.map(int => {
              const formattedDate = new Date(int.date).toLocaleDateString([], { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              });

              return (
                <div key={int.id} className="glass-card glass-card-hover p-5 rounded-2xl text-slate-300 space-y-4 border border-white/10 shadow-lg relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-base">{int.companyName}</h4>
                      <span className="text-slate-400 font-mono flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        int.status === 'Scheduled' ? 'bg-indigo-500/20 text-indigo-300' :
                        int.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
                      }`}>
                        {int.status}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        int.result === 'Selected' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        int.result === 'Rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {int.result === 'Selected' ? 'PASSED/OFFERED' : int.result}
                      </span>
                    </div>
                  </div>

                  {/* Post interview height-constrained scroll block */}
                  {(int.questionsAsked.length > 0 || int.questionsMissed.length > 0 || int.feedback) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 border border-white/10 rounded-xl text-xs leading-normal">
                      
                      <div className="space-y-2">
                        <span className="block font-bold text-white font-sans uppercase text-[10px] tracking-wider">Concept Questions Logged:</span>
                        
                        <div className="space-y-1">
                          <span className="block text-[11px] font-semibold text-slate-400">Asked:</span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {int.questionsAsked.map((q, i) => (
                              <span key={i} className="bg-white/5 border border-white/10 text-slate-200 px-2 py-0.5 rounded-lg font-mono text-[10px]">
                                {q}
                              </span>
                            ))}
                            {int.questionsAsked.length === 0 && <span className="text-slate-500 italic">None logged.</span>}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[11px] font-semibold text-rose-400">Missed / Struggled:</span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {int.questionsMissed.map((q, i) => (
                              <span key={i} className="bg-rose-500/15 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold">
                                {q}
                              </span>
                            ))}
                            {int.questionsMissed.length === 0 && <span className="text-emerald-400 font-bold italic">Zero missed targets.</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4">
                        <span className="block font-bold text-white font-sans uppercase text-[10px] tracking-wider">Round Evaluation Details:</span>
                        <div className="max-h-28 overflow-y-auto pr-1 text-slate-300 italic leading-relaxed text-xs">
                          {int.feedback || 'No evaluation notes registered.'}
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="flex justify-end gap-1 border-t border-white/10 pt-3">
                    <button 
                      onClick={() => triggerIntEdit(int)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition cursor-pointer"
                      title="Edit Experience details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteInterview(int.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition cursor-pointer"
                      title="Delete interview file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {interviews.length === 0 && (
              <div className="text-center py-12 glass-card rounded-2xl text-slate-400 text-xs">
                No interview rounds scheduled yet. Click "Schedule Tech Round" to track interview feedback!
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: INTERVIEW MISTAKE JOURNAL */}
      {activeTab === 'mistake-journal' && (
        <div className="space-y-4">
          
          <div className="glass-card p-5 rounded-2xl text-xs space-y-2 border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden shadow-sm">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Interview Gap & Mistake Journal</span>
            </h4>
            <p className="max-w-xl leading-relaxed text-slate-300">
              Document your recurring weaknesses and mistakes during interviews. Gaps logged here link directly to target learning revisions.
            </p>
          </div>

          {mistakeFormOpen ? (
            <form onSubmit={handleMistakeSubmit} className="glass-card p-5 space-y-4 max-w-2xl rounded-2xl border border-white/15">
              <h3 className="font-extrabold text-sm text-white border-b border-white/10 pb-2">
                Log New Interview Mistake/Gap
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Company Name / Interview Practice Marker</label>
                  <input 
                    type="text" 
                    value={mistakeCompany}
                    onChange={(e) => setMistakeCompany(e.target.value)}
                    placeholder="e.g. Uber Tech Inc"
                    className="w-full px-3 py-2 rounded-xl glass-input focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Missed Topics/Questions (separated by commas)</label>
                  <input 
                    type="text" 
                    value={mistakeMissedQuestionsString}
                    onChange={(e) => setMistakeMissedQuestionsString(e.target.value)}
                    placeholder="Marker Interface, G1GC Sweep triggers"
                    className="w-full px-3 py-2 rounded-xl glass-input focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Root Cause of Strife / Detailed Reflection</label>
                  <textarea 
                    value={mistakeReason}
                    onChange={(e) => setMistakeReason(e.target.value)}
                    placeholder="Unaware of modCount mechanics or young generation garbage collection sweeps..."
                    className="w-full px-3 py-2 rounded-xl h-24 glass-input focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10 font-sans">
                <button 
                  type="button" 
                  onClick={() => setMistakeFormOpen(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl text-xs cursor-pointer hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Log Mistake File
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setMistakeFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Mistakes File</span>
            </button>
          )}

          {/* List Mistakes - Height Constrained cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-2">
            {mistakes.map(m => (
              <div key={m.id} className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between border border-white/10 shadow-lg relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                    <span className="font-bold text-indigo-300 border border-indigo-500/20 bg-indigo-500/15 px-2.5 py-0.5 rounded-full block text-[10px]">
                      {m.companyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Logged: {m.date}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <span className="block text-rose-400 font-bold font-sans uppercase text-[10px] tracking-wider">Concept Blunder:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                      {m.missedQuestions.map((mis, i) => (
                        <span key={i} className="bg-rose-500/15 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold">
                          {mis}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 bg-rose-500/5 border border-rose-500/15 p-3 rounded-xl text-xs text-slate-300">
                    <span className="block font-black text-rose-300 text-[11px]">Failure Reflection:</span>
                    <div className="max-h-28 overflow-y-auto pr-1 italic leading-relaxed text-slate-200">
                      "{m.reason}"
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/10 mt-3">
                  <button 
                    onClick={() => onDeleteMistake(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition cursor-pointer"
                    title="Delete Mistake Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {mistakes.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-12 glass-card rounded-2xl text-slate-400 text-xs">
                Wonderful progress! No interview mistakes logged in your journal.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );

});
