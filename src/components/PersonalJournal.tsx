import React, { useState, useMemo } from 'react';
import { Journal, Topic, Interview, JournalType } from '../types';
import { openLocalFile, parseLocalFileRef } from '../localFileStore';
import { 
  BookOpen, Plus, Calendar, Search, Tag, Heading, Trash2, Edit3, 
  Paperclip, ArrowRight, Check, AlertCircle, FileText, CheckCircle, 
  ExternalLink, ArrowLeft, ChevronLeft, ChevronRight, HelpCircle 
} from 'lucide-react';
import AudioPlayButton from './AudioPlayButton';
import { useScrollGesture } from '../hooks/useScrollGesture';

interface PersonalJournalProps {
  journals: Journal[];
  topics: Topic[];
  interviews: Interview[];
  onAddJournal: (journal: Omit<Journal, 'id' | 'userId'>) => Promise<void>;
  onUpdateJournal: (journal: Journal) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
  onUploadAttachment: (file: File) => Promise<string>;
}

const PersonalJournal = React.memo(function PersonalJournal({
  journals,
  topics,
  interviews,
  onAddJournal,
  onUpdateJournal,
  onDeleteJournal,
  onUploadAttachment
}: PersonalJournalProps) {

  // Search, category & tags filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');


  // Form State for creating/editing journal entry
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Journal form fields
  const [type, setType] = useState<JournalType>('Daily Reflection');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [relatedTopicId, setRelatedTopicId] = useState<string>('');
  const [relatedInterviewId, setRelatedInterviewId] = useState<string>('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Active dates navigation for Journal Calendar (month selection)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date("2026-05-30T15:14:00Z"));

  // Check if journal is written today (relative to 2026-05-30)
  const todayStr = '2026-05-30';
  const isTodayJournalWritten = useMemo(() => {
    return journals.some(j => j.createdAt.startsWith(todayStr));
  }, [journals]);

  // Handle adding tag from input tag helper
  const handleAddTag = () => {
    const trimmed = tagsInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagsInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getAttachmentLabel = (attachment: string) => {
    const localRef = parseLocalFileRef(attachment);
    if (localRef) return localRef.name;

    try {
      const url = new URL(attachment);
      const filePath = decodeURIComponent(url.pathname.split('/o/')[1] || url.pathname);
      return filePath.split('/').pop()?.replace(/^\d+-/, '') || 'attachment';
    } catch {
      return attachment;
    }
  };

  const renderAttachmentLink = (attachment: string, label: string) => {
    if (parseLocalFileRef(attachment)) {
      return (
        <button
          type="button"
          onClick={() => openLocalFile(attachment)}
          className="hover:text-sky-300 hover:underline text-left"
        >
          {label}
        </button>
      );
    }

    return (
      <a href={attachment} target="_blank" rel="noreferrer" className="hover:text-sky-300 hover:underline">
        {label}
      </a>
    );
  };

  const handleAttachmentFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      const uploadedUrls = await Promise.all(Array.from(files).map(file => onUploadAttachment(file)));
      setAttachments(prev => [...prev, ...uploadedUrls.filter(url => !prev.includes(url))]);
    } catch (err) {
      console.error("Attachment upload error:", err);
      alert('Attachment save failed. Your browser may have blocked local storage or private mode storage.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = (attToRemove: string) => {
    setAttachments(attachments.filter(a => a !== attToRemove));
  };

  // Submit Journal form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      if (formMode === 'create') {
        await onAddJournal({
          type,
          title: title.trim(),
          content: content.trim(),
          tags,
          relatedTopicId: relatedTopicId || undefined,
          relatedInterviewId: relatedInterviewId || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else if (formMode === 'edit' && editingId) {
        const found = journals.find(j => j.id === editingId);
        if (found) {
          await onUpdateJournal({
            ...found,
            type,
            title: title.trim(),
            content: content.trim(),
            tags,
            relatedTopicId: relatedTopicId || undefined,
            relatedInterviewId: relatedInterviewId || undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
            updatedAt: new Date().toISOString()
          });
        }
      }
      // Reset Form State
      closeForm();
    } catch (err) {
      console.error("Journal handling error:", err);
    }
  };

  const openCreateForm = () => {
    setFormMode('create');
    setType('Daily Reflection');
    setTitle('');
    setContent('');
    setTags([]);
    setRelatedTopicId('');
    setRelatedInterviewId('');
    setAttachments([]);
    setIsFormOpen(true);
  };

  const openEditForm = (j: Journal) => {
    setFormMode('edit');
    setEditingId(j.id);
    setType(j.type);
    setTitle(j.title);
    setContent(j.content);
    setTags(j.tags || []);
    setRelatedTopicId(j.relatedTopicId || '');
    setRelatedInterviewId(j.relatedInterviewId || '');
    setAttachments(j.attachments || []);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Get distinct list of tags for search dropdown
  const allAvailableTags = useMemo(() => {
    const list = new Set<string>();
    journals.forEach(j => {
      if (j.tags) {
        j.tags.forEach(t => list.add(t));
      }
    });
    return Array.from(list);
  }, [journals]);

  // Filters calculation
  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
      const matchSearch = searchQuery === '' || 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (j.tags && j.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchType = selectedTypeFilter === 'All' || j.type === selectedTypeFilter;
      const matchTag = selectedTagFilter === 'All' || (j.tags && j.tags.includes(selectedTagFilter));

      return matchSearch && matchType && matchTag;
    });
  }, [journals, searchQuery, selectedTypeFilter, selectedTagFilter]);

  // Calendar View Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-indexed

    // Days in current selection
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sun=0, Mon=1...

    const daysList = [];

    // Prior Month days padding
    const prevMonthDaysTotal = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysList.push({
        day: prevMonthDaysTotal - i,
        isCurrentMonth: false,
        dateString: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthDaysTotal - i).padStart(2, '0')}`
      });
    }

    // Current Month days
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      daysList.push({
        day: d,
        isCurrentMonth: true,
        dateString: `${year}-${monthStr}-${dayStr}`
      });
    }

    // Next Month days padding
    const totalSlots = 42; // standard 6-row calendar
    const remainingSlots = totalSlots - daysList.length;
    for (let nm = 1; nm <= remainingSlots; nm++) {
      daysList.push({
        day: nm,
        isCurrentMonth: false,
        dateString: `${year}-${String(month + 2).padStart(2, '0')}-${String(nm).padStart(2, '0')}`
      });
    }

    return daysList;
  }, [currentCalendarDate]);

  // Quick Calendar Month nav
  const handleCalendarPrevMonth = () => {
    const old = new Date(currentCalendarDate);
    old.setMonth(old.getMonth() - 1);
    setCurrentCalendarDate(old);
  };

  const handleCalendarNextMonth = () => {
    const old = new Date(currentCalendarDate);
    old.setMonth(old.getMonth() + 1);
    setCurrentCalendarDate(old);
  };

  // ── Gesture scroll + calendar month nav ──
  useScrollGesture({
    activeTab: 'Daily Journal & Notes',
    onSwipeLeft:  handleCalendarPrevMonth,
    onSwipeRight: handleCalendarNextMonth,
  });

  return (
    <div className="space-y-6">

      {/* Header and today status widget banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main journal description */}
        <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-sky-500" />
          <div className="space-y-2">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Personal Reflection & Career Journal</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Maintain reflections on technical topics, logs of challenging coding mock errors, personal wins, and tactical improvement plans. Link entries directly with scheduled interviews or topics for complete career progression sync.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <div className="text-[10px] text-slate-400 font-mono">
              Total Recorded Entries: <strong className="text-indigo-300 font-bold">{journals.length}</strong>
            </div>
            <button
              onClick={openCreateForm}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Reflection Entry
            </button>
          </div>
        </div>

        {/* Reflection Widget for Dashboard / Pending widget */}
        <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden bg-slate-950/40">
          <div>
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Today's Reflection Status</span>
            <span className="text-[10px] text-slate-500 block">Date: May 30, 2026</span>
          </div>

          <div className="py-4">
            {isTodayJournalWritten ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-emerald-400 animate-fade-in shadow-inner">
                <CheckCircle className="w-6 h-6 shrink-0 fill-emerald-500/10" />
                <div className="min-w-0">
                  <span className="text-xs font-black block leading-none">✓ Journal Written</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block leading-relaxed">Awesome! Today's self assessment points logged.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-rose-400 animate-fade-in shadow-inner">
                <AlertCircle className="w-6 h-6 shrink-0 fill-rose-500/10" />
                <div className="min-w-0">
                  <span className="text-xs font-black block leading-none">⚠ Reflection Pending</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block leading-relaxed">No insights logged for May 30. Capture your accomplishments!</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            <button 
              onClick={openCreateForm}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-extrabold flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isTodayJournalWritten ? "Write another entries" : "Log today's wins now"}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Forms or list section */}
      {isFormOpen ? (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>{formMode === 'create' ? 'Create Reflection Entry' : 'Modify Journal Entry'}</span>
              </h4>
              <p className="text-[10px] text-slate-400">Capture your wins and draft an action plan to solidify core memory</p>
            </div>
            <button 
              onClick={closeForm}
              className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 opacity-90">Journal Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as JournalType)}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-505"
                >
                  <option value="Daily Reflection">Daily Reflection (Wins & Gaps)</option>
                  <option value="Interview Reflection">Interview Reflection (Company Q&A)</option>
                  <option value="Learning Journal">Learning Journal (Concept insights)</option>
                  <option value="Weekly Review Journal">Weekly Review Journal (Progress review)</option>
                </select>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 opacity-90">Reflection Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Collections framework core insights, AWS pipeline revision"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-505"
                />
              </div>

            </div>

            {/* content input (Rich-text area imitation) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider opacity-90">Content / Reflection Notes</label>
                <span className="text-[9px] font-mono text-slate-400">{content.length} characters</span>
              </div>
              <textarea
                required
                rows={8}
                placeholder="Write your reflection detail here... State wins, mistakes, key concepts learned, and clear bullet-point action plans for tomorrow."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#1e293b]/50 border border-white/10 text-xs text-slate-300 rounded-2xl p-4 outline-none focus:border-indigo-505 font-mono leading-relaxed resize-y"
              />
            </div>

            {/* Tags & linking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Add tags */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider opacity-90">Tags Tracker</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="add tag (e.g., springboot)"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-2.5 py-2.5 outline-none focus:border-indigo-505"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-indigo-300 text-xs font-bold rounded-xl outline-none"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-1 rounded">
                      <span>#{t}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Related study topic linking */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 opacity-90">Link Study Topic</label>
                <select
                  value={relatedTopicId || ''}
                  onChange={(e) => setRelatedTopicId(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-505"
                >
                  <option value="">-- No Direct Topic Link --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              {/* Related interview session linking */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 opacity-90">Link Live Interview</label>
                <select
                  value={relatedInterviewId || ''}
                  onChange={(e) => setRelatedInterviewId(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-505"
                >
                  <option value="">-- No Direct Interview Link --</option>
                  {interviews.map(i => (
                    <option key={i.id} value={i.id}>{i.companyName} ({i.date})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Attachments upload */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachments & Supporting Materials</span>
              <div className="max-w-md">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    handleAttachmentFiles(e.currentTarget.files);
                    e.currentTarget.value = '';
                  }}
                  disabled={isUploadingAttachment}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-2.5 py-2 outline-none focus:border-indigo-505 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-200 disabled:opacity-50"
                />
                {isUploadingAttachment && (
                  <span className="mt-2 block text-[10px] font-mono text-sky-400">Uploading attachment...</span>
                )}
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map(att => (
                    <span key={att} className="inline-flex items-center gap-1.5 text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/15 px-2 py-1 rounded">
                      <Paperclip className="w-3 h-3 shrink-0" />
                      {renderAttachmentLink(att, getAttachmentLabel(att))}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAttachment(att)}
                        className="text-slate-400 hover:text-white font-extrabold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-white/5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                Close Editor
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{formMode === 'create' ? 'Save Entry to Space' : 'Update Logged Entry'}</span>
              </button>
            </div>

          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left panel filters & Search of reflections */}
          <div className="xl:col-span-2 space-y-4">
            
            {/* Search & filters bar */}
            <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search with input icon */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reflections or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-indigo-505"
                />
              </div>

              {/* Advanced filter groups */}
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                {/* Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-2.5 py-2 outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Daily Reflection">Daily Reflection</option>
                  <option value="Interview Reflection">Interview Reflection</option>
                  <option value="Learning Journal">Learning Journal</option>
                  <option value="Weekly Review Journal">Weekly Review Journal</option>
                </select>

                {/* Tag Filter */}
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="bg-[#1e293b]/70 border border-white/10 text-xs text-slate-300 rounded-xl px-2.5 py-2 outline-none"
                >
                  <option value="All">All Tags</option>
                  {allAvailableTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* List/Tiles grid of logged reflections */}
            {filteredJournals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 glass-card border border-dashed border-white/10 text-center rounded-2xl bg-white/5 py-16">
                <FileText className="w-10 h-10 text-indigo-400/80 mb-3 animate-pulse" />
                <h5 className="text-sm font-bold text-white mb-1">No reflections matched current filters</h5>
                <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                  Adjust your search criteria or register a new study insight entry to populate your tracking dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJournals.map(journal => {
                  const linkedTopic = topics.find(t => t.id === journal.relatedTopicId);
                  const linkedInterview = interviews.find(i => i.id === journal.relatedInterviewId);

                  return (
                    <div 
                      key={journal.id} 
                      className="glass-card p-5 relative flex flex-col justify-between gap-3 bg-slate-950/20 hover:border-white/15 transition group"
                    >
                      {/* Top Type Indicator and Action triggers */}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded font-black max-w-full truncate select-none">
                          {journal.type}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => openEditForm(journal)}
                            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Edit entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteJournal(journal.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Remove entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Body summaries */}
                      <div className="space-y-1.5 flex-1 select-text relative group/journal-card">
                        <div className="text-[10px] font-mono text-slate-400 block">{journal.createdAt.split('T')[0]}</div>
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-black text-white leading-normal line-clamp-1">{journal.title}</h5>
                          <AudioPlayButton text={journal.content} tooltip="Read journal entry" className="p-0.5 opacity-0 group-hover/journal-card:opacity-100 transition-opacity bg-transparent border-none shadow-none text-slate-400 hover:text-white shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap select-text selection:bg-indigo-500/30 selection:text-white">
                          {journal.content}
                        </p>
                      </div>

                      {/* Display sub fields & tags/links */}
                      <div className="space-y-2 border-t border-white/5 pt-3 mt-1.5">
                        
                        {/* Tags display */}
                        {journal.tags && journal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {journal.tags.map(t => (
                              <span 
                                key={t} 
                                onClick={() => setSelectedTagFilter(t)}
                                className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded hover:text-indigo-400 cursor-pointer"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Linked connections information */}
                        {(linkedTopic || linkedInterview || (journal.attachments && journal.attachments.length > 0)) && (
                          <div className="flex flex-col gap-1 text-[9px] font-sans text-slate-400">
                            {linkedTopic && (
                              <div className="flex items-center gap-1 truncate">
                                <span className="w-1 h-1 rounded-full bg-teal-400" />
                                <span>Topic: <strong className="text-slate-300">{linkedTopic.name}</strong></span>
                              </div>
                            )}
                            {linkedInterview && (
                              <div className="flex items-center gap-1 truncate">
                                <span className="w-1 h-1 rounded-full bg-purple-400" />
                                <span>Interview: <strong className="text-slate-300">{linkedInterview.companyName} ({linkedInterview.date})</strong></span>
                              </div>
                            )}
                            {journal.attachments && journal.attachments.length > 0 && (
                              <div className="flex items-center gap-1 font-mono text-[8px] text-sky-400">
                                <Paperclip className="w-2.5 h-2.5" />
                                {renderAttachmentLink(journal.attachments[0], `${journal.attachments.length} attachment(s) linked`)}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right panel Journal diagnostic calendar view summary */}
          <div className="space-y-4">
            
            <div className="glass-card p-4 space-y-3.5 bg-slate-900/40">
              
              {/* Calendar controls header */}
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider block">Journal Map Calendar</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={handleCalendarPrevMonth}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-300 px-1 font-bold">
                    {currentCalendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={handleCalendarNextMonth}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Weekday indicators */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-slate-400 font-bold select-none pt-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <span key={idx}>{day}</span>
                ))}
              </div>

              {/* Grid cell layout */}
              <div className="grid grid-cols-7 gap-1 select-none">
                {calendarDays.map((cd, index) => {
                  const matchingEntries = journals.filter(j => j.createdAt.startsWith(cd.dateString));
                  const isWritten = matchingEntries.length > 0;
                  const isTodayCell = cd.dateString === todayStr;

                  let cellColor = 'bg-white/5 border border-white/5 text-slate-300';
                  if (!cd.isCurrentMonth) {
                    cellColor = 'bg-transparent text-slate-600 border-transparent opacity-30';
                  } else if (isWritten) {
                    cellColor = 'bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold';
                  } else if (isTodayCell) {
                    cellColor = 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold';
                  }

                  return (
                    <div 
                      key={index}
                      className={`h-7 rounded flex flex-col items-center justify-center p-0.5 relative transition ${cellColor}`}
                      title={`${cd.dateString}: ${isWritten ? `${matchingEntries.length} entries written` : 'No insights recorded'}`}
                    >
                      <span className="text-[9px] font-mono leading-none">{cd.day}</span>
                      {isWritten && (
                        <span className="w-1 h-1 rounded-full bg-teal-400 absolute bottom-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend descriptions */}
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded bg-teal-400" /> Insight Logged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded bg-indigo-400" /> Today (Pending)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded bg-slate-500" /> Not Recorded
                </span>
              </div>

            </div>

            {/* Quick coaching tips on reflective learning */}
            <div className="glass-card p-4 space-y-2 bg-indigo-950/15 border-indigo-500/15">
              <span className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-wider block">PrepFlow Coaching Insight</span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Reflective learning doubles retention. Reviewing mock errors or whiteboard struggles before bed allows deep motor skills synthesis. Add tags like <strong className="text-indigo-300">#failedconcept</strong> to pull up checklists in seconds next time panels ask.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
});
export default PersonalJournal;
