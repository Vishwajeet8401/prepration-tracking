/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Roadmap, RoadmapTopic, Topic } from '../types';
import { 
  Compass, Plus, Play, CheckCircle2, Lock, Sparkles, Trash2, LayoutGrid, 
  Layers, Check, HelpCircle, GraduationCap, Trophy, CornerDownRight, AlertTriangle, Info, Clock, Award, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useScrollGesture } from '../hooks/useScrollGesture';


interface PreparationRoadmapsProps {
  roadmaps: Roadmap[];
  topics: Topic[]; // to cross-reference auto topic completion
  onAddRoadmap: (roadmap: Omit<Roadmap, 'id' | 'userId'>) => Promise<void>;
  onUpdateRoadmap: (roadmap: Roadmap) => Promise<void>;
  onDeleteRoadmap: (id: string) => Promise<void>;
}

const prebuiltTemplates = [
  {
    id: "prebuilt-java-backend",
    title: "Java Backend Developer",
    description: "Enterprise ready Java software engineering fundamentals and modern frameworks.",
    topics: [
      { name: "Java Core", dependencies: [], completed: false },
      { name: "OOP Concepts", dependencies: ["Java Core"], completed: false },
      { name: "Collections", dependencies: ["OOP Concepts"], completed: false },
      { name: "Generics", dependencies: ["Collections"], completed: false },
      { name: "Exception Handling", dependencies: ["Java Core"], completed: false },
      { name: "Multithreading", dependencies: ["Java Core"], completed: false },
      { name: "Java 8 Features", dependencies: ["Java Core"], completed: false },
      { name: "JDBC", dependencies: ["Java Core"], completed: false },
      { name: "Spring Framework", dependencies: ["Java 8 Features", "OOP Concepts"], completed: false },
      { name: "Spring Boot", dependencies: ["Spring Framework"], completed: false },
      { name: "Hibernate/JPA", dependencies: ["JDBC", "Spring Framework"], completed: false },
      { name: "REST APIs", dependencies: ["Spring Boot"], completed: false },
      { name: "Microservices", dependencies: ["REST APIs", "Spring Boot"], completed: false },
      { name: "System Design", dependencies: ["Microservices"], completed: false }
    ]
  },
  {
    id: "prebuilt-fullstack",
    title: "Full Stack Developer",
    description: "From design grids to server-side databases. The full cycle curriculum.",
    topics: [
      { name: "HTML & CSS", dependencies: [], completed: false },
      { name: "JavaScript Essentials", dependencies: [], completed: false },
      { name: "DOM Manipulation", dependencies: ["HTML & CSS", "JavaScript Essentials"], completed: false },
      { name: "React", dependencies: ["DOM Manipulation", "JavaScript Essentials"], completed: false },
      { name: "State Management", dependencies: ["React"], completed: false },
      { name: "Node.js", dependencies: ["JavaScript Essentials"], completed: false },
      { name: "Express", dependencies: ["Node.js"], completed: false },
      { name: "NoSQL & SQL", dependencies: ["Express"], completed: false },
      { name: "Authentication", dependencies: ["Express", "NoSQL & SQL"], completed: false },
      { name: "Deployment", dependencies: ["Authentication"], completed: false }
    ]
  },
  {
    id: "prebuilt-springboot",
    title: "Spring Boot Developer",
    description: "Comprehensive backend framework curriculum for spring applications.",
    topics: [
      { name: "Spring Core", dependencies: [], completed: false },
      { name: "Spring Boot CLI", dependencies: ["Spring Core"], completed: false },
      { name: "AutoConfiguration", dependencies: ["Spring Boot CLI"], completed: false },
      { name: "JPA/Hibernate", dependencies: ["Spring Core"], completed: false },
      { name: "REST Endpoints", dependencies: ["AutoConfiguration"], completed: false },
      { name: "Spring Security", dependencies: ["REST Endpoints"], completed: false },
      { name: "JWT", dependencies: ["Spring Security"], completed: false },
      { name: "Microservices Architecture", dependencies: ["JWT", "REST Endpoints"], completed: false },
      { name: "Testing", dependencies: ["REST Endpoints"], completed: false },
      { name: "Docker", dependencies: ["Microservices Architecture"], completed: false }
    ]
  },
  {
    id: "prebuilt-dsa",
    title: "DSA Preparation",
    description: "Targeted problem solving maps across lists, dynamic bounds and trees.",
    topics: [
      { name: "Time & Space Complexity", dependencies: [], completed: false },
      { name: "Arrays", dependencies: ["Time & Space Complexity"], completed: false },
      { name: "Strings", dependencies: ["Time & Space Complexity"], completed: false },
      { name: "Hashing", dependencies: ["Arrays", "Strings"], completed: false },
      { name: "LinkedLists", dependencies: ["Time & Space Complexity"], completed: false },
      { name: "Stacks & Queues", dependencies: ["LinkedLists"], completed: false },
      { name: "Trees", dependencies: ["Stacks & Queues"], completed: false },
      { name: "Graphs", dependencies: ["Trees"], completed: false },
      { name: "Dynamic Programming", dependencies: ["Graphs"], completed: false },
      { name: "Heap/Priority Queue", dependencies: ["Dynamic Programming"], completed: false },
      { name: "Sorting Algorithms", dependencies: ["Arrays"], completed: false }
    ]
  },
  {
    id: "prebuilt-systemdesign",
    title: "System Design",
    description: "Architect distributed backends, streaming caches, high availability pipelines.",
    topics: [
      { name: "Vertical vs Horizontal Scaling", dependencies: [], completed: false },
      { name: "Monoliths vs Microservices", dependencies: [], completed: false },
      { name: "Load Balancers", dependencies: ["Vertical vs Horizontal Scaling"], completed: false },
      { name: "Caching Systems", dependencies: ["Load Balancers"], completed: false },
      { name: "Database Sharding", dependencies: ["Vertical vs Horizontal Scaling"], completed: false },
      { name: "DNS & Routing", dependencies: [], completed: false },
      { name: "CDN", dependencies: ["Caching Systems"], completed: false },
      { name: "Message Queues", dependencies: ["Monoliths vs Microservices"], completed: false },
      { name: "Consistent Hashing", dependencies: ["Database Sharding"], completed: false },
      { name: "Cap Theorem", dependencies: ["Monoliths vs Microservices"], completed: false }
    ]
  }
];

