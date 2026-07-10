import React, { useState } from 'react';
import { X, Plus, Trash2, Code2, Tag, BookOpen, AlertCircle } from 'lucide-react';
import { Topic, CodeLanguage, CodeQuestion, CodeDifficulty } from '../../types';

interface AddCodingQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  onAddQuestion: (newQ: Omit<CodeQuestion, 'id'>) => Promise<void>;
}

const LANGUAGES: CodeLanguage[] = ['java', 'python', 'cpp', 'javascript', 'typescript', 'go', 'c', 'kotlin'];

const DEFAULT_STARTER_CODE: Record<CodeLanguage, string> = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: Read input, solve, and print output
    }
}`,
  python: `# TODO: Read input, solve, and print output
# example:
# line = input()
# print(line)
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // TODO: Read input, solve, and print output
    return 0;
}`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l));
rl.on('close', () => {
    // TODO: Solve and console.log output
});`,
  typescript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l));
rl.on('close', () => {
    // TODO: Solve and console.log output
});`,
  go: `package main

import "fmt"

func main() {
    // TODO: Read input, solve, and print output
}`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // TODO: Read input, solve, and print output
    return 0;
}`,
  kotlin: `fun main() {
    // TODO: Read input, solve, and print output
}`
};

export default function AddCodingQuestionModal({
  isOpen,
  onClose,
  topics,
  onAddQuestion
}: AddCodingQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<CodeDifficulty>('Medium');
  const [topicId, setTopicId] = useState('');
  const [description, setDescription] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [constraintsString, setConstraintsString] = useState('');
  
  // Custom states for Examples
  const [examples, setExamples] = useState<Array<{ input: string; output: string; explanation?: string }>>([
    { input: '', output: '', explanation: '' }
  ]);

  // Custom states for Test Cases
  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string }>>([
    { input: '', expectedOutput: '' }
  ]);

  // Starter code per language
  const [starterCode, setStarterCode] = useState<Record<CodeLanguage, string>>({ ...DEFAULT_STARTER_CODE });
  const [activeCodeTab, setActiveCodeTab] = useState<CodeLanguage>('python');

  if (!isOpen) return null;

  const handleAddExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  };

  const handleRemoveExample = (index: number) => {
    if (examples.length === 1) return;
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: 'input' | 'output' | 'explanation', value: string) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length === 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleStarterCodeChange = (lang: CodeLanguage, val: string) => {
    setStarterCode({
      ...starterCode,
      [lang]: val
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !topicId) {
      alert('Please fill out Title, Description and select a Linked Topic.');
      return;
    }

    const validExamples = examples.filter(ex => ex.input.trim() || ex.output.trim());
    const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());

    if (validTestCases.length === 0) {
      alert('At least one valid test case is required.');
      return;
    }

    const tags = tagsString
      ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const constraints = constraintsString
      ? constraintsString.split('\n').map(c => c.trim()).filter(Boolean)
      : [];

    const newQuestion: Omit<CodeQuestion, 'id'> = {
      title: title.trim(),
      difficulty,
      description: description.trim(),
      examples: validExamples,
      testCases: validTestCases,
      constraints,
      tags,
      starterCode,
      topicId,
      isCustom: true,
    };

    await onAddQuestion(newQuestion);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDifficulty('Medium');
    setTopicId('');
    setDescription('');
    setTagsString('');
    setConstraintsString('');
    setExamples([{ input: '', output: '', explanation: '' }]);
    setTestCases([{ input: '', expectedOutput: '' }]);
    setStarterCode({ ...DEFAULT_STARTER_CODE });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Create Custom Coding Problem</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Metadata Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Problem Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Find Peak Element"
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as CodeDifficulty)}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Linked Study Topic</label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                required
              >
                <option value="">-- Choose Topic --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={e => setTagsString(e.target.value)}
                placeholder="Array, Binary Search, Divide and Conquer"
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Constraints (one per line)
              </label>
              <textarea
                value={constraintsString}
                onChange={e => setConstraintsString(e.target.value)}
                placeholder="1 <= nums.length <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
                rows={2}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition font-mono text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Problem Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the problem, input format, and output format. You can use markdown code backticks."
              rows={4}
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 transition"
              required
            />
          </div>

          {/* Tabbed Starter Code Input */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Code Editor</span>
              {/* Language selectors */}
              <div className="flex flex-wrap gap-1.5 justify-end">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveCodeTab(lang)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                      activeCodeTab === lang
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-[#1e1e1e]">
              <textarea
                value={starterCode[activeCodeTab]}
                onChange={e => handleStarterCodeChange(activeCodeTab, e.target.value)}
                rows={8}
                className="w-full bg-transparent text-white font-mono text-xs focus:outline-none resize-y"
                style={{ tabSize: 4 }}
              />
            </div>
          </div>

          {/* Examples Block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Examples (Visible to User)</label>
              <button
                type="button"
                onClick={handleAddExample}
                className="flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Example
              </button>
            </div>
            <div className="space-y-3">
              {examples.map((ex, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 mt-2 bg-slate-800 px-2 py-0.5 rounded">#{index + 1}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={ex.input}
                        onChange={e => handleExampleChange(index, 'input', e.target.value)}
                        placeholder="Input: nums = [1,2,3,1], target = 2"
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={ex.output}
                        onChange={e => handleExampleChange(index, 'output', e.target.value)}
                        placeholder="Output: 2"
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={ex.explanation || ''}
                        onChange={e => handleExampleChange(index, 'explanation', e.target.value)}
                        placeholder="Explanation (optional)"
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExample(index)}
                    disabled={examples.length === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-850 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test Cases Block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Cases (Evaluated on Run/Submit)</label>
                <div className="group relative">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-950 text-[10px] text-slate-400 rounded-lg border border-slate-800 z-50">
                    Input must match stdin formatting. First test case is used for single-run mode.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Test Case
              </button>
            </div>
            <div className="space-y-3">
              {testCases.map((tc, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 mt-2 bg-slate-800 px-2 py-0.5 rounded">#{index + 1}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <textarea
                        value={tc.input}
                        onChange={e => handleTestCaseChange(index, 'input', e.target.value)}
                        placeholder="Stdin input (e.g. 4\n1 2 3 1\n2)"
                        rows={2}
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition font-mono"
                      />
                    </div>
                    <div>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                        placeholder="Expected stdout (e.g. 2)"
                        rows={2}
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 transition font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(index)}
                    disabled={testCases.length === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-850 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-violet-850/30 transition cursor-pointer"
          >
            Save Problem
          </button>
        </div>
      </div>
    </div>
  );
}
