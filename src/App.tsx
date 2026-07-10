/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { useDatabase } from './context/DatabaseContext';

// Component imports
import Dashboard from './components/Dashboard';
import TopicManagement from './components/TopicManagement';
import QuestionBank from './components/QuestionBank';
import InterviewTracker from './components/InterviewTracker';
import Analytics from './components/Analytics';
import NotificationCenter from './components/NotificationCenter';
import FuturisticToaster from './components/FuturisticToaster';
import IntelligenceHub from './components/IntelligenceHub';
import AuthScreen from './components/AuthScreen';
import CloudBackupControls from './components/CloudBackupControls';
import ActivityPlanner from './components/ActivityPlanner';
import PersonalJournal from './components/PersonalJournal';
import PreparationRoadmaps from './components/PreparationRoadmaps';
import AchievementsView from './components/AchievementsView';
import MockInterviewWorkspace from './components/MockInterviewWorkspace';
import MobileOfflineHub from './components/MobileOfflineHub';
import BulkImportExportCenter from './components/BulkImportExportCenter';
import PersonalReminders from './components/PersonalReminders';
import StarStoryBuilder from './components/StarStoryBuilder';
import VocabularyBuilder from './components/VocabularyBuilder';
import CameraGestureWidget from './components/CameraGestureWidget';
import LandingPage from './components/LandingPage';
import GestureInstructionBar from './components/GestureInstructionBar';
import { BuyMeCoffeeModal } from './components/BuyMeCoffee';
import CodeEditorPage from './pages/CodeEditorPage';

// Firebase core integrations for logout
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

// Gesture control
import { useGestureContext } from './context/GestureContext';
import { useGestureController } from './hooks/useGestureController';
import { Hand } from 'lucide-react';

// Lucide Icon assets
import { 
  BookOpen, Sparkles, Award, ListTodo, Calendar, 
  Settings, Flame, Activity, Compass, HelpCircle as HelpIcon, Bell, 
  BadgeCheck, Loader, LogOut, Layers, Smartphone, Gamepad2, Menu, ClipboardList, BookMarked,
  ArrowUp, ArrowLeft, Coffee, Code2
} from 'lucide-react';
import { AppNotification } from './types';

// ── Tab order for gesture swipe navigation ───────────────────────────────────
const ALL_TABS = [
  'Home Dashboard',
  'AI Learning Assistant',
  'Study Topics & Revisions',
  'Flashcards & Practice',
  'Goals & Applications',
  'Reminders & Habits',
  'Task & Study Planner',
  'Experience & Story Builder',
  'Vocabulary Builder',
  'Progress & Analytics',
  'Learning Roadmaps',
  'My Achievements',
  'Daily Journal & Notes',
  'Practice Simulator',
  'Code Playground',
  'Mobile Sync Hub',
  'Backup & Data Settings',
];

