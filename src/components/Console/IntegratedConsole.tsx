import React, { useState } from 'react';
import ConsoleTabs, { ConsoleTabId } from './ConsoleTabs';
import OutputPanel from './OutputPanel';
import LogsPanel from './LogsPanel';
import TestCasePanel from './TestCasePanel';
import HistoryPanel from './HistoryPanel';
import AIDebugPanel from './AIDebugPanel';
import StatusBar from './StatusBar';
import Toolbar from './Toolbar';

import { CodeQuestion, CodeSubmission } from '../../types';
import { ExecutionResult } from '../../services/compilerApi';
import { X, AlertCircle } from 'lucide-react';

interface IntegratedConsoleProps {
  question: CodeQuestion;
  result: ExecutionResult | null;
  isRunning: boolean;
  isSubmitting: boolean;
  testResults: Array<{ input: string; expectedOutput: string; actualOutput: string; passed: boolean }>;
  submissions: CodeSubmission[];
  language: string;
  onRestore: (sub: CodeSubmission) => void;
  onSelectInput: (input: string) => void;
  onClear: () => void;
  onNavigateToLine?: (line: number) => void;
}

export default function IntegratedConsole({
  question,
  result,
  isRunning,
  isSubmitting,
  testResults,
  submissions,
  language,
  onRestore,
  onSelectInput,
  onClear,
  onNavigateToLine,
}: IntegratedConsoleProps) {
  const [activeTab, setActiveTab] = useState<ConsoleTabId>('testcases');
  const [isSplitView, setIsSplitView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-switch tabs based on compiler events
  React.useEffect(() => {
    if (isRunning) {
      setActiveTab('output');
    }
  }, [isRunning]);

  React.useEffect(() => {
    if (isSubmitting) {
      setActiveTab('testcases');
    }
  }, [isSubmitting]);

  React.useEffect(() => {
    if (result) {
      if (result.status === 'compilation_error') {
        setActiveTab('aidebug');
      } else {
        setActiveTab('output');
      }
    }
  }, [result]);

  // Capture execution log timeline
  const executionLogs = React.useMemo(() => {
    const logsList: Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'error' }> = [];
    const time = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isRunning || isSubmitting) {
      logsList.push({ timestamp: time(), message: 'Compilation Started', type: 'info' });
      logsList.push({ timestamp: time(), message: 'Running Program Tests', type: 'info' });
    }

    if (result) {
      if (result.status === 'compilation_error') {
        logsList.push({ timestamp: time(), message: 'Compilation Failed with Errors', type: 'error' });
      } else {
        logsList.push({ timestamp: time(), message: 'Compilation Successful', type: 'success' });
        logsList.push({ timestamp: time(), message: 'Execution Completed', type: 'success' });
      }
    }

    return logsList;
  }, [isRunning, isSubmitting, result]);

  const handleCopy = () => {
    if (result?.stdout) {
      navigator.clipboard.writeText(result.stdout);
    }
  };

  const handleDownload = () => {
    const messages = executionLogs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    const blob = new Blob([messages], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'execution_logs.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasCompileError = !!result && result.status === 'compilation_error';
  const passedCount = testResults.filter((r) => r.passed).length;

  const consoleStatus = isRunning || isSubmitting
    ? 'running'
    : !result
    ? 'idle'
    : result.status === 'timeout'
    ? 'timeout'
    : result.status === 'error'
    ? 'error'
    : 'success';

  const consoleContent = (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar
        isSplitView={isSplitView}
        setIsSplitView={setIsSplitView}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        onClear={onClear}
        onCopy={handleCopy}
        onDownload={handleDownload}
        showToggleOption={activeTab === 'output'}
      />

      {/* Tabs */}
      <ConsoleTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        passedCount={passedCount}
        totalCount={testResults.length}
        hasCompileError={hasCompileError}
      />

      {/* AI Execution Simulation Warning */}
      <div className="bg-amber-500/10 border-y border-amber-500/20 px-4 py-2.5 flex items-center gap-2 select-none text-xs font-semibold text-amber-300 bg-amber-500/5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>AI Simulation Mode: Code execution is simulated via the AI Coach backend. Piston public sandboxes are offline.</span>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-auto bg-[#0f172a] min-h-[160px]">
        {activeTab === 'output' && (
          <OutputPanel
            result={result}
            isRunning={isRunning || isSubmitting}
            isSplitView={isSplitView}
          />
        )}

        {activeTab === 'testcases' && (
          <TestCasePanel
            question={question}
            testResults={testResults}
            isRunning={isSubmitting}
            onSelectInput={onSelectInput}
          />
        )}

        {activeTab === 'logs' && (
          <LogsPanel
            logs={executionLogs}
            apiTiming={result?.executionTime}
            isOnline={navigator.onLine}
          />
        )}

        {activeTab === 'aidebug' && (
          <AIDebugPanel
            compileError={result?.status === 'compilation_error' ? result.compilationOutput || result.stderr : undefined}
            onNavigateToLine={onNavigateToLine}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            submissions={submissions}
            onRestore={onRestore}
            onRestoreOutput={onClear}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        status={consoleStatus as any}
        language={language}
        runtime={result?.executionTime}
        memory={result?.memory}
        isOnline={navigator.onLine}
      />
    </div>
  );

  // Fullscreen Overlay
  if (isFullscreen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 select-none font-sans">
          <div className="relative w-full max-w-4xl h-[85vh] bg-[#0f172a] border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute right-3 top-2.5 z-55">
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition border border-slate-700/40 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Close Fullscreen
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {consoleContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  return consoleContent;
}