const PreparationRoadmaps = React.memo(function PreparationRoadmaps({
  roadmaps,
  topics,
  onAddRoadmap,
  onUpdateRoadmap,
  onDeleteRoadmap
}: PreparationRoadmapsProps) {

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customTopicsInput, setCustomTopicsInput] = useState('');
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // ── Gesture scroll ──
  useScrollGesture({ activeTab: 'Learning Roadmaps' });


  // GSAP Entrance triggers on active roadmap reload
  const timelineRef = useRef<HTMLDivElement>(null);

  // Active Roadmap configuration
  const activeRoadmap = useMemo(() => {
    const active = roadmaps.find(r => r.isActive);
    if (active) return active;
    if (roadmaps.length > 0) return roadmaps[0];
    return null;
  }, [roadmaps]);

  // Enrich Roadmap topic details from local State Database (matching by Name)
  const enrichedActiveTopics = useMemo(() => {
    if (!activeRoadmap) return [];
    return activeRoadmap.topics.map((t, idx) => {
      const dbTopic = topics.find(tp => tp.name.toLowerCase() === t.name.toLowerCase());
      
      const isAutoCompleted = dbTopic ? (
        dbTopic.status === 'Mastered' || 
        dbTopic.status === 'Interview Ready' || 
        dbTopic.status === 'Revising'
      ) : false;

      const isCompleted = t.completed || isAutoCompleted;

      return {
        ...t,
        isCompleted,
        dbTopic,
        autoCompletedReason: isAutoCompleted ? `Synced: Database status is "${dbTopic?.status}"` : null,
      };
    });
  }, [activeRoadmap, topics]);

  useEffect(() => {
    if (enrichedActiveTopics.length > 0 && timelineRef.current) {
      // Trigger a sleek GSAP reveal animation for timeline steps!
      gsap.fromTo(
        timelineRef.current.querySelectorAll('.timeline-node-item'),
        { opacity: 0, scale: 0.88, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' }
      );
    }
  }, [activeRoadmap?.id, enrichedActiveTopics.length]);

  // Calculations & Percent complete stats
  const stats = useMemo(() => {
    if (enrichedActiveTopics.length === 0) return { percent: 0, completedCount: 0, total: 0, remaining: 0, resumeReadiness: 'Foundation Mode' };

    const total = enrichedActiveTopics.length;
    const completedCount = enrichedActiveTopics.filter(t => t.isCompleted).length;
    const remaining = total - completedCount;
    const percent = Math.round((completedCount / total) * 100);

    let resumeReadiness = 'Foundation Track';
    if (percent >= 75) {
      resumeReadiness = 'Excellent: Interview Ready Status';
    } else if (percent >= 40) {
      resumeReadiness = 'Competent: Growth Phase';
    }

    return {
      percent,
      completedCount,
      total,
      remaining,
      resumeReadiness
    };
  }, [enrichedActiveTopics]);

  // Spacing algorithm prioritizes next item whose prerequisites are met
  const nextRecommendedTopic = useMemo(() => {
    if (enrichedActiveTopics.length === 0) return null;

    return enrichedActiveTopics.find(t => {
      if (t.isCompleted) return false;
      return t.dependencies.every(dName => {
        const depTopic = enrichedActiveTopics.find(et => et.name.toLowerCase() === dName.toLowerCase());
        return depTopic ? depTopic.isCompleted : true; 
      });
    });
  }, [enrichedActiveTopics]);

  const handleActivatePrebuilt = async (prebuilt: typeof prebuiltTemplates[0]) => {
    try {
      for (const r of roadmaps) {
        if (r.isActive) {
          await onUpdateRoadmap({ ...r, isActive: false });
        }
      }

      await onAddRoadmap({
        title: prebuilt.title,
        description: prebuilt.description,
        topics: prebuilt.topics.map(t => ({ name: t.name, dependencies: t.dependencies, completed: false })),
        isPrebuilt: true,
        isActive: true,
        prebuiltId: prebuilt.id,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error activating template roadmap:", err);
    }
  };

  const handleToggleTopicCompleted = async (topicName: string) => {
    if (!activeRoadmap) return;

    try {
      const updatedTopics = activeRoadmap.topics.map(t => {
        if (t.name === topicName) {
          return { ...t, completed: !t.completed };
        }
        return t;
      });

      await onUpdateRoadmap({
        ...activeRoadmap,
        topics: updatedTopics
      });
    } catch (err) {
      console.error("Error toggling completion:", err);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    try {
      await onDeleteRoadmap(id);
    } catch (err) {
      console.error("Error removing learning path:", err);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const names = customTopicsInput.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');

    if (names.length === 0) return;

    const customTopics: RoadmapTopic[] = names.map((name, index) => {
      const dependencies = index > 0 ? [names[index - 1]] : [];
      return {
        name,
        dependencies,
        completed: false
      };
    });

    try {
      for (const r of roadmaps) {
        if (r.isActive) {
          await onUpdateRoadmap({ ...r, isActive: false });
        }
      }

      await onAddRoadmap({
        title: customTitle.trim(),
        description: customDescription.trim() || 'Custom designated learning sequence pathway.',
        topics: customTopics,
        isPrebuilt: false,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      setIsCreatingCustom(false);
      setCustomTitle('');
      setCustomDescription('');
      setCustomTopicsInput('');
    } catch (err) {
      console.error("Error building custom track:", err);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Header Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <div className="lg:col-span-3 glass-card p-6 relative overflow-hidden flex flex-col justify-between rounded-2xl">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider block">
                {activeRoadmap ? 'Active Interactive Learning Tree' : 'Initialize a career timeline'}
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                {activeRoadmap ? activeRoadmap.title : 'No Active Learning track'}
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl font-sans mt-0.5">
                {activeRoadmap ? activeRoadmap.description : 'Select a prebuilt professional template on the right side or build a custom sequential plan. The pipeline auto-syncs with your study database!'}
              </p>
            </div>

            {activeRoadmap && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-305 border border-indigo-500/15 px-3 py-1.5 rounded-full font-bold select-none font-sans whitespace-nowrap">
                  {activeRoadmap.isPrebuilt ? '★ Curated Pathway' : '✂ Custom Study Blueprint'}
                </span>
                <button
                  onClick={() => handleDeleteRoadmap(activeRoadmap.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition cursor-pointer"
                  title="Delete roadmap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {activeRoadmap && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] text-slate-450 font-mono block font-bold">Progress Rate</span>
                <span className="text-base font-extrabold font-mono text-indigo-300">{stats.percent}%</span>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] text-slate-450 font-mono block font-bold">Completed Anchors</span>
                <span className="text-base font-extrabold font-mono text-teal-400">{stats.completedCount} / {stats.total}</span>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] text-slate-450 font-mono block font-bold">Latency Steps</span>
                <span className="text-base font-extrabold font-mono text-slate-300">{stats.remaining} items</span>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] text-slate-450 font-mono block font-bold">Syllabus Class</span>
                <span className="text-[11px] font-black text-amber-400 truncate max-w-full block font-display leading-tight">
                  {stats.resumeReadiness}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Focus box */}
        <div className="glass-card p-5 bg-indigo-950/20 border-indigo-500/20 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2 text-left">
            <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Next Recommended step</span>
            {nextRecommendedTopic ? (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white font-display truncate max-w-full">{nextRecommendedTopic.name}</h4>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  Ready. Prerequisites are satisfied. Click to quick-toggle milestone completeness!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-teal-400 font-display">Roadmap Solved!</h4>
                <p className="text-[10px] text-slate-500 font-sans">Phenomenal effort. All concepts are in master state.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 mt-3">
            {nextRecommendedTopic && (
              <button 
                onClick={() => handleToggleTopicCompleted(nextRecommendedTopic.name)}
                className="w-full py-2 bg-indigo-650 hover:bg-slate-200 hover:text-indigo-950 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Cleared</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 2. Interactive visual roadmap timeline or template creator */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Visual pipeline list */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card p-5 rounded-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-white font-display">Stepped Syllabus Pipeline</span>
              <span className="text-[10px] font-mono text-slate-400">Move mouse over steps to audit details</span>
            </div>

            {enrichedActiveTopics.length === 0 ? (
              <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Compass className="w-10 h-10 text-indigo-400 mx-auto mb-2 animate-spin" style={{ animationDuration: '4s' }} />
                <h4 className="text-sm font-bold text-white mb-1 font-display">Launch your first timeline path</h4>
                <p className="text-xs text-slate-450 max-w-sm mx-auto font-sans leading-relaxed">
                  Choose one of the elite pre-structured tracks inside the right panel catalog or create your own custom track today.
                </p>
              </div>
            ) : (
              <div ref={timelineRef} className="relative pl-6 sm:pl-12 space-y-6 pt-3 pb-3">
                
                {/* Glowing vertical connector path line */}
                <div className="absolute left-[15px] sm:left-[27px] top-4 bottom-4 w-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-indigo-500 w-full"
                    initial={{ height: 0 }}
                    animate={{ height: `${stats.percent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>

                {enrichedActiveTopics.map((topic, index) => {
                  const uncompletedDeps = topic.dependencies.filter(dName => {
                    const depTopic = enrichedActiveTopics.find(et => et.name.toLowerCase() === dName.toLowerCase());
                    return depTopic ? !depTopic.isCompleted : true; 
                  });
                  const isLocked = uncompletedDeps.length > 0;
                  const isHovered = hoveredNode === index;
                  const isNextStep = nextRecommendedTopic?.name === topic.name;

                  return (
                    <div 
                      key={index}
                      onMouseEnter={() => setHoveredNode(index)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleToggleTopicCompleted(topic.name)}
                      className={`timeline-node-item relative rounded-xl border p-4 cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
                        topic.isCompleted 
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                          : isLocked 
                          ? 'bg-[#1f2937]/30 border-[#374151]/30 opacity-60' 
                          : isNextStep
                          ? 'bg-indigo-500/5 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                          : 'bg-white/5 border-white/5 hover:bg-white/8'
                      }`}
                    >
                      {/* Interactive glowing left node timeline bubble anchor */}
                      <div className="absolute -left-[30px] sm:-left-[46px] top-1/2 -translate-y-1/2 z-10">
                        <motion.div 
                          animate={isNextStep ? { scale: [1, 1.2, 1] } : {}}
                          transition={isNextStep ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border shadow-lg ${
                            topic.isCompleted 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                              : isLocked 
                              ? 'bg-slate-900 text-slate-500 border-slate-800' 
                              : isNextStep
                              ? 'bg-indigo-650 text-white border-indigo-400 ring-4 ring-indigo-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {topic.isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : index + 1}
                        </motion.div>
                      </div>

                      {/* Timeline node details */}
                      <div className="flex-1 min-w-0 flex items-start gap-3 text-left">
                        <div className="space-y-1 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-sm font-extrabold font-display ${topic.isCompleted ? 'text-white' : 'text-slate-300'}`}>
                              {topic.name}
                            </h4>
                            {isNextStep && (
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold uppercase font-mono animate-pulse">
                                CURRENT TARGET
                              </span>
                            )}
                          </div>

                          {topic.dependencies.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-mono text-slate-400">
                              <span>Prerequisites:</span>
                              {topic.dependencies.map(dName => {
                                const dep = enrichedActiveTopics.find(et => et.name.toLowerCase() === dName.toLowerCase());
                                return (
                                  <span key={dName} className={dep?.isCompleted ? 'text-teal-400' : 'text-red-450 font-black'}>
                                    {dName} {dep?.isCompleted ? '✓' : '🔒'}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {topic.autoCompletedReason && (
                            <div className="text-[9px] font-mono text-teal-400 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{topic.autoCompletedReason}</span>
                            </div>
                          )}

                          {/* Hover Tooltip/Dropdown Info Overlay (Fulfilling Hover Node Requirement!) */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-white/5 pt-2.5 mt-2.5 space-y-2 text-[10px] sm:text-xs overflow-hidden"
                              >
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                  <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">Status State</span>
                                    <span className="font-bold text-slate-200 capitalize">{topic.dbTopic ? topic.dbTopic.status : 'Not Seeded'}</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">Confidence</span>
                                    <span className="font-bold text-indigo-300 font-mono">{topic.dbTopic ? topic.dbTopic.confidenceScore : 0}%</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">Recall Index</span>
                                    <span className="font-bold text-teal-300 font-mono">{topic.dbTopic ? topic.dbTopic.recallScore : 0}%</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-mono">Total Practice</span>
                                    <span className="font-bold text-slate-200 font-mono">{topic.dbTopic ? topic.dbTopic.revisionCount : 0} rounds</span>
                                  </div>
                                </div>
                                {topic.dbTopic?.description && (
                                  <p className="text-[10px] text-slate-400 leading-normal italic font-sans pl-1.5 border-l border-white/10">
                                    Notes: {topic.dbTopic.description}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Action status labels */}
                      <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono sm:self-center justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                        {topic.isCompleted ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CLEARED</span>
                          </span>
                        ) : isLocked ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 font-sans">
                            <Lock className="w-3.5 h-3.5" />
                            <span>LOCKED</span>
                          </span>
                        ) : (
                          <span className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold flex items-center gap-1 group">
                            <span>REINFORCE</span>
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>

        {/* Right side catalog template list & custom track creator */}
        <div className="space-y-5">
          
          {/* Create Custom Track selector */}
          {isCreatingCustom ? (
            <div className="glass-card p-5 space-y-4 rounded-2xl text-left bg-slate-900/40">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white font-display">Draft career track path</span>
                <button 
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-[11px] font-mono text-slate-500 hover:text-slate-350"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateCustom} className="space-y-3">
                <div>
                  <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1 font-bold">Track Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kotlin Android Architecture"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1 font-bold">Description Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Master compose, flows, state limits and clean architecture"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[8px] font-mono uppercase text-slate-400 mb-1 font-bold">Sequential Units</label>
                    <span className="text-[8px] text-indigo-400 font-mono">Sequential cascade</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. Compose UI, StateFlows, Room Database, Coroutines, Hilt"
                    value={customTopicsInput}
                    onChange={(e) => setCustomTopicsInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs text-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 font-mono leading-relaxed"
                  />
                  <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                    * Separate with commas. The algorithm automatically designates each element to rely on its immediate predecessor.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Custom Blueprint
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingCustom(true)}
              className="w-full py-3.5 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-450 border border-dashed border-indigo-505/20 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 animate-bounce" />
              <span>Define Tailored Study Blueprint</span>
            </button>
          )}

          {/* Core Master Classes catalog */}
          <div className="glass-card p-5 space-y-4 rounded-2xl text-left">
            <span className="text-[10px] font-mono text-slate-350 font-extrabold uppercase tracking-widest block border-b border-white/5 pb-2">
              Structured Expert Curriculums
            </span>

            <div className="space-y-3">
              {prebuiltTemplates.map(p => {
                const isActivePrebuilt = activeRoadmap?.prebuiltId === p.id;

                return (
                  <div 
                    key={p.id}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition select-none ${
                      isActivePrebuilt 
                        ? 'bg-indigo-650/10 border-indigo-500/30' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white font-display">{p.title}</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-sans line-clamp-2">
                        {p.description}
                      </p>
                      <span className="text-[9px] font-mono bg-white/5 border border-white/5 text-slate-400 px-2 py-0.5 rounded inline-block mt-1">
                        {p.topics.length} core blocks
                      </span>
                    </div>

                    {!isActivePrebuilt ? (
                      <button
                        onClick={() => handleActivatePrebuilt(p)}
                        className="py-1.5 bg-slate-800 hover:bg-[#000] text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer border border-white/5"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Launch Track</span>
                      </button>
                    ) : (
                      <div className="py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold rounded-lg text-center border border-emerald-500/15">
                        ✓ Active track in progress
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
});
export default PreparationRoadmaps;
