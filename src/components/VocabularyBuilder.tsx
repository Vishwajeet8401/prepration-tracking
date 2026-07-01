/**
 * VocabularyBuilder.tsx
 * Personal English vocabulary tracker with smart 3-tier search,
 * Marathi meanings, pronunciation, and learning status progression.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, BookMarked, Plus, CheckCircle2, RotateCcw, Trash2,
  Flame, Star, Trophy, ChevronDown, ChevronUp, Volume2, Info,
  Sparkles, BookOpen, Eye, Filter, SortAsc, SortDesc, X, Loader2,
  AlertCircle, ArrowRight, Zap, Brain, Hand
} from 'lucide-react';
import { VocabularyWord, WordDefinition, VocabularyStatus } from '../types';
import AudioPlayButton from './AudioPlayButton';
import { useGestureController } from '../hooks/useGestureController';
import { useGestureContext } from '../context/GestureContext';

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  vocabularyWords: VocabularyWord[];
  onAddVocabularyWord: (word: Omit<VocabularyWord, 'id' | 'userId' | 'reviewCount' | 'lastReviewDate' | 'createdDate' | 'status'>) => Promise<void>;
  onUpdateVocabularyWord: (updated: VocabularyWord) => Promise<void>;
  onDeleteVocabularyWord: (id: string) => Promise<void>;
  onMarkWordReviewed: (id: string) => Promise<void>;
  onSearchWordDefinition: (query: string) => Promise<WordDefinition | null>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findFuzzyMatch(query: string, words: VocabularyWord[]): VocabularyWord | null {
  const normalized = query.toLowerCase().trim();
  let best: VocabularyWord | null = null;
  let bestDist = Infinity;
  for (const w of words) {
    const d = levenshtein(w.word.toLowerCase(), normalized);
    if (d <= 2 && d < bestDist) {
      best = w;
      bestDist = d;
    }
  }
  return best;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function highlightWord(sentence: string, word: string): React.ReactNode {
  const regex = new RegExp(`(${word})`, 'gi');
  const parts = sentence.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="vocab-highlight">{part}</mark>
      : part
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VocabularyStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  Learning: {
    color: 'text-amber-300',
    bg: 'bg-amber-500/15 border-amber-500/30',
    icon: <Brain className="w-3 h-3" />,
    label: 'Learning'
  },
  Reviewing: {
    color: 'text-sky-300',
    bg: 'bg-sky-500/15 border-sky-500/30',
    icon: <Eye className="w-3 h-3" />,
    label: 'Reviewing'
  },
  Mastered: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    icon: <Trophy className="w-3 h-3" />,
    label: 'Mastered'
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VocabularyStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function WordResultCard({
  definition,
  savedWord,
  isSaving,
  onAdd,
  onReview
}: {
  definition: WordDefinition;
  savedWord: VocabularyWord | null;
  isSaving: boolean;
  onAdd: () => void;
  onReview: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="vocab-result-card"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="vocab-word-icon">
            <BookOpen className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight capitalize leading-none">
                {definition.word}
              </h2>
              <AudioPlayButton 
                text={definition.word} 
                tooltip="Pronounce word" 
                className="p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-indigo-300 hover:text-indigo-200" 
              />
            </div>
            {definition.pronunciation && (
              <p className="text-sm text-indigo-300 font-medium mt-1 font-devanagari">
                /{definition.pronunciation}/
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {definition.isAiGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 animate-pulse">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Generated by AI
            </span>
          )}
          {savedWord ? (
            <>
              <StatusBadge status={savedWord.status} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                <Flame className="w-3 h-3" />
                {savedWord.reviewCount} reviews
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 border border-slate-600/40 text-slate-400">
              <Sparkles className="w-3 h-3" />
              Not in vocabulary
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* English Meaning */}
        <div className="vocab-meaning-block group relative">
          <div className="flex items-center justify-between gap-2">
            <span className="vocab-label">English Meaning</span>
            <AudioPlayButton 
              text={definition.englishMeaning} 
              tooltip="Read English meaning" 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
            />
          </div>
          <p className="text-sm text-slate-200 leading-relaxed mt-1">{definition.englishMeaning}</p>
        </div>
        {/* Marathi Meaning */}
        <div className="vocab-meaning-block group relative">
          <div className="flex items-center justify-between gap-2">
            <span className="vocab-label">Marathi Meaning</span>
            <AudioPlayButton 
              text={definition.marathiMeaning} 
              tooltip="Read Marathi meaning" 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
            />
          </div>
          <p className="text-lg text-emerald-200 font-semibold mt-1 font-devanagari leading-relaxed">
            {definition.marathiMeaning}
          </p>
        </div>
      </div>

      {/* Example sentence */}
      {definition.exampleSentence && (
        <div className="mt-4 vocab-example-block group relative">
          <div className="flex items-center justify-between gap-2">
            <span className="vocab-label mb-1 block">Example</span>
            <AudioPlayButton 
              text={definition.exampleSentence} 
              tooltip="Read example sentence" 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
            />
          </div>
          <p className="text-sm text-slate-300 italic leading-relaxed">
            "{highlightWord(definition.exampleSentence, definition.word)}"
          </p>
        </div>
      )}

      {/* If saved: show meta info */}
      {savedWord && showAll && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Added</span>
            <span className="text-slate-200 text-xs font-semibold">{formatDate(savedWord.createdDate)}</span>
          </div>
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Last Review</span>
            <span className="text-slate-200 text-xs font-semibold">{formatDate(savedWord.lastReviewDate)}</span>
          </div>
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Reviews</span>
            <span className="text-slate-200 text-xs font-semibold">{savedWord.reviewCount}</span>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        {savedWord ? (
          <>
            <button
              onClick={onReview}
              disabled={isSaving}
              id="vocab-mark-reviewed-btn"
              className="vocab-btn-primary"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as Reviewed
            </button>
            <button
              onClick={() => setShowAll(v => !v)}
              className="vocab-btn-ghost"
            >
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAll ? 'Less' : 'More info'}
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            disabled={isSaving}
            id="vocab-add-btn"
            className="vocab-btn-add"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            + Add to My Vocabulary
          </button>
        )}
      </div>

      {savedWord && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Already in your vocabulary — review count updated each time you search!
        </div>
      )}
    </motion.div>
  );
}

