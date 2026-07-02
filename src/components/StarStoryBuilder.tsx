import React, { useState } from 'react';
import { 
  StarStory 
} from '../types';
import { 
  Plus, Edit2, Trash2, Tag, Search, Sparkles, AlertCircle, 
  HelpCircle, ChevronDown, ChevronUp, Save, X, BookOpen, 
  RefreshCw, CheckCircle, Trophy, BarChart2
} from 'lucide-react';
import AudioPlayButton from './AudioPlayButton';
import { useScrollGesture } from '../hooks/useScrollGesture';
import { callAI } from '../utils/aiService';

interface StarStoryBuilderProps {
  starStories: StarStory[];
  onAddStarStory: (story: Omit<StarStory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateStarStory: (story: StarStory) => Promise<void>;
  onDeleteStarStory: (id: string) => Promise<void>;
  cerebrasApiKey?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
  cerebrasModel?: string;
  geminiModel?: string;
  groqModel?: string;
}

const PRESET_TAGS = ['Leadership', 'Conflict Resolution', 'Crisis Management', 'Technical Innovation', 'Process Improvement', 'Team Collaboration'];

export default function StarStoryBuilder({
  starStories,
  onAddStarStory,
  onUpdateStarStory,
  onDeleteStarStory,
  cerebrasApiKey,
  geminiApiKey,
  groqApiKey,
  cerebrasModel,
  geminiModel,
  groqModel
}: StarStoryBuilderProps) {
  // Navigation states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  // ── Gesture scroll ──
  useScrollGesture({ activeTab: 'Experience & Story Builder' });


  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null means adding new
  const [formTitle, setFormTitle] = useState('');
  const [formSituation, setFormSituation] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formResult, setFormResult] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);

  // AI states
  const [isAuditingId, setIsAuditingId] = useState<string | null>(null);

  // Filtered stories
  const filteredStories = starStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.situation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? story.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const openAddForm = () => {
    setEditId(null);
    setFormTitle('');
    setFormSituation('');
    setFormTask('');
    setFormAction('');
    setFormResult('');
    setFormTags([]);
    setIsEditing(true);
  };

  const openEditForm = (story: StarStory) => {
    setEditId(story.id);
    setFormTitle(story.title);
    setFormSituation(story.situation);
    setFormTask(story.task);
    setFormAction(story.action);
    setFormResult(story.result);
    setFormTags(story.tags);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSituation.trim() || !formAction.trim() || !formResult.trim()) {
      alert('Please fill out Title, Situation, Action, and Result.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      situation: formSituation.trim(),
      task: formTask.trim(),
      action: formAction.trim(),
      result: formResult.trim(),
      tags: formTags
    };

    if (editId) {
      const match = starStories.find(s => s.id === editId);
      if (match) {
        await onUpdateStarStory({
          ...match,
          ...payload
        });
      }
    } else {
      await onAddStarStory(payload);
    }
    setIsEditing(false);
  };

  const toggleTagSelection = (tag: string) => {
    if (formTags.includes(tag)) {
      setFormTags(prev => prev.filter(t => t !== tag));
    } else {
      setFormTags(prev => [...prev, tag]);
    }
  };

  const runAiAudit = async (story: StarStory) => {
    setIsAuditingId(story.id);
    try {
      const systemPrompt = `You are an expert technical recruiter and executive communication coach.
Evaluate the candidate's STAR story based on standard behavioral scoring parameters.
Specifically verify:
1. If Situation and Task are brief but provide sufficient technical context.
2. If Action clearly highlights candidate's individual contributions, tool choices, and engineering steps (rather than saying "we did").
3. If Result is quantifiable with tangible metrics (e.g. %, ms speed improvements, dollar metrics).

You must return a JSON object with these exact fields:
- "score": a number from 0 to 100 representing overall narrative quality.
- "feedback": 3-4 sentence detailed review focusing on what went well, what is missing, and how to rewrite it.`;

      const userPrompt = `STAR Story:
Title: ${story.title}
Situation: ${story.situation}
Task: ${story.task}
Action: ${story.action}
Result: ${story.result}`;

      const raw = await callAI({
        systemPrompt,
        userPrompt,
        temperature: 0.5,
        maxTokens: 400,
        cerebrasApiKey,
        geminiApiKey,
        groqApiKey,
        cerebrasModel,
        geminiModel,
        groqModel,
        responseMimeType: "application/json"
      });

      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const audit = JSON.parse(cleaned);

      await onUpdateStarStory({
        ...story,
        aiScore: audit.score,
        aiFeedback: audit.feedback
      });
    } catch (e) {
      console.error(e);
      alert("Failed to analyze story with AI. Using mock analysis fallback.");
      // Fallback local heuristic scoring
      const hasNumber = /\b\d+%?\b/.test(story.result);
      const score = hasNumber ? 85 : 60;
      const feedback = hasNumber 
        ? "Excellent result parameter including clear quantifiable numbers. Action description is solid but can highlight architectural alternatives more."
        : "Found gaps in Result representation. Behavioral questions require quantifiable metrics (e.g. percentage improvements). Try to assign a performance index.";
      await onUpdateStarStory({
        ...story,
        aiScore: score,
        aiFeedback: feedback
      });
    } finally {
      setIsAuditingId(null);
    }
  };

  const isQuantifiable = (resultStr: string): boolean => {
    return /\b\d+%?\b/.test(resultStr);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>STAR Behavioral Story Builder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize and evaluate past leadership, engineering, and architectural milestones in behavioral formats.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New STAR Story</span>
        </button>
      </div>

      {isEditing ? (
        /* STORY FORM EDITOR */
        <form onSubmit={handleSave} className="glass-card p-6 border border-white/5 space-y-5 max-w-3xl mx-auto animate-fade-in text-xs text-slate-350">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-white text-sm">
              {editId ? 'Modify behavioral STAR Record' : 'Create new STAR story'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Story Title / Scenario</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Scaling core checkout database shard / Navigating conflict with junior PM"
                className="w-full px-3 py-2 border rounded-xl glass-input text-slate-200 bg-[#111827]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Situation (S)</label>
                <textarea
                  rows={4}
                  value={formSituation}
                  onChange={e => setFormSituation(e.target.value)}
                  placeholder="What was the background context? Mention target constraints, latency spikes, or project delays."
                  className="w-full p-3 border rounded-xl glass-input text-slate-200 bg-[#111827] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Task (T) - Optional</label>
                <textarea
                  rows={4}
                  value={formTask}
                  onChange={e => setFormTask(e.target.value)}
                  placeholder="What was your specific responsibility? What did you have to deliver or achieve?"
                  className="w-full p-3 border rounded-xl glass-input text-slate-200 bg-[#111827] resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Action (A) - Highlight your own contribution</label>
              <textarea
                rows={5}
                value={formAction}
                onChange={e => setFormAction(e.target.value)}
                placeholder="What EXACT engineering, organizational, or communication steps did YOU personally execute? Be technical and specific."
                className="w-full p-3 border rounded-xl glass-input text-slate-200 bg-[#111827] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Result (R) - Try to quantify performance</label>
              <textarea
                rows={3}
                value={formResult}
                onChange={e => setFormResult(e.target.value)}
                placeholder="What was the outcome? Always try to include metrics (e.g. 'reduced CPU utilization by 35%', 'deployed 2 weeks early')."
                className="w-full p-3 border rounded-xl glass-input text-slate-205 bg-[#111827] resize-none"
              />
              {!isQuantifiable(formResult) && formResult.trim().length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[9px] mt-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Tip: Try incorporating quantified numbers (%, ms, $) inside your Results segment to score higher in audits!</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-slate-300 font-bold block">Categorization Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map(tag => {
                  const selected = formTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagSelection(tag)}
                      className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] transition cursor-pointer ${
                        selected
                          ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-white/5 rounded-xl hover:bg-white/5 text-slate-400 transition font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      ) : (
        /* MAIN DASHBOARD STORY LIST */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-xs font-sans">
          
          {/* Filters & Tags Sidebar */}
          <div className="glass-card p-5 space-y-5 border border-white/5 self-start">
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider block font-mono">Story Search & Filters</h3>
              <p className="text-[10px] text-slate-500 leading-normal">Narrow stories catalog by title keywords or Leadership presets.</p>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl glass-input text-slate-200 bg-[#111827]"
              />
              <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-slate-400 font-bold block text-[10px] uppercase font-mono tracking-wider">Filter by presets</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1.5 rounded-lg text-left transition font-semibold cursor-pointer text-[11px] ${
                    selectedTag === '' ? 'bg-indigo-500/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Scenarios ({starStories.length})
                </button>
                {PRESET_TAGS.map(tag => {
                  const count = starStories.filter(s => s.tags.includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-left transition font-semibold cursor-pointer text-[11px] flex items-center justify-between ${
                        selectedTag === tag ? 'bg-indigo-500/20 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stories Repository */}
          <div className="lg:col-span-2 space-y-4">
            {filteredStories.length === 0 ? (
              <div className="glass-card p-12 text-center border border-white/5 text-slate-400 space-y-3">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <span className="block font-bold text-white text-sm">No STAR stories configured</span>
                  <p className="text-xs text-slate-500 leading-normal max-w-sm mx-auto">
                    Use the "New STAR Story" creator panel to register past work accomplishments. AI evaluation guides will help index your structure.
                  </p>
                </div>
              </div>
            ) : (
              filteredStories.map(story => {
                const isActive = activeStoryId === story.id;
                const quantifiable = isQuantifiable(story.result);
                
                return (
                  <div 
                    key={story.id} 
                    className={`glass-card border transition-all duration-300 ${
                      isActive ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Header bar */}
                    <div 
                      onClick={() => setActiveStoryId(isActive ? null : story.id)}
                      className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1 space-y-1 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {story.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 font-mono text-[8px] text-slate-400 font-bold uppercase">
                              {t}
                            </span>
                          ))}
                        </div>
                        <h4 className="font-extrabold text-white text-sm leading-snug">{story.title}</h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {story.aiScore !== undefined && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            story.aiScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            story.aiScore >= 60 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-rose-500/10 border-rose-500/20 text-rose-450'
                          }`}>
                            <Trophy className="w-3 h-3" />
                            <span>STAR Score: {story.aiScore}</span>
                          </span>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditForm(story); }}
                            className="p-1.5 hover:bg-white/15 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                            title="Edit Story"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (confirm("Remove this STAR card?")) onDeleteStarStory(story.id); }}
                            className="p-1.5 hover:bg-red-500/15 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Delete Story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="p-1 text-slate-600">
                            {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible STAR details */}
                    {isActive && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-4 text-left animate-fade-in">
                        
                         {/* STAR Blocks */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1 relative group/situation">
                             <div className="flex items-center justify-between">
                               <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Situation (S)</span>
                               <AudioPlayButton text={story.situation} tooltip="Read situation" className="p-1 opacity-0 group-hover/situation:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white" />
                             </div>
                             <p className="leading-relaxed text-slate-300">{story.situation}</p>
                           </div>
                           
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1 relative group/task">
                             <div className="flex items-center justify-between">
                               <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Task (T)</span>
                               <AudioPlayButton text={story.task || 'Deliver milestones under set goals.'} tooltip="Read task" className="p-1 opacity-0 group-hover/task:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white" />
                             </div>
                             <p className="leading-relaxed text-slate-300">{story.task || 'Deliver milestones under set goals.'}</p>
                           </div>
                         </div>

                         <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1 relative group/action">
                           <div className="flex items-center justify-between">
                             <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Action (A)</span>
                             <AudioPlayButton text={story.action} tooltip="Read action details" className="p-1 opacity-0 group-hover/action:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white" />
                           </div>
                           <p className="leading-relaxed text-slate-300">{story.action}</p>
                         </div>

                         <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2 relative group/result">
                           <div className="flex items-center justify-between">
                             <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Result (R)</span>
                             <div className="flex items-center gap-2">
                               {!quantifiable && (
                                 <span className="text-[8px] text-amber-400 font-mono flex items-center gap-1 animate-pulse">
                                   <AlertCircle className="w-3 h-3" />
                                   <span>Unquantified result</span>
                                 </span>
                               )}
                               <AudioPlayButton text={story.result} tooltip="Read result" className="p-1 opacity-0 group-hover/result:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white" />
                             </div>
                           </div>
                           <p className="leading-relaxed text-slate-300">{story.result}</p>
                         </div>

                         {/* AI Grading Audit Drawer */}
                         <div className="border-t border-white/5 pt-3.5 space-y-3">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <Sparkles className="w-4 h-4 text-indigo-400" />
                               <span className="font-bold text-white text-[11px]">AI Behavioral Star Audit</span>
                             </div>

                             <button
                               type="button"
                               onClick={() => runAiAudit(story)}
                               disabled={isAuditingId !== null}
                               className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer text-[10px] disabled:opacity-55"
                             >
                               {isAuditingId === story.id ? (
                                 <>
                                   <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                   <span>Evaluating Story...</span>
                                 </>
                               ) : (
                                 <>
                                   <RefreshCw className="w-3.5 h-3.5" />
                                   <span>{story.aiScore !== undefined ? 'Re-Audit Story' : 'Run Audit Scorer'}</span>
                                 </>
                               )}
                             </button>
                           </div>

                           {story.aiFeedback && (
                             <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 space-y-2 relative group/ai-feedback">
                               <div className="flex items-center justify-between border-b border-indigo-500/10 pb-1.5">
                                 <div className="flex items-center gap-2">
                                   <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                                   <span className="font-bold text-white text-[10px]">Coach's Evaluation Report &bull; Rating {story.aiScore}/100</span>
                                 </div>
                                 <AudioPlayButton text={story.aiFeedback} tooltip="Read feedback evaluation" className="p-1 opacity-0 group-hover/ai-feedback:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white" />
                               </div>
                               <p className="text-slate-300 leading-relaxed text-[11px] italic font-sans">
                                 "{story.aiFeedback}"
                               </p>
                             </div>
                           )}
                         </div>


                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
