import { useEffect } from 'react';

interface KeyboardShortcutsCallbacks {
  onRun: () => void;
  onSubmit: () => void;
  onSave: () => void;
  onNavigateTab: (tabIndex: number) => void;
  onAIAction: (actionId: 'hint' | 'explain' | 'debug' | 'optimize') => void;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenCheatSheet: () => void;
}

export function useKeyboardShortcuts(callbacks: KeyboardShortcutsCallbacks) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when focusing standard input/textarea (but allow key intercept inside Monaco)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Let's specifically allow Monaco editor elements (which contain monaco-editor class)
      const isMonaco = target.closest('.monaco-editor') !== null;
      if (isInput && !isMonaco) {
        return;
      }

      const ctrlCmd = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // ── Ctrl + Enter → Run Code ──────────────────────────────────────────
      if (ctrlCmd && !shift && e.key === 'Enter') {
        e.preventDefault();
        callbacks.onRun();
        return;
      }

      // ── Ctrl + Shift + Enter → Submit Solution ───────────────────────────
      if (ctrlCmd && shift && e.key === 'Enter') {
        e.preventDefault();
        callbacks.onSubmit();
        return;
      }

      // ── Ctrl + S → Save Draft ─────────────────────────────────────────────
      if (ctrlCmd && !shift && e.key === 's') {
        e.preventDefault();
        callbacks.onSave();
        return;
      }

      // ── Ctrl + Shift + P → Command Palette ──────────────────────────────
      if (ctrlCmd && shift && e.key === 'P') {
        e.preventDefault();
        callbacks.onOpenCommandPalette();
        return;
      }

      // ── F1 → Open Shortcut Cheat Sheet ───────────────────────────────────
      if (e.key === 'F1') {
        e.preventDefault();
        callbacks.onOpenCheatSheet();
        return;
      }

      // ── Ctrl + Shift + F → Focus Editor ──────────────────────────────────
      if (ctrlCmd && shift && e.key === 'F') {
        e.preventDefault();
        const monacoContainer = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
        monacoContainer?.focus();
        return;
      }

      // ── Alt + 1..6 → Navigation Tabs ─────────────────────────────────────
      if (alt && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        callbacks.onNavigateTab(parseInt(e.key));
        return;
      }

      // ── AI Actions ────────────────────────────────────────────────────────
      if (ctrlCmd) {
        if (e.key === 'i') {
          e.preventDefault();
          callbacks.onAIAction('hint');
        } else if (shift && e.key === 'I') {
          e.preventDefault();
          callbacks.onAIAction('explain');
        } else if (e.key === 'b') {
          e.preventDefault();
          callbacks.onAIAction('debug');
        } else if (e.key === 'k') {
          e.preventDefault();
          callbacks.onAIAction('optimize');
        }
      }

      // ── Ctrl + Alt + T → Toggle Theme ──────────────────────────────────
      if (ctrlCmd && alt && e.key === 't') {
        e.preventDefault();
        callbacks.onToggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}
