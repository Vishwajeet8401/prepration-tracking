/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Question, Topic, VoiceRecording } from '../types';
import { 
  Layers, HelpCircle, Check, Play, Eye, RotateCcw, AlertTriangle, 
  Trash2, Plus, Edit2, Search, Mic, Square, Volume2, Save, Sparkles, HelpCircle as HelpIcon, Calendar, ArrowRight
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  topics: Topic[];
  voiceRecordings: VoiceRecording[];
  onAddQuestion: (question: Omit<Question, 'id' | 'askedCount'>) => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onRecallResponse: (questionId: string, topicId: string, response: 'Remembered' | 'Partially' | 'Forgot') => void;
  onAddVoiceRecording: (recording: Omit<VoiceRecording, 'id'>) => void;
  onDeleteVoiceRecording: (id: string) => void;
}

export default function QuestionBank({
  questions,
  topics,
  voiceRecordings,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onRecallResponse,
  onAddVoiceRecording,
  onDeleteVoiceRecording
}: QuestionBankProps) {

  // Nested navigation: 'bank' | 'practice' | 'voice'
  const [activeTab, setActiveTab] = useState<'bank' | 'practice' | 'voice'>('bank');

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');

  // Q&A Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<Question['difficulty']>('Medium');
  const [formTopicId, setFormTopicId] = useState('');
  const [formTagsString, setFormTagsString] = useState('');
  const [formSource, setFormSource] = useState<Question['source']>('Interview');

  // Interactive Play Practice Session System
  const [practiceTopicId, setPracticeTopicId] = useState('All');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceActive, setPracticeActive] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  // Track previous responses in current practice run
  const [practiceTracker, setPracticeTracker] = useState<{question: string, status: string}[]>([]);

  // Voice Recording parameters using standard Web MediaRecorder API
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTopicId, setRecordingTopicId] = useState(topics[0]?.id || '');
  const [recordingTitle, setRecordingTitle] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed Topics switcher lists
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
      const matchTopic = topicFilter === 'All' || q.topicId === topicFilter;
      return matchSearch && matchDifficulty && matchTopic;
    });
  }, [questions, searchQuery, difficultyFilter, topicFilter]);

  // Handle create Q&A triggering
  const handleOpenCreate = () => {
    setIsEditing(true);
    setEditingQuestionId(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormDifficulty('Medium');
    setFormTopicId(topics[0]?.id || '');
    setFormTagsString('');
    setFormSource('Interview');
  };

  // Handle edit Q&A trigger
  const handleOpenEdit = (q: Question) => {
    setIsEditing(true);
    setEditingQuestionId(q.id);
    setFormQuestion(q.question);
    setFormAnswer(q.answer);
    setFormDifficulty(q.difficulty);
    setFormTopicId(q.topicId);
    setFormTagsString(q.tags.join(', '));
    setFormSource(q.source);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion || !formAnswer || !formTopicId) return;

    const parsedTags = formTagsString
      ? formTagsString.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    if (editingQuestionId) {
      const existing = questions.find(q => q.id === editingQuestionId)!;
      onUpdateQuestion({
        ...existing,
        question: formQuestion,
        answer: formAnswer,
        difficulty: formDifficulty,
        topicId: formTopicId,
        tags: parsedTags,
        source: formSource
      });
    } else {
      onAddQuestion({
        question: formQuestion,
        answer: formAnswer,
        difficulty: formDifficulty,
        topicId: formTopicId,
        tags: parsedTags,
        source: formSource,
        lastAskedDate: new Date().toISOString()
      });
    }

    setIsEditing(false);
    setEditingQuestionId(null);
  };

  // START ACTIVE RECALL PRACTICE SESSION
  const startPracticeSession = () => {
    const list = practiceTopicId === 'All' 
      ? [...questions]
      : questions.filter(q => q.topicId === practiceTopicId);
    
    if (list.length === 0) {
      alert("No questions matched the selected topic filter.");
      return;
    }

    // Shuffle questions dynamically for active recall randomized challenge
    const shuffled = list.sort(() => Math.random() - 0.5);
    setPracticeQuestions(shuffled);
    setCurrentPracticeIndex(0);
    setShowAnswer(false);
    setPracticeTracker([]);
    setSessionCompleted(false);
    setPracticeActive(true);
  };

  // Handle evaluation response
  const handleRecallEvaluation = (status: 'Remembered' | 'Partially' | 'Forgot') => {
    const activeQ = practiceQuestions[currentPracticeIndex];
    if (!activeQ) return;

    // Call state modifier (updates intervals, sets topic level forgot count logs)
    onRecallResponse(activeQ.id, activeQ.topicId, status);

    // Track response locally for final statistics summaries
    setPracticeTracker([...practiceTracker, { question: activeQ.question, status }]);

    // Progress slide
    if (currentPracticeIndex < practiceQuestions.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
      setShowAnswer(false);
    } else {
      setSessionCompleted(true);
    }
  };

  // Start voice recording explanations
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone capture features require explicit platform navigator media permissions.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Save recording
        onAddVoiceRecording({
          topicId: recordingTopicId,
          title: recordingTitle || `Verbal study session #${voiceRecordings.length + 1}`,
          audioUrl,
          duration: recordingSeconds,
          date: new Date().toISOString()
        });

        // Clear tracks
        stream.getTracks().forEach(track => track.stop());
        setRecordingTitle('');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start tick timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone device permissions blocked.", err);
      alert("Unable to access recording devices. Please configure browser permission tags.");
    }
  };

  // Stop recording Verbal Explanations
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Internal Navigation Sub-header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-2.5 gap-2">
        <div className="flex items-center gap-3">
          <HelpIcon className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Active Recall & Practices</h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg text-xs font-semibold border border-white/5">
          <button 
            onClick={() => { setActiveTab('bank'); setIsEditing(false); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Question Bank
          </button>
          <button 
            onClick={() => { setActiveTab('practice'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'practice' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Spaced Recall Session
          </button>
          <button 
            onClick={() => { setActiveTab('voice'); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === 'voice' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Voice Revision Rec
          </button>
        </div>
      </div>

      {/* TAB 1: QUESTION BANK LISTING */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          
          {isEditing && (
            <form onSubmit={handleSaveQuestion} className="glass-card p-5 space-y-4 text-slate-100">
              <h3 className="font-extrabold text-sm text-white border-b border-white/10 pb-2">
                {editingQuestionId ? 'Modify Interview Question' : 'Append New Interview Question'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Interview Question Text</label>
                  <input 
                    type="text"
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="e.g. Can you explain fail-fast dynamic structures?"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Correct Structured Answer / Key Explanation Points</label>
                  <textarea 
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    placeholder="Provide optimal response concepts or reference answer codes..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-28 font-mono glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Difficulty Grade</label>
                  <select 
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as Question['difficulty'])}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="Easy" className="bg-[#111827]">Easy</option>
                    <option value="Medium" className="bg-[#111827]">Medium</option>
                    <option value="Hard" className="bg-[#111827]">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Linked Specific Topic</label>
                  <select 
                    value={formTopicId}
                    onChange={(e) => setFormTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Tags (separated by comma)</label>
                  <input 
                    type="text"
                    value={formTagsString}
                    onChange={(e) => setFormTagsString(e.target.value)}
                    placeholder="Concurrency, Hashing, JVM, Collections"
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Origin / Source</label>
                  <select 
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as Question['source'])}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="Interview" className="bg-[#111827]">Real Interview</option>
                    <option value="Course" className="bg-[#111827]">Course</option>
                    <option value="Book" className="bg-[#111827]">System Book</option>
                    <option value="Internet" className="bg-[#111827]">Web Article</option>
                    <option value="Personal Notes" className="bg-[#111827]">Personal Notes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/20 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          )}

          {/* Question Filter row */}
          {!isEditing && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 font-bold" />
                  <input 
                    type="text" 
                    placeholder="Search Q&A details..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs glass-input font-sans"
                  />
                </div>

                <select 
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-sans cursor-pointer glass-input"
                >
                  <option value="All" className="bg-[#111827]">All Difficulties</option>
                  <option value="Easy" className="bg-[#111827]">Easy</option>
                  <option value="Medium" className="bg-[#111827]">Medium</option>
                  <option value="Hard" className="bg-[#111827]">Hard</option>
                </select>

                <select 
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-sans cursor-pointer glass-input"
                >
                  <option value="All" className="bg-[#111827]">All Linked Topics</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white rounded-xl text-xs font-bold ml-auto md:ml-0 cursor-pointer shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          )}

          {/* Question Cards Stack */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {filteredQuestions.map(q => {
                const topicObj = topics.find(t => t.id === q.topicId);
                return (
                  <div key={q.id} className="glass-card p-5 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      {/* Top flags */}
                      <div className="flex items-center justify-between gap-1 mb-2.5">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          q.difficulty === 'Hard' ? 'bg-rose-500/15 text-rose-350 border border-rose-500/10' :
                          q.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/10' :
                          'bg-emerald-500/15 text-emerald-300 border border-emerald-500/10'
                        }`}>
                          {q.difficulty}
                        </span>

                        <span className="text-[10px] text-slate-400 font-sans">
                          Source: <strong className="text-slate-200">{q.source}</strong>
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="font-extrabold text-white text-sm mb-2.5 leading-snug">
                        {q.question}
                      </h4>

                      {/* Inline key metrics / dates (Last Asked Tracker!) */}
                      <div id="last_asked_tracker" className="border-t border-dashed border-white/10 pt-2.5 my-3 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                        <div>
                          <span className="block text-slate-450 uppercase text-[9px]">Asked Count</span>
                          <span className="font-bold text-slate-205">{q.askedCount} times</span>
                        </div>
                        <div>
                          <span className="block text-slate-450 uppercase text-[9px]">Last Asked</span>
                          <span className="font-bold text-slate-205">
                            {q.lastAskedDate ? new Date(q.lastAskedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-450 uppercase text-[9px]">Last Revised</span>
                          <span className="font-bold text-slate-205">
                            {q.lastRevisedDate ? new Date(q.lastRevisedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}
                          </span>
                        </div>
                      </div>

                      {/* Answer Snippet Toggle Preview */}
                      <details className="text-xs group border border-white/5 bg-white/2 rounded-xl p-3 leading-relaxed">
                        <summary className="font-bold font-sans text-indigo-400 select-none cursor-pointer flex items-center justify-between">
                          <span>Toggle Correct Answer Preview</span>
                          <span className="text-slate-400 group-open:rotate-180 transition-transform">&darr;</span>
                        </summary>
                        <p className="mt-2 text-slate-300 font-mono whitespace-pre-line border-t border-white/5 pt-2 leading-relaxed">
                          {q.answer}
                        </p>
                      </details>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-4">
                      {topicObj && (
                        <span className="text-[10px] font-bold text-slate-450 font-mono">
                          Topic: <span className="text-indigo-305 font-sans font-semibold">{topicObj.name}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEdit(q)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-12 glass-card">
                  <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-semibold">Clear of matched questions</p>
                  <p className="text-slate-400 text-xs text-center mx-auto max-w-sm">Re-select filter bounds or register a new card using the top actions.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE SPACING RECALL PRACTICE MODULE */}
      {activeTab === 'practice' && (
        <div className="glass-card p-6 space-y-6">
          
          {/* Active selection phase */}
          {!practiceActive ? (
            <div className="max-w-xl mx-auto text-center space-y-4 py-8">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <Layers className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-white text-lg">Initialize Spacing Active Recall Round</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Our system evaluates memory decay. Evaluating answers customizes topic confidence, and clicks on 'Forgot' automatically escalate schedules into the High Priority Queue.
                </p>
              </div>

              <div className="bg-white/2 p-4 rounded-xl space-y-3.5 text-left border border-white/5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-350">Filter Topic Coverage</label>
                  <select 
                    value={practiceTopicId}
                    onChange={(e) => setPracticeTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans cursor-pointer glass-input"
                  >
                    <option value="All" className="bg-[#111827]">All Linked Topics ({questions.length} questions)</option>
                    {topics.map(t => {
                      const count = questions.filter(q => q.topicId === t.id).length;
                      return (
                        <option key={t.id} value={t.id} className="bg-[#111827]">{t.name} ({count} questions)</option>
                      );
                    })}
                  </select>
                </div>

                <button 
                  onClick={startPracticeSession}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/30 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  Start Recall Round
                </button>
              </div>
            </div>
          ) : sessionCompleted ? (
            /* Complete Phase summary report */
            <div className="max-w-xl mx-auto space-y-6 text-center py-4 text-slate-200">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-350 font-mono border border-emerald-500/10">
                Round Terminated
              </span>

              <h3 className="text-2xl font-black text-white">Recall Review Completed!</h3>
              <p className="text-xs text-slate-400">
                You have completed evaluating active technical retrieval cards. Here is how your response scores shaped:
              </p>

              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden text-left text-xs bg-white/2">
                {practiceTracker.map((tr, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-200 line-clamp-1">{tr.question}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono leading-none ${
                      tr.status === 'Remembered' ? 'bg-emerald-500/25 text-emerald-305' :
                      tr.status === 'Partially' ? 'bg-amber-500/25 text-amber-305' : 'bg-rose-500/25 text-rose-305'
                    }`}>
                      {tr.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setPracticeActive(false)}
                  className="w-full py-2 bg-white/5 text-slate-305 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Configure New Session
                </button>
                <button 
                  onClick={startPracticeSession}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-550 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Restart Practice
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Card Phase slide */
            <div className="max-w-xl mx-auto space-y-6 text-slate-200">
              
              {/* Header metrics */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-405 pb-2 border-b border-white/10">
                <span>Card: <strong>{currentPracticeIndex + 1}</strong> of <strong>{practiceQuestions.length}</strong></span>
                <span className="bg-indigo-500/15 px-2 py-0.5 rounded text-indigo-305 font-bold border border-indigo-500/10">Active Recall</span>
              </div>

              {/* Recall Card Container */}
              <div className="p-6 bg-[#00000020] border border-white/5 rounded-2xl space-y-4 shadow-xs min-h-60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-305 px-2 py-0.5 rounded font-bold font-mono">
                    Topic: {topics.find(t => t.id === practiceQuestions[currentPracticeIndex]?.topicId)?.name || 'General'}
                  </span>
                  <h4 className="text-lg font-extrabold text-white mt-3 leading-snug">
                    {practiceQuestions[currentPracticeIndex]?.question}
                  </h4>
                </div>

                {showAnswer ? (
                  <div className="mt-4 pt-4 border-t border-dashed border-white/10 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                    <span className="block font-sans font-extrabold text-indigo-400 uppercase mb-2 text-[10px] tracking-wider">Verified System Answer:</span>
                    {practiceQuestions[currentPracticeIndex]?.answer}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-indigo-420 text-indigo-305 font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                  >
                    Show Solution & Evaluators
                  </button>
                )}
              </div>

              {/* Evaluation Response actions - Only visible when solution is open */}
              {showAnswer && (
                <div className="space-y-3.5">
                  <div className="text-center font-bold text-xs text-slate-300">
                    Be honest: How cleanly did you retain this answer?
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-sans">
                    {/* Forgot option */}
                    <button 
                      onClick={() => handleRecallEvaluation('Forgot')}
                      className="p-3 bg-red-500/15 hover:bg-rose-500/25 border border-red-500/20 text-rose-300 rounded-xl flex flex-col items-center justify-center transition cursor-pointer shadow-xs group"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-xs">Forgot</span>
                      <span className="text-[9px] opacity-75 font-mono text-center mt-0.5">Flag Urgent</span>
                    </button>

                    {/* Partially option */}
                    <button 
                      onClick={() => handleRecallEvaluation('Partially')}
                      className="p-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 rounded-xl flex flex-col items-center justify-center transition cursor-pointer shadow-xs group"
                    >
                      <RotateCcw className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-xs">Partially</span>
                      <span className="text-[9px] opacity-75 font-mono text-center mt-0.5">Short Interval</span>
                    </button>

                    {/* Remembered option */}
                    <button 
                      onClick={() => handleRecallEvaluation('Remembered')}
                      className="p-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-580 text-emerald-305 rounded-xl flex flex-col items-center justify-center transition cursor-pointer shadow-xs group"
                    >
                      <Check className="w-5 h-5 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-xs">Remembered</span>
                      <span className="text-[9px] opacity-75 font-mono text-center mt-0.5">Safe Interval</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary session breaker */}
              <button 
                onClick={() => setPracticeActive(false)}
                className="block text-center text-xs text-slate-450 hover:text-white hover:underline mx-auto cursor-pointer"
              >
                Abort Session
              </button>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: VOICE REVISION RECORDER MODULE */}
      {activeTab === 'voice' && (
        <div className="glass-card p-5 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base">Voice Practice & Recorder Module</h3>
            <p className="text-xs text-slate-405 font-sans">
              Practice explaining technical concepts verbally to replicate actual panel whiteboard sessions. Record, name, identify, and listen back to criticize structural terminology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Recording Deck */}
            <div className="border border-white/5 bg-white/2 rounded-xl p-5 space-y-4">
              <div className="pb-2 border-b border-white/5">
                <h4 className="font-extrabold text-sm text-indigo-305 flex items-center gap-1.5 font-sans">
                  <Mic className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Interactive Voice Studio</span>
                </h4>
                <p className="text-[10px] text-slate-450 font-mono">Record technical briefings</p>
              </div>

              <div className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Target Study Topic</label>
                  <select 
                    value={recordingTopicId}
                    onChange={(e) => setRecordingTopicId(e.target.value)}
                    disabled={isRecording}
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans disabled:opacity-50 glass-input"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Recording Label Title</label>
                  <input 
                    type="text" 
                    placeholder="Fail-fast vs Safe briefing demo"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    disabled={isRecording}
                    className="w-full px-3 py-2 rounded-lg text-xs disabled:opacity-50 glass-input"
                  />
                </div>

                {/* Micro record buttons */}
                <div className="flex flex-col items-center justify-center py-6 bg-black/20 border border-dashed border-white/10 rounded-xl gap-2 text-center">
                  {isRecording ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse border border-red-550/20">
                        <Square className="w-6 h-6 fill-current" />
                      </div>
                      <span className="font-mono font-bold text-red-400 text-base">
                        {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-red-400 animate-pulse font-mono">Microphone capturing active...</span>
                      
                      <button 
                        onClick={stopRecording}
                        className="mt-2 px-4 py-1.5 bg-red-650 text-white text-xs font-bold rounded-lg hover:bg-indigo-850 cursor-pointer shadow-xs transition"
                      >
                        Stop & Compile
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                        <Mic className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-slate-400 font-bold block">Ready for voice trace</span>
                      <button 
                        onClick={startRecording}
                        className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 cursor-pointer shadow-xs transition border border-indigo-550/30"
                      >
                        Record Answer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Recordings Library */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2 pb-2 border-b border-white/10">
                <Volume2 className="w-4.5 h-4.5 text-indigo-400" />
                <span>Saved Briefing Track Library ({voiceRecordings.length})</span>
              </h4>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {voiceRecordings.map(rec => {
                  const correlatedTopic = topics.find(t => t.id === rec.topicId);
                  return (
                    <div key={rec.id} className="p-3 bg-white/2 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-white text-sm leading-none">{rec.title}</h5>
                          <span className="text-[9px] font-mono font-bold bg-indigo-500/15 text-indigo-305 px-2 py-0.2 rounded-full border border-indigo-500/10">
                            {correlatedTopic?.name || 'General'}
                          </span>
                        </div>
                        <span className="block text-slate-400 text-[10px] font-mono leading-none">
                          Recorded: {new Date(rec.date).toLocaleDateString()} &bull; Duration: {rec.duration}s
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <audio src={rec.audioUrl} controls className="h-8 max-w-44 lg:max-w-xs scale-90 invert opacity-80" />
                        <button 
                          onClick={() => onDeleteVoiceRecording(rec.id)}
                          className="p-1.5 text-slate-450 hover:text-rose-400 hover:bg-white/5 rounded-lg border border-white/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {voiceRecordings.length === 0 && (
                  <div className="text-center py-10 bg-[#ffffff01] rounded-xl border border-dashed border-white/5 text-slate-500 text-xs font-sans">
                    No active recordings detected. Configure topic settings and press record to build oral brief histories.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
