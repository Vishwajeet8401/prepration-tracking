import React, { useState, useEffect, useRef } from 'react';
import { MockInterview, Topic } from '../types';
import { 
  Play, Square, Sparkles, Clock, ListTodo, Award, RefreshCw, 
  ChevronRight, CheckCircle2, AlertCircle, HelpCircle, Flame, BarChart2, BookOpen, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MockInterviewWorkspaceProps {
  topics: Topic[];
  interviews: MockInterview[];
  onAddInterview: (int: Omit<MockInterview, 'id' | 'userId'>) => Promise<void>;
  onDeleteInterview: (id: string) => Promise<void>;
}

const PRESET_QUESTIONS = {
  Technical: [
    {
      id: 't1',
      question: 'How does the ConcurrentHashMap achieve high concurrency compared to a synchronized Hashtable?',
      expectedKeywords: ['segment', 'bucket', 'reentrant lock', 'cas', 'compare and swap', 'synchronized blocks', 'node-level locking'],
      idealConcept: 'ConcurrentHashMap in modern Java uses CAS (Compare-And-Swap) operations for empty buckets, and locking at the single bucket node level. This avoids locking the entire map, allowing multiple reader threads and distinct bucket writer threads to operate simultaneously without interference.'
    },
    {
      id: 't2',
      question: 'What are the key differences between heap memory and stack memory in the Java Virtual Machine?',
      expectedKeywords: ['heap', 'stack', 'allocation', 'garbage collection', 'reference', 'thread safety', 'scope'],
      idealConcept: 'Stack memory is used for local variable storage, method execution frames, and object references. It is thread-safe and faster with LIFO structure. Heap memory stores all actual object instances, is shared across threads, and is managed dynamically by the Garbage Collector.'
    },
    {
      id: 't3',
      question: 'Explain the N+1 select query problem in Hibernate or JPA, and how can you solve it?',
      expectedKeywords: ['join fetch', 'entity graph', 'batch size', 'n+1', 'lazy loading', 'eager loading'],
      idealConcept: 'The N+1 problem occurs when Hibernate executes 1 query to retrieve parent entities and then executes N separate queries to retrieve child associations for each parent. It is solved using JOIN FETCH queries, JPA Entity Graphs, or setting a subselect/batch fetch size in configuration.'
    },
    {
      id: 't4',
      question: 'How do you ensure cache consistency between a distributed cache (like Redis) and your primary SQL database?',
      expectedKeywords: ['cache aside', 'write through', 'write behind', 'eviction', 'ttl', 'transactional', 'message queue'],
      idealConcept: 'Cache consistency is commonly maintained using the Cache-Aside pattern (write database, delete cache). Advanced systems use Write-Through, transactional cache invalidation, short TTL boundaries, or CDC (Change Data Capture) via message queues for asynchronous caching sync.'
    }
  ],
  HR: [
    {
      id: 'h1',
      question: 'Tell me about a time when you had a technical disagreement with a colleague. How did you handle it?',
      expectedKeywords: ['listen', 'empathy', 'trade-offs', 'data-driven', 'collaboration', 'consensus', 'respect'],
      idealConcept: 'Explain a specific disagreement calmly, highlighting active listening, objectifying trade-offs using proof-of-concept benchmarks or official documentation, and collaborating constructive guidelines rather than arguing personal styles.'
    },
    {
      id: 'h2',
      question: 'Describe a challenging bug you encountered in production, your troubleshooting workflow, and how you hotfixed it.',
      expectedKeywords: ['logs', 'apm', 'root cause', 'hotfix', 'regression testing', 'post-mortem', 'monitoring'],
      idealConcept: 'Illustrate your systematic troubleshooting loop: gathering telemetry error logs, isolating the state, deploying a verified patch, executing safety regression tests, and conducting post-mortem tracking to avoid future leaks.'
    },
    {
      id: 'h3',
      question: 'Where do you see your technical career in five years?',
      expectedKeywords: ['architectural', 'mentoring', 'domain master', 'continuous learning', 'system design', 'impact'],
      idealConcept: 'Emphasize your intent to master high-availability backend microservices, lead architectural designs, mentor junior contributors, and translate product visions into scalable cloud-native architectures.'
    }
  ],
  'System Design': [
    {
      id: 's1',
      question: 'How would you design a scalable distributed rate limiter for an API gateway serving millions of users?',
      expectedKeywords: ['token bucket', 'sliding window', 'redis', 'lua scripts', 'fallback', 'middleware', 'latency'],
      idealConcept: 'Implement a Token Bucket or Sliding Window log algorithm using Redis to hold rate limit counters dynamically. Use Redis Lua scripts to execute queries atomically, keeping latency below 5ms with back-up local fallback headers.'
    },
    {
      id: 's2',
      question: 'How would you design a highly consistent, fault-tolerant distributed transaction system?',
      expectedKeywords: ['two-phase commit', '2pc', 'saga pattern', 'compensation', 'outbox pattern', 'idempotency'],
      idealConcept: 'For strict consistency, two-phase commit is used but limits performance. In microservices, the Saga Pattern is preferred: using orchestration or choreographies with compensating compensation events, backed by transactional outbox pipelines and idompotency guards.'
    }
  ],
  Behavioral: [
    {
      id: 'b1',
      question: 'Describe a time you failed to meet a target deadline. What did you learn and how did you manage expectations?',
      expectedKeywords: ['proactive communication', 'transparency', 'prioritization', 'agile', 'timeline modification', 'velocity'],
      idealConcept: 'Highlight proactive communication with stakeholders the moment risks were discovered. Detail how you re-prioritized features, shipped MVP core functionality on time, and adjusted sprint velocity estimations for future projects.'
    }
  ]
};

export default function MockInterviewWorkspace({
  topics,
  interviews,
  onAddInterview,
  onDeleteInterview
}: MockInterviewWorkspaceProps) {
  // Config state
  const [roundType, setRoundType] = useState<'Technical' | 'HR' | 'System Design' | 'Behavioral'>('Technical');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  // Active session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionsList, setQuestionsList] = useState<Array<{ id: string; question: string; expectedKeywords: string[]; idealConcept: string }>>([]);
  
  // Session logs list for active run
  const [sessionHistory, setSessionHistory] = useState<Array<{
    question: string;
    answer: string;
    evaluation: string;
    score: number;
    answerTime: number;
  }>>([]);

  // Timing states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stats computed
  const avgPerformanceScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length)
    : 0;

  const totalAnsweredCount = interviews.reduce((sum, i) => sum + i.answeredCount, 0);

  // Start Session handler
  const startInterview = () => {
    const list = PRESET_QUESTIONS[roundType] || PRESET_QUESTIONS.Technical;
    // Shuffle slightly or take subset
    setQuestionsList(list);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setSessionHistory([]);
    setTimerSeconds(0);
    setTotalTimerSeconds(0);
    setIsSessionActive(true);

    // Initial timer starter
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
      setTotalTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  // Skip / Submit Answer handler
  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please type or dictate an answer before submitting.');
      return;
    }

    const currentQ = questionsList[currentQuestionIndex];
    if (!currentQ) return;

    // CLIENT ACTION EVALUATION ENGINE
    const answerLower = userAnswer.toLowerCase();
    const matched = currentQ.expectedKeywords.filter(kw => answerLower.includes(kw));
    const matchRatio = matched.length / currentQ.expectedKeywords.length;

    // Intelligence evaluation
    let score = Math.min(100, Math.round(matchRatio * 75 + (userAnswer.length > 120 ? 25 : userAnswer.length / 5)));
    if (score < 30) score = 30 + Math.round(Math.random() * 15); // baseline

    let evaluation = '';
    if (score >= 80) {
      evaluation = `Superb explanation. You successfully matched key concepts: ${matched.join(', ')}. Your phrasing demonstrates clear production authority on the subject. Expected keywords were thoroughly covered aligned with ideal architectural standards.`;
    } else if (score >= 55) {
      evaluation = `Solid answer but can be enhanced. You hit core concepts: ${matched.join(', ')}. However, to move into Mastered level, make sure to explicitly cite: ${currentQ.expectedKeywords.filter(k => !matched.includes(k)).join(', ')}. Try to expand your details with practical application instances of these definitions.`;
    } else {
      evaluation = `Conceptual gaps identified. You mentioned few descriptors: ${matched.length > 0 ? matched.join(', ') : 'none'}. For high-tier selections, you must incorporate essential terms like: ${currentQ.expectedKeywords.join(', ')}. Review the ideal definition framework below carefully.`;
    }

    // Capture entry
    const entry = {
      question: currentQ.question,
      answer: userAnswer,
      evaluation,
      score,
      answerTime: timerSeconds
    };

    const nextHistory = [...sessionHistory, entry];
    setSessionHistory(nextHistory);

    // Advance
    if (currentQuestionIndex + 1 < questionsList.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setTimerSeconds(0); // reset per-question timer
    } else {
      // Finished!
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Save overall mock report
      const overallScore = Math.round(nextHistory.reduce((sum, h) => sum + h.score, 0) / nextHistory.length);
      const avgTime = Math.round(totalTimerSeconds / nextHistory.length);
      
      const overallFeedback = overallScore >= 80
        ? `Selected! Excellent simulated interview under standard ${difficulty} timing limits. You hit high evaluation standard bounds on ${roundType} elements.`
        : overallScore >= 60
        ? `Pending Decision. Strong attempt on ${roundType}, but gaps in specific conceptual segments should be resolved prior to live panels.`
        : `Rejected. Found multiple gaps across essential keywords. Review custom revisions and study weak sections to consolidate foundational tracks.`;

      const topicsCovered = Array.from(new Set(topics.slice(0, 3).map(t => t.name)));

      await onAddInterview({
        roundType,
        difficulty,
        topicsCovered: topicsCovered.length > 0 ? topicsCovered : ['Enterprise architecture', 'Technical strategy'],
        answeredCount: nextHistory.length,
        totalQuestions: questionsList.length,
        score: overallScore,
        averageAnswerTime: avgTime,
        confidenceScore: overallScore,
        feedback: overallFeedback,
        history: nextHistory,
        createdAt: new Date().toISOString()
      });

      setIsSessionActive(false);
      alert(`Completed mock interview session! Formulated complete scorecard feedback: ${overallScore}% score saved successfully.`);
    }
  };

  // Close early
  const terminateSessionEarly = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSessionActive(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS AND KPI CHIPS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Interactive Mock Interview Workspace</span>
          </h2>
          <p className="text-xs text-slate-400">Evaluate your live communication and memory retrieval accuracy in simulation rounds.</p>
        </div>

        {/* Top KPI trackers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div className="text-left font-sans">
              <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none">Interviews Complete</span>
              <span className="text-sm font-extrabold text-white font-mono leading-none">{interviews.length}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <div className="text-left font-sans">
              <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none">Avg Answer Accuracy</span>
              <span className="text-sm font-extrabold text-indigo-300 font-mono leading-none">{avgPerformanceScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      {!isSessionActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SETUP CONTROL PANEL (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Configure Simulation Round</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Select Round Stream</label>
                  <p className="text-[10px] text-slate-400">Each category targets a distinct selection framework.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PRESET_QUESTIONS) as Array<keyof typeof PRESET_QUESTIONS>).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setRoundType(opt)}
                        className={`py-2 px-3 rounded-lg border text-left font-semibold transition ${
                          roundType === opt
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                            : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">Simulation Difficulty</label>
                  <p className="text-[10px] text-slate-400">Controls time expectations per core answer response.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Easy', 'Medium', 'Hard'].map(dopt => (
                      <button
                        key={dopt}
                        onClick={() => setDifficulty(dopt as any)}
                        className={`py-2 px-1 rounded-lg border text-center font-semibold transition ${
                          difficulty === dopt
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {dopt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions Brief */}
              <div className="bg-[#111827]/40 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-xs leading-normal">
                <span className="font-bold text-white flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>How Mock Simulator Evaluation Works</span>
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  <li>You will be presented a sequence of curated high-frequency questions.</li>
                  <li>Type your response clearly in the text box.</li>
                  <li>Our intelligent assessment engine compiles your matching core keywords to render precise scores and gaps in real-time.</li>
                  <li>Completing the round updates your historic analytics profile automatically!</li>
                </ul>
              </div>

              {/* Start Trigger */}
              <button
                onClick={startInterview}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Begin Real-Time Mock Interview Simulation</span>
              </button>
            </div>

            {/* RECENT SCORECARDS HISTORY */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider block font-mono">Simulated Historic Scorecards</h3>
              
              <div className="space-y-3">
                {interviews.map(item => (
                  <div key={item.id} className="glass-card p-4 space-y-3 border border-white/5 hover:border-white/10 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] font-mono text-indigo-405 font-bold uppercase tracking-widest">{item.roundType} &bull; {item.difficulty}</span>
                        <h4 className="font-bold text-white text-sm">{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} Scorecard</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-450 font-mono">Avg time: {item.averageAnswerTime}s</span>
                        <span className={`text-base font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                          item.score >= 80 ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                          item.score >= 55 ? 'bg-amber-500/10 text-amber-450 border border-amber-500/20' :
                          'text-rose-400 bg-red-500/10 border border-red-500/20'
                        }`}>
                          {item.score}% Acc
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic">"{item.feedback}"</p>

                    {/* Historical breakdown nested drawers */}
                    <details className="text-xs font-sans text-slate-400 group">
                      <summary className="cursor-pointer text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold select-none outline-none">
                        View Detailed Questions Breakdown &rarr;
                      </summary>
                      <div className="space-y-3 pt-3 pl-3 border-l border-white/5 mt-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {item.history?.map((hist, idx) => (
                          <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/5 text-left">
                            <span className="block text-[8px] font-mono text-slate-400">Question {idx + 1} &bull; {hist.answerTime}s</span>
                            <p className="font-bold text-white">{hist.question}</p>
                            <p className="text-[10px] bg-black/20 p-2 rounded italic text-slate-400 border border-white/5">Your raw answer: "{hist.answer}"</p>
                            <p className="text-emerald-400 text-[11px] leading-relaxed mt-1">{hist.evaluation}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}

                {interviews.length === 0 && (
                  <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-4">
                    <Award className="w-8 h-8 text-indigo-400 opacity-60 mb-2" />
                    <span className="text-xs font-semibold text-white">No simulated scorecards generated yet</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Start your first simulated interview above to pop study KPI scores here.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR KPI FEEDBACK */}
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2 uppercase tracking-wide">Workspace Analytics Insights</h3>
              
              <div className="space-y-3 text-xs leading-relaxed font-sans">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Evaluation Average:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{avgPerformanceScore}%</span>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Completed Rounds:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{interviews.length}</span>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Questions Answered:</span>
                  <span className="text-sm font-extrabold text-white font-mono">{totalAnsweredCount} qs</span>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-300 block">💡 Core Selection Pro-Tip</span>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  Leading organizations value concise structural answers over highly verbose descriptions. Highlight the core technology framework, mention architectural trade-offs, and state a tangible benchmark metric when possible.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ACTIVE TIMED APPLICATION FRAMEWORK */
        <div className="max-w-3xl mx-auto glass-card p-6 border border-indigo-500/20 space-y-6 animate-fade-in text-left">
          
          {/* Active run Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-400">
                ACTIVE ROUND: {roundType} ({difficulty})
              </span>
              <h3 className="font-extrabold text-white text-base">
                Question {currentQuestionIndex + 1} of {questionsList.length}
              </h3>
            </div>

            {/* Timers */}
            <div className="flex items-center gap-3 font-mono text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Timer: {timerSeconds}s</span>
              </span>
              <span className="text-slate-500">|</span>
              <span>Total: {totalTimerSeconds}s</span>
            </div>
          </div>

          {/* Active Question Box */}
          <div className="bg-indigo-500/5 md:flex items-start gap-4 p-5 rounded-2xl border border-indigo-500/10 space-y-2 md:space-y-0">
            <HelpCircle className="w-8 h-8 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black">Simulation Prompt</span>
              <p className="text-sm font-extrabold text-white leading-relaxed">
                {questionsList[currentQuestionIndex]?.question}
              </p>
            </div>
          </div>

          {/* Input text prompt */}
          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-semibold block">Type your response below:</label>
            <textarea
              rows={6}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Structure your answer, cite expected keywords, explain your system design choices..."
              className="w-full p-4 rounded-2xl text-xs leading-relaxed glass-input focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            
            <div className="flex items-center justify-between text-[11px] text-slate-405 px-1 py-0.5">
              <span>Expected Keywords to reference: <span className="font-mono text-indigo-305 font-bold">{questionsList[currentQuestionIndex]?.expectedKeywords.join(', ')}</span></span>
              <span>Count: {userAnswer.length} characters</span>
            </div>
          </div>

          {/* Core submit buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              onClick={submitAnswer}
              className="w-full sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-bold font-sans flex items-center justify-center gap-2 cursor-pointer shadow transition"
            >
              <Send className="w-4 h-4" />
              <span>
                {currentQuestionIndex + 1 === questionsList.length ? 'Finalize Scorecard' : 'Submit Answer & Proceed'}
              </span>
            </button>

            <button
              onClick={terminateSessionEarly}
              className="w-full sm:w-auto px-5 py-3 bg-rose-650/15 hover:bg-rose-600/25 text-rose-300 border border-rose-500/20 rounded-xl font-bold font-sans text-xs cursor-pointer text-center"
            >
              Cancel Interview
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
