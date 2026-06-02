/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Topic, Subject } from '../types';
import { useStackedPanelHistory } from '../hooks/useStackedPanelHistory';
import { useAllTopics } from '../hooks/useAllTopics';
import { 
  Plus, Edit2, Trash2, Search, Link2, AlertTriangle, Book, HelpCircle, 
  Check, Save, Eye, ArrowRight, ShieldAlert, Sparkles, BookOpen, Layers
} from 'lucide-react';

interface TopicManagementProps {
  subjects: Subject[];
  onAddSubject: (s: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
  topics: Topic[];
  onAddTopic: (topic: Omit<Topic, 'id' | 'revisionCount' | 'forgotCount'>) => void;
  onUpdateTopic: (topic: Topic) => void;
  onDeleteTopic: (id: string) => void;
  onMergeTopics: (primaryTopicId: string, duplicateTopicIds: string[]) => void;
  onLoadMore?: () => void;
  userId?: string;
}

type FlatItem = 
  | { type: 'header', subjectId: string, subject: Subject | undefined }
  | { type: 'topic', topic: Topic };

const GridContainer = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div {...props} ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2" />
));
GridContainer.displayName = 'GridContainer';

const ItemContainer = forwardRef<HTMLDivElement, any>(({ 'data-index': index, context, children, ...props }, ref) => {
  const isHeader = context?.flatItems?.[index]?.type === 'header';
  return (
    <div {...props} ref={ref} className={isHeader ? 'col-span-full mb-2 mt-4' : 'col-span-1 h-full'}>
      {children}
    </div>
  );
});
ItemContainer.displayName = 'ItemContainer';

