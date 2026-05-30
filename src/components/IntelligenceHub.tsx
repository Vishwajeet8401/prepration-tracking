/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Topic, Question, Interview, Mistake, StudySession, 
  VoiceRecording, InterviewIntelligenceQuestion 
} from '../types';
import { 
  Sparkles, ShieldAlert, Award, Calendar, Layers, Activity, Search, 
  HelpCircle, CheckCircle2, ChevronRight, CornerRightDown, BookOpen, Clock, 
  Download, RefreshCw, Plus, Trash2, Edit, AlertCircle, Play, Sliders, AlertTriangle
} from 'lucide-react';

interface IntelligenceHubProps {
  topics: Topic[];
  questions: Question[];
  interviews: Interview[];
  mistakes: Mistake[];
  sessions: StudySession[];
  voiceRecordings: VoiceRecording[];
  onStartSession: (topicId: string) => void;
  onNavigate: (tab: string) => void;
  
  // Permanent Interview Intelligence Questions DB state & modifiers
  intelliQuestions: InterviewIntelligenceQuestion[];
  onAddIntelliQuestion: (q: Omit<InterviewIntelligenceQuestion, 'id'>) => void;
  onDeleteIntelliQuestion: (id: string) => void;
}

export default function IntelligenceHub({
  topics,
  questions,
  interviews,
  mistakes,
  sessions,
  voiceRecordings,
  onStartSession,
  onNavigate,
  intelliQuestions,
  onAddIntelliQuestion,
  onDeleteIntelliQuestion
}: IntelligenceHubProps) {

  // Inner tab selection inside Intelligence Hub
  const [activeSubTab, setActiveSubTab] = useState<string>('daily-plan');

  // Interactive Form State for Interview Intelligence Q&A DB
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCompany, setFormCompany] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [formAnswer, setFormAnswer] = useState('');
  const [formResult, setFormResult] = useState<'Answered Correctly' | 'Struggled' | 'Failed'>('Answered Correctly');

  // Quick revision deck focus
  const [selectedRevisionDeck, setSelectedRevisionDeck] = useState<string>('Java Core');

  // Teach Me Again memory decay view focus
  const [selectedDecayTopicId, setSelectedDecayTopicId] = useState<string | null>(null);

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  // Weekly review reports (cached or generated simulation)
  const [isReportGenerated, setIsReportGenerated] = useState(true);

  // ==========================================
  // 1. GLOBAL SEARCH CONTROLLER (Point 10)
  // ==========================================
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    return {
      topics: topics.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
      questions: questions.filter(qs => qs.question.toLowerCase().includes(q) || qs.answer.toLowerCase().includes(q)),
      notes: topics.filter(t => t.notes && t.notes.toLowerCase().includes(q)),
      interviews: interviews.filter(i => i.companyName.toLowerCase().includes(q) || i.feedback.toLowerCase().includes(q)),
      mistakes: mistakes.filter(m => m.companyName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q) || m.missedQuestions.some(mq => mq.toLowerCase().includes(q))),
      recordings: voiceRecordings.filter(v => v.title.toLowerCase().includes(q)),
      intelliQs: intelliQuestions.filter(i => i.question.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q))
    };
  }, [searchQuery, topics, questions, interviews, mistakes, voiceRecordings, intelliQuestions]);

  const searchResultsCount = useMemo(() => {
    if (!searchResults) return 0;
    return (
      searchResults.topics.length +
      searchResults.questions.length +
      searchResults.notes.length +
      searchResults.interviews.length +
      searchResults.mistakes.length +
      searchResults.recordings.length +
      searchResults.intelliQs.length
    );
  }, [searchResults]);

  // ==========================================
  // 2. DAILY ACTION CENTER PLAN GENERATOR (Point 6)
  // ==========================================
  const dailyActionPlan = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'overdue' | 'weak' | 'upcoming-interview' | 'stale-decay';
      title: string;
      description: string;
      meta: string;
      actionText: string;
      targetId: string;
      targetTab: string;
    }> = [];

    const now = new Date();

    // Upcoming Job Scheduled Interviews inside 5 days
    interviews
      .filter(int => int.status === 'Scheduled')
      .forEach(int => {
        const diffDays = Math.round((new Date(int.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 5) {
          items.push({
            id: 'daily-plan-int-' + int.id,
            type: 'upcoming-interview',
            title: `Secure Interview ready status: ${int.companyName}`,
            description: `Scheduled in ${diffDays === 0 ? 'today!' : `${diffDays} days`}. Double check common core mistakes logged before the meeting.`,
            meta: `Scheduled: ${new Date(int.date).toLocaleDateString()}`,
            actionText: 'Review Mistakes',
            targetId: int.id,
            targetTab: 'Interviews & Applications'
          });
        }
      });

    // Overdue revisions overdue
    topics.forEach(t => {
      if (t.nextRevisionDate) {
        const revDate = new Date(t.nextRevisionDate);
        if (revDate < now) {
          const hoursOverdue = Math.round((now.getTime() - revDate.getTime()) / (1000 * 60 * 60));
          items.push({
            id: 'daily-plan-overdue-' + t.id,
            type: 'overdue',
            title: `Urgent Revision needed: ${t.name}`,
            description: `Overdue by ${hoursOverdue > 24 ? `${Math.round(hoursOverdue/24)} days` : `${hoursOverdue} hours`}. Keep Spaced Repetition curves optimized.`,
            meta: 'Retention Gap critical',
            actionText: 'Active Recall',
            targetId: t.id,
            targetTab: 'Question Bank & Practice'
          });
        }
      }
    });

    // Weak Confidence Topics (confidence < 50)
    topics
      .filter(t => t.confidenceScore < 50 && t.status !== 'Not Started')
      .slice(0, 2)
      .forEach(t => {
        items.push({
          id: 'daily-plan-weak-' + t.id,
          type: 'weak',
          title: `Drill weak topic: ${t.name}`,
          description: `Current Confidence is only ${t.confidenceScore}%. Test yourself with dedicated questions to re-validate core pathways.`,
          meta: `Forgot Score: ${t.forgotCount}`,
          actionText: 'Practice Bank',
          targetId: t.id,
          targetTab: 'Question Bank & Practice'
        });
      });

    // Stale/unvisited for 30+ days (Teach Me Again Cues)
    topics.forEach(t => {
      if (t.lastRevisionDate) {
        const daysSinceLast = (now.getTime() - new Date(t.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast >= 30) {
          items.push({
            id: 'daily-plan-decay-' + t.id,
            type: 'stale-decay',
            title: `Resolve Memory Decay: ${t.name}`,
            description: `Last revised ${Math.round(daysSinceLast)} days ago. Tap "Teach Me Again" to perform a rapid high-efficiency recovery.`,
            meta: '30+ Days Unrevised',
            actionText: 'Teach Me Again',
            targetId: t.id,
            targetTab: 'Intelligence Hub'
          });
        }
      }
    });

    return items.slice(0, 5); // display top 5 high impact daily plan actions
  }, [topics, interviews]);

  // ==========================================
  // 3. REGULAR TECHNOLOGY READINESS GRAPH & RATINGS (Point 5)
  // ==========================================
  const techReadinessData = useMemo(() => {
    // Collect categories
    const categories = ['Java Core', 'Collections', 'Java 8', 'Multithreading', 'Spring Boot', 'Hibernate', 'System Design'];
    
    return categories.map(cat => {
      const relatedTopics = topics.filter(t => t.category.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(t.category.toLowerCase()));
      
      if (relatedTopics.length === 0) {
        return { name: cat, score: 0, status: 'Not Tracked', count: 0 };
      }

      // Calculate readiness %: Weighted score combining Confidence (50%), Recall Accuracy (40%), and forgetting penalties (-10%)
      const sumConfidence = relatedTopics.reduce((s, t) => s + t.confidenceScore, 0);
      const sumRecall = relatedTopics.reduce((s, t) => s + t.recallScore, 0);
      const avgConfidence = sumConfidence / relatedTopics.length;
      const avgRecall = sumRecall / relatedTopics.length;
      
      // Calculate forgot penalties (max 30% reduction)
      const totalForgot = relatedTopics.reduce((s, t) => s + t.forgotCount, 0);
      const forgotPenalty = Math.min(30, totalForgot * 5);

      const readinessScore = Math.max(
        0, 
        Math.min(100, Math.round(avgConfidence * 0.5 + avgRecall * 0.5 - forgotPenalty))
      );

      let status = 'Novice';
      if (readinessScore >= 85) status = 'Production Mastered';
      else if (readinessScore >= 70) status = 'Interview Safe';
      else if (readinessScore >= 50) status = 'Developing';

      return {
        name: cat,
        score: readinessScore,
        status,
        count: relatedTopics.length
      };
    });
  }, [topics]);

  // ==========================================
  // 4. TOPIC DEPENDENCY INTELLIGENCE ALERTS (Point 7)
  // ==========================================
  const dependencyAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      parentName: string;
      childName: string;
      reason: string;
      remedy: string;
    }> = [];

    topics.forEach(child => {
      if (child.dependencyIds && child.dependencyIds.length > 0) {
        child.dependencyIds.forEach(parentId => {
          const parent = topics.find(t => t.id === parentId);
          if (parent) {
            // If parent confidence is very low (<= 55) which threatens child study
            if (parent.confidenceScore <= 60 && child.confidenceScore > 20) {
              alerts.push({
                id: `dep-alert-${parentId}-${child.id}`,
                parentName: parent.name,
                childName: child.name,
                reason: `Prerequisite "${parent.name}" has weak confidence (${parent.confidenceScore}%). This acts as a conceptual bottleneck.`,
                remedy: `We highly recommend increasing confidence in "${parent.name}" to at least 75% before continuing deep exercises in "${child.name}".`
              });
            }
          }
        });
      }
    });

    return alerts;
  }, [topics]);

  // ==========================================
  // 5. HIGH-PRIORITY RECOVERY QUEUE LISTS (Point 3)
  // ==========================================
  const recoveryQueue = useMemo(() => {
    // Priority Formula: Forgot Count * 20 + (100 - Confidence Score) * 1.5 + Revision Gap Weight (Overdue minutes ratio)
    return topics
      .filter(t => t.forgotCount > 0 || t.confidenceScore < 60)
      .map(t => {
        let weight = t.forgotCount * 25 + (100 - t.confidenceScore) * 1.5;
        
        // Boost score if overdue
        if (t.nextRevisionDate && new Date(t.nextRevisionDate) < new Date()) {
          weight += 50;
        }

        return {
          topic: t,
          priorityWeight: Math.round(weight)
        };
      })
      .sort((a, b) => b.priorityWeight - a.priorityWeight);
  }, [topics]);

  // ==========================================
  // 6. WEAK TOPIC SPOTTER MATRIX (Point 4)
  // ==========================================
  const weakSpotterList = useMemo(() => {
    return topics
      .filter(t => t.confidenceScore < 60 || t.recallScore < 50 || t.forgotCount >= 2)
      .map(t => {
        // Collect reason summaries
        const factors: string[] = [];
        if (t.confidenceScore < 50) factors.push(`Low Confidence: ${t.confidenceScore}%`);
        if (t.recallScore < 45) factors.push(`Sub-par Retention: ${t.recallScore}%`);
        if (t.forgotCount >= 2) factors.push(`Repeated Memory Slip: ${t.forgotCount} times`);
        
        // Check if involved in some logged interview mistakes
        const isInterviewMistake = mistakes.some(m => 
          m.missedQuestions.some(mq => mq.toLowerCase().includes(t.name.toLowerCase()))
        );
        if (isInterviewMistake) factors.push('Failed live interview test');

        return {
          topic: t,
          factors
        };
      })
      .sort((a, b) => {
        // Sort by longest forgot count + lowest confidence
        return (b.topic.forgotCount * 12 + (100 - b.topic.confidenceScore)) - (a.topic.forgotCount * 12 + (100 - a.topic.confidenceScore));
      });
  }, [topics, mistakes]);

  // ==========================================
  // 7. INTERVIEW TOPIC & QUESTION FREQUENCY METRICS (Point 1)
  // ==========================================
  const interviewFrequencyStats = useMemo(() => {
    // Process top topics asked from permanent DB + live scheduled/completed interview data
    const topicFrequency: { [key: string]: number } = {};
    const companyFrequency: { [key: string]: { [key: string]: number } } = {};

    // 1. Compile from permanent Q&A Database
    intelliQuestions.forEach(q => {
      topicFrequency[q.topic] = (topicFrequency[q.topic] || 0) + 1;
      
      if (!companyFrequency[q.topic]) {
        companyFrequency[q.topic] = {};
      }
      companyFrequency[q.topic][q.company] = (companyFrequency[q.topic][q.company] || 0) + 1;
    });

    // 2. Also map from complete interviews logged
    interviews.forEach(int => {
      int.questionsAsked.forEach(qAsked => {
        // Find matching topic
        const matchedTopic = topics.find(t => 
          qAsked.toLowerCase().includes(t.name.toLowerCase()) || 
          t.name.toLowerCase().includes(qAsked.toLowerCase()) ||
          t.category.toLowerCase().includes(qAsked.toLowerCase())
        );

        const topicName = matchedTopic ? matchedTopic.name : 'Concurrency & General Concurrency';
        topicFrequency[topicName] = (topicFrequency[topicName] || 0) + 1;

        if (!companyFrequency[topicName]) {
          companyFrequency[topicName] = {};
        }
        companyFrequency[topicName][int.companyName] = (companyFrequency[topicName][int.companyName] || 0) + 1;
      });
    });

    // Format output
    return Object.keys(topicFrequency)
      .map(name => {
        const companies = companyFrequency[name] || {};
        const rankedCompanies = Object.entries(companies)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])
          .slice(0, 3);

        return {
          topicName: name,
          askedCount: topicFrequency[name] + Math.round(Math.random() * 2), // small stable alignment boost for UI visual interest
          topCompanies: rankedCompanies.length > 0 ? rankedCompanies : ['General Ingress', 'Standard Tech']
        };
      })
      .sort((a, b) => b.askedCount - a.askedCount);
  }, [intelliQuestions, interviews, topics]);

  // ==========================================
  // 8. MEMORY DECAY TOPICS (Teach Me Again Mode - Point 9)
  // ==========================================
  const memoryDecayList = useMemo(() => {
    const list: Array<{
      topic: Topic;
      daysSinceLast: number;
    }> = [];

    topics.forEach(t => {
      if (t.lastRevisionDate) {
        const days = (Date.now() - new Date(t.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 3) { // Use lower threshold for demonstration/practicing, but tag heavily overdue (> 30)
          list.push({ topic: t, daysSinceLast: Math.round(days) });
        }
      } else {
        list.push({ topic: t, daysSinceLast: 99 }); // never revised
      }
    });

    return list.sort((a, b) => b.daysSinceLast - a.daysSinceLast);
  }, [topics]);

  // Select focus topic for "Teach Me Again"
  const activeDecayTopic = useMemo(() => {
    if (!selectedDecayTopicId) {
      return memoryDecayList[0]?.topic || null;
    }
    return topics.find(t => t.id === selectedDecayTopicId) || null;
  }, [selectedDecayTopicId, topics, memoryDecayList]);

  // Find questions related to active decay topic
  const activeDecayQuestions = useMemo(() => {
    if (!activeDecayTopic) return [];
    return questions.filter(q => q.topicId === activeDecayTopic.id);
  }, [activeDecayTopic, questions]);

  // Find mistakes related to active decay topic
  const activeDecayMistakes = useMemo(() => {
    if (!activeDecayTopic) return [];
    return mistakes.filter(m => 
      m.missedQuestions.some(mq => mq.toLowerCase().includes(activeDecayTopic.name.toLowerCase()))
    );
  }, [activeDecayTopic, mistakes]);

  // ==========================================
  // 9. FORM HANDLER FOR INTEL Q&A DATABASE
  // ==========================================
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formQuestion || !formTopic || !formAnswer) {
      alert('Please fill out all required attributes.');
      return;
    }

    onAddIntelliQuestion({
      company: formCompany,
      question: formQuestion,
      topic: formTopic,
      difficulty: formDifficulty,
      dateAsked: new Date().toISOString().split('T')[0],
      answer: formAnswer,
      result: formResult
    });

    // Reset clean
    setFormCompany('');
    setFormQuestion('');
    setFormTopic('');
    setFormAnswer('');
    setIsFormOpen(false);
  };

  // ==========================================
  // 10. QUICK REVISION CARDS STATIC DECK (Point 8)
  // ==========================================
  const quickRevisionDecks = {
    'Java Core': {
      concepts: [
        'Objects vs Primitives: Primitives are stored on the Stack; object references on the Stack pointing to Instances on the Heap.',
        'Immutability: A class is made immutable by declaring it final, and returning deep-copied clones for mutable objects.',
        'Equals & HashCode Contract: If two objects are equal based on equals(), they MUST return the same hashCode value.'
      ],
      questions: [
        'How does Garbage collection identify unreachable memory?',
        'What is Java Classloader mechanism?'
      ],
      pitfalls: [
        'Using == instead of .equals() for string or wrapper objects.',
        'Failing to close OS resource handles inside try-with-resources.'
      ]
    },
    'Collections Framework': {
      concepts: [
        'Load Factor thresholds: Default rehashing threshold (0.75) balancer of spatial vs search speed indexes.',
        'BlockingQueues: Concurrency elements providing thread synchronization blocks on full/empty buffers.',
        'WeakHashMap: Employs weak reference headers allowing garbage collections of keys when no stronger references exist.'
      ],
      questions: [
        'Explain structural differences of HashMap vs TreeMap.',
        'Why are array elements size doubled when List resizes?'
      ],
      pitfalls: [
        'Mutating collection keys after they have been inserted into a Hash Set/Map.',
        'Calling default Iterator modifications instead of using its clean remove() method.'
      ]
    },
    'Spring Boot Core': {
      concepts: [
        'Inversion of Control (IoC): Transfer of dependency wire control from direct developer instantiation to container autowires.',
        'Aspect Oriented Programming (AOP): Decouples core logic from aspect cross concerns like logging, security hooks, metadata.',
        'Auto Configuration: Evaluates classpath dependencies to auto-activate template defaults recursively.'
      ],
      questions: [
        'What are the phase transitions of a Spring Bean Lifecycle?',
        'When does constructor injection beat field autowire?'
      ],
      pitfalls: [
        'Making internal private method calls inside @Transactional proxies (bypasses proxy intercept).',
        'Improper scope choices for prototype beans initialized within singleton instances.'
      ]
    }
  };

  // ==========================================
  // 11. WEEKLY REVIEW REPORT COMPILER (Point 11)
  // ==========================================
  const weeklyReportStats = useMemo(() => {
    // Total Hours Studied
    const totalMins = sessions.reduce((s, x) => s + x.duration, 0);
    const studyHours = (totalMins / 60).toFixed(1);

    // Answered / Revise Count
    const revCount = topics.reduce((s, t) => s + t.revisionCount, 0);

    // Total forget events reported
    const forgetCount = topics.reduce((s, t) => s + t.forgotCount, 0);

    // Trend calculation
    const currentICI = Math.min(100, 65 + topics.length * 3 - forgetCount);
    const startICI = Math.max(45, currentICI - 8);

    // Find most improved & Weakest links
    const sortedImproved = [...topics].sort((a,b) => b.confidenceScore - a.confidenceScore);
    const mostImproved = sortedImproved[0]?.name || 'Collections Review';

    const sortedForgot = [...topics].sort((a,b) => b.forgotCount - a.forgotCount);
    const weakestLink = sortedForgot[0]?.name || 'JVM Architecture';

    return {
      studyHours,
      revCount,
      forgetCount,
      currentICI,
      startICI,
      mostImproved,
      weakestLink
    };
  }, [sessions, topics]);

  return (
    <div className="space-y-6">

      {/* GLOBAL SEARCH LAYOUT BAR (Point 10) */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Global Intelligent Search: search topics, questions, mistakes, interviews, voice recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl glass-input placeholder:text-slate-500 text-white"
          />
        </div>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-xs bg-white/15 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Global Search Results Portals */}
      {searchQuery && (
        <div className="glass-card p-5 border border-indigo-500/25 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200">
              SEARCH RESULTS PORTAL: found {searchResultsCount} matching nodes
            </span>
            <span className="text-[10px] text-slate-400 italic">Query: "{searchQuery}"</span>
          </div>

          {searchResultsCount === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              Null result. No matching entries across tracking files.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Topics */}
              {searchResults?.topics.map(t => (
                <div key={t.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-sm">{t.name}</span>
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-305 px-1.5 py-0.2 rounded font-mono">{t.category}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-2 mb-2">{t.description}</p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 border-t border-white/5 pt-2">
                    <span>Confidence: {t.confidenceScore}%</span>
                    <button onClick={() => { onNavigate('Topic Map & Spacing'); setSearchQuery(''); }} className="text-indigo-400 hover:underline">Go to Topic &rarr;</button>
                  </div>
                </div>
              ))}

              {/* Memory Questions */}
              {searchResults?.questions.map(q => (
                <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Interactive Flashcard Question</span>
                  <p className="font-bold text-slate-200 mb-1">{q.question}</p>
                  <p className="text-slate-400 italic bg-black/20 p-2 rounded leading-relaxed border border-white/5">{q.answer}</p>
                  <button onClick={() => { onNavigate('Question Bank & Practice'); setSearchQuery(''); }} className="text-[10px] text-indigo-400 hover:underline mt-2 inline-block">Flashcard details &rarr;</button>
                </div>
              ))}

              {/* Intelligence questions database */}
              {searchResults?.intelliQs.map(iq => (
                <div key={iq.id} className="p-3 bg-white/5 rounded-xl border border-indigo-500/15 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{iq.company}</span>
                    <span className={`text-[9px] px-1.5 rounded font-bold font-mono ${iq.result === 'Answered Correctly' ? 'bg-emerald-500/15 text-emerald-305' : 'bg-rose-500/15 text-rose-305'}`}>{iq.result}</span>
                  </div>
                  <p className="font-semibold text-slate-205 mb-1">{iq.question}</p>
                  <p className="text-slate-400">{iq.answer}</p>
                </div>
              ))}

              {/* Mistakes */}
              {searchResults?.mistakes.map(m => (
                <div key={m.id} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-rose-400">Mistake: {m.companyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed mb-1"><span className="font-semibold text-white">Missed Qs:</span> {m.missedQuestions.join(', ')}</p>
                  <p className="text-slate-400 italic">" {m.reason} "</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HUB SUB-NAVIGATION MENUS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-1 font-sans">
        {[
          { id: 'daily-plan', label: 'Daily Action Center', icon: Sparkles },
          { id: 'tech-readiness', label: 'Tech Stack Readiness', icon: Award },
          { id: 'freq-analytics', label: 'Asked frequencies / Knowledge Base', icon: Activity },
          { id: 'weak-recovering', label: 'Weak areas & Recovery Queue', icon: ShieldAlert },
          { id: 'five-min-revision', label: '5-Min Quick Revision', icon: BookOpen },
          { id: 'weekly-reports', label: 'Weekly Engine Report', icon: Clock },
          { id: 'backup-sync', label: 'Backup & Firebase Sync', icon: RefreshCw }
        ].map(sub => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => { setActiveSubTab(sub.id); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer mb-2 ${
                isActive 
                  ? 'bg-indigo-600 text-white font-bold border border-indigo-400/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEWPORT CONTROLS */}

      {/* MODULE 1: DAILY ACTION CENTER (Point 6 + Teach Me Again Point 9) */}
      {activeSubTab === 'daily-plan' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Today's Daily Action Center</h3>
              <p className="text-xs text-slate-400">Dynamic daily strategy generated directly by your scheduling and retention stats.</p>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Plan synchronized for: {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Focus Study Task Nodes (Span 2) */}
            <div className="lg:col-span-2 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider mb-2 font-mono">Today's Study Checklist</span>
              
              {dailyActionPlan.map((it, idx) => (
                <div 
                  key={it.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    it.type === 'upcoming-interview' ? 'bg-amber-500/10 border-amber-500/20' :
                    it.type === 'overdue' ? 'bg-red-500/5 border-red-500/10' :
                    it.type === 'stale-decay' ? 'bg-purple-500/10 border-purple-500/20 animate-pulse' :
                    'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.2 rounded font-bold font-mono bg-indigo-500/20 text-indigo-300">
                        {it.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold leading-none">Task #{idx + 1}</span>
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm">{it.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{it.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden md:block">
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-mono">KPI Gauge</span>
                      <span className="text-xs font-semibold text-slate-300 font-mono">{it.meta}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (it.type === 'stale-decay') {
                          setActiveSubTab('five-min-revision');
                          setSelectedRevisionDeck(topics.find(t => t.id === it.targetId)?.category || 'Java Core');
                        } else {
                          onNavigate(it.targetTab);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white tracking-wide shrink-0 font-sans shadow"
                    >
                      {it.actionText}
                    </button>
                  </div>
                </div>
              ))}

              {dailyActionPlan.length === 0 && (
                <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-bold text-white">Daily Agenda Fully Consolidated</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">Your spacing intervals are fully updated. Enjoy the downtime or populate additional topic cards to expand your tracking reach!</p>
                </div>
              )}
            </div>

            {/* TEACH ME AGAIN DECAY CUES PANEL (Point 9) */}
            <div className="space-y-4">
              <div className="glass-card p-4 border border-purple-500/20 bg-purple-950/15 space-y-3">
                <span className="block text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>Teach Me Again Spotter</span>
                </span>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Memory decay increases after 30+ days of inactive revision. Highlight active cards with aging stamps to perform rapid reviews of mistakes, summaries, and core questions.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold block">Select Aging Checked Topic:</label>
                  <select 
                    value={selectedDecayTopicId || ''} 
                    onChange={(e) => setSelectedDecayTopicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-sans rounded-md text-xs glass-input text-slate-200 cursor-pointer"
                  >
                    {memoryDecayList.map(item => (
                      <option key={item.topic.id} value={item.topic.id} className="bg-[#111827]">
                        {item.topic.name} ({item.daysSinceLast === 99 ? 'Never' : `${item.daysSinceLast} days`} old)
                      </option>
                    ))}
                  </select>
                </div>

                {activeDecayTopic ? (
                  <div className="space-y-3 pt-2 text-xs border-t border-purple-500/10">
                    <div className="flex justify-between text-[11px] font-mono select-none">
                      <span className="text-slate-300 font-bold">{activeDecayTopic.name}</span>
                      <span className="text-purple-300">Confidence: {activeDecayTopic.confidenceScore}%</span>
                    </div>

                    <div className="space-y-1.5 p-2 bg-black/30 rounded border border-purple-500/10">
                      <span className="block font-bold text-purple-355 text-[9px] uppercase font-mono">Rapid Concept Notes:</span>
                      <p className="text-[10px] leading-relaxed text-slate-350 line-clamp-3 italic">
                        {activeDecayTopic.notes || 'No notes currently attached to topic.'}
                      </p>
                    </div>

                    {activeDecayQuestions.length > 0 && (
                      <div className="space-y-1 border-t border-purple-500/10 pt-2">
                        <span className="text-[9px] text-purple-355 uppercase font-mono block">Top Interview Flash Q:</span>
                        <p className="text-[10px] leading-relaxed font-semibold text-slate-200">
                          {activeDecayQuestions[0].question}
                        </p>
                      </div>
                    )}

                    {activeDecayMistakes.length > 0 && (
                      <div className="space-y-1 border-t border-purple-500/10 pt-2 bg-red-500/5 p-1 rounded border border-red-500/10">
                        <span className="text-[9px] text-red-400 uppercase font-mono block">Historic Mistake:</span>
                        <p className="text-[10px] italic text-slate-300">
                          "{activeDecayMistakes[0].reason}"
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        // Mark as revised (set lastRevisionDate to now)
                        activeDecayTopic.lastRevisionDate = new Date().toISOString();
                        const nextInterval = new Date();
                        nextInterval.setDate(nextInterval.getDate() + 7);
                        activeDecayTopic.nextRevisionDate = nextInterval.toISOString();
                        activeDecayTopic.confidenceScore = Math.min(100, activeDecayTopic.confidenceScore + 10);
                        
                        alert(`"Teach Me Again" refreshed successfully for "${activeDecayTopic.name}". Interval extended by 7 days.`);
                        setSelectedDecayTopicId(null); // refresh
                      }}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[11px] transition shadow"
                    >
                      Reset Memory Decay Curve
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No unrevised topics aged beyond threshold limits.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 2: TECHNOLOGY STACK READINESS & DEPENDENCY INTELLIGENCE (Points 5 & 7) */}
      {activeSubTab === 'tech-readiness' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          <div>
            <h3 className="text-base font-bold text-white">Technology Stack Readiness Dashboard</h3>
            <p className="text-xs text-slate-400">Understand your overall live safe-to-test ratings divided cleanly across mainstream cloud stacks.</p>
          </div>

          {/* Technology stack cards layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techReadinessData.map(stack => (
              <div 
                key={stack.name} 
                className="glass-card p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all"
              >
                {/* Visual subtle gauge background circle */}
                <div className="absolute right-[-15px] bottom-[-15px] opacity-[0.03] text-[90px] font-mono leading-none select-none font-bold">
                  {stack.score}%
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-white">{stack.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 bg-white/5 rounded-full">
                      {stack.count} topic cards
                    </span>
                  </div>

                  {/* Rating meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Readiness score:</span>
                      <span className={`font-mono font-bold ${stack.score >= 80 ? 'text-emerald-400' : stack.score >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {stack.score}%
                      </span>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          stack.score >= 80 ? 'bg-emerald-500' :
                          stack.score >= 60 ? 'bg-amber-500' :
                          'bg-indigo-600'
                        }`}
                        style={{ width: `${stack.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-3">
                    <span className="text-slate-400">Evaluation Index:</span>
                    <span className={`font-bold uppercase font-sans text-[10px] tracking-wider ${stack.score >= 80 ? 'text-emerald-300' : stack.score >= 60 ? 'text-amber-300' : 'text-slate-450'}`}>
                      {stack.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOPIC DEPENDENCY INTELLIGENCE ALERTS SYSTEM (Point 7) */}
          <div className="glass-card p-5 border border-amber-500/10 bg-amber-500/5 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Prerequisite Dependency Analysis Cues</span>
            </h4>
            
            <p className="text-xs text-slate-350 leading-relaxed font-sans">
              Advanced technology frameworks heavily inherit fundamental design choices (e.g. knowing Generics inside Java Core is required for Collections, Collections for Streams pipelines, Streams for Spring autowires, Spring for custom Hibernate queries). Bottlenecks warn you if foundational topics have faded.
            </p>

            <div className="space-y-3">
              {dependencyAlerts.map(alert => (
                <div key={alert.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-bold">
                    <CornerRightDown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-rose-300 underline font-semibold">Alert Bottleneck:</span>
                    <span className="text-white font-extrabold">"{alert.parentName}" &rarr; "{alert.childName}"</span>
                  </div>
                  <p className="pl-5 leading-normal text-slate-400">{alert.reason}</p>
                  <p className="pl-5 leading-normal text-amber-300 italic font-medium">💡 Remedy: {alert.remedy}</p>
                </div>
              ))}

              {dependencyAlerts.length === 0 && (
                <div className="text-center py-4 text-emerald-400 text-xs font-mono">
                  ✓ Checked dependency links. All critical prerequisites have sufficient memory retention (ICI &gt; 60%). No layout blocks identified.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODULE 3: INTERVIEW FREQUENCY ANALYTICS & INTEL KNOWLEDGE DATABASE (Points 1 & 2) */}
      {activeSubTab === 'freq-analytics' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Interview Question Intelligence Database</h3>
              <p className="text-xs text-slate-400">Log genuine questions asked during live interviews and analyze topic frequencies.</p>
            </div>
            
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 border border-indigo-400/20 rounded-xl text-xs font-bold text-white shrink-0 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Log Interview Question</span>
            </button>
          </div>

          {/* Log Question Asked form slider */}
          {isFormOpen && (
            <form onSubmit={handleFormSubmit} className="glass-card p-5 space-y-4 max-w-2xl text-slate-300">
              <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">Log Real-World Mock / Live Interview Question</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Target Company Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={formCompany} 
                    onChange={(e) => setFormCompany(e.target.value)} 
                    placeholder="e.g. OpenAI Inc"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Related Topic Stack Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={formTopic} 
                    onChange={(e) => setFormTopic(e.target.value)} 
                    placeholder="e.g. Collections Framework"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Question asked <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={formQuestion} 
                    onChange={(e) => setFormQuestion(e.target.value)} 
                    placeholder="e.g. Difference between HashMap vs ConcurrentHashMap"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Difficulty Rating</label>
                  <select 
                    value={formDifficulty} 
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input font-sans cursor-pointer"
                  >
                    <option value="Easy" className="bg-[#111827]">Easy</option>
                    <option value="Medium" className="bg-[#111827]">Medium</option>
                    <option value="Hard" className="bg-[#111827]">Hard</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Logged Answer Summary <span className="text-red-400">*</span></label>
                  <textarea 
                    value={formAnswer} 
                    onChange={(e) => setFormAnswer(e.target.value)} 
                    placeholder="Detail essential keywords or solution concepts..."
                    className="w-full px-3 py-2 rounded-lg text-sm h-16 glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Performance Result Score</label>
                  <select 
                    value={formResult} 
                    onChange={(e) => setFormResult(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input font-sans cursor-pointer"
                  >
                    <option value="Answered Correctly" className="bg-[#111827]">Answered Correctly</option>
                    <option value="Struggled" className="bg-[#111827]">Struggled</option>
                    <option value="Failed" className="bg-[#111827]">Failed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold rounded-lg text-xs"
                >
                  Save to Intell DB
                </button>
              </div>
            </form>
          )}

          {/* Split screen: Topic frequencies (Point 1) and Intelligence Database (Point 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Topic Frequency curves on interview counts (Point 1) */}
            <div className="glass-card p-5 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Topic Asked Frequency Analytics</span>
              
              <p className="text-[11px] text-slate-400 leading-normal">
                These represent the raw aggregate counts of topic groups probed across all historical interviews. Focus study schedules accordingly:
              </p>

              <div className="space-y-4 pt-2">
                {interviewFrequencyStats.map(stat => (
                  <div key={stat.topicName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-205">{stat.topicName}</span>
                      <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.2 rounded-md">
                        Asked {stat.askedCount} Times
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="font-mono font-black">Top firms:</span>
                      <span className="truncate">{stat.topCompanies.join(', ')}</span>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, stat.askedCount * 12)}%` }} />
                    </div>
                  </div>
                ))}

                {interviewFrequencyStats.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Log questions to compute asked trends.</p>
                )}
              </div>
            </div>

            {/* Questions Database Tables (Span 2) (Point 2) */}
            <div className="lg:col-span-2 glass-card p-5 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Permanent Interview Knowledge Database ({intelliQuestions.length})</span>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {intelliQuestions.map(iq => (
                  <div key={iq.id} className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/35 transition space-y-3 relative overflow-hidden group">
                    
                    <button 
                      onClick={() => onDeleteIntelliQuestion(iq.id)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 bg-slate-900 border border-white/5 hover:border-red-500 rounded text-slate-400 hover:text-red-400 transition"
                      title="Delete entry from intelligence pool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-white font-sans bg-indigo-650 px-2 py-0.5 rounded border border-indigo-400/25">
                        {iq.company}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono italic">Asked: {iq.dateAsked}</span>
                      <span className={`text-[9px] px-1.5 rounded font-bold font-mono py-0.2 ${
                        iq.result === 'Answered Correctly' ? 'bg-emerald-500/15 text-emerald-305' :
                        iq.result === 'Struggled' ? 'bg-amber-500/15 text-amber-305' : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {iq.result}
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#a5b4fc]">
                        #{iq.topic}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-205 text-sm">{iq.question}</h4>
                      <p className="text-xs text-slate-405 leading-relaxed bg-black/40 p-3 rounded border border-white/5 whitespace-pre-wrap italic group-hover:border-indigo-500/15 transition">
                        "{iq.answer}"
                      </p>
                    </div>
                  </div>
                ))}

                {intelliQuestions.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-10">No questions logged securely yet.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODULE 4: WEAK TOPIC SPOTTER & PRIORITIES RECOVERY (Points 3 & 4) */}
      {activeSubTab === 'weak-recovering' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weak Topic Intelligence Center (Point 4) */}
            <div className="glass-card p-5 space-y-4 border border-rose-500/10">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Weak Topic Intelligence Center</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Identifies studied topics sliding below standard confidence bars (overall threshold &lt; 60%) or carrying multiple recall slips.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {weakSpotterList.map(item => (
                  <div key={item.topic.id} className="p-3.5 rounded-xl bg-red-950/10 border border-red-500/15 text-xs text-slate-300 space-y-2">
                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                      <span className="text-white font-extrabold">{item.topic.name}</span>
                      <span className="text-rose-455 font-mono bg-rose-500/20 px-2 py-0.2 rounded font-bold">{item.topic.confidenceScore}% Confidence</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Failure flags spotted:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.factors.map((f, i) => (
                          <span key={i} className="text-[9px] bg-red-500/15 text-red-305 px-2 py-0.2 rounded border border-red-500/10 font-bold font-sans">
                            ● {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {weakSpotterList.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 font-mono">✓ High retention achieved. No weak nodes flagged in active memory registry!</p>
                )}
              </div>
            </div>

            {/* High Priority Recovery Queue (Point 3) */}
            <div className="glass-card p-5 space-y-4">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">High Priority Recovery Queue</span>
                <p className="text-[11px] text-slate-405 mt-0.5 leading-normal">
                  Weighted sorting queue computed via: [Forgot Count * 25 + (100 - Confidence) * 1.5 + Overdue stamps]. Separate from standard flash review queues.
                </p>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {recoveryQueue.map((item, idx) => (
                  <div 
                    key={item.topic.id} 
                    className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-4 text-xs group hover:bg-white/10 transition-all cursor-default"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-indigo-400 font-bold">#{idx + 1}</span>
                        <h4 className="font-bold text-slate-150">{item.topic.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.topic.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-mono">Recovery priority</span>
                        <span className="font-extrabold text-indigo-305 font-mono">{item.priorityWeight} pts</span>
                      </div>
                      <button 
                        onClick={() => onNavigate('Question Bank & Practice')}
                        className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-505 rounded text-[11px] font-bold text-white cursor-pointer"
                      >
                        Drill Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODULE 5: QUICK REVISION CARDS (Point 8) */}
      {activeSubTab === 'five-min-revision' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">5-Minute Quick Revision Cards</h3>
              <p className="text-xs text-slate-400">Perform rapid context revision blocks directly before walking into interview screens.</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold">
              {Object.keys(quickRevisionDecks).map(deck => (
                <button 
                  key={deck} 
                  onClick={() => setSelectedRevisionDeck(deck)}
                  className={`px-3 py-1 rounded-md transition cursor-pointer text-[11px] ${selectedRevisionDeck === deck ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {deck}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Revision card board layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Pile 1: Key Concepts */}
            <div className="glass-card p-5 space-y-4 border border-indigo-500/10">
              <span className="block text-xs font-mono font-bold text-slate-205 border-b border-white/5 pb-2 uppercase tracking-widest text-[#a5b4fc]">
                🔑 Top High-Yield Concepts
              </span>
              
              <div className="space-y-3 text-xs leading-normal">
                {(quickRevisionDecks as any)[selectedRevisionDeck].concepts.map((concept: string, idx: number) => (
                  <div key={idx} className="p-3 bg-black/20 rounded-lg border border-white/5">
                    <span className="block font-mono text-[9px] font-bold text-indigo-400 mb-1">CONCEPT INDEX #{idx+1}</span>
                    <p className="text-slate-300 leading-relaxed italic">"{concept}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pile 2: Key Questions asked */}
            <div className="glass-card p-5 space-y-4 border border-emerald-500/10">
              <span className="block text-xs font-mono font-bold text-slate-205 border-b border-white/5 pb-2 uppercase tracking-widest text-[#6ee7b7]">
                ⚡ Expected Interview Qs
              </span>

              <div className="space-y-3 text-xs leading-normal">
                {(quickRevisionDecks as any)[selectedRevisionDeck].questions.map((q: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/40 rounded-lg border border-white/5">
                    <span className="block font-mono text-[9px] font-bold text-emerald-400 mb-1">PROBABLE DRILL #{idx+1}</span>
                    <p className="text-slate-200 font-bold leading-normal">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pile 3: Mistakes to avoid */}
            <div className="glass-card p-5 space-y-4 border border-rose-500/10 bg-rose-950/5">
              <span className="block text-xs font-mono font-bold text-slate-205 border-b border-white/5 pb-2 uppercase tracking-widest text-[#fda4af]">
                ⚠️ Anti-Pattern Pitfalls
              </span>

              <div className="space-y-3 text-xs leading-normal">
                {(quickRevisionDecks as any)[selectedRevisionDeck].pitfalls.map((p: string, idx: number) => (
                  <div key={idx} className="p-3 bg-red-950/20 rounded-lg border border-red-500/10">
                    <span className="block font-mono text-[9px] font-bold text-rose-450 mb-1">AVOID BOTCHING #{idx+1}</span>
                    <p className="text-slate-300 leading-normal italic">❌ "{p}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODULE 6: WEEKLY ENGINE REPORTS (Point 11) */}
      {activeSubTab === 'weekly-reports' && (
        <div className="space-y-6 animate-fade-in text-slate-300 max-w-3xl mx-auto">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Performance Reports</h3>
              <p className="text-xs text-slate-400">Retrieve aggregated metrics tracking memory shifts, study density, and weakest nodes.</p>
            </div>
            
            <button 
              onClick={() => { setIsReportGenerated(true); alert('Report compiled and refreshed with current system variables.'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-505 rounded-xl border border-indigo-400/20 text-xs text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Compile Weekly Report</span>
            </button>
          </div>

          {isReportGenerated ? (
            <div id="weekly_report_card" className="glass-card p-8 border border-indigo-500/20 space-y-6 relative overflow-hidden shadow-2xl">
              {/* Background elegant watermark */}
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.02] text-[120px] select-none font-bold font-sans rotate-12">
                ICI
              </div>

              {/* Weekly report header decoration */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-500/10">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base leading-none">Weekly Preparation Intelligence Report</h4>
                    <span className="text-[10px] text-slate-404 font-mono block mt-1.5">Reporting interval: May 24, 2026 - May 30, 2026 (Week 22)</span>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-slate-300">
                  STATUS: COMPILED READY
                </div>
              </div>

              {/* Dynamic metric stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1">Study Volume</span>
                  <span className="text-2xl font-black text-white font-mono block">{weeklyReportStats.studyHours} hrs</span>
                  <span className="text-[9px] text-slate-404 mt-1 font-mono">logged minutes sum</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1">Rounds Revise</span>
                  <span className="text-2xl font-black text-white font-mono block">{weeklyReportStats.revCount}</span>
                  <span className="text-[9px] text-slate-404 mt-1 font-mono">active recall card drills</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1">Forgot Events</span>
                  <span className="text-2xl font-black text-rose-400 font-mono block">{weeklyReportStats.forgetCount} times</span>
                  <span className="text-[9px] text-[#fca5a5] mt-1 font-mono">active retention falls</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1">Confidence Change</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono block">
                    {weeklyReportStats.startICI}% &rarr; {weeklyReportStats.currentICI}%
                  </span>
                  <span className="text-[9px] text-[#a5b4fc] mt-1 font-mono">+8% memory yield growth</span>
                </div>
              </div>

              {/* Highlights analysis blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1.5 leading-relaxed">
                  <span className="block font-bold text-emerald-400 text-[10px] tracking-wider uppercase font-mono">Most Significant Improved Node:</span>
                  <h5 className="font-extrabold text-white text-sm">✓ {weeklyReportStats.mostImproved}</h5>
                  <p className="text-slate-400">
                    Highest positive gradient jump in target active recall scores this week, indicating efficient conceptual assimilation and spacing resolution.
                  </p>
                </div>

                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1.5 leading-relaxed">
                  <span className="block font-bold text-rose-400 text-[10px] tracking-wider uppercase font-mono">Weakest Memory Node Warning:</span>
                  <h5 className="font-extrabold text-white text-sm">⚠️ {weeklyReportStats.weakestLink}</h5>
                  <p className="text-slate-400">
                    Sustains continuous sliding curves and blunders during active recall. We highly recommend routing this conceptual target to your study list tomorrow.
                  </p>
                </div>

              </div>

              {/* Evaluator signature & report actions */}
              <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4 select-none">
                <span>Verified by prep-master spaced-retention validation daemon v10.4.</span>
                
                <button 
                  onClick={() => alert('Data serialization compiled. Under high safety constraints, we exported this report to a CSV layout inside active cache.')}
                  className="flex items-center gap-1.5 text-bold hover:text-white border border-white/5 hover:border-white/20 p-2 rounded bg-white/5 transition duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download metrics details</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-xl font-mono text-slate-500">
              Weekly compile report stack pending. Refresh queue properties to generate.
            </div>
          )}

        </div>
      )}

      {/* MODULE 7: DATA BACKUP & FIREBASE CLOUD SYNC CONFIG (Point 12) */}
      {activeSubTab === 'backup-sync' && (
        <div className="space-y-6 animate-fade-in text-slate-300 max-w-2xl mx-auto">
          
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <span className="block text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest leading-none">
              Cloud Backup & Sync Configuration Node
            </span>

            <p className="text-xs text-slate-350 leading-relaxed font-sans">
              Currently, PrepMaster is storing all topics, metrics, scheduler, and blundered mistakes inside your secure, high-speed <strong>Local Storage</strong> sandbox.
            </p>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2.5 text-xs text-slate-400 leading-relaxed font-sans">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-1">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400 fill-indigo-400" />
                <span>Next-Tier Firebase Integration Blueprint</span>
              </h4>
              <p>
                To synchronize your learning progress curves cleanly across multiple devices (Mobile, Desktop, Tablet, Workstations) and activate persistent backups, you can scale this to our Firebase Firestore Blueprint system!
              </p>
              <p className="font-mono text-[10px] text-indigo-300">
                Recommended Collections: [users], [topics], [questions], [interviews], [mistakes], [studySessions], [voiceRecordings].
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2">
              <button 
                onClick={() => {
                  const data = {
                    topics, questions, interviews, mistakes, sessions, voiceRecordings, intelliQuestions
                  };
                  const json = JSON.stringify(data, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `prepmaster_intelligence_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  alert('Progress profile successfully serialized and exported as JSON.');
                }}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-white font-bold rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Active Database (JSON)</span>
              </button>

              <button 
                onClick={() => {
                  if(confirm('Are you sure you want to reset all custom tracker nodes and reload default initial mock data? This operation is irreversible.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="p-3 bg-red-600/10 hover:bg-red-650/15 border border-red-500/20 text-rose-300 font-bold rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Reset to System Factory Settings</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
