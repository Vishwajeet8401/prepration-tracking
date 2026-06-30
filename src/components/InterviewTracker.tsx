/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JobApplication, Interview, Mistake, Topic } from '../types';
import { 
  Building2, Calendar, FileText, CheckCircle, AlertTriangle, Play, Plus, 
  Trash2, Edit2, Search, ArrowRight, ShieldAlert, BadgeInfo, Check, Save, Sparkles, BookOpen
} from 'lucide-react';

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

const InterviewTracker = React.memo(function InterviewTracker({
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

  // APP FORM EDIT CAPTURE
  const triggerAppEdit = (app: JobApplication) => {
    setAppFormOpen(true);
    setAppEditingId(app.id);
    setAppCompany(app.company);
    setAppPosition(app.position);
    setAppAppliedDate(app.appliedDate);
    setAppStatus(app.status);
    setAppNotes(app.notes || '');
  };

  // INTERVIEW FORM SUBMIT HANDLER
  const handleIntSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intCompany || !intDate) return;

    const asked = intQuestionsAskedString ? intQuestionsAskedString.split(',').map(s => s.trim()).filter(Boolean) : [];
    const missed = intQuestionsMissedString ? intQuestionsMissedString.split(',').map(s => s.trim()).filter(Boolean) : [];

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

  // INTERVIEW FORM EDIT CAPTURE
  const triggerIntEdit = (int: Interview) => {
    setIntFormOpen(true);
    setIntEditingId(int.id);
    setIntCompany(int.companyName);
    setIntDate(int.date);
    setIntStatus(int.status);
    setIntQuestionsAskedString(int.questionsAsked.join(', '));
    setIntQuestionsMissedString(int.questionsMissed.join(', '));
    setIntFeedback(int.feedback);
    setIntResult(int.result);
  };

  // MISTAKE SUBMIT HANDLER
  const handleMistakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeCompany || !mistakeMissedQuestionsString || !mistakeReason) return;

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
    <div className="space-y-6">

      {/* Navigation Sub Tab Layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-2.5 gap-2">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Hiring Trackers & Mistake Journals</h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold">
          <button 
            onClick={() => { setActiveTab('apps'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'apps' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Job Applications
          </button>
          <button 
            onClick={() => { setActiveTab('interview-scheduler'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'interview-scheduler' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Interviews Review
          </button>
          <button 
            onClick={() => { setActiveTab('mistake-journal'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'mistake-journal' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Mistake Journal
          </button>
        </div>
      </div>

      {/* TAB 1: JOB APPLICATIONS TRACKER */}
      {activeTab === 'apps' && (
        <div className="space-y-4 text-slate-205">
          
          {appFormOpen ? (
            <form onSubmit={handleAppSubmit} className="glass-card p-5 space-y-4 max-w-2xl">
              <h3 className="font-extrabold text-sm text-white border-b border-white/10 pb-2">
                {appEditingId ? 'Modify Registered Job Application' : 'Register New Job Application'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Company Name</label>
                  <input 
                    type="text" 
                    value={appCompany}
                    onChange={(e) => setAppCompany(e.target.value)}
                    placeholder="e.g. OpenAI Inc"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
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
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Applied Date</label>
                  <input 
                    type="date" 
                    value={appAppliedDate}
                    onChange={(e) => setAppAppliedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input font-sans cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Current Progress Status</label>
                  <select 
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as JobApplication['status'])}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="Applied" className="bg-[#111827]">Applied</option>
                    <option value="Interview Scheduled" className="bg-[#111827]">Interview Scheduled</option>
                    <option value="Rejected" className="bg-[#111827]">Rejected</option>
                    <option value="Offer Received" className="bg-[#111827]">Offer Received</option>
                    <option value="Joined" className="bg-[#111827]">Joined</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Additional Details / Notes</label>
                  <textarea 
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    placeholder="Wired referral or recruiter contacts, salary boundaries, links to job specifications..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-20 glass-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setAppFormOpen(false); setAppEditingId(null); }}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 border border-indigo-505 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setAppFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Job Application</span>
            </button>
          )}

          {/* Job application list mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {applications.map(app => (
              <div key={app.id} className="glass-card p-5 flex flex-col justify-between hover:border-white/20 transition relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Applied: {app.appliedDate}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                      app.status === 'Joined' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/10' :
                      app.status === 'Offer Received' ? 'bg-indigo-500/15 text-indigo-303 border-indigo-500/10' :
                      app.status === 'Interview Scheduled' ? 'bg-purple-500/15 text-purple-303 border-purple-500/10' :
                      app.status === 'Rejected' ? 'bg-rose-500/15 text-rose-303 border-rose-500/10' :
                      'bg-white/5 text-slate-400 border-white/5'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base mb-1">{app.company}</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase font-mono tracking-wider mb-3">
                    {app.position}
                  </p>

                  {app.notes && (
                    <p className="text-xs text-slate-300 italic bg-white/2 border border-white/5 p-3 rounded-lg leading-relaxed mb-4 whitespace-pre-wrap">
                      {app.notes}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-1.5 border-t border-white/5 pt-3.5">
                  <button 
                    onClick={() => triggerAppEdit(app)}
                    className="p-1.5 text-slate-404 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDeleteApplication(app.id)}
                    className="p-1.5 text-slate-404 hover:text-rose-404 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERVIEWS Review & experience MODULE */}
      {activeTab === 'interview-scheduler' && (
        <div className="space-y-4 text-slate-200">
          
          {intFormOpen ? (
            <form onSubmit={handleIntSubmit} className="glass-card p-5 space-y-4 max-w-2xl text-slate-100">
              <h3 className="font-black text-sm text-white border-b border-white/10 pb-2">
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
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Round Calendar Date</label>
                  <input 
                    type="datetime-local" 
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input font-sans cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Round Status</label>
                  <select 
                    value={intStatus}
                    onChange={(e) => setIntStatus(e.target.value as Interview['status'])}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="Scheduled" className="bg-[#111827]">Scheduled</option>
                    <option value="Completed" className="bg-[#111827]">Completed</option>
                    <option value="Cancelled" className="bg-[#111827]">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Final Selection Result</label>
                  <select 
                    value={intResult}
                    onChange={(e) => setIntResult(e.target.value as Interview['result'])}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="Pending" className="bg-[#111827]">Pending</option>
                    <option value="Selected" className="bg-[#111827]">Selected / Passed</option>
                    <option value="Rejected" className="bg-[#111827]">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1 border-t border-white/5 pt-2.5">
                  <label className="block text-xs font-extrabold text-indigo-400">Interview Experience logger (Post-interview)</label>
                  <p className="text-[10px] text-slate-400 block mb-2 font-mono">Input collected details to feedback the weak nodes system.</p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Questions Asked (separated by comma)</label>
                  <input 
                    type="text" 
                    value={intQuestionsAskedString}
                    onChange={(e) => setIntQuestionsAskedString(e.target.value)}
                    placeholder="Fail-fast iterator exception, Spring Proxy Bean Lifecycle"
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Questions Missed / Blundered (separated by comma)</label>
                  <input 
                    type="text" 
                    value={intQuestionsMissedString}
                    onChange={(e) => setIntQuestionsMissedString(e.target.value)}
                    placeholder="Write here if you couldn't respond cleanly"
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Overall Recruiter Feedback & Self-Reflection</label>
                  <textarea 
                    value={intFeedback}
                    onChange={(e) => setIntFeedback(e.target.value)}
                    placeholder="Recruiter comments on system design or details on what concepts were requested during deep-dives..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-20 glass-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => { setIntFormOpen(false); setIntEditingId(null); }}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-505 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
                >
                  Save Interview
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIntFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 border border-indigo-500/30 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Tech Round</span>
            </button>
          )}

          {/* List technical round reviews */}
          <div className="space-y-4 pt-2">
            {interviews.map(int => {
              const formattedDate = new Date(int.date).toLocaleDateString([], { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              });

              return (
                <div key={int.id} className="glass-card p-5 text-slate-300 space-y-4 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-base">{int.companyName}</h4>
                      <span className="text-slate-404 font-mono flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        int.status === 'Scheduled' ? 'bg-indigo-500/15 text-indigo-300' :
                        int.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'
                      }`}>
                        {int.status}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        int.result === 'Selected' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/10' :
                        int.result === 'Rejected' ? 'bg-rose-500/25 text-rose-300 border-rose-500/10' : 'bg-amber-500/15 text-amber-300 border-amber-500/10'
                      }`}>
                        {int.result === 'Selected' ? 'PASSED/OFFERED' : int.result}
                      </span>
                    </div>
                  </div>

                  {/* Post interview variables */}
                  {(int.questionsAsked.length > 0 || int.questionsMissed.length > 0 || int.feedback) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 border border-white/5 rounded-xl text-slate-350 leading-normal">
                      
                      <div className="space-y-2">
                        <span className="block font-bold text-white font-sans uppercase text-[10px] tracking-wider">Concept Questions Logged:</span>
                        
                        <div className="space-y-1.5">
                          <span className="block font-semibold text-slate-400">Asked:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {int.questionsAsked.map((q, i) => (
                              <span key={i} className="bg-white/5 border border-white/10 text-slate-200 px-2 py-0.5 rounded-sm font-mono text-[10px]">
                                {q}
                              </span>
                            ))}
                            {int.questionsAsked.length === 0 && <span className="text-slate-500 italic">None logged.</span>}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block font-semibold text-rose-400">Missed / Struggled:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {int.questionsMissed.map((q, i) => (
                              <span key={i} className="bg-rose-500/15 border border-rose-500/10 text-rose-350 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold">
                                {q}
                              </span>
                            ))}
                            {int.questionsMissed.length === 0 && <span className="text-emerald-400 font-bold italic">Perfect! Zero logged missed targets.</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-l border-white/5 pl-0 md:pl-4">
                        <span className="block font-bold text-white font-sans uppercase text-[10px] tracking-wider">Round Evaluation details:</span>
                        <p className="italic text-slate-350 line-clamp-4 leading-relaxed">
                          {int.feedback || 'No comments registered yet.'}
                        </p>
                      </div>

                    </div>
                  )}

                  <div className="flex justify-end gap-1 border-t border-white/5 pt-3.5">
                    <button 
                      onClick={() => triggerIntEdit(int)}
                      className="p-1.5 text-slate-404 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition"
                      title="Edit Experience details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteInterview(int.id)}
                      className="p-1.5 text-slate-404 hover:text-rose-404 hover:bg-white/5 rounded-lg transition"
                      title="Delete interview file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: INTERVIEW MISTAKE JOURNAL */}
      {activeTab === 'mistake-journal' && (
        <div className="space-y-4 text-slate-205">
          
          <div className="border border-indigo-500/15 bg-indigo-500/5 p-5 rounded-2xl text-xs space-y-3 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5 z-10 relative">
              <ShieldAlert className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>What is an Interview Mistake Journal?</span>
            </h4>
            <p className="max-w-xl leading-relaxed text-slate-300 relative z-10">
              Your most recurring weaknesses are documented here. Failures to remember simple concepts like Marker Interfaces or Completable Thread pool parameters are mapped directly back to target revision indices.
            </p>
          </div>

          {mistakeFormOpen ? (
            <form onSubmit={handleMistakeSubmit} className="glass-card p-5 space-y-4 max-w-2xl text-slate-100">
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
                    className="w-full px-3 py-2 rounded-lg glass-input"
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
                    className="w-full px-3 py-2 rounded-lg glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Root Cause of Strife / Detailed Reflection</label>
                  <textarea 
                    value={mistakeReason}
                    onChange={(e) => setMistakeReason(e.target.value)}
                    placeholder="Unaware of modCount mechanics or lacked memory promotion rules for young garbage collection sweeps..."
                    className="w-full px-3 py-2 rounded-lg h-28 glass-input"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5 font-sans">
                <button 
                  type="button" 
                  onClick={() => setMistakeFormOpen(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 border border-indigo-505 text-white text-xs font-bold rounded-lg cursor-pointer shadow"
                >
                  Log Mistake File
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setMistakeFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/30 text-white rounded-xl text-xs font-bold cursor-pointer shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Mistakes File</span>
            </button>
          )}

          {/* List Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {mistakes.map(m => (
              <div key={m.id} className="glass-card p-5 relative flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                    <span className="font-bold text-indigo-305 border border-indigo-500/10 bg-indigo-500/15 px-2.5 py-0.5 rounded-full block text-[10px]">
                      {m.companyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Logged: {m.date}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <span className="block text-rose-400 font-bold font-sans uppercase text-[10px] tracking-wider">Concept Blunder:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.missedQuestions.map((mis, i) => (
                        <span key={i} className="bg-rose-500/15 text-rose-300 border border-rose-500/10 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                          {mis}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl leading-normal text-xs text-slate-300">
                    <span className="block font-black text-rose-300">Failure Reflection:</span>
                    <p className="italic leading-relaxed text-slate-200">
                      "{m.reason}"
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/5 mt-4">
                  <button 
                    onClick={() => onDeleteMistake(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition cursor-pointer"
                    title="Delete Mistake Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {mistakes.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-10 glass-card text-slate-450 text-xs font-sans">
                Wonderful progress! No interview mistakes logged in your journal. Continue practicing recall sets regularly.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );

  // Quick helper to bypass typescript setter scoping warning with standard names
  function setMakeCompany(val: string) {
    setMistakeCompany(val);
  }
})
export default InterviewTracker;