export default function TopicManagement({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onMergeTopics,
  onLoadMore,
  userId
}: TopicManagementProps) {

  // Fetch full lightweight topic list for dependency mapping to bypass pagination limit
  const { allTopics } = useAllTopics(userId);
  
  // Tabs: 'subjects' | 'all' | 'dependencies' | 'quick-revision' | 'teach-me' | 'merge'
  const [activeSubTab, setActiveSubTab] = useState<'subjects' | 'all' | 'dependencies' | 'quick-revision' | 'teach-me' | 'merge'>('all');
  
  // Infinite Scroll Observer
  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!observerRef.current || !onLoadMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore();
      }
    }, { threshold: 0.1 });
    
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, topics.length]);
  
  // Subject Form State
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formSubjectDesc, setFormSubjectDesc] = useState('');
  const [formSubjectColor, setFormSubjectColor] = useState('bg-indigo-500');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<Topic['status']>('Not Started');
  const [formConfidence, setFormConfidence] = useState(50);
  const [formRecall, setFormRecall] = useState(50);
  const [formNotes, setFormNotes] = useState('');
  const [formDependencies, setFormDependencies] = useState<string[]>([]);

  // Teach Me Again selected topic
  const [teachMeTopicId, setTeachMeTopicId] = useState<string>(topics[0]?.id || '');

  // Merge Topics State
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [mergeDuplicateIds, setMergeDuplicateIds] = useState<string[]>([]);
  
  // Smart auto-suggestion effect
  React.useEffect(() => {
    if (!mergePrimaryId) {
      setMergeDuplicateIds([]);
      return;
    }
    const primary = topics.find(t => t.id === mergePrimaryId);
    if (!primary) return;

    // Tokenize strings to find common significant words
    const tokenize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
    const pTokens = tokenize(primary.name);
    
    if (pTokens.length === 0) {
      setMergeDuplicateIds([]);
      return;
    }

    const suggested = topics.filter(t => {
      if (t.id === primary.id) return false;
      const tTokens = tokenize(t.name);
      const intersection = pTokens.filter(pt => tTokens.includes(pt));
      // Overlap threshold: if they share at least 1 significant token, we suggest it
      return intersection.length > 0;
    }).map(t => t.id);

    setMergeDuplicateIds(suggested);
  }, [mergePrimaryId, topics]);

  const closeEditor = () => {
    setIsEditing(false);
    setEditingTopicId(null);
  };

  useStackedPanelHistory({
    active: isEditing,
    key: 'topic-editor',
    onBack: closeEditor,
  });
  
  // Unique Categories computed dynamically
  const categories = useMemo(() => {
    const list = new Set(topics.map(t => t.category));
    return ['All', ...Array.from(list)];
  }, [topics]);

  const handleOpenCreate = () => {
    setIsEditing(true);
    setEditingTopicId(null);
    setFormName('');
    setFormCategory('');
    setFormSubjectId(subjects[0]?.id || '');
    setFormDescription('');
    setFormStatus('Learning');
    setFormConfidence(50);
    setFormRecall(50);
    setFormNotes('');
    setFormDependencies([]);
  };

  const handleOpenEdit = (topic: Topic) => {
    setIsEditing(true);
    setEditingTopicId(topic.id);
    setFormName(topic.name);
    setFormCategory(topic.category);
    setFormSubjectId(topic.subjectId || subjects[0]?.id || '');
    setFormDescription(topic.description);
    setFormStatus(topic.status);
    setFormConfidence(topic.confidenceScore);
    setFormRecall(topic.recallScore);
    setFormNotes(topic.notes);
    setFormDependencies(topic.dependencyIds || []);
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCategory) return;

    if (editingTopicId) {
      const existing = topics.find(t => t.id === editingTopicId)!;
      onUpdateTopic({
        ...existing,
        subjectId: formSubjectId,
        name: formName,
        category: formCategory,
        description: formDescription,
        status: formStatus,
        confidenceScore: formConfidence,
        recallScore: formRecall,
        notes: formNotes,
        dependencyIds: formDependencies
      });
    } else {
      onAddTopic({
        subjectId: formSubjectId,
        name: formName,
        category: formCategory,
        description: formDescription,
        status: formStatus,
        confidenceScore: formConfidence,
        recallScore: formRecall,
        notes: formNotes,
        dependencyIds: formDependencies
      });
    }
    closeEditor();
  };

  // Check dependent warnings
  // Returns warning strings if any parent in dependency chain has confidence < 60
  const getDependencyWarnings = (topic: Topic) => {
    const warnings: string[] = [];
    if (!topic.dependencyIds || topic.dependencyIds.length === 0) return warnings;

    topic.dependencyIds.forEach(parentId => {
      const parent = topics.find(t => t.id === parentId);
      if (parent && parent.confidenceScore < 60) {
        warnings.push(`"${parent.name}" confidence is low (${parent.confidenceScore}%). Understanding of "${topic.name}" may be heavily affected.`);
      }
    });

    return warnings;
  };

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [topics, searchQuery, categoryFilter, statusFilter]);

  // Flattened grid structure for virtualization
  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    const subjectIds = Array.from(new Set<string>(filteredTopics.map(t => t.subjectId || '')));
    
    subjectIds.forEach(subjId => {
      const subject = subjects.find(s => s.id === subjId);
      const subjTopics = filteredTopics.filter(t => t.subjectId === subjId);
      if (subjTopics.length > 0) {
        items.push({ type: 'header', subjectId: subjId || 'uncategorized', subject });
        subjTopics.forEach(topic => {
          items.push({ type: 'topic', topic });
        });
      }
    });
    return items;
  }, [filteredTopics, subjects]);

  // Topic selected in active teach me tab
  const activeTeachTopic = useMemo(() => {
    return topics.find(t => t.id === teachMeTopicId);
  }, [topics, teachMeTopicId]);

  // High interest topics check for "unrevised for 30+ days"
  const rustyTopics = useMemo(() => {
    const thresholdMs = 30 * 24 * 60 * 60 * 1000;
    return topics.filter(t => {
      if (!t.lastRevisionDate && t.revisionCount > 0) return true;
      if (!t.lastRevisionDate) return false;
      const last = new Date(t.lastRevisionDate).getTime();
      return (Date.now() - last) > thresholdMs;
    });
  }, [topics]);

  // Preset key points guides for Quick Revision Quick Lookups
  const quickRevisionGuides = [
    {
      title: "Collections (10 Crucial Points)",
      key: "collections",
      points: [
        "Hashing: HashMap uses hashcode() to find bucket, equals() inside collision bucket linked-list/tree to identify key.",
        "Treeify: In Java 8, when size of linked list in a bucket exceeds 8 and overall table capacity is >= 64, list converts to balanced Red-Black Tree.",
        "Resizing: When capacity exceeds standard threshold factor * size, HashMap doubles capacity. Triggering index calculation: index = hash & (n-1).",
        "Set vs List: Set permits unique elements. List supports duplicates and respects insert index order.",
        "HashSet internal: Instantiates HashMap on constructor. Store values as keys, with an empty dynamic Object 'PRESENT' as value.",
        "Array vs Linked List: ArrayList has O(1) random index access but O(N) shift. LinkedList has O(1) insertions but O(N) lookup.",
        "CopyOnWriteArrayList: Performs deep array copy on each mutate write operation - ideal for multi-read low-write triggers.",
        "IdentityHashMap: Compares keys strictly using reference equality operator (==) rather than equals() method.",
        "WeakHashMap: Map keys are garbage collected as soon as strong references are lost, avoiding continuous memory leakage.",
        "Fail-Fast vs Safe: Fast checks concurrent structures via modCount variable. Safe clones structural backplane."
      ]
    },
    {
      title: "Java 8 Streams (8 Crucial Points)",
      key: "streams",
      points: [
        "Lazy Execution: Intermediate streams are only registered. Operation executes strictly when final terminal is invoked.",
        "Stateless vs Stateful: Stateless transforms independently (e.g. map, filter). Stateful requires fully caching inputs (e.g. sorted, distinct).",
        "FlatMap conversion: Flattens hierarchical nested collections (e.g. Stream<List<String>> -> Stream<String>).",
        "Optional wrappers: Stream API uses Optional<T> response types specifically to nullify standard NullPointerExceptions.",
        "Parallel Streams: Operates tasks using standard ForkJoin threadpools. Beware using under shared heavy workloads.",
        "Internal vs External: Streams enforce compiler-side internal stream traversal rather than consumer control loops.",
        "Collectors framework: Standard collect aggregates data points back into customized Sets, Maps, lists, groupers.",
        "Immutability: Active stream processes never edit the source elements, returning clean pipelines instead."
      ]
    },
    {
      title: "Spring Boot Architecture (12 Crucial Points)",
      key: "springboot",
      points: [
        "Inversion of Control (IoC): Outsources dependency instantiation and management life stages completely to Spring context.",
        "Dependency Injection: Wiring modules using @Autowired (Constructor injection is favored over Field injection).",
        "Spring Bean Cycle: Instantiation -> Populate Properties -> Aware Methods -> PostProcessors -> custom init() -> Destruction.",
        "Configuration: @SpringBootApplication is a composite tagging @SpringBootConfiguration, @EnableAutoConfiguration, @ComponentScan.",
        "Autoconfiguration: Examines pom.xml dependencies and dynamically provisions mock beans conditionally inside the context.",
        "Scopes: Prototype creates a new object on each request. Singleton holds a shared class structure inside memory.",
        "Transactional: @Transactional proxy intercepts class triggers to commit or rollback databases on RuntimeExceptions.",
        "AOP Aspect: Intercepts core class execution to weave generic concerns (e.g. logging, analytics) around custom JointPoints.",
        "Profiles configuration: Customizes yaml parameters selectively for dedicated environments (e.g., prod, dev, staging).",
        "Filters vs Interceptors: Filters apply at servlet bounds. Interceptors resolve inside Spring handler execution bounds.",
        "Spring Security Filters: Operates chains of filters to intercept and evaluate authorization headers.",
        "Spring Boot Actuator: Activates metrics, thread dumps, health status, and live environments queries natively via standard endpoints."
      ]
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Navigation headers within module */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-2.5 gap-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Technical Topic Manager</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 rounded-lg text-xs font-semibold border border-white/5">
          <button 
            onClick={() => { setActiveSubTab('subjects'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'subjects' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Subjects
          </button>
          <button 
            onClick={() => { setActiveSubTab('all'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'all' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            All Topics
          </button>
          <button 
            onClick={() => { setActiveSubTab('dependencies'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'dependencies' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Dependency Map
          </button>
          <button 
            onClick={() => { setActiveSubTab('quick-revision'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'quick-revision' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            5-Min Revision
          </button>
          <button 
            onClick={() => { setActiveSubTab('teach-me'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'teach-me' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Teach Me Again
          </button>
          <button 
            onClick={() => { setActiveSubTab('merge'); closeEditor(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'merge' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Merge Duplicates
          </button>
        </div>
      </div>

      {/* RUSTY TOPICS BANNER WARNING */}
      {rustyTopics.length > 0 && activeSubTab === 'all' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-amber-200 leading-normal">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block text-white">Retention Recall Drift Triggered</span>
              <span>The following topics have stayed unrevised for over 30 days and require refresher analysis: {rustyTopics.map(t => `"${t.name}"`).join(', ')}.</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (rustyTopics[0]) {
                setTeachMeTopicId(rustyTopics[0].id);
                setActiveSubTab('teach-me');
              }
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold cursor-pointer shrink-0 transition"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* SUB-TAB 1: ALL TOPICS INTERACTIVE GRID */}
      {activeSubTab === 'all' && (
        <>
          {/* Create Topic Drawer Panel */}
          {isEditing ? (
            <form onSubmit={handleSave} className="glass-card p-5 space-y-4 text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-white">{editingTopicId ? 'Edit Studied Topic' : 'Register New Topic'}</h3>
                <button 
                  type="button" 
                  onClick={closeEditor}
                  className="text-xs text-slate-400 hover:text-white font-sans cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Topic Name (e.g. Collections)</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Provide explicit node name"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Category Tag</label>
                  <input 
                    type="text" 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Java 8, Spring Boot, etc."
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Subject Assignment</label>
                  <select 
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input font-sans cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-[#111827]">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#111827]">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Description Summary</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe what specific frameworks or protocols are covered on this topic..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-16 glass-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">State Progress Status</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Topic['status'])}
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input font-sans"
                  >
                    <option value="Not Started" className="bg-[#111827]">Not Started</option>
                    <option value="Learning" className="bg-[#111827]">Learning</option>
                    <option value="Practicing" className="bg-[#111827]">Practicing</option>
                    <option value="Revising" className="bg-[#111827]">Revising</option>
                    <option value="Interview Ready" className="bg-[#111827]">Interview Ready</option>
                    <option value="Mastered" className="bg-[#111827]">Mastered</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Linked Parent Dependencies</label>
                  <div className="max-h-24 overflow-y-auto border border-white/10 rounded-lg p-2 bg-white/2 space-y-1">
                    {allTopics.filter(t => t.id !== editingTopicId).map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-xs font-sans text-slate-350 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={formDependencies.includes(t.id)}
                          onChange={() => {
                            if (formDependencies.includes(t.id)) {
                              setFormDependencies(formDependencies.filter(id => id !== t.id));
                            } else {
                              setFormDependencies([...formDependencies, t.id]);
                            }
                          }}
                          className="rounded-sm border-white/20 text-indigo-650 focus:ring-indigo-500 bg-black/40"
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                    {allTopics.length <= 1 && (
                      <span className="text-[10px] text-slate-400 block">No other topics registered yet.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Self Confidence Meter</span>
                    <span className="font-mono text-indigo-400 font-bold">{formConfidence}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Observed Recall Accuracy</span>
                    <span className="font-mono text-indigo-400 font-bold">{formRecall}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100"
                    value={formRecall}
                    onChange={(e) => setFormRecall(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Study Markdown Notes & Key Code Snippets</label>
                  <textarea 
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Use standard bullet markers (* Bullet item) or paste technical questions and responses..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-36 font-mono glass-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={closeEditor}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs font-medium hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer border border-indigo-500/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 font-bold" />
                  <input 
                    type="text" 
                    placeholder="Search topics, categories..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm glass-input"
                  />
                </div>

                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm glass-input font-sans cursor-pointer"
                >
                  <option value="All" className="bg-[#111827]">All Categories</option>
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="bg-[#111827]">{c}</option>
                  ))}
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm glass-input font-sans cursor-pointer"
                >
                  <option value="All" className="bg-[#111827]">All Statuses</option>
                  <option value="Not Started" className="bg-[#111827]">Not Started</option>
                  <option value="Learning" className="bg-[#111827]">Learning</option>
                  <option value="Practicing" className="bg-[#111827]">Practicing</option>
                  <option value="Revising" className="bg-[#111827]">Revising</option>
                  <option value="Interview Ready" className="bg-[#111827]">Interview Ready</option>
                  <option value="Mastered" className="bg-[#111827]">Mastered</option>
                </select>
              </div>

              <button 
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold border border-indigo-500/30 transition cursor-pointer shadow-md ml-auto md:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Topic</span>
</button>
            </div>
          )}

          {/* Grid Layout of Registered Topics */}
          {!isEditing && flatItems.length > 0 && (
            <VirtuosoGrid
              useWindowScroll
              data={flatItems}
              context={{ flatItems }}
              components={{
                List: GridContainer,
                Item: ItemContainer
              }}
              endReached={() => {
                if (topics.length >= 50 && onLoadMore) onLoadMore();
              }}
              itemContent={(index, item) => {
                if (item.type === 'header') {
                  const subject = item.subject;
                  return (
                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${subject ? subject.color : 'bg-slate-500'}`} />
                      {subject ? subject.name : 'Uncategorized Topics'}
                    </h3>
                  );
                }

                const topic = item.topic;
                const warnings = getDependencyWarnings(topic);
                const isOverdue = topic.nextRevisionDate && new Date(topic.nextRevisionDate) < new Date();
                
                return (
                  <div 
                    key={topic.id} 
                    className={`glass-card glass-card-hover p-5 flex flex-col justify-between relative overflow-hidden h-full ${isOverdue ? 'border-amber-500/30' : ''}`}
                  >
                    <div>
                      {/* Category Tag & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-305 border border-indigo-500/10">
                          {topic.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(topic)}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition cursor-pointer"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteTopic(topic.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition cursor-pointer"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Header and status info */}
                      <div className="space-y-1 mb-2">
                        <h4 className="font-extrabold text-white text-[15px] leading-tight">
                          {topic.name}
                        </h4>
                      </div>

                      {/* Warnings if dependencies weak */}
                      {warnings.length > 0 && (
                        <div className="mb-3 px-2 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-start gap-1.5 text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <div className="text-[9px] font-semibold leading-relaxed space-y-0.5">
                            {warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                          </div>
                        </div>
                      )}

                      {/* Description truncated */}
                      <p className="text-xs text-slate-350 line-clamp-3 mb-4 leading-relaxed font-sans">
                        {topic.description || <span className="italic text-slate-500">No core description supplied.</span>}
                      </p>

                      {/* Visual Health metrics layout */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Confidence</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                topic.confidenceScore > 80 ? 'bg-emerald-400' :
                                topic.confidenceScore > 50 ? 'bg-amber-400' : 'bg-rose-400'
                              }`} style={{ width: `${topic.confidenceScore}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-200">{topic.confidenceScore}%</span>
                          </div>
                        </div>

                        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Next Revision</span>
                          <span className={`text-[10px] font-bold ${isOverdue ? 'text-amber-400' : 'text-slate-200'}`}>
                            {topic.nextRevisionDate ? new Date(topic.nextRevisionDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Unscheduled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom stats and notes toggle */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-3">
                        <span>Revisions: <strong className="text-slate-200 font-mono">{topic.revisionCount}</strong></span>
                        <span>Forgot count: <strong className={`${topic.forgotCount > 0 ? 'text-red-400' : 'text-slate-200'} font-mono`}>{topic.forgotCount}</strong></span>
                      </div>

                      <div className="flex items-center justify-between gap-1 border-t border-white/5 pt-3">
                        <span className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full font-bold ${
                          topic.status === 'Mastered' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/10' :
                          topic.status === 'Interview Ready' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/10' :
                          topic.status === 'Revising' ? 'bg-indigo-500/15 text-indigo-305 border border-indigo-500/10' :
                          topic.status === 'Practicing' ? 'bg-purple-500/15 text-purple-305 border border-purple-500/10' :
                          topic.status === 'Learning' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/10' : 'bg-white/5 text-slate-300 border border-white/10'
                        }`}>
                          {topic.status}
                        </span>

                        <button 
                          onClick={() => {
                            setTeachMeTopicId(topic.id);
                            setActiveSubTab('teach-me');
                          }}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Review Notes</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}

          {!isEditing && flatItems.length === 0 && (
            <div className="text-center py-12 glass-card">
              <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 text-sm font-semibold">No studied topics matched filters</p>
              <p className="text-slate-400 text-xs">Reset keyword criteria or create a fresh topic card above.</p>
            </div>
          )}
          
        </>
      )}

      {/* SUB-TAB 2: TOPIC DEPENDENCY MAP DECK */}
      {activeSubTab === 'dependencies' && (
        <div className="glass-card p-5 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Layers className="text-indigo-400 w-5 h-5" />
              <span>Core Subject Dependencies & Prerequisite Layouts</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-normal font-sans">
              Linking topics builds hierarchical retention chains. If a prerequisites node registers low recall metrics, dependent elements flash adaptive warm alerts immediately.
            </p>
          </div>

          <div className="border border-white/5 rounded-xl bg-white/2 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {topics.map(t => {
                const dependenciesStr = t.dependencyIds.map(depId => {
                  const dep = allTopics.find(tp => tp.id === depId);
                  return dep ? dep.name : '';
                }).filter(Boolean).join(', ');

                return (
                  <div key={t.id} className="min-w-48 glass-card rounded-xl p-4 relative flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 font-mono block uppercase mb-1">
                        {t.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#f8fafc] mb-1">{t.name}</h4>
                      
                      {t.dependencyIds.length > 0 && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 my-1.5 border-t border-white/5 pt-1.5 mt-2">
                          <Link2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">Requires: {dependenciesStr}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono font-bold mt-2.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-sm ${t.confidenceScore < 60 ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-305'}`}>
                        CID: {t.confidenceScore}%
                      </span>
                      <span className="text-slate-400 font-normal">Forgot: {t.forgotCount}</span>
                    </div>

                    {/* Low rating warning directly inside dependency card */}
                    {t.dependencyIds.some(depId => {
                      const dep = topics.find(p => p.id === depId);
                      return dep && dep.confidenceScore < 60;
                    }) && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-rose-300 flex items-center justify-center shadow-xs" title="Prerequisite topics are weak!">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Simulated graph visual map pathway description */}
            <div className="border-t border-white/5 pt-4 text-xs space-y-2 text-slate-300 leading-relaxed font-sans">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Recommended Mastering Progression Pathway:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs bg-[#ffffff02] p-3 rounded-lg border border-white/5">
                <span className="bg-white/5 text-slate-200 px-2 py-1 rounded-sm border border-white/5">Java Core</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="bg-white/5 text-slate-200 px-2 py-1 rounded-sm border border-white/5">Collections</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="bg-white/5 text-slate-200 px-2 py-1 rounded-sm border border-white/5">Java 8 Streams</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="bg-indigo-950/40 text-indigo-200 px-2 py-1 rounded-sm border border-indigo-500/20">Spring Boot</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <span className="bg-white/5 text-slate-200 px-2 py-1 rounded-sm border border-white/5">Spring Data / Hibernate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QUICK REVISION 5-MINUTE CARD */}
      {activeSubTab === 'quick-revision' && (
        <div className="glass-card p-5 space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
              <span>5-Minute Quick Revision Guides</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-normal font-sans">
              Read these compiled, high-density points directly before entering interviews for immediate retrieval stimulus. Perfect tactical answers in brief summaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {quickRevisionGuides.map(guide => (
              <div key={guide.key} className="glass-card p-4 space-y-4 shadow-xs relative">
                <div className="pb-2 border-b border-white/5">
                  <h4 className="font-extrabold text-sm text-indigo-400 tracking-tight leading-snug">
                    {guide.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 block font-mono">Pre-Interview Boost</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
                  {guide.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-4.5 h-4.5 rounded-full bg-indigo-500/15 border border-indigo-500/10 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-slate-300 pr-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TEACH ME AGAIN PANEL */}
      {activeSubTab === 'teach-me' && (
        <div className="glass-card p-5 space-y-4 text-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-white/10 gap-3">
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">Teach Me Again Mode</h3>
              <p className="text-xs text-slate-400 font-sans">
                Detailed study concept summaries for deep-dives, references, and key answers.
              </p>
            </div>

            {/* Quick switcher select dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-sans">Select Topic</span>
              <select 
                value={teachMeTopicId}
                onChange={(e) => setTeachMeTopicId(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-sans cursor-pointer glass-input"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {activeTeachTopic ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Concept Notes Renderer */}
              <div className="md:col-span-2 space-y-4 md:border-r border-white/5 pr-0 md:pr-6">
                <div>
                  <h4 className="font-extrabold text-white text-lg mb-1 leading-snug">{activeTeachTopic.name} Concept Notes</h4>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider block">ID: {activeTeachTopic.id} &bull; Category: {activeTeachTopic.category}</p>
                </div>

                {/* Simulated Markdown Note Body */}
                <div className="p-4 rounded-xl bg-white/2 border border-white/10 overflow-y-auto max-h-96">
                  <div className="prose prose-invert prose-sm text-xs text-slate-300 leading-relaxed space-y-3 font-mono whitespace-pre-line">
                    {activeTeachTopic.notes || "No custom note documentation added to this topic card. Click edit details to append concepts, bullets, and syntax snippets!"}
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Stats and triggers */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-white/10 bg-white/2 text-xs gap-3 flex flex-col font-sans">
                  <h5 className="font-extrabold text-white border-b border-white/5 pb-1.5">Topic Confidence & Schedule</h5>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px] font-mono">Current Status</span>
                    <span className="bg-indigo-500/15 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/10">
                      {activeTeachTopic.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px] font-mono">Memory Recall Rate</span>
                    <span className="font-bold text-slate-200 font-mono">{activeTeachTopic.recallScore}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-rose-400 uppercase text-[10px] font-mono font-bold">Forgot Score</span>
                    <span className="font-extrabold text-red-400 font-mono">{activeTeachTopic.forgotCount} times</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase text-[10px] font-mono">Total Revisions</span>
                    <span className="font-bold text-slate-200 font-mono">{activeTeachTopic.revisionCount} rounds</span>
                  </div>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-550/20 text-indigo-200 p-4 rounded-xl text-xs space-y-3 shadow-xs">
                  <span className="font-bold block text-white flex items-center gap-1.1">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                    <span>How to Study This Topic:</span>
                  </span>
                  <p className="leading-relaxed text-slate-350 font-sans">
                    Navigate to the **Question Bank** tab to run a randomized recall memory check. Active recall triggers high retention pathways, reinforcing weak nodes.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-sans">
              No active topics to load notes. Use the All Topics tab to register your first subject.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 0: SUBJECT MANAGER DECK */}
      {activeSubTab === 'subjects' && (
        <div className="glass-card p-5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">Core Subject Manager</h3>
              <p className="text-xs text-slate-400 font-sans">
                Group your technical topics under broader academic subjects (e.g. System Design, Backend Engineering).
              </p>
            </div>
            {!isEditingSubject && (
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => {
                    const uncategorizedTopics = topics.filter(t => !t.subjectId);
                    if (uncategorizedTopics.length === 0) {
                      alert('All your topics are already categorized under a subject!');
                      return;
                    }
                    if (subjects.length === 0) {
                      alert('Please create at least one Subject first before migrating old topics.');
                      return;
                    }
                    const targetSubject = subjects[0];
                    if (confirm(`Do you want to automatically assign ${uncategorizedTopics.length} uncategorized topics to your "${targetSubject.name}" subject?`)) {
                      uncategorizedTopics.forEach(t => {
                        onUpdateTopic({...t, subjectId: targetSubject.id});
                      });
                      alert(`Successfully migrated ${uncategorizedTopics.length} topics to ${targetSubject.name}!`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md shrink-0 transition cursor-pointer"
                >
                  <span>Migrate Old Data</span>
                </button>
                <button 
                  onClick={() => {
                    setIsEditingSubject(true);
                    setEditingSubjectId(null);
                    setFormSubjectName('');
                    setFormSubjectDesc('');
                    setFormSubjectColor('bg-indigo-500');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shrink-0 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Subject</span>
                </button>
              </div>
            )}
          </div>

          {isEditingSubject && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if(!formSubjectName) return;
              if (editingSubjectId) {
                const existing = subjects.find(s => s.id === editingSubjectId)!;
                onUpdateSubject({...existing, name: formSubjectName, description: formSubjectDesc, color: formSubjectColor});
              } else {
                onAddSubject({ name: formSubjectName, description: formSubjectDesc, color: formSubjectColor, createdAt: new Date().toISOString() });
              }
              setIsEditingSubject(false);
            }} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Subject Name</label>
                  <input type="text" value={formSubjectName} onChange={e => setFormSubjectName(e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm glass-input" placeholder="e.g. System Design" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Color Theme</label>
                  <select value={formSubjectColor} onChange={e => setFormSubjectColor(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm glass-input font-sans">
                    <option value="bg-indigo-500" className="bg-[#111827]">Indigo</option>
                    <option value="bg-emerald-500" className="bg-[#111827]">Emerald</option>
                    <option value="bg-rose-500" className="bg-[#111827]">Rose</option>
                    <option value="bg-amber-500" className="bg-[#111827]">Amber</option>
                    <option value="bg-purple-500" className="bg-[#111827]">Purple</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Description</label>
                  <textarea value={formSubjectDesc} onChange={e => setFormSubjectDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm h-16 glass-input" placeholder="What does this subject cover?" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setIsEditingSubject(false)} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/5 transition cursor-pointer">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer">Save Subject</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map(subject => {
              const subjectTopics = topics.filter(t => t.subjectId === subject.id);
              return (
                <div key={subject.id} className="border border-white/10 bg-[#ffffff05] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${subject.color} opacity-80`} />
                  <div className="ml-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-white">{subject.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{subject.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-4">
                      <button onClick={() => {
                        setIsEditingSubject(true);
                        setEditingSubjectId(subject.id);
                        setFormSubjectName(subject.name);
                        setFormSubjectDesc(subject.description);
                        setFormSubjectColor(subject.color);
                      }} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={() => {
                        if (confirm('Delete this subject? Topics will lose their subject mapping.')) onDeleteSubject(subject.id);
                      }} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <div className="mt-4 ml-2 flex items-center justify-between text-xs font-mono border-t border-white/5 pt-3">
                    <span className="text-slate-400">Total Topics: <strong className="text-white">{subjectTopics.length}</strong></span>
                    <span className="text-slate-400">Registered: {new Date(subject.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {subjects.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-slate-400 text-sm font-sans">No subjects created yet. Add one to start organizing!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: MERGE DUPLICATES */}
      {activeSubTab === 'merge' && (
        <div className="glass-card p-5 space-y-6">
          <div className="space-y-1 border-b border-white/5 pb-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Layers className="text-indigo-400 w-5 h-5" />
              <span>Merge Duplicate Topics</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Safely consolidate duplicated topics. All questions, study sessions, voice recordings, journals, and dependencies attached to the duplicates will be reassigned to the Primary Topic, and the duplicates will be deleted.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-white">1. Select Primary Topic (Keep)</label>
              <select 
                value={mergePrimaryId}
                onChange={(e) => setMergePrimaryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-sans cursor-pointer bg-[#ffffff05] border border-white/10 text-white"
              >
                <option value="" disabled className="bg-[#111827]">-- Select the topic you want to keep --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#111827]">{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            {mergePrimaryId && (
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-white">2. Select Duplicates (Merge & Delete)</label>
                  {mergeDuplicateIds.length > 0 && (
                    <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30">
                      {mergeDuplicateIds.length} Selected
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-400 font-sans">
                  The system has auto-suggested duplicates based on naming similarities. You can manually check or uncheck topics below.
                </p>

                <div className="max-h-64 overflow-y-auto border border-white/10 rounded-lg p-3 bg-black/20 space-y-2">
                  {topics.filter(t => t.id !== mergePrimaryId).map(t => (
                    <label key={t.id} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${mergeDuplicateIds.includes(t.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}>
                      <input 
                        type="checkbox" 
                        checked={mergeDuplicateIds.includes(t.id)}
                        onChange={() => {
                          if (mergeDuplicateIds.includes(t.id)) {
                            setMergeDuplicateIds(mergeDuplicateIds.filter(id => id !== t.id));
                          } else {
                            setMergeDuplicateIds([...mergeDuplicateIds, t.id]);
                          }
                        }}
                        className="mt-1 rounded-sm border-white/20 text-indigo-650 focus:ring-indigo-500 bg-black/40"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Category: {t.category}</span>
                      </div>
                    </label>
                  ))}
                  {topics.length <= 1 && (
                    <span className="text-[10px] text-slate-400 block p-2">No other topics available to merge.</span>
                  )}
                </div>
              </div>
            )}

            {mergePrimaryId && mergeDuplicateIds.length > 0 && (
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => {
                    const primary = topics.find(t => t.id === mergePrimaryId);
                    if (!primary) return;
                    if (confirm(`Are you sure you want to merge ${mergeDuplicateIds.length} topics into "${primary.name}"? This action cannot be easily undone.`)) {
                      onMergeTopics(mergePrimaryId, mergeDuplicateIds);
                      setMergePrimaryId('');
                      setMergeDuplicateIds([]);
                      alert('Merge completed successfully!');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Execute Merge & Cleanup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