// ─── Library Card ─────────────────────────────────────────────────────────────

function LibraryWordCard({
  word,
  onReview,
  onDelete,
  onStatusChange,
  onClick
}: {
  word: VocabularyWord;
  onReview: () => void;
  onDelete: () => void;
  onStatusChange: (status: VocabularyStatus) => void;
  onClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[word.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="vocab-library-card group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white capitalize truncate">{word.word}</h3>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{word.englishMeaning}</p>
        </div>
        <StatusBadge status={word.status} />
      </div>

      <p className="text-xs text-emerald-300 font-devanagari font-medium mb-3 truncate">
        {word.marathiMeaning}
      </p>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-rose-300">
          <Flame className="w-3 h-3" />
          {word.reviewCount}x
        </span>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onReview}
            title="Mark reviewed"
            className="vocab-icon-btn text-sky-400 hover:text-sky-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              title="Change status"
              className="vocab-icon-btn text-slate-400 hover:text-slate-200"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 4 }}
                  className="absolute right-0 top-6 z-20 bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-xl min-w-[120px]"
                >
                  {(['Learning', 'Reviewing', 'Mastered'] as VocabularyStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(s); setMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 hover:bg-white/10 transition ${STATUS_CONFIG[s].color}`}
                    >
                      {STATUS_CONFIG[s].icon}
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onDelete}
            title="Delete word"
            className="vocab-icon-btn text-rose-400 hover:text-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function WordDetailModal({
  word,
  onClose,
  onReview,
  onDelete,
  onStatusChange
}: {
  word: VocabularyWord;
  onClose: () => void;
  onReview: () => void;
  onDelete: () => void;
  onStatusChange: (status: VocabularyStatus) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="vocab-word-icon">
            <BookOpen className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white capitalize">{word.word}</h2>
              <AudioPlayButton 
                text={word.word} 
                tooltip="Pronounce word" 
                className="p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-indigo-300 hover:text-indigo-200" 
              />
            </div>
            {word.pronunciation && (
              <p className="text-sm text-indigo-300 font-devanagari mt-1">{word.pronunciation}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="vocab-meaning-block group relative">
            <div className="flex items-center justify-between gap-2">
              <span className="vocab-label">English Meaning</span>
              <AudioPlayButton 
                text={word.englishMeaning} 
                tooltip="Read English meaning" 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
              />
            </div>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">{word.englishMeaning}</p>
          </div>
          <div className="vocab-meaning-block group relative">
            <div className="flex items-center justify-between gap-2">
              <span className="vocab-label">Marathi Meaning</span>
              <AudioPlayButton 
                text={word.marathiMeaning} 
                tooltip="Read Marathi meaning" 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
              />
            </div>
            <p className="text-lg text-emerald-200 font-devanagari font-semibold mt-1">{word.marathiMeaning}</p>
          </div>
          {word.exampleSentence && (
            <div className="vocab-example-block group relative">
              <div className="flex items-center justify-between gap-2">
                <span className="vocab-label block mb-1">Example</span>
                <AudioPlayButton 
                  text={word.exampleSentence} 
                  tooltip="Read example sentence" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-transparent hover:bg-white/5 border-none shadow-none text-slate-400 hover:text-white" 
                />
              </div>
              <p className="text-sm text-slate-300 italic">"{highlightWord(word.exampleSentence, word.word)}"</p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Added</span>
            <span className="text-white text-xs font-bold">{formatDate(word.createdDate)}</span>
          </div>
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Reviews</span>
            <span className="text-rose-300 text-xs font-bold">{word.reviewCount}x</span>
          </div>
          <div className="vocab-meta-chip">
            <span className="text-slate-400 text-[10px]">Last Reviewed</span>
            <span className="text-white text-xs font-bold">{formatDate(word.lastReviewDate)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          {(['Learning', 'Reviewing', 'Mastered'] as VocabularyStatus[]).map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                word.status === s
                  ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onReview} className="vocab-btn-primary flex-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Mark Reviewed
          </button>
          <button onClick={onDelete} className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type LibraryTab = 'All' | VocabularyStatus;

export default function VocabularyBuilder({
  vocabularyWords,
  onAddVocabularyWord,
  onUpdateVocabularyWord,
  onDeleteVocabularyWord,
  onMarkWordReviewed,
  onSearchWordDefinition
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<WordDefinition | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [fuzzyHint, setFuzzyHint] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('All');
  const [sortBy, setSortBy] = useState<'date' | 'reviews' | 'alpha'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchedWordInVocab = useMemo(() => {
    if (!searchResult) return null;
    return vocabularyWords.find(w => w.word.toLowerCase() === searchResult.word.toLowerCase()) ?? null;
  }, [searchResult, vocabularyWords]);

  const filteredWords = useMemo(() => {
    let list = activeTab === 'All' ? vocabularyWords : vocabularyWords.filter(w => w.status === activeTab);
    list = [...list].sort((a, b) => {
      let val = 0;
      if (sortBy === 'date') val = a.createdDate.localeCompare(b.createdDate);
      else if (sortBy === 'reviews') val = a.reviewCount - b.reviewCount;
      else val = a.word.localeCompare(b.word);
      return sortDir === 'desc' ? -val : val;
    });
    return list;
  }, [vocabularyWords, activeTab, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: vocabularyWords.length,
    learning: vocabularyWords.filter(w => w.status === 'Learning').length,
    reviewing: vocabularyWords.filter(w => w.status === 'Reviewing').length,
    mastered: vocabularyWords.filter(w => w.status === 'Mastered').length,
    reviewedToday: vocabularyWords.filter(w => {
      const today = new Date().toISOString().split('T')[0];
      return w.lastReviewDate?.startsWith(today) && w.reviewCount > 0;
    }).length
  }), [vocabularyWords]);

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    setFuzzyHint(null);
    setSearchResult(null);

    // Check fuzzy hint before fetching
    const fuzzy = findFuzzyMatch(q, vocabularyWords);
    if (fuzzy && fuzzy.word.toLowerCase() !== q.toLowerCase()) {
      setFuzzyHint(fuzzy.word);
    }

    try {
      const result = await onSearchWordDefinition(q);
      if (result) {
        setSearchResult(result);
      } else {
        setSearchError(`No definition found for "${q}". Please check the spelling and try again.`);
      }
    } catch {
      setSearchError('Could not fetch definition. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, vocabularyWords, onSearchWordDefinition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAdd = useCallback(async () => {
    if (!searchResult) return;
    setIsSaving(true);
    try {
      await onAddVocabularyWord({
        word: searchResult.word,
        pronunciation: searchResult.pronunciation,
        englishMeaning: searchResult.englishMeaning,
        marathiMeaning: searchResult.marathiMeaning,
        exampleSentence: searchResult.exampleSentence,
        isAiGenerated: searchResult.isAiGenerated
      });
    } finally {
      setIsSaving(false);
    }
  }, [searchResult, onAddVocabularyWord]);

  const handleReview = useCallback(async (id: string) => {
    await onMarkWordReviewed(id);
  }, [onMarkWordReviewed]);

  const handleDeleteWord = useCallback(async (id: string) => {
    await onDeleteVocabularyWord(id);
    if (selectedWord?.id === id) setSelectedWord(null);
  }, [onDeleteVocabularyWord, selectedWord]);

  const handleStatusChange = useCallback(async (word: VocabularyWord, status: VocabularyStatus) => {
    await onUpdateVocabularyWord({ ...word, status });
    if (selectedWord?.id === word.id) setSelectedWord(prev => prev ? { ...prev, status } : null);
  }, [onUpdateVocabularyWord, selectedWord]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setSearchError(null);
    setFuzzyHint(null);
    searchInputRef.current?.focus();
  };

  const TABS: LibraryTab[] = ['All', 'Learning', 'Reviewing', 'Mastered'];

  // ── Gesture control ────────────────────────────────────────────────────────────
  const { state: gestureState } = useGestureContext();
  const isGestureOn = gestureState.camera.active && gestureState.settings.enabled;

  // Track which library word is currently "focused" by gestures
  const [gestureWordIndex, setGestureWordIndex] = useState(0);

  // Keep index in bounds as filteredWords changes
  useEffect(() => {
    setGestureWordIndex(i => Math.min(i, Math.max(0, filteredWords.length - 1)));
  }, [filteredWords.length]);

  useGestureController({
    activeTab: 'Vocabulary Builder',
    // Swipe left = previous word
    onSwipeLeft: () => {
      setGestureWordIndex(i => Math.max(0, i - 1));
    },
    // Swipe right = next word
    onSwipeRight: () => {
      setGestureWordIndex(i => Math.min(filteredWords.length - 1, i + 1));
    },
    // Scroll library up with swipe up
    onSwipeUp: () => {
      document.querySelector('.vocab-library-scroll')?.scrollBy({ top: -80, behavior: 'smooth' });
    },
    // Scroll library down with swipe down
    onSwipeDown: () => {
      document.querySelector('.vocab-library-scroll')?.scrollBy({ top: 80, behavior: 'smooth' });
    },
    // Thumb-up → mark current word Mastered
    onThumbUp: () => {
      const w = filteredWords[gestureWordIndex];
      if (w) handleStatusChange(w, 'Mastered');
    },
    // Fist → mark current word Learning (needs more practice)
    onFist: () => {
      const w = filteredWords[gestureWordIndex];
      if (w) handleStatusChange(w, 'Learning');
    },
    // Pinch → mark current word as reviewed
    onClick: () => {
      const w = filteredWords[gestureWordIndex];
      if (w) handleReview(w.id);
    },
  });

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none">Vocabulary Builder</h1>
            <p className="text-xs text-slate-400 mt-0.5">Search words • Learn Marathi meanings • Track your progress</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-indigo-400" />{stats.total} total words</span>
          <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-emerald-400" />{stats.mastered} mastered</span>
          <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-rose-400" />{stats.reviewedToday} reviewed today</span>
        </div>
      </div>

      {/* Gesture active banner */}
      {isGestureOn && filteredWords.length > 0 && (
        <div className="gesture-active-banner">
          <Hand size={13} />
          <span>
            ✋ Gesture Mode — Swipe ←→ navigate &nbsp;|&nbsp;
            👍 Thumb Up = Mastered &nbsp;|&nbsp;
            ✊ Fist = Learning &nbsp;|&nbsp;
            🤏 Pinch = Mark Reviewed
          </span>
          <span className="ml-auto text-indigo-400 font-mono text-[10px]">
            {gestureWordIndex + 1}/{filteredWords.length}
          </span>
        </div>
      )}

      {/* ─── Stats Bar ──────────────────────────────────────────────────── */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Words', val: stats.total, color: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30', textColor: 'text-indigo-300', icon: <BookOpen className="w-4 h-4" /> },
            { label: 'Learning', val: stats.learning, color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', textColor: 'text-amber-300', icon: <Brain className="w-4 h-4" /> },
            { label: 'Reviewing', val: stats.reviewing, color: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30', textColor: 'text-sky-300', icon: <Eye className="w-4 h-4" /> },
            { label: 'Mastered', val: stats.mastered, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', textColor: 'text-emerald-300', icon: <Trophy className="w-4 h-4" /> }
          ].map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-xl p-3 flex items-center gap-3`}
            >
              <div className={`${s.textColor}`}>{s.icon}</div>
              <div>
                <div className={`text-xl font-black ${s.textColor}`}>{s.val}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Search Section ──────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Search a Word</h2>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            3-tier smart search
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="vocab-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type an English word (e.g. although, serendipity...)"
              className="vocab-search-input"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            id="vocab-search-btn"
            onClick={() => handleSearch()}
            disabled={isSearching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Search tier explanation */}
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-indigo-400" /> Checks your vocabulary first</span>
          <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /></span>
          <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-amber-400" /> Checks global word cache</span>
          <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /></span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-400" /> AI fetch if not found</span>
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2.5 text-sm text-indigo-300"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching your vocabulary, word cache, and AI...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fuzzy hint */}
        <AnimatePresence>
          {fuzzyHint && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2"
            >
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Did you mean: </span>
              <button
                onClick={() => { setSearchQuery(fuzzyHint); handleSearch(fuzzyHint); setFuzzyHint(null); }}
                className="font-bold underline hover:text-amber-200 transition capitalize"
              >
                {fuzzyHint}
              </button>
              <span>? (from your vocabulary)</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {searchError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Card */}
        <AnimatePresence>
          {searchResult && !isSearching && (
            <div className="mt-4">
              <WordResultCard
                definition={searchResult}
                savedWord={searchedWordInVocab}
                isSaving={isSaving}
                onAdd={handleAdd}
                onReview={() => searchedWordInVocab && handleReview(searchedWordInVocab.id)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Vocabulary Library ──────────────────────────────────────────── */}
      <div className="glass-card p-5">
        {/* Library header */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">My Vocabulary</h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/50">
              {filteredWords.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort controls */}
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
              {[
                { key: 'date', label: 'Date' },
                { key: 'reviews', label: 'Reviews' },
                { key: 'alpha', label: 'A–Z' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    if (sortBy === opt.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortBy(opt.key as typeof sortBy); setSortDir('desc'); }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
                    sortBy === opt.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.key && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const count = tab === 'All' ? stats.total : stats[tab.toLowerCase() as 'learning' | 'reviewing' | 'mastered'];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition border ${
                  isActive
                    ? tab === 'All'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : `${STATUS_CONFIG[tab as VocabularyStatus].bg} ${STATUS_CONFIG[tab as VocabularyStatus].color} border-current`
                    : 'bg-slate-800/50 border-slate-700/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab !== 'All' && STATUS_CONFIG[tab as VocabularyStatus].icon}
                {tab}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20' : 'bg-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredWords.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <BookMarked className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1">
              {activeTab === 'All' ? 'No words yet!' : `No ${activeTab} words`}
            </p>
            <p className="text-xs text-slate-500">
              {activeTab === 'All'
                ? 'Search for a word above and click "+ Add to My Vocabulary" to get started.'
                : `Words you ${activeTab === 'Learning' ? 'start learning' : activeTab === 'Reviewing' ? 'review 3+ times' : 'master (8+ reviews)'} will appear here.`}
            </p>
          </motion.div>
        )}

        {/* Word grid */}
        {filteredWords.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWords.map(word => (
              <div key={word.id}>
                <LibraryWordCard
                  word={word}
                  onReview={() => handleReview(word.id)}
                  onDelete={() => handleDeleteWord(word.id)}
                  onStatusChange={status => handleStatusChange(word, status)}
                  onClick={() => setSelectedWord(word)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Progress hint */}
        {stats.total > 0 && (
          <div className="mt-5 p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Auto-progression:</strong> Words automatically advance from{' '}
              <span className="text-amber-300">Learning</span> → <span className="text-sky-300">Reviewing</span> after 3 reviews,
              and to <span className="text-emerald-300">Mastered</span> after 8 reviews. You can also change status manually.
            </span>
          </div>
        )}
      </div>

      {/* ─── Word Detail Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedWord && (
          <WordDetailModal
            word={selectedWord}
            onClose={() => setSelectedWord(null)}
            onReview={() => { handleReview(selectedWord.id); setSelectedWord(null); }}
            onDelete={() => { handleDeleteWord(selectedWord.id); setSelectedWord(null); }}
            onStatusChange={status => handleStatusChange(selectedWord, status)}
          />
        )}
      </AnimatePresence>

      {/* ─── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');

        .font-devanagari {
          font-family: 'Noto Sans Devanagari', 'Mangal', 'Kokila', sans-serif;
        }

        .vocab-search-input {
          width: 100%;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          padding: 10px 38px 10px 38px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .vocab-search-input:focus {
          border-color: rgba(99, 102, 241, 0.7);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .vocab-search-input::placeholder { color: rgb(100, 116, 139); }

        .vocab-result-card {
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.8));
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .vocab-result-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #6366f1, #a855f7, #06b6d4);
        }

        .vocab-word-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .vocab-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgb(100, 116, 139);
        }

        .vocab-meaning-block {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 10px;
          padding: 12px;
        }

        .vocab-example-block {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 10px;
          padding: 12px;
        }

        .vocab-meta-chip {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex; flex-direction: column; gap: 2px;
        }

        .vocab-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: 10px;
          color: #a5b4fc;
          font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .vocab-btn-primary:hover {
          background: rgba(99, 102, 241, 0.3);
          color: white;
        }
        .vocab-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .vocab-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 10px;
          color: rgb(148, 163, 184);
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .vocab-btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }

        .vocab-btn-add {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 13px; font-weight: 800;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .vocab-btn-add:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }
        .vocab-btn-add:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .vocab-library-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 14px;
          padding: 14px;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .vocab-library-card:hover {
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .vocab-icon-btn {
          padding: 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          background: transparent;
          display: flex; align-items: center;
        }
        .vocab-icon-btn:hover { background: rgba(255,255,255,0.08); }

        .vocab-highlight {
          background: rgba(251, 191, 36, 0.25);
          color: rgb(253, 224, 71);
          border-radius: 3px;
          padding: 0 2px;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
