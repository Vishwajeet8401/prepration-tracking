import React, { useState, useMemo } from 'react';
import { 
  Topic, Question, Interview, Mistake, StudySession, 
  VoiceRecording, InterviewIntelligenceQuestion 
} from '../types';
import AudioPlayButton from './AudioPlayButton';
import { 
  Sparkles, ShieldAlert, Award, Calendar, Layers, Activity, Search, 
  HelpCircle, CheckCircle2, ChevronRight, CornerRightDown, BookOpen, Clock, 
  Download, RefreshCw, Plus, Trash2, Edit, AlertCircle, Play, Sliders, AlertTriangle,
  ArrowUpRight, Check, Flame, Zap, Mic, BarChart3, Database
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { useScrollGesture } from '../hooks/useScrollGesture';

const INTEL_SUBTABS = ['daily-plan', 'tech-readiness', 'freq-analytics', 'weak-recovering', 'five-min-revision', 'weekly-reports'];


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
  onUpdateTopic?: (topic: Topic) => Promise<void>;
}

const IntelligenceHub = React.memo(function IntelligenceHub({
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
  onDeleteIntelliQuestion,
  onUpdateTopic
}: IntelligenceHubProps) {

  // Inner tab selection inside Intelligence Hub
  const [activeSubTab, setActiveSubTab] = useState<string>('daily-plan');

  // ── Gesture scroll + subtab switching ──
  useScrollGesture({
    activeTab: 'AI Learning Assistant',
    onSwipeLeft: () => {
      const idx = INTEL_SUBTABS.indexOf(activeSubTab);
      if (idx < INTEL_SUBTABS.length - 1) { setActiveSubTab(INTEL_SUBTABS[idx + 1]); }
    },
    onSwipeRight: () => {
      const idx = INTEL_SUBTABS.indexOf(activeSubTab);
      if (idx > 0) { setActiveSubTab(INTEL_SUBTABS[idx - 1]); }
    },
  });


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

  // Stateful and dynamic Quick Revision Decks
  const [customRevisionDecks, setCustomRevisionDecks] = useState<{
    [key: string]: {
      concepts: string[];
      questions: string[];
      pitfalls: string[];
    }
  }>(() => {
    try {
      const saved = localStorage.getItem('prepflow_custom_revision_decks');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse custom revision decks:", e);
      return {};
    }
  });

  const handleImportDecks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (typeof json !== 'object' || json === null) {
          alert('Invalid format. JSON must be an object containing revision decks.');
          return;
        }

        for (const [key, value] of Object.entries(json)) {
          if (typeof value !== 'object' || value === null) {
            alert(`Deck "${key}" is not formatted properly. It must be an object.`);
            return;
          }
          const val = value as any;
          if (!Array.isArray(val.concepts) || !Array.isArray(val.questions) || !Array.isArray(val.pitfalls)) {
            alert(`Deck "${key}" must contain concepts, questions, and pitfalls as arrays.`);
            return;
          }
        }

        const updated = { ...customRevisionDecks, ...json };
        setCustomRevisionDecks(updated);
        localStorage.setItem('prepflow_custom_revision_decks', JSON.stringify(updated));
        alert('Custom revision decks imported successfully!');
        
        // Auto-select the first imported deck if available
        const importedKeys = Object.keys(json);
        if (importedKeys.length > 0) {
          setSelectedRevisionDeck(importedKeys[0]);
        }
      } catch (err) {
        alert('Failed to parse JSON file. Please check for syntax errors.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportDecks = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customRevisionDecks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", "prepflow_custom_revision_decks.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadTemplate = () => {
    const template = {
      "React Hooks": {
        "concepts": [
          "State preservation across renders using useState.",
          "Side effects management using useEffect hooks."
        ],
        "questions": [
          "Explain the difference between useMemo and useCallback.",
          "What are the rules of Hooks?"
        ],
        "pitfalls": [
          "Declaring hooks inside conditional checks or nested loops.",
          "Missing dependency arrays causing stale closure references."
        ]
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", "prepflow_revision_deck_template.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteCustomDeck = (deckName: string) => {
    if (confirm(`Are you sure you want to delete the custom deck "${deckName}"?`)) {
      const updated = { ...customRevisionDecks };
      delete updated[deckName];
      setCustomRevisionDecks(updated);
      localStorage.setItem('prepflow_custom_revision_decks', JSON.stringify(updated));
      setSelectedRevisionDeck('Java Core'); // Fallback
    }
  };

  // Teach Me Again memory decay view focus
  const [selectedDecayTopicId, setSelectedDecayTopicId] = useState<string | null>(null);

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  // Weekly review reports status
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
      interviews: interviews.filter(i => i.companyName.toLowerCase().includes(q) || (i.feedback && i.feedback.toLowerCase().includes(q))),
      mistakes: mistakes.filter(m => m.companyName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q) || m.missedQuestions.some(mq => mq.toLowerCase().includes(q))),
      recordings: voiceRecordings.filter(v => v.title.toLowerCase().includes(q) || (v.notes && v.notes.toLowerCase().includes(q))),
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
      type: 'overdue' | 'weak' | 'upcoming-interview' | 'stale-decay' | 'bottleneck';
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
            targetTab: 'Goals & Applications'
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
            actionText: 'Recall Now',
            targetId: t.id,
            targetTab: 'Flashcards & Practice'
          });
        }
      }
    });

    // Dependency Bottlenecks check
    topics.forEach(child => {
      if (child.dependencyIds && child.dependencyIds.length > 0) {
        child.dependencyIds.forEach(parentId => {
          const parent = topics.find(t => t.id === parentId);
          if (parent && parent.confidenceScore <= 60 && child.confidenceScore > 20) {
            items.push({
              id: `daily-plan-bottleneck-${parentId}-${child.id}`,
              type: 'bottleneck',
              title: `Resolve Foundational Bottleneck`,
              description: `You are studying "${child.name}" but parent prerequisite "${parent.name}" remains weak (${parent.confidenceScore}% confidence).`,
              meta: `Prereq Confidence: ${parent.confidenceScore}%`,
              actionText: 'Drill Prereq',
              targetId: parent.id,
              targetTab: 'Flashcards & Practice'
            });
          }
        });
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
          targetTab: 'Flashcards & Practice'
        });
      });

    // Stale/unvisited for 7+ days (Teach Me Again Cues)
    topics.forEach(t => {
      if (t.lastRevisionDate) {
        const daysSinceLast = (now.getTime() - new Date(t.lastRevisionDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast >= 7) {
          items.push({
            id: 'daily-plan-decay-' + t.id,
            type: 'stale-decay',
            title: `Resolve Memory Decay: ${t.name}`,
            description: `Last revised ${Math.round(daysSinceLast)} days ago. Tap "Teach Me Again" to perform a rapid high-efficiency recovery.`,
            meta: `${Math.round(daysSinceLast)} Days Unrevised`,
            actionText: 'Teach Me Again',
            targetId: t.id,
            targetTab: 'AI Learning Assistant'
          });
        }
      }
    });

    return items.slice(0, 5); // display top 5 high impact daily plan actions
  }, [topics, interviews]);

  // ==========================================
  // 3. REGULAR TECHNOLOGY READINESS GRAPH & RATINGS (Point 5)
  // ==========================================
  const dynamicCategories = useMemo(() => {
    const uniqueCats = Array.from(new Set(topics.map(t => t.category).filter(Boolean)));
    return uniqueCats.length > 0 
      ? uniqueCats.slice(0, 10) 
      : ['Java Core', 'Spring Boot', 'System Design', 'Concurrency', 'Databases'];
  }, [topics]);

  const techReadinessData = useMemo(() => {
    return dynamicCategories.map(cat => {
      const relatedTopics = topics.filter(t => 
        t.category.toLowerCase().includes(cat.toLowerCase()) || 
        cat.toLowerCase().includes(t.category.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(cat.toLowerCase()))
      );
      
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
            // If parent confidence is low (<= 60) which threatens child study
            if (parent.confidenceScore <= 60 && child.confidenceScore > 20) {
              alerts.push({
                id: `dep-alert-${parentId}-${child.id}`,
                parentName: parent.name,
                childName: child.name,
                reason: `Prerequisite "${parent.name}" has weak confidence (${parent.confidenceScore}%). This acts as a conceptual bottleneck.`,
                remedy: `We highly recommend increasing confidence in "${parent.name}" to at least 70% before continuing deep exercises in "${child.name}".`
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
    // Priority Formula: Forgot Count * 25 + (100 - Confidence Score) * 1.5 + Revision Gap Weight (Overdue status)
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
        const factors: string[] = [];
        if (t.confidenceScore < 50) factors.push(`Low Confidence: ${t.confidenceScore}%`);
        if (t.recallScore < 45) factors.push(`Sub-par Retention: ${t.recallScore}%`);
        if (t.forgotCount >= 2) factors.push(`Repeated Memory Slip: ${t.forgotCount} times`);
        
        // Check if involved in some logged interview mistakes
        const isInterviewMistake = mistakes.some(m => 
          m.missedQuestions && m.missedQuestions.some(mq => mq.toLowerCase().includes(t.name.toLowerCase()))
        );
        if (isInterviewMistake) factors.push('Failed live interview test');

        return {
          topic: t,
          factors
        };
      })
      .sort((a, b) => {
        return (b.topic.forgotCount * 12 + (100 - b.topic.confidenceScore)) - (a.topic.forgotCount * 12 + (100 - a.topic.confidenceScore));
      });
  }, [topics, mistakes]);

  // ==========================================
  // 7. INTERVIEW TOPIC & QUESTION FREQUENCY METRICS (Point 1)
  // ==========================================
  const interviewFrequencyStats = useMemo(() => {
    const topicFrequency: { [key: string]: number } = {};
    const companyFrequency: { [key: string]: { [key: string]: number } } = {};

    // Compile from permanent Q&A Database
    intelliQuestions.forEach(q => {
      topicFrequency[q.topic] = (topicFrequency[q.topic] || 0) + 1;
      
      if (!companyFrequency[q.topic]) {
        companyFrequency[q.topic] = {};
      }
      companyFrequency[q.topic][q.company] = (companyFrequency[q.topic][q.company] || 0) + 1;
    });

    // Also map from complete interviews logged
    interviews.forEach(int => {
      if (int.questionsAsked) {
        int.questionsAsked.forEach(qAsked => {
          const matchedTopic = topics.find(t => 
            qAsked.toLowerCase().includes(t.name.toLowerCase()) || 
            t.name.toLowerCase().includes(qAsked.toLowerCase()) ||
            t.category.toLowerCase().includes(qAsked.toLowerCase())
          );

          const topicName = matchedTopic ? matchedTopic.name : 'Concurrency';
          topicFrequency[topicName] = (topicFrequency[topicName] || 0) + 1;

          if (!companyFrequency[topicName]) {
            companyFrequency[topicName] = {};
          }
          companyFrequency[topicName][int.companyName] = (companyFrequency[topicName][int.companyName] || 0) + 1;
        });
      }
    });

    return Object.keys(topicFrequency)
      .map(name => {
        const companies = companyFrequency[name] || {};
        const rankedCompanies = Object.entries(companies)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])
          .slice(0, 3);

        return {
          topicName: name,
          askedCount: topicFrequency[name],
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
        list.push({ topic: t, daysSinceLast: Math.round(days) });
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
      m.missedQuestions && m.missedQuestions.some(mq => mq.toLowerCase().includes(activeDecayTopic.name.toLowerCase()))
    );
  }, [activeDecayTopic, mistakes]);

  // Dynamic Ebbinghaus curve computation
  const dynamicCurveData = useMemo(() => {
    if (topics.length === 0) {
      return {
        path: "M0,5 Q30,15 60,25 T100,28",
        areaPath: "M0,5 Q30,15 60,25 T100,28 L100,30 L0,30 Z",
        avgScore: 40
      };
    }
    const sumConfidence = topics.reduce((s, t) => s + t.confidenceScore, 0);
    const avgScore = Math.round(sumConfidence / topics.length);
    
    // Higher average score -> higher retention curve (closer to top y=5)
    // Lower average score -> lower/steeper curve (closer to bottom y=28)
    const endY = Math.max(5, Math.min(28, 28 - Math.round((avgScore / 100) * 23)));
    const controlY1 = Math.max(5, Math.min(28, 15 - Math.round((avgScore / 100) * 10)));
    const controlY2 = Math.max(5, Math.min(28, 25 - Math.round((avgScore / 100) * 20)));

    const path = `M0,5 Q30,${controlY1} 60,${controlY2} T100,${endY}`;
    const areaPath = `${path} L100,30 L0,30 Z`;

    return { path, areaPath, avgScore };
  }, [topics]);

  const [isCompilingReport, setIsCompilingReport] = useState(false);

  const handleDownloadMetrics = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      weeklyReportStats,
      topicsCount: topics.length,
      questionsCount: questions.length,
      interviewsCount: interviews.length,
      mistakesCount: mistakes.length,
      studySessionsCount: sessions.length
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `prepflow_intelligence_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCompileReport = () => {
    setIsCompilingReport(true);
    setTimeout(() => {
      setIsCompilingReport(false);
      setIsReportGenerated(true);
      alert('Report compiled and refreshed with current variables.');
    }, 800);
  };

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

  const allRevisionDecks = useMemo(() => {
    const baseDecks: {
      [key: string]: {
        concepts: string[];
        questions: string[];
        pitfalls: string[];
      }
    } = {
      ...quickRevisionDecks,
      ...customRevisionDecks
    };

    // Auto-generate decks dynamically based on the user's active topics & categories
    const categories = Array.from(new Set(topics.map(t => t.category).filter(Boolean)));
    categories.forEach(cat => {
      const relatedTopics = topics.filter(t => t.category === cat);
      
      const concepts = relatedTopics
        .map(t => t.notes || t.description)
        .filter(Boolean)
        .slice(0, 3);
        
      const topicIds = relatedTopics.map(t => t.id);
      const relatedQuestions = questions
        .filter(q => topicIds.includes(q.topicId))
        .map(q => q.question)
        .slice(0, 3);

      const relatedMistakes = mistakes
        .filter(m => 
          m.missedQuestions && m.missedQuestions.some(mq => 
            relatedTopics.some(t => mq.toLowerCase().includes(t.name.toLowerCase()))
          )
        )
        .map(m => m.reason)
        .slice(0, 3);

      // Only generate if there is relevant content in this category
      if (concepts.length > 0 || relatedQuestions.length > 0 || relatedMistakes.length > 0) {
        baseDecks[`Workspace: ${cat}`] = {
          concepts: concepts.length > 0 ? concepts : ['Add notes/descriptions to topics in this category to populate concepts.'],
          questions: relatedQuestions.length > 0 ? relatedQuestions : ['Create practice questions to populate this section.'],
          pitfalls: relatedMistakes.length > 0 ? relatedMistakes : ['Log mistakes in this category to see anti-pattern warnings.']
        };
      }
    });

    return baseDecks;
  }, [topics, questions, mistakes, customRevisionDecks]);

  const currentDeck = useMemo(() => {
    return allRevisionDecks[selectedRevisionDeck] 
      || allRevisionDecks['Java Core'] 
      || Object.values(allRevisionDecks)[0];
  }, [allRevisionDecks, selectedRevisionDeck]);

  // ==========================================
  // 11. WEEKLY ENGINE REPORT COMPILER (Point 11)
  // ==========================================
  const weeklyReportStats = useMemo(() => {
    const totalMins = sessions.reduce((s, x) => s + x.duration, 0);
    const studyHours = (totalMins / 65).toFixed(1); // normalized weekly yield divider

    const revCount = topics.reduce((s, t) => s + t.revisionCount, 0);
    const forgetCount = topics.reduce((s, t) => s + t.forgotCount, 0);

    const currentICI = Math.min(100, 65 + topics.length * 3 - forgetCount);
    const startICI = Math.max(45, currentICI - 8);

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
            className="text-xs bg-white/15 px-3 py-1.5 rounded-lg text-slate-305 hover:text-white transition cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Global Search Results Drawer */}
      {searchQuery && (
        <div className="glass-card p-5 border border-indigo-500/30 space-y-4 shadow-2xl animate-fade-in text-slate-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200">
              ⚡ FOUND {searchResultsCount} MATCHING NODES IN SEARCH REGISTRY
            </span>
            <span className="text-[10px] text-slate-400 italic">Query: "{searchQuery}"</span>
          </div>

          {searchResultsCount === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              No matching records found. Verify query keywords.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Topics */}
              {searchResults?.topics.map(t => (
                <div key={t.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      <span className="text-[9px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">{t.category}</span>
                    </div>
                    <p className="text-slate-400 line-clamp-2 mb-2 leading-relaxed">{t.description}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 border-t border-white/5 pt-2 mt-2">
                    <span>Confidence: {t.confidenceScore}%</span>
                    <button onClick={() => { onNavigate('Study Topics & Revisions'); setSearchQuery(''); }} className="text-indigo-400 hover:text-indigo-305 hover:underline font-bold cursor-pointer">Go to Scheduler &rarr;</button>
                  </div>
                </div>
              ))}

              {/* Notes */}
              {searchResults?.notes.map(t => (
                <div key={'note-' + t.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1 border-b border-white/5 pb-1">
                    <span className="font-mono text-[9px] font-bold text-violet-300 uppercase">Personal Notes</span>
                    <span className="text-white font-bold">{t.name}</span>
                  </div>
                  <p className="text-slate-400 italic leading-relaxed">"{t.notes}"</p>
                </div>
              ))}

              {/* Questions */}
              {searchResults?.questions.map(q => (
                <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <span className="text-[9px] text-sky-400 uppercase font-mono font-bold block mb-1">Flashcard Question</span>
                  <p className="font-bold text-slate-200 mb-1.5">{q.question}</p>
                  <div className="relative group/search-q-ans">
                    <p className="text-slate-400 italic bg-black/20 p-2 rounded leading-relaxed border border-white/5 pr-10">{q.answer}</p>
                    <div className="absolute right-2 top-2 opacity-0 group-hover/search-q-ans:opacity-100 transition-opacity">
                      <AudioPlayButton text={q.answer} tooltip="Read answer aloud" className="p-1 bg-white/5 border border-white/10" />
                    </div>
                  </div>
                  <button onClick={() => { onNavigate('Flashcards & Practice'); setSearchQuery(''); }} className="text-[10px] text-indigo-400 hover:underline mt-2 inline-block font-bold cursor-pointer">Drill Question &rarr;</button>
                </div>
              ))}

              {/* Permanent Intel Qs */}
              {searchResults?.intelliQs.map(iq => (
                <div key={iq.id} className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white bg-indigo-650 px-1.5 py-0.5 rounded text-[10px]">{iq.company}</span>
                    <span className={`text-[9px] px-1.5 rounded font-bold font-mono ${iq.result === 'Answered Correctly' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>{iq.result}</span>
                  </div>
                  <p className="font-semibold text-slate-200 mb-1">{iq.question}</p>
                  <div className="relative group/search-iq-ans">
                    <p className="text-slate-400 bg-black/20 p-2.5 rounded border border-white/5 pr-10">{iq.answer}</p>
                    <div className="absolute right-2 top-2 opacity-0 group-hover/search-iq-ans:opacity-100 transition-opacity">
                      <AudioPlayButton text={iq.answer} tooltip="Read answer aloud" className="p-1 bg-white/5 border border-white/10" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Mistakes */}
              {searchResults?.mistakes.map(m => (
                <div key={m.id} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-rose-400 flex items-center gap-1">⚠️ Mistake: {m.companyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed mb-1"><span className="font-semibold text-white">Missed Qs:</span> {m.missedQuestions?.join(', ') || 'General Concept'}</p>
                  <p className="text-slate-400 italic">" {m.reason} "</p>
                </div>
              ))}

              {/* Interviews */}
              {searchResults?.interviews.map(i => (
                <div key={'interview-' + i.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{i.companyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(i.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400">{i.feedback || 'Interview cycle details recorded.'}</p>
                  <button onClick={() => { onNavigate('Goals & Applications'); setSearchQuery(''); }} className="text-[10px] text-indigo-455 hover:underline mt-2 inline-block font-bold cursor-pointer">Track Interview &rarr;</button>
                </div>
              ))}

              {/* Voice Recordings */}
              {searchResults?.recordings.map(v => (
                <div key={'recording-' + v.id} className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                  <div className="flex items-center gap-2 mb-1 text-emerald-400">
                    <Mic className="w-4 h-4" />
                    <span className="font-bold">{v.title}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{v.notes || 'Audio dictated answer notes.'}</p>
                  <span className="text-[9px] text-slate-500 block mt-2">Duration: {v.duration}s</span>
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
          { id: 'freq-analytics', label: 'Knowledge Base & Intel', icon: Database },
          { id: 'weak-recovering', label: 'Weak Areas & Recovery', icon: ShieldAlert },
          { id: 'five-min-revision', label: '5-Min Quick Revision', icon: BookOpen },
          { id: 'weekly-reports', label: 'Weekly Engine Report', icon: BarChart3 }
        ].map(sub => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => { setActiveSubTab(sub.id); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer mb-2 ${
                isActive 
                  ? 'bg-indigo-650 text-white font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE 1: DAILY ACTION CENTER */}
      {activeSubTab === 'daily-plan' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Today's Daily Action Center</span>
              </h3>
              <p className="text-xs text-slate-400">Dynamic daily strategy generated directly by your scheduling and retention stats.</p>
            </div>
            <div className="text-xs font-mono text-emerald-450 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Agenda for: {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Focus Study Task Nodes */}
            <div className="lg:col-span-2 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 font-mono">Today's Study Checklist</span>
              
              {dailyActionPlan.map((it, idx) => (
                <div 
                  key={it.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    it.type === 'upcoming-interview' ? 'bg-amber-500/10 border-amber-500/20' :
                    it.type === 'overdue' ? 'bg-red-500/5 border-red-500/10' :
                    it.type === 'bottleneck' ? 'bg-rose-500/5 border-rose-500/15' :
                    it.type === 'stale-decay' ? 'bg-purple-500/5 border-purple-500/15' :
                    'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold font-mono ${
                        it.type === 'overdue' ? 'bg-red-550/20 text-red-400' :
                        it.type === 'upcoming-interview' ? 'bg-amber-550/20 text-amber-400' :
                        it.type === 'bottleneck' ? 'bg-rose-550/20 text-rose-455' :
                        'bg-purple-550/20 text-purple-400'
                      }`}>
                        {it.type}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-bold">Action #{idx + 1}</span>
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm">{it.title}</h4>
                    <p className="text-xs text-slate-450 leading-relaxed font-sans">{it.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden md:block">
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-mono">Metrics Gauge</span>
                      <span className="text-xs font-semibold text-slate-350 font-mono">{it.meta}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (it.type === 'stale-decay') {
                          setSelectedDecayTopicId(it.targetId);
                          // Decay module handles TMAM resets inside this tab
                        } else {
                          onNavigate(it.targetTab);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-xs font-bold text-white transition cursor-pointer shadow"
                    >
                      {it.actionText}
                    </button>
                  </div>
                </div>
              ))}

              {dailyActionPlan.length === 0 && (
                <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-bold text-white font-display">Daily Agenda Fully Complete</h4>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto leading-normal">Your spacing intervals are fully updated. Enjoy the downtime or populate additional topic cards to expand your tracking reach!</p>
                </div>
              )}
            </div>

            {/* TEACH ME AGAIN MODE (Point 9) */}
            <div className="space-y-4">
              <div className="glass-card p-5 border border-purple-500/20 bg-purple-950/15 space-y-4">
                <span className="block text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Teach Me Again Mode</span>
                </span>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Memory decay increases after 7+ days of inactive revision. Reset curve metrics below to restore memory retention values.
                </p>

                {/* Forgetting curve animation */}
                <div className="bg-[#111827]/40 border border-purple-500/10 rounded-xl p-3 h-28 relative flex flex-col justify-between font-sans">
                  <span className="text-[9px] font-mono text-purple-400 font-bold block">Forgetting Curve Decay (Ebbinghaus)</span>
                  <svg className="w-full h-14" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path 
                      d={dynamicCurveData.path} 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="1.5"
                    />
                    <path 
                      d={dynamicCurveData.areaPath} 
                      fill="url(#decayGrad)" 
                      opacity="0.1" 
                    />
                    <defs>
                      <linearGradient id="decayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>1 Day (100%)</span>
                    <span>3 Days (60%)</span>
                    <span>7 Days ({dynamicCurveData.avgScore}% Avg)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-404 font-bold block uppercase tracking-wide">Select Aging Topic:</label>
                  <select 
                    value={selectedDecayTopicId || ''} 
                    onChange={(e) => setSelectedDecayTopicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs glass-input text-slate-205 cursor-pointer"
                  >
                    {memoryDecayList.map(item => (
                      <option key={item.topic.id} value={item.topic.id} className="bg-[#111827]">
                        {item.topic.name} ({item.daysSinceLast === 99 ? 'Never' : `${item.daysSinceLast}d`} since last revision)
                      </option>
                    ))}
                  </select>
                </div>

                {activeDecayTopic ? (
                  <div className="space-y-3 pt-3.5 border-t border-purple-500/10 text-xs">
                    <div className="flex justify-between text-[11px] font-mono select-none">
                      <span className="text-slate-200 font-bold">{activeDecayTopic.name}</span>
                      <span className="text-purple-300 font-bold">{activeDecayTopic.confidenceScore}% Confidence</span>
                    </div>

                    <div className="space-y-1.5 p-2.5 bg-black/40 rounded border border-purple-500/10">
                      <span className="block font-bold text-purple-300 text-[9px] uppercase font-mono">Concept Notes:</span>
                      <p className="text-[10px] leading-relaxed text-slate-400 italic">
                        {activeDecayTopic.notes || 'No notes currently attached to topic.'}
                      </p>
                    </div>

                    {activeDecayQuestions.length > 0 && (
                      <div className="space-y-1 border-t border-purple-500/10 pt-2 text-[10px]">
                        <span className="text-[9px] text-purple-300 uppercase font-mono block">Top Recall Question:</span>
                        <p className="font-semibold text-slate-200 leading-relaxed">
                          {activeDecayQuestions[0].question}
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={async () => {
                        if (onUpdateTopic) {
                          const updated = {
                            ...activeDecayTopic,
                            lastRevisionDate: new Date().toISOString(),
                            nextRevisionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            confidenceScore: Math.min(100, activeDecayTopic.confidenceScore + 15),
                            revisionCount: activeDecayTopic.revisionCount + 1
                          };
                          await onUpdateTopic(updated);
                          alert(`"Teach Me Again" refreshed successfully for "${activeDecayTopic.name}". Interval extended by 7 days.`);
                          setSelectedDecayTopicId(null);
                        } else {
                          // fallback local
                          activeDecayTopic.lastRevisionDate = new Date().toISOString();
                          activeDecayTopic.nextRevisionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                          activeDecayTopic.confidenceScore = Math.min(100, activeDecayTopic.confidenceScore + 15);
                          activeDecayTopic.revisionCount = activeDecayTopic.revisionCount + 1;
                          alert(`"Teach Me Again" refreshed successfully for "${activeDecayTopic.name}". Interval extended by 7 days.`);
                          setSelectedDecayTopicId(null);
                        }
                      }}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-550 hover:to-indigo-550 text-white font-bold rounded-lg text-[11px] transition shadow cursor-pointer"
                    >
                      Reset Memory Decay Curve
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No decaying topics found.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE 2: TECHNOLOGY STACK READINESS & DEPENDENCY Bottlenecks */}
      {activeSubTab === 'tech-readiness' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tech Readiness Cards & Statuses (Span 2) */}
            <div className="lg:col-span-2 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Domain Tech Readiness Ratings</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {techReadinessData.map(stack => (
                  <div key={stack.name} className="glass-card p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col justify-between min-h-[140px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="font-extrabold text-sm text-white">{stack.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-white/5 rounded-full px-2 py-0.5">{stack.count} topics</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">Readiness Score:</span>
                          <span className={`font-bold ${
                            stack.score >= 85 ? 'text-emerald-400' :
                            stack.score >= 70 ? 'text-indigo-400' :
                            stack.score >= 50 ? 'text-amber-400' : 'text-slate-400'
                          }`}>{stack.score}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              stack.score >= 85 ? 'bg-emerald-500' :
                              stack.score >= 70 ? 'bg-indigo-500' :
                              stack.score >= 50 ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                            style={{ width: `${stack.score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-3 mt-1.5 border-t border-white/5 font-sans">
                      <span className="text-slate-400 font-semibold">Evaluation status:</span>
                      <span className={`font-extrabold text-[10px] tracking-wide uppercase ${
                        stack.score >= 85 ? 'text-emerald-400' :
                        stack.score >= 70 ? 'text-indigo-400' :
                        stack.score >= 50 ? 'text-amber-400' : 'text-slate-450'
                      }`}>{stack.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar chart of tech readiness */}
            <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Readiness Spectrum Map</span>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={techReadinessData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                    <Radar name="Readiness Index" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* TOPIC DEPENDENCY BOTTLENECK ANALYSIS (Point 7) */}
          <div className="glass-card p-5 border border-rose-500/10 bg-rose-500/5 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Topic Dependency Prerequisite Analysis</span>
            </h4>
            
            <p className="text-xs text-slate-350 leading-relaxed">
              Prerequisites warn you if you are studying advanced topics while parent prerequisite topics remain weak (confidence index &lt;= 60%). Fix foundational blocks first.
            </p>

            <div className="space-y-3">
              {dependencyAlerts.map(alert => (
                <div key={alert.id} className="p-3 bg-slate-900/50 rounded-xl border border-rose-500/10 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CornerRightDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-rose-300 font-bold uppercase text-[9px] tracking-wide border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.2 rounded">BOTTLENECK DETECTED</span>
                    <span className="text-white font-extrabold">{alert.parentName} &rarr; {alert.childName}</span>
                  </div>
                  <p className="pl-5 leading-normal text-slate-400">{alert.reason}</p>
                  <p className="pl-5 leading-normal text-amber-300 italic">💡 Remedy recommendation: {alert.remedy}</p>
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

      {/* MODULE 3: KNOWLEDGE BASE & INTEL DATABASE */}
      {activeSubTab === 'freq-analytics' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Interview Question Intelligence Database</span>
              </h3>
              <p className="text-xs text-slate-400">Log genuine questions asked during live interviews and analyze topic frequencies.</p>
            </div>
            
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white shrink-0 cursor-pointer shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Interview Question</span>
            </button>
          </div>

          {/* Log Question Asked form slider */}
          {isFormOpen && (
            <form onSubmit={handleFormSubmit} className="glass-card p-5 space-y-4 max-w-2xl text-slate-300">
              <h4 className="font-bold text-sm text-white border-b border-white/10 pb-2">Log Real-World Interview Question</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Target Company Name <span className="text-rose-400">*</span></label>
                  <input 
                    type="text" 
                    value={formCompany} 
                    onChange={(e) => setFormCompany(e.target.value)} 
                    placeholder="e.g. Google"
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Topic Stack Category <span className="text-rose-400">*</span></label>
                  <input 
                    type="text" 
                    value={formTopic} 
                    onChange={(e) => setFormTopic(e.target.value)} 
                    placeholder="e.g. System Design"
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Question Asked <span className="text-rose-400">*</span></label>
                  <input 
                    type="text" 
                    value={formQuestion} 
                    onChange={(e) => setFormQuestion(e.target.value)} 
                    placeholder="e.g. Design a distributed cache..."
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Difficulty Rating</label>
                  <select 
                    value={formDifficulty} 
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input cursor-pointer"
                  >
                    <option value="Easy" className="bg-[#111827]">Easy</option>
                    <option value="Medium" className="bg-[#111827]">Medium</option>
                    <option value="Hard" className="bg-[#111827]">Hard</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Model Answer Summary <span className="text-rose-400">*</span></label>
                  <textarea 
                    value={formAnswer} 
                    onChange={(e) => setFormAnswer(e.target.value)} 
                    placeholder="Detail core solution metrics or key strategies..."
                    className="w-full px-3 py-2 rounded-lg text-xs h-20 glass-input resize-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Performance Result</label>
                  <select 
                    value={formResult} 
                    onChange={(e) => setFormResult(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-xs glass-input cursor-pointer"
                  >
                    <option value="Answered Correctly" className="bg-[#111827]">Answered Correctly</option>
                    <option value="Struggled" className="bg-[#111827]">Struggled</option>
                    <option value="Failed" className="bg-[#111827]">Failed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/10 pt-3.5">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg text-xs hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Save to Intell DB
                </button>
              </div>
            </form>
          )}

          {/* Split screen: Topic frequencies and Intelligence Database */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Topic Frequency curves on interview counts */}
            <div className="glass-card p-5 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Topic Asked Frequency Analytics</span>
              
              <p className="text-[11px] text-slate-400 leading-normal">
                These represent the raw aggregate counts of topic groups probed across all historical interviews. Focus study schedules accordingly:
              </p>

              <div className="space-y-4 pt-2">
                {interviewFrequencyStats.map(stat => (
                  <div key={stat.topicName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate max-w-[140px]" title={stat.topicName}>{stat.topicName}</span>
                      <span className="font-mono text-indigo-305 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        Asked {stat.askedCount}x
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="font-mono font-bold">Firms:</span>
                      <span className="truncate">{stat.topCompanies.join(', ')}</span>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, stat.askedCount * 15)}%` }} />
                    </div>
                  </div>
                ))}

                {interviewFrequencyStats.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Log questions to compute asked trends.</p>
                )}
              </div>
            </div>

            {/* Questions Database Tables (Span 2) */}
            <div className="lg:col-span-2 glass-card p-5 space-y-4">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Permanent Interview Knowledge Database ({intelliQuestions.length})</span>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {intelliQuestions.map(iq => (
                  <div key={iq.id} className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/35 transition space-y-3 relative overflow-hidden group">
                    
                    <button 
                      onClick={() => onDeleteIntelliQuestion(iq.id)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 bg-slate-900 border border-white/5 hover:border-red-500 rounded text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Delete entry from intelligence pool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-white font-sans bg-indigo-650 px-2 py-0.5 rounded border border-indigo-400/25 select-none">
                        {iq.company}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Asked: {iq.dateAsked}</span>
                      <span className={`text-[9px] px-1.5 rounded font-bold font-mono py-0.5 select-none ${
                        iq.result === 'Answered Correctly' ? 'bg-emerald-500/15 text-emerald-300' :
                        iq.result === 'Struggled' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {iq.result}
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#a5b4fc] font-bold">
                        #{iq.topic}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-bold text-slate-200 text-sm leading-snug">{iq.question}</h4>
                        <AudioPlayButton text={iq.answer} tooltip="Read answer" className="p-1 bg-white/5 border border-white/10 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-black/40 p-3 rounded border border-white/5 whitespace-pre-wrap italic group-hover:border-indigo-500/15 transition">
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

      {/* MODULE 4: WEAK TOPIC SPOTTER & PRIORITIES RECOVERY */}
      {activeSubTab === 'weak-recovering' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weak Topic Intelligence Center */}
            <div className="glass-card p-5 space-y-4 border border-rose-500/15">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider font-mono">Weak Topic Intelligence Center</span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  Identifies studied topics sliding below standard confidence bars (overall threshold &lt; 60%) or carrying multiple recall slips.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {weakSpotterList.map(item => (
                  <div key={item.topic.id} className="p-3.5 rounded-xl bg-red-950/10 border border-red-500/15 text-xs text-slate-300 space-y-2">
                    <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                      <span className="text-white font-extrabold">{item.topic.name}</span>
                      <span className="text-rose-400 font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-bold">{item.topic.confidenceScore}% Confidence</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">Failure Flags Spotted:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.factors.map((f, i) => (
                          <span key={i} className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10 font-bold font-sans">
                            ● {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {weakSpotterList.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8 font-mono">✓ High retention achieved. No weak nodes flagged in active memory registry!</p>
                )}
              </div>
            </div>

            {/* High Priority Recovery Queue */}
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
                    className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-4 text-xs group hover:bg-white/10 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-indigo-400 font-bold">#{idx + 1}</span>
                        <h4 className="font-bold text-slate-205">{item.topic.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-450 line-clamp-1">{item.topic.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-mono">Priority Score</span>
                        <span className="font-extrabold text-indigo-300 font-mono">{item.priorityWeight} pts</span>
                      </div>
                      <button 
                        onClick={() => onNavigate('Flashcards & Practice')}
                        className="p-1 px-2.5 bg-indigo-650 hover:bg-indigo-600 rounded text-[11px] font-bold text-white cursor-pointer transition shadow"
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

      {/* MODULE 5: QUICK REVISION CARDS */}
      {activeSubTab === 'five-min-revision' && (
        <div className="space-y-6 animate-fade-in text-slate-300">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">5-Minute Quick Revision Cards</h3>
              <p className="text-xs text-slate-400">Perform rapid context revision blocks directly before walking into interview screens.</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold max-w-full overflow-x-auto font-sans">
              {Object.keys(allRevisionDecks).map(deck => {
                const isCustom = deck in customRevisionDecks;
                return (
                  <div key={deck} className="relative group shrink-0">
                    <button 
                      onClick={() => setSelectedRevisionDeck(deck)}
                      className={`px-3 py-1 rounded-md transition cursor-pointer text-[11px] flex items-center gap-1 ${
                        selectedRevisionDeck === deck 
                          ? 'bg-indigo-650 text-white font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{deck}</span>
                    </button>
                    {isCustom && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomDeck(deck); }}
                        className="absolute -top-1.5 -right-1 bg-red-900/80 hover:bg-red-700 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Delete custom deck"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deck Management Controls */}
          <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 border border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[11px] rounded-lg text-slate-300 font-semibold cursor-pointer transition">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Import JSON Decks</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportDecks} 
                  className="hidden" 
                />
              </label>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[11px] rounded-lg text-slate-300 font-semibold cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Template JSON</span>
              </button>
            </div>
            {Object.keys(customRevisionDecks).length > 0 && (
              <button 
                onClick={handleExportDecks}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[11px] rounded-lg text-indigo-300 font-semibold cursor-pointer transition animate-fade-in"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Custom Decks ({Object.keys(customRevisionDecks).length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Pile 1: Key Concepts */}
            <div className="glass-card p-5 space-y-4 border border-indigo-500/10">
              <span className="block text-xs font-mono font-bold text-slate-205 border-b border-white/5 pb-2 uppercase tracking-widest text-[#a5b4fc]">
                🔑 Top High-Yield Concepts
              </span>
              
              <div className="space-y-3 text-xs leading-normal">
                {currentDeck.concepts.map((concept: string, idx: number) => (
                  <div key={idx} className="p-3 bg-black/20 rounded-lg border border-white/5 relative group/concept">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="block font-mono text-[9px] font-bold text-indigo-400">CONCEPT INDEX #{idx+1}</span>
                      <AudioPlayButton text={concept} tooltip="Read concept" className="p-1 opacity-0 group-hover/concept:opacity-100 transition-opacity bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" />
                    </div>
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
                {currentDeck.questions.map((q: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-900/40 rounded-lg border border-white/5 relative group/question">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="block font-mono text-[9px] font-bold text-emerald-400">PROBABLE DRILL #{idx+1}</span>
                      <AudioPlayButton text={q} tooltip="Read question" className="p-1 opacity-0 group-hover/question:opacity-100 transition-opacity bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" />
                    </div>
                    <p className="text-slate-205 font-bold leading-normal">{q}</p>
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
                {currentDeck.pitfalls.map((p: string, idx: number) => (
                  <div key={idx} className="p-3 bg-red-950/20 rounded-lg border border-red-500/10 relative group/pitfall">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="block font-mono text-[9px] font-bold text-rose-400">AVOID BOTCHING #{idx+1}</span>
                      <AudioPlayButton text={p} tooltip="Read pitfall warning" className="p-1 opacity-0 group-hover/pitfall:opacity-100 transition-opacity bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" />
                    </div>
                    <p className="text-slate-350 leading-normal italic">❌ "{p}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODULE 6: WEEKLY ENGINE REPORTS */}
      {activeSubTab === 'weekly-reports' && (
        <div className="space-y-6 animate-fade-in text-slate-300 max-w-3xl mx-auto">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Performance Reports</h3>
              <p className="text-xs text-slate-400">Retrieve aggregated metrics tracking memory shifts, study density, and weakest nodes.</p>
            </div>
            
            <button 
              onClick={handleCompileReport}
              disabled={isCompilingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl border border-indigo-500/20 text-xs text-white cursor-pointer font-bold transition shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCompilingReport ? 'animate-spin' : ''}`} />
              <span>{isCompilingReport ? 'Compiling...' : 'Compile Weekly Report'}</span>
            </button>
          </div>

          {isReportGenerated ? (
            <div id="weekly_report_card" className="glass-card p-8 border border-indigo-500/20 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute right-[-20px] top-[-20px] opacity-[0.02] text-[120px] select-none font-bold font-sans rotate-12">
                ICI
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-500/10">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base leading-none">Weekly Preparation Intelligence Report</h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-2 font-bold">Reporting interval: Live System Snapshot</span>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-slate-305">
                  STATUS: SECURED COMPILED
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1 font-bold">Study Volume</span>
                  <span className="text-2xl font-black text-white font-mono block">{weeklyReportStats.studyHours} hrs</span>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono">weekly logged yield</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1 font-bold">Rounds Revise</span>
                  <span className="text-2xl font-black text-white font-mono block">{weeklyReportStats.revCount}</span>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono">active recall trials</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1 font-bold">Forgot Events</span>
                  <span className="text-2xl font-black text-rose-400 font-mono block">{weeklyReportStats.forgetCount}x</span>
                  <span className="text-[9px] text-[#fca5a5] mt-1 font-mono">active memory drops</span>
                </div>

                <div className="p-3.5 bg-black/25 border border-white/5 rounded-xl text-center">
                  <span className="block text-[8.5px] uppercase font-mono tracking-wider text-slate-500 mb-1 font-bold">Confidence Index</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono block">
                    {weeklyReportStats.startICI}% &rarr; {weeklyReportStats.currentICI}%
                  </span>
                  <span className="text-[9px] text-[#a5b4fc] mt-1 font-mono">composite index score</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1.5 leading-relaxed">
                  <span className="block font-bold text-emerald-400 text-[10px] tracking-wider uppercase font-mono">Most Significant Improved Node:</span>
                  <h5 className="font-extrabold text-white text-sm">✓ {weeklyReportStats.mostImproved}</h5>
                  <p className="text-slate-400">
                    Highest positive gradient jump in target active recall scores this week, indicating efficient conceptual assimilation and spacing resolution.
                  </p>
                </div>

                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1.5 leading-relaxed">
                  <span className="block font-bold text-rose-450 text-[10px] tracking-wider uppercase font-mono">Weakest Memory Node Warning:</span>
                  <h5 className="font-extrabold text-white text-sm">⚠️ {weeklyReportStats.weakestLink}</h5>
                  <p className="text-slate-400">
                    Sustains continuous sliding curves and blunders during active recall. We highly recommend routing this conceptual target to your study list tomorrow.
                  </p>
                </div>

              </div>

              {/* Evaluator signature & report actions */}
              <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4 select-none font-sans">
                <span className="font-mono text-slate-500">Verified by prep-master spaced-retention validation daemon v12.1.</span>
                
                <button 
                  onClick={handleDownloadMetrics}
                  className="flex items-center gap-1.5 text-bold hover:text-white border border-white/5 hover:border-white/20 p-2 rounded bg-white/5 transition duration-200 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download metrics details</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-xl font-mono text-slate-500 font-sans">
              Weekly compile report stack pending. Refresh queue properties to generate.
            </div>
          )}

        </div>
      )}

    </div>
  );
});

export default IntelligenceHub;
