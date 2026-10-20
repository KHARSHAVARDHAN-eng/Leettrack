'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import dynamic from 'next/dynamic';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Problem, Difficulty } from '@/types';
import { getProblemTopics } from '@/lib/storage';

const ProblemModal = dynamic(
  () => import('@/components/dashboard/ProblemModal').then((m) => m.ProblemModal),
  { ssr: false }
);
const ScheduleRevisionModal = dynamic(
  () => import('@/components/calendar/ScheduleRevisionModal').then((m) => m.ScheduleRevisionModal),
  { ssr: false }
);
const ProblemDetailsModal = dynamic(
  () => import('@/components/problems/ProblemDetailsModal').then((m) => m.ProblemDetailsModal),
  { ssr: false }
);
import {
  Search,
  Plus,
  ExternalLink,
  Code2,
  Edit2,
  Trash2,
  Calendar,
  RefreshCw,
  Check,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Tag,
  Clock,
  History,
} from 'lucide-react';

type SortOption =
  | 'number-asc'
  | 'number-desc'
  | 'title-asc'
  | 'title-desc'
  | 'date-desc'
  | 'date-asc'
  | 'difficulty';

function cleanProblemTitle(title: string, frontendId?: number): string {
  if (frontendId === undefined) return title;
  const firstChar = title.charCodeAt(0);
  // Fast path: if title does not start with digits or prefix, return immediately without regex
  const isDigitOrPrefix = (firstChar >= 48 && firstChar <= 57) || firstChar === 35 || firstChar === 91;
  if (!isDigitOrPrefix) {
    return title;
  }
  return title.replace(new RegExp(`^(?:#|\\[)?${frontendId}(?:\\]|\\.|\\s|-)+`, 'i'), '').trim() || title;
}