export default function App() {
  const { user, userProfile, authLoading } = useAuth();
  const {
    subjects, topics, topicLimit, setTopicLimit, questions, questionLimit, setQuestionLimit,
    applications, interviews, mistakes, sessions, notifications, voiceRecordings, intelliQuestions,
    plans, tasks, journals, roadmaps, mockInterviews, starStories, personalReminders, reminderLogs, reminderSettings,
    userSettings, loading, globalStats, urgentTopics, activeToasts, setActiveToasts,
    mockPresetQuestions,
    handleSeedSandbox, handleRestoreCloudBackup, handleAddSubject, handleUpdateSubject, handleDeleteSubject,
    handleAddTopic, handleUpdateTopic, handleDeleteTopic, handleMergeTopics, handleAddJournal, handleUpdateJournal,
    handleUploadJournalAttachment, handleDeleteJournal, handleAddRoadmap, handleUpdateRoadmap, handleDeleteRoadmap,
    handleAddQuestion, handleUpdateQuestion, handleDeleteQuestion, handleRecallResponse, handleAddVoice, handleDeleteVoice,
    handleAddApplication, handleUpdateApplication, handleDeleteApplication, handleAddInterview, handleUpdateInterview,
    handleDeleteInterview, handleAddMockInterview, handleDeleteMockInterview, handleAddStarStory, handleUpdateStarStory,
    handleDeleteStarStory, handleAddPersonalReminder,
    handleUpdatePersonalReminder, handleDeletePersonalReminder, handleActionPersonalReminder, handleUpdateReminderSettings,
    handleUpdateCerebrasKey, handleUpdateGeminiKey, handleUpdateGroqKey, handleUpdateCerebrasModel, handleUpdateGeminiModel, handleUpdateGroqModel,
    handleUpdateTheme, handleBulkImport, handleAddMistake, handleDeleteMistake, handleAddSession, pushNotification, handleMarkRead,
    handleClearAll, handleAddIntelliQuestion, handleDeleteIntelliQuestion, handleAddPlan, handleDeletePlan,
    handleUpdateTaskInApp, handleDeleteTaskInApp, handleUpdateCustomPrompt, handleAddMockPresetQuestion, handleDeleteMockPresetQuestion,
    vocabularyWords, handleAddVocabularyWord, handleUpdateVocabularyWord, handleDeleteVocabularyWord,
    handleMarkWordReviewed, handleSearchWordDefinition, codingQuestions
  } = useDatabase();

  // Landing page state — show by default for unauthenticated visitors
  const [showLandingPage, setShowLandingPage] = useState(true);

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<string>('Home Dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<'import' | 'templates' | 'export' | 'settings'>('import');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSessionTopicId, setActiveSessionTopicId] = useState<string | null>(null);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);

  const isHandlingHistoryRef = useRef(false);

  // Tab navigation stack for back button support
  const [historyStack, setHistoryStack] = useState<string[]>(['Home Dashboard']);

  const handleGoBack = () => {
    if (historyStack.length > 1) {
      const prevTab = historyStack[historyStack.length - 2];
      setActiveTab(prevTab);
    } else {
      setActiveTab('Home Dashboard');
    }
  };

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Gesture context & global swipe navigation ────────────────────────────
  const { state: gestureState, startCamera, stopCamera } = useGestureContext();
  const isGestureActive = gestureState.camera.active && gestureState.settings.enabled;

  // Global swipe navigation is disabled to prevent accidental page switching.

  const handleExecuteToastAction = (toast: AppNotification) => {
    setActiveToasts(prev => prev.filter(t => t.id !== toast.id));
    if (toast.actionUrl) {
      setActiveTab(toast.actionUrl);
    }
  };

  // Browser Navigation History synchronizer
  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState?.prepTracker?.activeTab) {
      window.history.replaceState(
        { ...currentState, prepTracker: { ...(currentState?.prepTracker || {}), activeTab } },
        '',
        window.location.href,
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const nextTab = event.state?.prepTracker?.activeTab;
      if (typeof nextTab === 'string') {
        isHandlingHistoryRef.current = true;
        setActiveTab(nextTab);
        setIsNavOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isHandlingHistoryRef.current) {
      isHandlingHistoryRef.current = false;
      return;
    }

    const currentState = window.history.state;
    if (currentState?.prepTracker?.activeTab === activeTab) return;

    window.history.pushState(
      { ...currentState, prepTracker: { ...(currentState?.prepTracker || {}), activeTab } },
      '',
      window.location.href,
    );
  }, [activeTab]);

  // Synchronize historyStack with activeTab changes
  useEffect(() => {
    setHistoryStack(prev => {
      if (prev[prev.length - 1] === activeTab) return prev;
      if (prev.length > 1 && prev[prev.length - 2] === activeTab) {
        return prev.slice(0, -1);
      }
      return [...prev, activeTab];
    });
  }, [activeTab]);

  if (authLoading) {
    return (
      <div data-theme="cyber-midnight" className="min-h-screen text-slate-100 flex flex-col items-center justify-center font-sans antialiased relative">
        <div className="mesh-gradient opacity-80" />
        <Loader className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
        <p className="text-xs font-mono tracking-widest text-indigo-300 uppercase animate-pulse">Securing Your Workspace...</p>
      </div>
    );
  }

  return (
    <div data-theme={userSettings?.theme || 'cyber-midnight'} className="min-h-screen text-slate-100 flex flex-col font-sans select-none antialiased relative">
      <div className="mesh-gradient" />
      
      {user && (
      <header className="app-header text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            {activeTab !== 'Home Dashboard' && (
              <button
                onClick={handleGoBack}
                id="header-back-btn"
                className="group p-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:shadow-md"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>
            )}
            <img src="/prepFlow.png" alt="PrepFlow Logo" className="w-9 h-9 rounded-xl object-contain border border-slate-700/50 shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-base tracking-tight text-white font-sans">PrepFlow</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5 leading-none">
                Your Smart Learning & Goal Companion
              </span>
            </div>
          </div>

          {/* Gesture toggle — shown only on sm+ */}
          <button
            className={`hidden sm:flex gesture-header-toggle ${isGestureActive ? 'active' : ''}`}
            onClick={() => isGestureActive ? stopCamera() : startCamera()}
            title={isGestureActive ? 'Disable Gesture Control' : 'Enable Gesture Control'}
          >
            <span className="dot" />
            <Hand size={12} />
            {isGestureActive ? 'Gesture On' : 'Gesture Off'}
          </button>

          <div className="flex items-center gap-3.5 text-xs text-indigo-100 shrink-0 font-sans">
            <div className="hidden sm:flex flex-col items-end leading-none gap-1">
              <span className="font-bold text-slate-200">{user.email}</span>
              <span className="text-[10px] text-indigo-300 font-mono flex items-center gap-0.5">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                {userProfile?.name || 'Active Learner'}
              </span>
            </div>
            <button
              onClick={() => signOut(auth)}
              id="header-logout-btn"
              className="hidden sm:flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-xs font-semibold text-rose-350 hover:text-rose-300 cursor-pointer items-center gap-1.5 hover:shadow-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>

            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
          </div>

        </div>
      </header>
      )}

      {!user ? (
        showLandingPage ? (
          <LandingPage onGetStarted={() => setShowLandingPage(false)} />
        ) : (
          <AuthScreen onBackToLanding={() => setShowLandingPage(true)} />
        )
      ) : (
        <>
          <AnimatePresence>
            {isNavOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNavOpen(false)}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                />
                
                <motion.div
                  initial={{ x: 300 }}
                  animate={{ x: 0 }}
                  exit={{ x: 300 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-16 h-[calc(100vh-64px)] w-72 bg-slate-900 border-l border-slate-700/50 z-40 overflow-y-auto p-4"
                >
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 mb-3 font-black">
                      Explore Modules
                    </span>

                    {[
                      { label: 'Home Dashboard', icon: Flame },
                      { label: 'AI Learning Assistant', icon: Sparkles },
                      { label: 'Study Topics & Revisions', icon: Compass },
                      { label: 'Flashcards & Practice', icon: HelpIcon },
                      { label: 'Goals & Applications', icon: Calendar },
                      { label: 'Reminders & Habits', icon: Bell },
                      { label: 'Task & Study Planner', icon: ListTodo },
                      { label: 'Experience & Story Builder', icon: ClipboardList },
                      { label: 'Vocabulary Builder', icon: BookMarked },
                      { label: 'Progress & Analytics', icon: Activity },
                      { label: 'Learning Roadmaps', icon: Layers },
                      { label: 'My Achievements', icon: Award },
                      { label: 'Daily Journal & Notes', icon: BookOpen },
                      { label: 'Practice Simulator', icon: Gamepad2 },
                      { label: 'Code Playground', icon: Code2 },
                      { label: 'Mobile Sync Hub', icon: Smartphone },
                       { label: 'Backup & Data Settings', icon: Settings },
                       { label: 'Support Creator ☕', icon: Coffee, action: () => setIsCoffeeModalOpen(true) }
                     ].map(tab => {
                       const Icon = tab.icon;
                       const isActive = activeTab === tab.label;
                       const hasAction = 'action' in tab;
                       const hasWarning = tab.label === 'Backup & Data Settings' && !userSettings?.geminiApiKey;
                       return (
                         <button
                           key={tab.label}
                           onClick={() => {
                             if ('action' in tab && typeof tab.action === 'function') {
                               tab.action();
                             } else {
                               if (tab.label === 'Backup & Data Settings') {
                                 setSettingsSubTab('import');
                               }
                               setActiveTab(tab.label);
                             }
                             setIsNavOpen(false);
                           }}
                           className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                             isActive 
                               ? 'bg-indigo-650 text-white shadow-md border border-indigo-500/30' 
                               : hasAction 
                                 ? 'bg-indigo-950/20 text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 border border-indigo-500/10'
                                 : 'text-slate-300 hover:bg-white/10 hover:text-white'
                           }`}
                         >
                           <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : hasAction ? 'text-indigo-450' : 'text-slate-400'}`} />
                           <span>{tab.label}</span>
                           {hasWarning && (
                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-auto animate-pulse" title="Configure AI API Keys" />
                           )}
                         </button>
                       );
                     })}

                    <button
                      onClick={() => {
                        signOut(auth);
                        setIsNavOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-350 hover:bg-rose-950/30 transition cursor-pointer mt-4 border border-rose-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {activeTab === 'Code Playground' ? (
            <CodeEditorPage onBackToDashboard={handleGoBack} />
          ) : (
            <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 flex flex-col lg:flex-row gap-6">
          
          <nav className="hidden lg:flex w-full lg:w-60 flex-col gap-4">
            
            <div className="glass-card p-4 space-y-1.5">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 mb-2 font-black select-none">
                Explore Modules
              </span>

              {[
                { label: 'Home Dashboard', icon: Flame },
                { label: 'AI Learning Assistant', icon: Sparkles },
                { label: 'Study Topics & Revisions', icon: Compass },
                { label: 'Flashcards & Practice', icon: HelpIcon },
                { label: 'Goals & Applications', icon: Calendar },
                { label: 'Reminders & Habits', icon: Bell },
                { label: 'Task & Study Planner', icon: ListTodo },
                { label: 'Experience & Story Builder', icon: ClipboardList },
                { label: 'Vocabulary Builder', icon: BookMarked },
                { label: 'Progress & Analytics', icon: Activity },
                { label: 'Learning Roadmaps', icon: Layers },
                { label: 'My Achievements', icon: Award },
                { label: 'Daily Journal & Notes', icon: BookOpen },
                { label: 'Practice Simulator', icon: Gamepad2 },
                { label: 'Code Playground', icon: Code2 },
                { label: 'Mobile Sync Hub', icon: Smartphone },
                 { label: 'Backup & Data Settings', icon: Settings },
                 { label: 'Support Creator ☕', icon: Coffee, action: () => setIsCoffeeModalOpen(true) }
               ].map(tab => {
                 const Icon = tab.icon;
                 const isActive = activeTab === tab.label;
                 const hasAction = 'action' in tab;
                 const hasWarning = tab.label === 'Backup & Data Settings' && !userSettings?.geminiApiKey;
                 return (
                   <button
                     key={tab.label}
                     onClick={() => {
                       if ('action' in tab && typeof tab.action === 'function') {
                         tab.action();
                       } else {
                         if (tab.label === 'Backup & Data Settings') {
                           setSettingsSubTab('import');
                         }
                         setActiveTab(tab.label);
                       }
                     }}
                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold font-sans tracking-wide transition cursor-pointer ${
                       isActive 
                         ? 'bg-indigo-650 text-white shadow-md border border-indigo-500/30 font-bold' 
                         : hasAction 
                           ? 'bg-indigo-950/20 text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 border border-indigo-500/10'
                           : 'text-slate-300 hover:bg-white/10 hover:text-white'
                     }`}
                   >
                     <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : hasAction ? 'text-indigo-450' : 'text-slate-400'}`} />
                     <span>{tab.label}</span>
                     {hasWarning && (
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-auto animate-pulse" title="Configure AI API Keys" />
                     )}
                   </button>
                 );
               })}
            </div>

            <div className="hidden lg:block">
              <NotificationCenter 
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onClearAll={handleClearAll}
                topics={topics}
                questions={questions}
                interviews={interviews}
                applications={applications}
                sessions={sessions}
                tasks={tasks}
                journals={journals}
                mockInterviews={mockInterviews}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pushNotification={pushNotification}
                personalReminders={personalReminders}
                userSettings={userSettings}
              />
            </div>

          </nav>

          <section className="flex-1 min-w-0 flex flex-col gap-6">
            
            {topics.length === 0 && (
              <div className="bg-slate-900/60 border border-indigo-500/25 rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-bounce" />
                <h3 className="text-base font-bold text-white mb-1.5 font-sans">Welcome to your learning space!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Your database is currently empty. Initialize your dashboard with a standard set of learning topics and flashcards to start tracking your progress.
                </p>
                <button
                  onClick={handleSeedSandbox}
                  disabled={loading}
                  id="sandbox-seed-btn"
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl cursor-pointer shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {loading ? <Loader className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
                  Seed Sandbox Demo Workspace
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.985, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: -10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full flex flex-col gap-6"
              >
                {activeTab === 'Home Dashboard' && (
              <div className="space-y-6">
                <Dashboard 
                  topics={topics}
                  questions={questions}
                  interviews={interviews}
                  mistakes={mistakes}
                  sessions={sessions}
                  notifications={notifications}
                  onStartSession={(id) => {
                    setActiveSessionTopicId(id);
                    setActiveTab('Progress & Analytics');
                  }}
                   onNavigate={(dest, subTab) => {
                    setActiveTab(dest);
                    if (dest === 'Backup & Data Settings' && subTab) {
                      setSettingsSubTab(subTab as any);
                    }
                  }}
                  plans={plans}
                  tasks={tasks}
                  onUpdateTask={handleUpdateTaskInApp}
                  journals={journals}
                  roadmaps={roadmaps}
                  personalReminders={personalReminders}
                  reminderLogs={reminderLogs}
                  onActionReminder={handleActionPersonalReminder}
                  globalStats={globalStats}
                  urgentTopics={urgentTopics}
                  pushNotification={pushNotification}
                  userSettings={userSettings}
                />
                
                <CloudBackupControls 
                  userId={user.uid}
                  currentData={{
                    topics,
                    questions,
                    applications,
                    interviews,
                    mistakes,
                    sessions,
                    voiceRecordings,
                    notifications,
                    intelliQuestions
                  }}
                  onRestore={handleRestoreCloudBackup}
                  onPushNotification={pushNotification}
                />
              </div>
            )}

            {activeTab === 'AI Learning Assistant' && (
              <IntelligenceHub 
                topics={topics}
                questions={questions}
                interviews={interviews}
                mistakes={mistakes}
                sessions={sessions}
                voiceRecordings={voiceRecordings}
                onStartSession={(id) => {
                  setActiveTab('Progress & Analytics');
                }}
                onNavigate={(dest) => {
                  setActiveTab(dest);
                }}
                intelliQuestions={intelliQuestions}
                onAddIntelliQuestion={handleAddIntelliQuestion}
                onDeleteIntelliQuestion={handleDeleteIntelliQuestion}
                onUpdateTopic={handleUpdateTopic}
              />
            )}

          {activeTab === 'Study Topics & Revisions' && (
            <TopicManagement 
              subjects={subjects}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              topics={topics}
              questions={questions}
              onAddTopic={handleAddTopic}
              onUpdateTopic={handleUpdateTopic}
              onDeleteTopic={handleDeleteTopic}
              onMergeTopics={handleMergeTopics}
              onRecallResponse={handleRecallResponse}
              onLoadMore={() => { if (topics.length >= topicLimit) setTopicLimit(prev => prev + 50); }}
              onNavigate={(dest) => setActiveTab(dest)}
              userId={user?.uid}
              topicLimit={topicLimit}
            />
          )}

          {activeTab === 'Flashcards & Practice' && (
            <QuestionBank 
              questions={questions}
              topics={topics}
              voiceRecordings={voiceRecordings}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onRecallResponse={handleRecallResponse}
              onAddVoiceRecording={handleAddVoice}
              onDeleteVoiceRecording={handleDeleteVoice}
              onLoadMore={() => { if (questions.length >= questionLimit) setQuestionLimit(prev => prev + 50); }}
              onNavigate={(dest) => setActiveTab(dest)}
              questionLimit={questionLimit}
            />
          )}

          {activeTab === 'Goals & Applications' && (
            <InterviewTracker 
              applications={applications}
              interviews={interviews}
              mistakes={mistakes}
              topics={topics}
              onAddApplication={handleAddApplication}
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              onAddInterview={handleAddInterview}
              onUpdateInterview={handleUpdateInterview}
              onDeleteInterview={handleDeleteInterview}
              onAddMistake={handleAddMistake}
              onDeleteMistake={handleDeleteMistake}
            />
          )}

          {activeTab === 'Progress & Analytics' && (
            <Analytics 
              sessions={sessions} 
              subjects={subjects} 
              topics={topics}
              onAddSession={handleAddSession}
              plans={plans}
              tasks={tasks}
              globalStats={globalStats}
              initialActiveTopicId={activeSessionTopicId}
              clearInitialActiveTopicId={() => setActiveSessionTopicId(null)}
            />
          )}

          {activeTab === 'Task & Study Planner' && (
            <ActivityPlanner 
              plans={plans}
              tasks={tasks}
              onAddPlan={handleAddPlan}
              onDeletePlan={handleDeletePlan}
              onUpdateTask={handleUpdateTaskInApp}
              onDeleteTask={handleDeleteTaskInApp}
            />
          )}

          {activeTab === 'Learning Roadmaps' && (
            <PreparationRoadmaps 
              roadmaps={roadmaps}
              topics={topics}
              onAddRoadmap={handleAddRoadmap}
              onUpdateRoadmap={handleUpdateRoadmap}
              onDeleteRoadmap={handleDeleteRoadmap}
            />
          )}

          {activeTab === 'My Achievements' && (
            <AchievementsView 
              sessions={sessions}
              questions={questions}
              interviews={interviews}
              applications={applications}
              streakDays={7}
            />
          )}

          {activeTab === 'Daily Journal & Notes' && (
            <PersonalJournal 
              journals={journals}
              topics={topics}
              interviews={interviews}
              onAddJournal={handleAddJournal}
              onUpdateJournal={handleUpdateJournal}
              onDeleteJournal={handleDeleteJournal}
              onUploadAttachment={handleUploadJournalAttachment}
            />
          )}

          {activeTab === 'Reminders & Habits' && (
            <PersonalReminders 
              reminders={personalReminders}
              logs={reminderLogs}
              settings={reminderSettings}
              onAddReminder={handleAddPersonalReminder}
              onUpdateReminder={handleUpdatePersonalReminder}
              onDeleteReminder={handleDeletePersonalReminder}
              onActionReminder={handleActionPersonalReminder}
              onUpdateSettings={handleUpdateReminderSettings}
            />
          )}

          {activeTab === 'Experience & Story Builder' && (
            <StarStoryBuilder 
              starStories={starStories}
              onAddStarStory={handleAddStarStory}
              onUpdateStarStory={handleUpdateStarStory}
              onDeleteStarStory={handleDeleteStarStory}
              cerebrasApiKey={userSettings?.cerebrasApiKey}
              geminiApiKey={userSettings?.geminiApiKey}
              groqApiKey={userSettings?.groqApiKey}
              cerebrasModel={userSettings?.cerebrasModel}
              geminiModel={userSettings?.geminiModel}
              groqModel={userSettings?.groqModel}
            />
          )}

          {activeTab === 'Vocabulary Builder' && (
            <VocabularyBuilder
              vocabularyWords={vocabularyWords}
              onAddVocabularyWord={handleAddVocabularyWord}
              onUpdateVocabularyWord={handleUpdateVocabularyWord}
              onDeleteVocabularyWord={handleDeleteVocabularyWord}
              onMarkWordReviewed={handleMarkWordReviewed}
              onSearchWordDefinition={handleSearchWordDefinition}
            />
          )}

          {activeTab === 'Practice Simulator' && (
            <MockInterviewWorkspace 
              subjects={subjects}
              topics={topics}
              questions={questions}
              intelliQuestions={intelliQuestions}
              mockPresetQuestions={mockPresetQuestions}
              customInterviewPrompt={userSettings?.customInterviewPrompt}
              onUpdateCustomPrompt={handleUpdateCustomPrompt}
              onAddMockPresetQuestion={handleAddMockPresetQuestion}
              onDeleteMockPresetQuestion={handleDeleteMockPresetQuestion}
              interviews={mockInterviews}
              cerebrasApiKey={userSettings?.cerebrasApiKey}
              geminiApiKey={userSettings?.geminiApiKey}
              groqApiKey={userSettings?.groqApiKey}
              cerebrasModel={userSettings?.cerebrasModel}
              geminiModel={userSettings?.geminiModel}
              groqModel={userSettings?.groqModel}
              onAddInterview={handleAddMockInterview}
              onDeleteInterview={handleDeleteMockInterview}
            />
          )}

            {activeTab === 'Code Playground' && (
            <CodeEditorPage />
          )}

          {activeTab === 'Mobile Sync Hub' && (
            <MobileOfflineHub 
              notifications={notifications}
              onPushNotification={pushNotification}
            />
          )}

          {activeTab === 'Backup & Data Settings' && (
            <BulkImportExportCenter 
              userId={user.uid}
              topics={topics}
              questions={questions}
              intelliQuestions={intelliQuestions}
              mistakes={mistakes}
              plans={plans}
              roadmaps={roadmaps}
              journals={journals}
              interviews={interviews}
              subjects={subjects}
              mockPresetQuestions={mockPresetQuestions}
              userSettings={userSettings}
              vocabularyWords={vocabularyWords}
              codingQuestions={codingQuestions}
              onUpdateCerebrasKey={handleUpdateCerebrasKey}
              onUpdateGeminiKey={handleUpdateGeminiKey}
              onUpdateGroqKey={handleUpdateGroqKey}
              onUpdateCerebrasModel={handleUpdateCerebrasModel}
              onUpdateGeminiModel={handleUpdateGeminiModel}
              onUpdateGroqModel={handleUpdateGroqModel}
              onUpdateTheme={handleUpdateTheme}
              onBulkImport={handleBulkImport}
              initialSubTab={settingsSubTab}
            />
          )}


              </motion.div>
            </AnimatePresence>

          </section>

            </main>
          )}
        </>
      )}

      <footer className="border-t border-white/5 mt-auto py-5 select-none text-center bg-black/10">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 font-sans">
          &copy; 2026 PrepFlow. Accelerate learning, track tasks, and achieve your goals with smart companion tools.
        </div>
      </footer>

      <FuturisticToaster 
        toasts={activeToasts}
        onDismiss={(id) => setActiveToasts(prev => prev.filter(t => t.id !== id))}
        onExecuteAction={handleExecuteToastAction}
      />

      <BuyMeCoffeeModal 
        isOpen={isCoffeeModalOpen} 
        onClose={() => setIsCoffeeModalOpen(false)} 
      />

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1, translateY: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-full shadow-lg border border-indigo-500/40 backdrop-blur-md cursor-pointer z-50 transition-colors duration-250 flex items-center justify-center hover:shadow-indigo-500/25"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 text-indigo-100" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating AI Gesture Widget — visible only when gesture control is active */}
      {user && isGestureActive && <CameraGestureWidget />}

      {/* Fixed bottom gesture instruction bar — visible only when gesture control is active */}
      {user && isGestureActive && <GestureInstructionBar activeTab={activeTab} />}

    </div>
  );
}
