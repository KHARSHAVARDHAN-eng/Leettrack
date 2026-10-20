'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Plus, Tag } from 'lucide-react';
import { Difficulty, Problem } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  getTodayDateString,
  canonicalProblemUrl,
  extractProblemSlug,
  extractProblemNumber,
  getProblemTopics,
} from '@/lib/storage';

const POPULAR_TOPICS = [
  'Array',
  'Hash Map',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Dynamic Programming',
  'Tree',
  'Binary Tree',
  'Graph',
  'DFS',
  'BFS',
  'Union Find',
  'Linked List',
  'Stack',
  'Heap',
  'Greedy',
  'String',
  'Math',
  'Bit Manipulation',
  'Backtracking',
  'Trie',
  'Matrix',
];

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    url: string;
    difficulty: Difficulty;
    solvedAt: string;
    frontendId?: number;
    category?: string;
    topics?: string[];
    tags?: string[];
    initialRevisionDate?: string;
  }) => { success: boolean; error?: string };
  initialProblem?: Problem | null;
  mode?: 'add' | 'edit';
}

function ProblemModalContent({
  onClose,
  onSubmit,
  initialProblem,
  mode,
}: {
  onClose: () => void;
  onSubmit: ProblemModalProps['onSubmit'];
  initialProblem?: Problem | null;
  mode: 'add' | 'edit';
}) {
  const [title, setTitle] = useState(initialProblem?.title || '');
  const [frontendId, setFrontendId] = useState<string>(
    initialProblem?.frontendId !== undefined ? String(initialProblem.frontendId) : ''
  );
  const [url, setUrl] = useState(
    initialProblem?.url ||
      (initialProblem?.slug ? canonicalProblemUrl(initialProblem.slug) : '')
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initialProblem?.difficulty || 'Medium');
  const [solvedAt, setSolvedAt] = useState(initialProblem?.solvedAt || getTodayDateString());
  const [topics, setTopics] = useState<string[]>(() => {
    if (initialProblem) {
      return getProblemTopics(initialProblem);
    }
    return ['Array', 'Hash Map'];
  });
  const [newTopicInput, setNewTopicInput] = useState('');
  const [scheduleRevision, setScheduleRevision] = useState(mode === 'add');
  const [revisionDate, setRevisionDate] = useState(() => {
    if (typeof window === 'undefined') return '2026-10-18';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${tomorrow.getFullYear()}-${m}-${d}`;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);

    // Auto-detect number from title if user hasn't explicitly entered a frontendId
    const detectedNumber = extractProblemNumber(val);
    if (detectedNumber && (!frontendId || frontendId.trim() === '')) {
      setFrontendId(String(detectedNumber));
    }

    if (mode === 'add' && !url) {
      const slug = extractProblemSlug(val);
      if (slug) {
        setUrl(`https://leetcode.com/problems/${slug}/`);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (!frontendId || frontendId.trim() === '') {
      const detectedNumber = extractProblemNumber(val);
      if (detectedNumber) {
        setFrontendId(String(detectedNumber));
      }
    }
  };

  const handleAddTopic = () => {
    const trimmed = newTopicInput.trim();
    if (!trimmed) return;
    if (!topics.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTopics((prev) => [...prev, trimmed]);
    }
    setNewTopicInput('');
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics((prev) => prev.filter((t) => t !== topicToRemove));
  };

  const handleTogglePopularTopic = (topic: string) => {
    if (topics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
      setTopics((prev) => prev.filter((t) => t.toLowerCase() !== topic.toLowerCase()));
    } else {
      setTopics((prev) => [...prev, topic]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    const cleanUrl = url.trim();

    if (!cleanTitle) {
      setErrorMessage('Problem title is required.');
      return;
    }

    if (!cleanUrl) {
      setErrorMessage('LeetCode problem URL is required.');
      return;
    }

    const numericId = frontendId.trim() ? parseInt(frontendId.trim(), 10) : undefined;
    const validNumericId = numericId && !isNaN(numericId) && numericId > 0 ? numericId : undefined;

    const finalTopics = topics.length > 0 ? topics : ['General'];

    const result = onSubmit({
      title: cleanTitle,
      url: cleanUrl,
      frontendId: validNumericId,
      difficulty,
      solvedAt,
      category: finalTopics[0] || 'Algorithms',
      topics: finalTopics,
      tags: finalTopics,
      initialRevisionDate: mode === 'add' && scheduleRevision ? revisionDate : undefined,
    });

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Failed to save problem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-lg bg-[#141419] border border-[#272733] shadow-2xl p-5 my-8"
        role="dialog"
        aria-labelledby="problem-modal-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#21212b]">
          <h2 id="problem-modal-title" className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <span>{mode === 'edit' ? 'Edit Solved Problem' : 'Log Solved Problem'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3.5 p-2.5 rounded bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Problem # and Title Row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <label htmlFor="problem-id" className="block text-zinc-300 font-medium mb-1">
                Number #
              </label>
              <input
                id="problem-id"
                type="number"
                min="1"
                placeholder="e.g. 1"
                value={frontendId}
                onChange={(e) => setFrontendId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 placeholder:text-zinc-600 font-mono text-xs focus-visible:border-violet-500/60 focus-visible:outline-none"
              />
            </div>

            <div className="col-span-9">
              <label htmlFor="problem-title" className="block text-zinc-300 font-medium mb-1">
                Problem Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="problem-title"
                type="text"
                required
                placeholder="e.g. Two Sum"
                value={title}
                onChange={handleTitleChange}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="problem-url" className="block text-zinc-300 font-medium mb-1">
              LeetCode Problem URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="problem-url"
              type="url"
              required
              placeholder="https://leetcode.com/problems/two-sum/"
              value={url}
              onChange={handleUrlChange}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 placeholder:text-zinc-600 font-mono text-[11px] focus-visible:border-violet-500/60 focus-visible:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="difficulty-select" className="block text-zinc-300 font-medium mb-1">
                Difficulty <span className="text-rose-400">*</span>
              </label>
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 focus-visible:border-violet-500/60 focus-visible:outline-none cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="solved-date" className="block text-zinc-300 font-medium mb-1">
                Original Solve Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="solved-date"
                type="date"
                required
                value={solvedAt}
                onChange={(e) => setSolvedAt(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 focus-visible:border-violet-500/60 focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Topic Labels Section */}
          <div className="space-y-2 pt-1 border-t border-[#21212b]">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Tag size={12} className="text-violet-400" />
                <span>Topic Labels</span>
              </label>
              <span className="text-[10px] text-zinc-500">
                {topics.length} topic{topics.length === 1 ? '' : 's'} assigned
              </span>
            </div>

            {/* Selected Topic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-7 p-1.5 rounded-md bg-[#171720] border border-[#262633]">
              {topics.length === 0 ? (
                <span className="text-[11px] text-zinc-500 italic pl-1">
                  No topics assigned yet. Add topic labels below.
                </span>
              ) : (
                topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#20202d] text-zinc-200 border border-[#2f2f42]"
                  >
                    <span>{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
                      title={`Remove topic "${topic}"`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Topic Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a topic label (e.g. Hash Map, Two Pointers)..."
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                className="flex-1 px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 placeholder:text-zinc-600 text-xs focus-visible:border-violet-500/60 focus-visible:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="xs"
                icon={<Plus size={12} />}
                onClick={handleAddTopic}
              >
                Add topic
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">
                Popular topics:
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {POPULAR_TOPICS.map((suggested) => {
                  const isSelected = topics.some(
                    (t) => t.toLowerCase() === suggested.toLowerCase()
                  );
                  return (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleTogglePopularTopic(suggested)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-medium'
                          : 'bg-[#181822] text-zinc-400 border-[#272736] hover:text-zinc-200 hover:bg-[#1f1f2c]'
                      }`}
                    >
                      {isSelected ? `✓ ${suggested}` : `+ ${suggested}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {mode === 'add' && (
            <div className="pt-2 border-t border-[#21212b]">
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="schedule-revision-check"
                  type="checkbox"
                  checked={scheduleRevision}
                  onChange={(e) => setScheduleRevision(e.target.checked)}
                  className="rounded border-[#2c2c38] bg-[#191921] text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="schedule-revision-check" className="text-zinc-300 font-medium cursor-pointer">
                  Schedule first revision review
                </label>
              </div>

              {scheduleRevision && (
                <div className="pl-5">
                  <label htmlFor="first-review-date" className="block text-zinc-400 text-[11px] mb-1">
                    Review Date
                  </label>
                  <input
                    id="first-review-date"
                    type="date"
                    value={revisionDate}
                    onChange={(e) => setRevisionDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 text-xs focus-visible:border-violet-500/60 focus-visible:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#21212b]">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {mode === 'edit' ? 'Save changes' : 'Save problem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const ProblemModal: React.FC<ProblemModalProps> = (props) => {
  if (!props.isOpen) return null;
  const key = props.initialProblem ? `edit-${props.initialProblem.id}` : 'add-new';
  return <ProblemModalContent key={key} {...props} mode={props.mode || 'add'} />;
};

export const AddProblemModal = ProblemModal;