function ProblemsContent() {
  const searchParams = useSearchParams();
  const initialTopicParam = searchParams?.get('topic') || 'All';

  const {
    problems,
    revisions,
    addProblem,
    updateProblem,
    deleteProblem,
    scheduleRevision,
    completeRevision,
    rescheduleRevision,
    cancelRevision,
    leetCodeConnection,
    isSyncingLeetCode,
    syncLeetCodeAccount,
  } = useWorkspace();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicParam);
  const [sortBy, setSortBy] = useState<SortOption>('number-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Modals state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemModalMode, setProblemModalMode] = useState<'add' | 'edit'>('add');
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleProblemId, setScheduleProblemId] = useState<string | undefined>();

  const [selectedProblemForHistory, setSelectedProblemForHistory] = useState<Problem | null>(null);

  // Extract all unique topics dynamically from current problems
  const allUniqueTopics = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      const pTopics = getProblemTopics(p);
      pTopics.forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [problems]);

  // Filtered and numerically sorted problems
  const processedProblems = useMemo(() => {
    // 1. Filter
    const filtered = problems.filter((prob) => {
      const probTopics = getProblemTopics(prob);

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        prob.title.toLowerCase().includes(query) ||
        (prob.frontendId !== undefined && String(prob.frontendId).includes(query)) ||
        prob.category.toLowerCase().includes(query) ||
        probTopics.some((t) => t.toLowerCase().includes(query));

      // Difficulty match
      const matchesDiff =
        selectedDifficulty === 'All' || prob.difficulty === selectedDifficulty;

      // Topic match
      const matchesTopic =
        selectedTopic === 'All' ||
        probTopics.some((t) => t.toLowerCase() === selectedTopic.toLowerCase());

      return matchesSearch && matchesDiff && matchesTopic;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'number-asc') {
        // Strict numerical sort: #1, #2, #3, ..., #10
        if (a.frontendId !== undefined && b.frontendId !== undefined) {
          return a.frontendId - b.frontendId;
        }
        if (a.frontendId !== undefined && b.frontendId === undefined) return -1;
        if (a.frontendId === undefined && b.frontendId !== undefined) return 1;
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'number-desc') {
        if (a.frontendId !== undefined && b.frontendId !== undefined) {
          return b.frontendId - a.frontendId;
        }
        if (a.frontendId !== undefined && b.frontendId === undefined) return -1;
        if (a.frontendId === undefined && b.frontendId !== undefined) return 1;
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }

      if (sortBy === 'date-desc') {
        return (b.solvedAt || '').localeCompare(a.solvedAt || '');
      }

      if (sortBy === 'date-asc') {
        return (a.solvedAt || '').localeCompare(b.solvedAt || '');
      }

      if (sortBy === 'difficulty') {
        const order: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
        return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
      }

      return 0;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedTopic, sortBy]);

  // Reset to page 1 whenever search, topic, difficulty, or sort changes
  const [prevFilterKey, setPrevFilterKey] = useState('');
  const currentFilterKey = `${searchQuery}|${selectedTopic}|${selectedDifficulty}|${sortBy}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(processedProblems.length / pageSize) || 1;
  const paginatedProblems = useMemo(() => {
    if (processedProblems.length <= pageSize) return processedProblems;
    const start = (currentPage - 1) * pageSize;
    return processedProblems.slice(start, start + pageSize);
  }, [processedProblems, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingProblem(null);
    setProblemModalMode('add');
    setIsProblemModalOpen(true);
  };

  const handleOpenEdit = (prob: Problem) => {
    setEditingProblem(prob);
    setProblemModalMode('edit');
    setIsProblemModalOpen(true);
  };

  const handleOpenSchedule = (probId: string) => {
    setScheduleProblemId(probId);
    setIsScheduleModalOpen(true);
  };

  const handleProblemSubmit = (data: {
    title: string;
    url: string;
    difficulty: Difficulty;
    solvedAt: string;
    frontendId?: number;
    category?: string;
    topics?: string[];
    tags?: string[];
    initialRevisionDate?: string;
  }) => {
    if (problemModalMode === 'edit' && editingProblem) {
      return updateProblem(editingProblem.id, {
        title: data.title,
        url: data.url,
        frontendId: data.frontendId,
        difficulty: data.difficulty,
        solvedAt: data.solvedAt,
        category: data.category,
        topics: data.topics,
        tags: data.tags,
      });
    } else {
      return addProblem(data);
    }
  };

  const handleQuickSync = async () => {
    if (!leetCodeConnection?.username) return;
    const res = await syncLeetCodeAccount(leetCodeConnection.username);
    if (res.success && res.summary) {
      setSyncFeedback(
        `Synced with @${leetCodeConnection.username}: +${res.summary.importedCount} new, ${res.summary.alreadyExistingCount} already present.`
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Click column header to cycle sort
  const handleHeaderSort = (column: 'number' | 'difficulty' | 'date') => {
    if (column === 'number') {
      setSortBy((prev) => (prev === 'number-asc' ? 'number-desc' : 'number-asc'));
    } else if (column === 'difficulty') {
      setSortBy((prev) => (prev === 'difficulty' ? 'number-asc' : 'difficulty'));
    } else if (column === 'date') {
      setSortBy((prev) => (prev === 'date-desc' ? 'date-asc' : 'date-desc'));
    }
  };

  return (
    <AppLayout title="Problems" onQuickAdd={handleOpenAdd}>
      <div className="space-y-3.5">
        {/* Page Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <span>Problems</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#1e1e27] text-zinc-400 border border-[#2b2b38]">
                {problems.length} solved
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              LeetCode-style archive ordered by problem number, difficulty, and topic taxonomy.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {leetCodeConnection?.isConnected ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={isSyncingLeetCode}
                icon={
                  <RefreshCw
                    size={13}
                    className={isSyncingLeetCode ? 'animate-spin text-violet-400' : ''}
                  />
                }
                onClick={handleQuickSync}
              >
                {isSyncingLeetCode ? 'Syncing...' : 'Sync LeetCode'}
              </Button>
            ) : (
              <Link href="/settings">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={
                    <svg className="w-3.5 h-3.5 fill-[#ffa116]" viewBox="0 0 24 24">
                      <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.074 5.074 0 0 0-3.69-1.428c-1.455 0-2.846.57-3.87 1.593L3.58 12.06c-1.024 1.024-1.58 2.401-1.58 3.844 0 1.442.556 2.82 1.58 3.843l4.332 4.364c1.024 1.024 2.415 1.603 3.87 1.603s2.846-.579 3.87-1.603l2.609-2.636c.514-.514.496-1.365-.039-1.9-.535-.536-1.386-.554-1.9-.039z" />
                    </svg>
                  }
                >
                  Connect LeetCode
                </Button>
              </Link>
            )}

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              Add problem
            </Button>
          </div>
        </div>

        {/* Sync Toast */}
        {syncFeedback && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* LeetCode-Inspired Filter and Search Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2.5 rounded-md bg-[#141419] border border-[#24242e]">
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181822] border border-[#292937] flex-1 max-w-md">
            <Search size={14} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search questions by title, number, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Difficulty and Topic Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Difficulty Filter Pills (LeetCode Colors) */}
            <div className="flex items-center bg-[#191922] p-0.5 rounded-md border border-[#282836]">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => {
                const isSelected = selectedDifficulty === diff;
                let colorClass = 'text-zinc-400 hover:text-zinc-200';
                if (isSelected) {
                  if (diff === 'Easy') colorClass = 'bg-[#00b8a3]/20 text-[#00b8a3] font-semibold border border-[#00b8a3]/40';
                  else if (diff === 'Medium') colorClass = 'bg-[#ffc01e]/20 text-[#ffc01e] font-semibold border border-[#ffc01e]/40';
                  else if (diff === 'Hard') colorClass = 'bg-[#ff375f]/20 text-[#ff375f] font-semibold border border-[#ff375f]/40';
                  else colorClass = 'bg-[#272736] text-zinc-100 font-semibold border border-[#353548]';
                }

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${colorClass}`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>

            {/* Topic Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-[#191922] border border-[#282836] text-zinc-300 text-xs focus:outline-none cursor-pointer"
                aria-label="Filter by topic"
              >
                <option value="All">All Topics ({allUniqueTopics.length})</option>
                {allUniqueTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Control Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 rounded-md bg-[#191922] border border-[#282836] text-zinc-300 text-xs focus:outline-none cursor-pointer font-mono"
                aria-label="Sort problems"
              >
                <option value="number-asc">Sort: # Asc (1, 2, 3...)</option>
                <option value="number-desc">Sort: # Desc</option>
                <option value="title-asc">Sort: Title (A-Z)</option>
                <option value="title-desc">Sort: Title (Z-A)</option>
                <option value="date-desc">Sort: Date Solved (Newest)</option>
                <option value="date-asc">Sort: Date Solved (Oldest)</option>
                <option value="difficulty">Sort: Difficulty (Easy → Hard)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Row (if topic or search is active) */}
        {(selectedTopic !== 'All' || selectedDifficulty !== 'All' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap text-xs px-1">
            <span className="text-zinc-500 text-[11px] font-mono">Active filters:</span>
            {selectedTopic !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium">
                <Tag size={11} />
                <span>Topic: {selectedTopic}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTopic('All')}
                  className="hover:text-rose-400 ml-0.5 cursor-pointer"
                  title="Clear topic filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            {selectedDifficulty !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1e1e28] border border-[#2b2b3a] text-zinc-300 text-xs">
                <span>Difficulty: {selectedDifficulty}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('All')}
                  className="hover:text-rose-400 ml-0.5 cursor-pointer"
                  title="Clear difficulty filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1e1e28] border border-[#2b2b3a] text-zinc-300 text-xs">
                <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-400 ml-0.5 cursor-pointer"
                  title="Clear query"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedTopic('All');
                setSelectedDifficulty('All');
                setSearchQuery('');
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 underline ml-1 cursor-pointer"
            >
              Reset all
            </button>

            <span className="ml-auto text-[11px] text-zinc-500 font-mono">
              Showing {processedProblems.length} of {problems.length} problems
            </span>
          </div>
        )}

        {/* LeetCode-Inspired Problem Table */}
        <div className="rounded-md border border-[#22222a] bg-[#121215] overflow-hidden">
          {processedProblems.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Code2}
                title={
                  problems.length === 0
                    ? 'No problems recorded yet'
                    : 'No matching problems found'
                }
                description={
                  problems.length === 0
                    ? 'Start tracking your solved LeetCode problems or import your recent history to build your workspace.'
                    : 'Try clearing your search query or selecting a different difficulty or topic.'
                }
                actionLabel={
                  problems.length === 0 ? 'Log your first problem' : 'Clear all filters'
                }
                onAction={() => {
                  if (problems.length === 0) {
                    handleOpenAdd();
                  } else {
                    setSearchQuery('');
                    setSelectedDifficulty('All');
                    setSelectedTopic('All');
                  }
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#22222a] text-zinc-400 text-[11px] uppercase tracking-wider bg-[#16161c]">
                    {/* Status Column (LeetCode Solved Checkmark) */}
                    <th className="py-2.5 px-3 text-center font-medium w-12" title="Solved status">
                      Status
                    </th>

                    {/* Title & Number Column */}
                    <th
                      className="py-2.5 px-4 font-medium cursor-pointer select-none group"
                      onClick={() => handleHeaderSort('number')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="group-hover:text-zinc-200">Title</span>
                        {sortBy === 'number-asc' ? (
                          <ArrowUp size={12} className="text-violet-400" />
                        ) : sortBy === 'number-desc' ? (
                          <ArrowDown size={12} className="text-violet-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-zinc-600 group-hover:text-zinc-400" />
                        )}
                      </div>
                    </th>

                    {/* Difficulty Column */}
                    <th
                      className="py-2.5 px-4 font-medium w-28 cursor-pointer select-none group"
                      onClick={() => handleHeaderSort('difficulty')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="group-hover:text-zinc-200">Difficulty</span>
                        {sortBy === 'difficulty' && (
                          <ArrowUp size={12} className="text-violet-400" />
                        )}
                      </div>
                    </th>

                    {/* Topics Column */}
                    <th className="py-2.5 px-4 font-medium hidden md:table-cell">
                      Topic Labels
                    </th>

                    {/* Revision Queue Column */}
                    <th className="py-2.5 px-3 font-medium text-center w-24 hidden lg:table-cell">
                      Reviews
                    </th>

                    {/* Solved Date Column */}
                    <th
                      className="py-2.5 px-4 font-medium text-right w-28 cursor-pointer select-none group hidden sm:table-cell"
                      onClick={() => handleHeaderSort('date')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="group-hover:text-zinc-200">Solved</span>
                        {sortBy === 'date-desc' ? (
                          <ArrowDown size={12} className="text-violet-400" />
                        ) : sortBy === 'date-asc' ? (
                          <ArrowUp size={12} className="text-violet-400" />
                        ) : null}
                      </div>
                    </th>

                    {/* Actions Column */}
                    <th className="py-2.5 px-4 font-medium text-right w-24">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1e1e26]">
                  {paginatedProblems.map((prob, idx) => {
                    const probTopics = getProblemTopics(prob);
                    const canonicalUrl = prob.url || `https://leetcode.com/problems/${prob.slug}/`;

                    // Alternating subtle zebra striping matching LeetCode's compact style
                    const rowBgClass =
                      idx % 2 === 0
                        ? 'bg-[#141418]'
                        : 'bg-[#17171e]';

                    // LeetCode Difficulty Styling
                    let difficultyColor = 'text-zinc-300';
                    if (prob.difficulty === 'Easy') difficultyColor = 'text-[#00b8a3] font-medium';
                    else if (prob.difficulty === 'Medium') difficultyColor = 'text-[#ffc01e] font-medium';
                    else if (prob.difficulty === 'Hard') difficultyColor = 'text-[#ff375f] font-medium';

                    const cleanDisplayTitle = cleanProblemTitle(prob.title, prob.frontendId);

                    return (
                      <tr
                        key={prob.id}
                        className={`${rowBgClass} hover:bg-[#1e1e27] transition-colors group cursor-default`}
                      >
                        {/* Solved Status Indicator */}
                        <td className="py-2 px-3 text-center align-middle">
                          <span
                            className="inline-flex items-center justify-center text-[#00b8a3]"
                            title="Solved"
                          >
                            <CheckCircle2 size={16} strokeWidth={2.2} />
                          </span>
                        </td>

                        {/* Problem Number & Title (LeetCode formatting) */}
                        <td className="py-2 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedProblemForHistory(prob)}
                              className="font-medium text-zinc-100 hover:text-violet-300 transition-colors inline-flex items-center gap-1.5 text-left cursor-pointer"
                              title={`View revision history timeline for ${prob.title}`}
                            >
                              <span className="font-mono text-zinc-300">
                                {prob.frontendId !== undefined ? `${prob.frontendId}.` : '•'}
                              </span>
                              <span className="truncate max-w-[220px] sm:max-w-[340px] lg:max-w-[420px]">
                                {cleanDisplayTitle}
                              </span>
                            </button>
                            <a
                              href={canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              title={`Open ${prob.title} on LeetCode`}
                            >
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>

                        {/* Difficulty */}
                        <td className="py-2 px-4 align-middle">
                          <span className={`text-xs ${difficultyColor}`}>
                            {prob.difficulty}
                          </span>
                        </td>

                        {/* Topic Labels (Click to filter or explore) */}
                        <td className="py-2 px-4 align-middle hidden md:table-cell">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {probTopics.slice(0, 3).map((topic) => (
                              <button
                                key={topic}
                                type="button"
                                onClick={() => setSelectedTopic(topic)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1f2a] hover:bg-[#282838] text-zinc-300 hover:text-zinc-100 border border-[#2b2b3b] transition-colors cursor-pointer"
                                title={`Filter by ${topic}`}
                              >
                                {topic}
                              </button>
                            ))}
                            {probTopics.length > 3 && (
                              <span
                                className="text-[10px] text-zinc-500 font-mono"
                                title={probTopics.slice(3).join(', ')}
                              >
                                +{probTopics.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Revision Counter / Spaced Repetition status */}
                        <td className="py-2 px-3 text-center align-middle font-mono text-zinc-400 tabular-nums hidden lg:table-cell">
                          <button
                            type="button"
                            onClick={() => setSelectedProblemForHistory(prob)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[11px] bg-[#1a1a24] hover:bg-[#222230] border border-[#262634] hover:border-violet-500/40 text-zinc-300 transition-colors cursor-pointer"
                            title={`View history: ${prob.revisionCount} completed review(s)`}
                          >
                            <Clock size={10} className="text-zinc-500" />
                            <span>{prob.revisionCount} rev</span>
                          </button>
                        </td>

                        {/* Solved Date */}
                        <td className="py-2 px-4 text-right align-middle font-mono text-zinc-400 text-[11px] tabular-nums hidden sm:table-cell">
                          {prob.solvedAt}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2 px-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedProblemForHistory(prob)}
                              className="p-1 text-zinc-500 hover:text-violet-400 hover:bg-[#22222e] rounded transition-colors cursor-pointer"
                              title="View revision history timeline"
                              aria-label={`View history for ${prob.title}`}
                            >
                              <History size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSchedule(prob.id)}
                              className="p-1 text-zinc-500 hover:text-violet-400 hover:bg-[#22222e] rounded transition-colors cursor-pointer"
                              title="Schedule revision review"
                              aria-label={`Schedule revision for ${prob.title}`}
                            >
                              <Calendar size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prob)}
                              className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-[#22222e] rounded transition-colors cursor-pointer"
                              title="Edit problem & topics"
                              aria-label={`Edit ${prob.title}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProblem(prob.id)}
                              className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-[#22222e] rounded transition-colors cursor-pointer"
                              title="Delete problem"
                              aria-label={`Delete ${prob.title}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls (Only shown for large datasets > 50 items) */}
          {processedProblems.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#22222a] bg-[#141418] text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processedProblems.length)} of {processedProblems.length}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] text-zinc-400 bg-[#191922] border border-[#272736]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Problem Modal (Add / Edit) */}
      <ProblemModal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        onSubmit={handleProblemSubmit}
        initialProblem={editingProblem}
        mode={problemModalMode}
      />

      {/* Schedule Revision Modal */}
      <ScheduleRevisionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        problems={problems}
        initialProblemId={scheduleProblemId}
        onSchedule={(probId, date, interval, notes) =>
          scheduleRevision(probId, date, interval, notes)
        }
      />

      {/* Problem Details & Complete Revision History Timeline Modal */}
      <ProblemDetailsModal
        isOpen={Boolean(selectedProblemForHistory)}
        onClose={() => setSelectedProblemForHistory(null)}
        problem={selectedProblemForHistory}
        revisions={revisions}
        onScheduleRevision={scheduleRevision}
        onCompleteRevision={completeRevision}
        onRescheduleRevision={rescheduleRevision}
        onCancelRevision={cancelRevision}
        onEditProblem={handleOpenEdit}
      />
    </AppLayout>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400 text-xs">Loading problems...</div>}>
      <ProblemsContent />
    </Suspense>
  );
}
