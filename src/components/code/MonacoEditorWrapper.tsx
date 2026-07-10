import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { CodeLanguage, EditorTheme } from '../../types';
import { LANGUAGE_CONFIG } from '../../data/codeQuestions';
import { Loader } from 'lucide-react';

interface MonacoEditorWrapperProps {
  language: CodeLanguage;
  theme: EditorTheme;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  fontSize?: number;
  onEditorMount?: (editor: any) => void;
}

// Custom Dracula theme definition
const DRACULA_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
    { token: 'function', foreground: '50fa7b' },
    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'constant', foreground: 'bd93f9' },
    { token: 'operator', foreground: 'ff79c6' },
    { token: 'delimiter', foreground: 'f8f8f2' },
    { token: 'annotation', foreground: '50fa7b' },
  ],
  colors: {
    'editor.background': '#1e1f29',
    'editor.foreground': '#f8f8f2',
    'editorCursor.foreground': '#f8f8f0',
    'editor.lineHighlightBackground': '#44475a50',
    'editorLineNumber.foreground': '#6272a4',
    'editorLineNumber.activeForeground': '#f8f8f2',
    'editor.selectionBackground': '#44475a',
    'editor.inactiveSelectionBackground': '#44475a80',
    'editorIndentGuide.background': '#ffffff15',
    'editorBracketMatch.background': '#44475a',
    'editorBracketMatch.border': '#ff79c6',
    'scrollbarSlider.background': '#44475a80',
    'scrollbarSlider.hoverBackground': '#44475aa0',
    'scrollbarSlider.activeBackground': '#6272a4',
  },
};

export default function MonacoEditorWrapper({
  language,
  theme,
  value,
  onChange,
  onRun,
  fontSize = 14,
  onEditorMount,
}: MonacoEditorWrapperProps) {
  const config = LANGUAGE_CONFIG[language];
  const monacoTheme = theme === 'dracula' ? 'dracula-custom' : theme;

  const handleMount: OnMount = (editor, monaco) => {
    onEditorMount?.(editor);
    monaco.editor.defineTheme('dracula-custom', DRACULA_THEME);
    if (theme === 'dracula') {
      monaco.editor.setTheme('dracula-custom');
    }

    // Ctrl+Enter → Run
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => { onRun?.(); },
    });

    // Ctrl+S → prevent default (auto-saved)
    editor.addAction({
      id: 'save-code',
      label: 'Save Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => { /* auto-saved via localStorage */ },
    });

    editor.focus();
  };

  return (
    <Editor
      height="100%"
      language={config?.monacoId || 'plaintext'}
      theme={monacoTheme}
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={handleMount}
      loading={
        <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#1e1e1e]">
          <Loader className="w-6 h-6 animate-spin text-violet-400" />
          <p className="text-[11px] text-slate-500 font-mono">Loading editor...</p>
        </div>
      }
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        tabSize: 4,
        wordWrap: 'on',
        contextmenu: true,
        quickSuggestions: true,
        parameterHints: { enabled: true },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          verticalSliderSize: 6,
        },
      }}
    />
  );
}
