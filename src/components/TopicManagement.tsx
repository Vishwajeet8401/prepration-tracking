/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Topic } from '../types';
import { 
  Plus, Edit2, Trash2, Search, Link2, AlertTriangle, Book, HelpCircle, 
  Check, Save, Eye, ArrowRight, ShieldAlert, Sparkles, BookOpen, Layers
} from 'lucide-react';

interface TopicManagementProps {
  topics: Topic[];
  onAddTopic: (topic: Omit<Topic, 'id' | 'revisionCount' | 'forgotCount'>) => void;
  onUpdateTopic: (topic: Topic) => void;
  onDeleteTopic: (id: string) => void;
}

export default function TopicManagement({
  topics,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic
}: TopicManagementProps) {
  
  // Tabs: 'all' | 'dependencies' | 'quick-revision' | 'teach-me'
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'dependencies' | 'quick-revision' | 'teach-me'>('all');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<Topic['status']>('Not Started');
  const [formConfidence, setFormConfidence] = useState(50);
  const [formRecall, setFormRecall] = useState(50);
  const [formNotes, setFormNotes] = useState('');
  const [formDependencies, setFormDependencies] = useState<string[]>([]);

  // Teach Me Again selected topic
  const [teachMeTopicId, setTeachMeTopicId] = useState<string>(topics[0]?.id || '');
  
  // Unique Categories computed dynamically
  const categories = useMemo(() => {
    const list = new Set(topics.map(t => t.category));
    return ['All', ...Array.from(list)];
  }, [topics]);

  // Handler to open create form
  const handleOpenCreate = () => {
    setIsEditing(true);
    setEditingTopicId(null);
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormStatus('Learning');
    setFormConfidence(50);
    setFormRecall(50);
    setFormNotes('');
    setFormDependencies([]);
  };

  // Handler to open edit form
  const handleOpenEdit = (topic: Topic) => {
    setIsEditing(true);
    setEditingTopicId(topic.id);
    setFormName(topic.name);
    setFormCategory(topic.category);
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
    setIsEditing(false);
    setEditingTopicId(null);
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
        
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg text-xs font-semibold border border-white/5">
          <button 
            onClick={() => { setActiveSubTab('all'); setIsEditing(false); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'all' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            All Topics
          </button>
          <button 
            onClick={() => { setActiveSubTab('dependencies'); setIsEditing(false); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'dependencies' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Dependency Map
          </button>
          <button 
            onClick={() => { setActiveSubTab('quick-revision'); setIsEditing(false); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'quick-revision' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            5-Min Revision
          </button>
          <button 
            onClick={() => { setActiveSubTab('teach-me'); setIsEditing(false); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeSubTab === 'teach-me' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'}`}
          >
            Teach Me Again
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
                  onClick={() => { setIsEditing(false); setEditingTopicId(null); }}
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
                    {topics.filter(t => t.id !== editingTopicId).map(t => (
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
                    {topics.length === 1 && (
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
                  onClick={() => setIsEditing(false)}
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
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map(topic => {
                const warnings = getDependencyWarnings(topic);
                const isOverdue = topic.nextRevisionDate && new Date(topic.nextRevisionDate) < new Date();
                
                return (
                  <div 
                    key={topic.id} 
                    className={`glass-card glass-card-hover p-5 flex flex-col justify-between relative overflow-hidden ${isOverdue ? 'border-amber-500/30' : ''}`}
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
                        <h3 className="font-extrabold text-white text-base flex items-center gap-1.5 leading-tight">
                          {topic.name}
                          {isOverdue && (
                            <span className="text-[9px] font-mono border border-orange-500/35 bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded-sm animate-pulse font-bold leading-none">
                              OVERDUE
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-1">
                          {topic.description}
                        </p>
                      </div>

                      {/* Parent Warnings Display */}
                      {warnings.map((warn, i) => (
                        <div key={i} className="my-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-[11px] text-red-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <span>{warn}</span>
                        </div>
                      ))}

                      {/* Visual Gauges confidence/recall */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-dashed border-white/10 my-3 font-mono text-xs">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-0.5">
                            <span>Confidence</span>
                            <span className="font-bold text-slate-200">{topic.confidenceScore}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${topic.confidenceScore < 50 ? 'bg-rose-500' : topic.confidenceScore < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                              style={{ width: `${topic.confidenceScore}%` }} 
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-0.5">
                            <span>Recall Metric</span>
                            <span className="font-bold text-slate-200">{topic.recallScore}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${topic.recallScore < 50 ? 'bg-rose-500' : topic.recallScore < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                              style={{ width: `${topic.recallScore}%` }} 
                            />
                          </div>
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
              })}

              {filteredTopics.length === 0 && (
                <div className="col-span-1 md:col-span-3 text-center py-12 glass-card">
                  <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-semibold">No studied topics matched filters</p>
                  <p className="text-slate-400 text-xs">Reset keyword criteria or create a fresh topic card above.</p>
                </div>
              )}
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
                  const dep = topics.find(tp => tp.id === depId);
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

    </div>
  );
}
