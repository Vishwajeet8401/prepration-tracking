import React, { useState, useMemo } from 'react';
import { CodeSubmission } from '../../types';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, RotateCcw, Trash2, History,
  Search, Filter, Eye, ArrowLeftRight, FileCode, Copy, Download, Award,
  Sparkles, Check, Pin, FileSpreadsheet, PlusCircle, PenTool, LayoutGrid, TrendingUp, Info, ChevronRight
} from 'lucide-react';
import { LANGUAGE_CONFIG } from '../../data/codeQuestions';

interface SubmissionHistoryProps {
  submissions: CodeSubmission[];
  onRestore: (sub: CodeSubmission) => void;
  onDelete: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Accepted':
      return { label: 'AC', title: 'Accepted', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
    case 'Wrong Answer':
      return { label: 'WA', title: 'Wrong Answer', color: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
    case 'Compilation Error':
      return { label: 'CE', title: 'Compilation Error', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
    case 'Runtime Error':
      return { label: 'RE', title: 'Runtime Error', color: 'text-orange-400 border-orange-500/20 bg-orange-500/10' };
    case 'Time Limit Exceeded':
      return { label: 'TLE', title: 'Time Limit Exceeded', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' };
    case 'Memory Limit Exceeded':
      return { label: 'MLE', title: 'Memory Limit Exceeded', color: 'text-pink-400 border-pink-500/20 bg-pink-500/10' };
    default:
      return { label: 'SUB', title: 'Submitted', color: 'text-slate-400 border-slate-500/20 bg-slate-500/10' };
  }
}

// Simple line-by-line diff generator
function generateSimpleDiff(codeA: string, codeB: string) {
  const linesA = codeA.split('\n');
  const linesB = codeB.split('\n');
  const diffs: Array<{ type: 'added' | 'removed' | 'normal'; text: string }> = [];

  const maxLines = Math.max(linesA.length, linesB.length);
  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i];
    const lineB = linesB[i];

    if (lineA !== undefined && lineB === undefined) {
      diffs.push({ type: 'removed', text: `- ${lineA}` });
    } else if (lineA === undefined && lineB !== undefined) {
      diffs.push({ type: 'added', text: `+ ${lineB}` });
    } else if (lineA !== lineB) {
      diffs.push({ type: 'removed', text: `- ${lineA}` });
      diffs.push({ type: 'added', text: `+ ${lineB}` });
    } else {
      if (diffs.length < 50) { // Limit diff size for display
        diffs.push({ type: 'normal', text: `  ${lineA}` });
      }
    }
  }
  return diffs;
}

export default function SubmissionHistory({
  submissions,
  onRestore,
  onDelete,
}: SubmissionHistoryProps) {
  // Navigation / views
  const [selectedSub, setSelectedSub] = useState<CodeSubmission | null>(null);
  const [compareSubA, setCompareSubA] = useState<CodeSubmission | null>(null);
  const [compareSubB, setCompareSubB] = useState<CodeSubmission | null>(null);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [langFilter, setLangFilter] = useState<string>('All');

  // Interactive user notes / pinning
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [currentNote, setCurrentNote] = useState('');

  // ── FILTER SUBMISSIONS ───────────────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        sub.sourceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.status.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || sub.status === statusFilter;
      const matchLang = langFilter === 'All' || sub.language === langFilter;
      return matchSearch && matchStatus && matchLang;
    });
  }, [submissions, searchQuery, statusFilter, langFilter]);

  // ── STATISTICS ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (submissions.length === 0) return null;
    const total = submissions.length;
    const accepted = submissions.filter((s) => s.status === 'Accepted').length;
    const accuracy = Math.round((accepted / total) * 100);

    // Filter runtime in ms
    const runtimes = submissions
      .map((s) => parseInt(s.executionTime) || 0)
      .filter((r) => r > 0);
    const fastest = runtimes.length > 0 ? Math.min(...runtimes) : 0;
    const average = runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 0;

    return { total, accepted, accuracy, fastest, average };
  }, [submissions]);

  // ── EXPORT CSV ───────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['ID', 'Status', 'Language', 'Runtime', 'Memory', 'Score', 'Created At'];
    const rows = submissions.map((s) => [
      s.id,
      s.status,
      s.language,
      s.executionTime,
      s.memory,
      s.score ?? (s.status === 'Accepted' ? 100 : 0),
      s.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `submission_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleDownloadCode = (code: string, lang: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solution.${LANGUAGE_CONFIG[lang]?.extension || 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectCompare = (sub: CodeSubmission) => {
    if (!compareSubA) {
      setCompareSubA(sub);
    } else if (!compareSubB && sub.id !== compareSubA.id) {
      setCompareSubB(sub);
      setShowCompareView(true);
    } else {
      setCompareSubA(sub);
      setCompareSubB(null);
    }
  };

  // Complexity evolution chain heuristics
  const evolutionList = useMemo(() => {
    // Return unique submissions based on logic improvement
    return submissions
      .slice()
      .reverse()
      .map((sub, idx) => {
        let comp = 'O(N²)';
        if (sub.status === 'Accepted') {
          comp = sub.sourceCode.includes('HashMap') || sub.sourceCode.includes('dict') ? 'O(N) (Optimal)' : 'O(N log N)';
        }
        return {
          attempt: idx + 1,
          status: sub.status,
          complexity: comp,
          lang: sub.language,
        };
      });
  }, [submissions]);

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 text-xs">
      {/* ── Subtitle Actions ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#111827] border-b border-slate-700/30 shrink-0">
        <div className="flex items-center gap-3">
          <History className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-slate-200">History & Submissions</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer border ${
              showStats ? 'bg-violet-600/10 border-violet-500/30 text-violet-300' : 'bg-slate-800/40 border-slate-700/20 text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/20 rounded text-[10px] font-bold uppercase text-slate-300 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* ── Main Panel Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto max-h-[350px] p-4 space-y-4">
        {/* Render Comparison View */}
        {showCompareView && compareSubA && compareSubB && (
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">Compare Submissions</span>
              <button
                onClick={() => {
                  setShowCompareView(false);
                  setCompareSubB(null);
                }}
                className="text-[10px] text-violet-400 hover:underline font-bold cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Submission A Info */}
              <div className="bg-[#0f172a] rounded-lg border border-slate-850 p-3 space-y-1">
                <div className="font-bold text-slate-400">Submission A</div>
                <div className="text-emerald-400 font-bold">{compareSubA.status}</div>
                <div className="text-[10px] text-slate-500 font-mono">Runtime: {compareSubA.executionTime}</div>
                <div className="text-[10px] text-slate-500 font-mono">Memory: {compareSubA.memory}</div>
              </div>
              {/* Submission B Info */}
              <div className="bg-[#0f172a] rounded-lg border border-slate-850 p-3 space-y-1">
                <div className="font-bold text-slate-400">Submission B</div>
                <div className="text-rose-400 font-bold">{compareSubB.status}</div>
                <div className="text-[10px] text-slate-500 font-mono">Runtime: {compareSubB.executionTime}</div>
                <div className="text-[10px] text-slate-500 font-mono">Memory: {compareSubB.memory}</div>
              </div>
            </div>

            {/* Simple Side-by-side diff */}
            <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-[10px] bg-slate-950 p-3 max-h-[160px] overflow-y-auto leading-relaxed">
              {generateSimpleDiff(compareSubA.sourceCode, compareSubB.sourceCode).map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.type === 'added'
                      ? 'text-emerald-400 bg-emerald-500/5'
                      : line.type === 'removed'
                      ? 'text-rose-400 bg-rose-500/5'
                      : 'text-slate-500'
                  }
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render Statistics Dashboard */}
        {showStats && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#111827] rounded-xl border border-slate-800 p-4">
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Attempts</span>
              <div className="text-lg font-black text-white mt-1">{stats.total}</div>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Accuracy Rate</span>
              <div className="text-lg font-black text-emerald-400 mt-1">{stats.accuracy}%</div>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Best Runtime</span>
              <div className="text-lg font-black text-violet-400 mt-1">{stats.fastest} ms</div>
            </div>
            <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Avg Runtime</span>
              <div className="text-lg font-black text-slate-300 mt-1">{stats.average} ms</div>
            </div>

            {/* Evolution Pipeline timeline */}
            {evolutionList.length > 0 && (
              <div className="col-span-full border-t border-slate-800/80 pt-3 mt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Complexity Evolution Roadmap</span>
                <div className="flex flex-wrap items-center gap-3">
                  {evolutionList.map((evo) => {
                    const badge = getStatusBadge(evo.status);
                    return (
                      <div key={evo.attempt} className="flex items-center gap-2">
                        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex flex-col items-center">
                          <span className="text-[8px] text-slate-500">Attempt {evo.attempt}</span>
                          <span className="font-bold text-slate-300">{evo.complexity}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 ${badge.color}`}>{badge.label}</span>
                        </div>
                        {evo.attempt < evolutionList.length && <ChevronRight className="w-4 h-4 text-slate-700" />}
                      </div>
                    );
                  })}
                  <div className="bg-violet-600/10 border border-violet-500/30 px-3 py-1.5 rounded-lg flex flex-col items-center">
                    <span className="text-[8px] text-violet-400">Target</span>
                    <span className="font-bold text-violet-300">Interview Ready ⭐</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submissions Table view ────────────────────────────────────────── */}
        <div className="bg-[#111827] rounded-xl border border-slate-850 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#161f30]/50 border-b border-slate-850">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history (e.g. HashMap, binary...)"
                className="w-full bg-[#0f172a] border border-slate-800 focus:border-violet-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none placeholder-slate-700"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0f172a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Accepted">Accepted</option>
                <option value="Wrong Answer">Wrong Answer</option>
                <option value="Compilation Error">Compilation Error</option>
                <option value="Runtime Error">Runtime Error</option>
              </select>

              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="bg-[#0f172a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Languages</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-widest bg-slate-900/10">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Runtime</th>
                  <th className="px-4 py-3">Memory</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {filteredSubmissions.map((sub) => {
                  const badge = getStatusBadge(sub.status);
                  const lang = LANGUAGE_CONFIG[sub.language];
                  const isPinned = pinnedId === sub.id;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/10 group transition">
                      <td className="px-4 py-3 font-bold">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${badge.color}`}>
                          {badge.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{timeAgo(sub.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{sub.executionTime}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{sub.memory || '16 MB'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-400">
                        {lang?.icon} {lang?.label || sub.language}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-bold font-mono">
                        {sub.score ?? (sub.status === 'Accepted' ? 100 : 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPinnedId(isPinned ? null : sub.id)}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400'
                            }`}
                            title={isPinned ? 'Unpin' : 'Pin attempt'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="p-1 text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition cursor-pointer"
                            title="View code & evaluation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSelectCompare(sub)}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              compareSubA?.id === sub.id
                                ? 'text-violet-400 bg-violet-500/10'
                                : 'text-slate-600 hover:text-violet-400 hover:bg-violet-500/10'
                            }`}
                            title="Select to compare"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(sub.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Submission Details Side Drawer Modal ────────────────────────────── */}
        {selectedSub && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedSub(null)} />
            <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-[#111827] border-l border-slate-700/50 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-300 font-sans">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1b2330] border-b border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Submission Details</span>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">Attempt #{selectedSub.id.slice(0, 8)}</div>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="text-xs text-slate-500 hover:text-white px-2.5 py-1 bg-slate-800 rounded transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Score badge / status info */}
                <div className="bg-[#0f172a] rounded-xl border border-slate-850 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${getStatusBadge(selectedSub.status).color}`}>
                      {selectedSub.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Award className="w-4 h-4 text-amber-400" />
                      Score: <span className="text-slate-200 font-bold">{selectedSub.score ?? 100}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-sans block">Language</span>
                      <span className="font-bold text-slate-300">{LANGUAGE_CONFIG[selectedSub.language]?.label || selectedSub.language}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-sans block">Submitted</span>
                      <span className="font-bold text-slate-300">{new Date(selectedSub.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-sans block">Runtime</span>
                      <span className="font-bold text-violet-400">{selectedSub.executionTime}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-slate-500 font-sans block">Memory</span>
                      <span className="font-bold text-slate-300">{selectedSub.memory || '16 MB'}</span>
                    </div>
                  </div>
                </div>

                {/* AI Review Summary info */}
                <div className="bg-violet-600/5 border border-violet-500/15 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                    <Sparkles className="w-4 h-4" />
                    Interview Coach Assessment
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {selectedSub.aiFeedback || 'Time Complexity: O(N)\nSpace Complexity: O(N)\nGreat job! HashMap approach runs optimally. Readability looks perfect.'}
                  </div>
                </div>

                {/* User Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Custom Revision Notes</label>
                  <textarea
                    value={notes[selectedSub.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [selectedSub.id]: e.target.value })}
                    placeholder="Write custom notes for this attempt..."
                    className="w-full bg-[#0f172a] border border-slate-800 hover:border-slate-700/60 focus:border-violet-500/50 rounded-lg p-2.5 text-xs focus:outline-none resize-none"
                    rows={2}
                  />
                </div>

                {/* Source Code Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <FileCode className="w-3.5 h-3.5" />
                      Code Viewer
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCode(selectedSub.sourceCode)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadCode(selectedSub.sourceCode, selectedSub.language)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onRestore(selectedSub);
                          setSelectedSub(null);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-500/5 border border-violet-500/10 rounded-md px-2 py-0.5 ml-2 hover:bg-violet-500/10 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  </div>

                  <pre className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-200 overflow-auto max-h-[220px]">
                    {selectedSub.sourceCode}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
