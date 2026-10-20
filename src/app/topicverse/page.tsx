'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  Compass,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  BarChart2,
  Calendar,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';

interface TopicSummary {
  topic: string;
  count: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  problems: Problem[];
}

type TopicSortOption = 'count-desc' | 'count-asc' | 'name-asc' | 'name-desc';

export default function TopicversePage() {
  const router = useRouter();
  const { problems, addProblem, updateProblem, scheduleRevision } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TopicSortOption>('count-desc');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Modals state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleProblemId, setScheduleProblemId] = useState<string | undefined>();

  // Aggregate topics dynamically from real problem records
  const { topicSummaries, totalAssignedCount, uncategorizedCount, maxCount } = useMemo(() => {
    const map = new Map<string, TopicSummary>();
    let totalAssignments = 0;
    let uncategorized = 0;

    problems.forEach((p) => {
      const pTopics = getProblemTopics(p);

      if (pTopics.length === 0) {
        uncategorized++;
        const topicName = 'Uncategorized';
        let existing = map.get(topicName);
        if (!existing) {
          existing = {
            topic: topicName,
            count: 0,
            easyCount: 0,
            mediumCount: 0,
            hardCount: 0,
            problems: [],
          };
          map.set(topicName, existing);
        }
        existing.count += 1;
        if (p.difficulty === 'Easy') existing.easyCount += 1;
        else if (p.difficulty === 'Medium') existing.mediumCount += 1;
        else if (p.difficulty === 'Hard') existing.hardCount += 1;
        existing.problems.push(p);
      } else {
        pTopics.forEach((topic) => {
          totalAssignments++;
          const clean = topic.trim();
          let existing = map.get(clean);
          if (!existing) {
            existing = {
              topic: clean,
              count: 0,
              easyCount: 0,
              mediumCount: 0,
              hardCount: 0,
              problems: [],
            };
            map.set(clean, existing);
          }
          existing.count += 1;
          if (p.difficulty === 'Easy') existing.easyCount += 1;
          else if (p.difficulty === 'Medium') existing.mediumCount += 1;
          else if (p.difficulty === 'Hard') existing.hardCount += 1;
          existing.problems.push(p);
        });
      }
    });

    const list = Array.from(map.values());

    // Sort problems within each topic by frontendId (ascending numerical order)
    list.forEach((t) => {
      t.problems.sort((a, b) => {
        if (a.frontendId !== undefined && b.frontendId !== undefined) {
          return a.frontendId - b.frontendId;
        }
        if (a.frontendId !== undefined) return -1;
        if (b.frontendId !== undefined) return 1;
        return a.title.localeCompare(b.title);
      });
    });

    const max = list.reduce((m, item) => Math.max(m, item.count), 1);

    return {
      topicSummaries: list,
      totalAssignedCount: totalAssignments,
      uncategorizedCount: uncategorized,
      maxCount: max,
    };
  }, [problems]);

  // Filtered and sorted topics
  const processedTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = topicSummaries.filter((t) => {
      if (!q) return true;
      if (t.topic.toLowerCase().includes(q)) return true;
      return t.problems.some(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.frontendId !== undefined && String(p.frontendId).includes(q))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'count-desc') {
        if (b.count !== a.count) return b.count - a.count;
        return a.topic.localeCompare(b.topic);
      }
      if (sortBy === 'count-asc') {
        if (a.count !== b.count) return a.count - b.count;
        return a.topic.localeCompare(b.topic);
      }
      if (sortBy === 'name-asc') {
        return a.topic.localeCompare(b.topic);
      }
      if (sortBy === 'name-desc') {
        return b.topic.localeCompare(a.topic);
      }
      return 0;
    });
  }, [topicSummaries, searchQuery, sortBy]);

  const toggleExpand = (topic: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const handleNavigateToTopic = (topicName: string) => {
    if (topicName === 'Uncategorized') {
      router.push('/problems');
    } else {
      router.push(`/problems?topic=${encodeURIComponent(topicName)}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingProblem(null);
    setIsProblemModalOpen(true);
  };

  const handleOpenEdit = (prob: Problem) => {
    setEditingProblem(prob);
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
    if (editingProblem) {
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

  const topTopic = useMemo(() => {
    if (topicSummaries.length === 0) return null;
    return [...topicSummaries].sort((a, b) => b.count - a.count)[0];
  }, [topicSummaries]);

  return (
    <AppLayout title="Topicverse" onQuickAdd={handleOpenAdd}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <Compass size={20} className="text-violet-400" />
              <span>Topicverse</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              How many problems have you solved using each algorithmic topic? Real-time taxonomy across your tracked library.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/problems">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
                All Problems
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Metric Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-[#141419] border border-[#23232b] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                Topics Mastered
              </span>
              <span className="text-lg font-semibold font-mono text-zinc-100 tabular-nums">
                {topicSummaries.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-[#191924] border border-[#28283a] flex items-center justify-center text-violet-400">
              <Layers size={15} />
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#141419] border border-[#23232b] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                Top Practiced Topic
              </span>
              <span className="text-sm font-semibold text-zinc-100 truncate max-w-[150px] block">
                {topTopic ? `${topTopic.topic} (${topTopic.count})` : '—'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-[#191924] border border-[#28283a] flex items-center justify-center text-emerald-400">
              <Sparkles size={15} />
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#141419] border border-[#23232b] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                Total Topic Tags
              </span>
              <span className="text-lg font-semibold font-mono text-zinc-100 tabular-nums">
                {totalAssignedCount}
              </span>
            </div>
            <div className="w-8 h-8 rounded-md bg-[#191924] border border-[#28283a] flex items-center justify-center text-amber-400">
              <BarChart2 size={15} />
            </div>
          </div>
        </div>

        {/* Uncategorized Notice if any problems lack topic labels */}
        {uncategorizedCount > 0 && (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span>
                {uncategorizedCount} problem{uncategorizedCount === 1 ? '' : 's'} without topic labels. You can label them directly below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('Uncategorized')}
              className="text-amber-400 hover:text-amber-200 underline text-[11px] font-medium cursor-pointer shrink-0"
            >
              Filter Uncategorized
            </button>
          </div>
        )}

        {/* Toolbar: Search and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-md bg-[#141419] border border-[#24242e]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181822] border border-[#292937] flex-1 max-w-sm">
            <Search size={14} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Search topics or contained problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                title="Clear topic search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-zinc-500 font-mono">Sort topics:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TopicSortOption)}
              className="px-2.5 py-1.5 rounded-md bg-[#191922] border border-[#282836] text-zinc-200 text-xs focus:outline-none cursor-pointer font-mono"
            >
              <option value="count-desc">Problems Solved (Most First)</option>
              <option value="count-asc">Problems Solved (Least First)</option>
              <option value="name-asc">Topic Name (A → Z)</option>
              <option value="name-desc">Topic Name (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Main Topic Breakdown Table */}
        <div className="rounded-md border border-[#22222a] bg-[#121215] overflow-hidden">
          {processedTopics.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Compass}
                title={
                  problems.length === 0
                    ? 'No topics recorded yet'
                    : 'No matching topics found'
                }
                description={
                  problems.length === 0
                    ? 'Log your solved problems with topic labels to explore your algorithmic distribution.'
                    : 'Try clearing your search query to view all available topics.'
                }
                actionLabel={
                  problems.length === 0 ? 'Log your first problem' : 'Clear search'
                }
                onAction={() => {
                  if (problems.length === 0) {
                    handleOpenAdd();
                  } else {
                    setSearchQuery('');
                  }
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#22222a] text-zinc-400 text-[11px] uppercase tracking-wider bg-[#16161c]">
                    <th className="py-2.5 px-4 font-medium">Topic</th>
                    <th className="py-2.5 px-4 font-medium w-48 text-center sm:text-left">
                      Problems Solved
                    </th>
                    <th className="py-2.5 px-4 font-medium hidden md:table-cell">
                      Difficulty Distribution
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right w-40">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1e1e26]">
                  {processedTopics.map((item, idx) => {
                    const isExpanded = Boolean(expandedTopics[item.topic]);
                    const percentage = Math.round((item.count / maxCount) * 100);

                    // Alternating subtle zebra striping
                    const rowBgClass =
                      idx % 2 === 0
                        ? 'bg-[#141418]'
                        : 'bg-[#17171e]';

                    return (
                      <React.Fragment key={item.topic}>
                        <tr
                          className={`${rowBgClass} hover:bg-[#1e1e27] transition-colors group cursor-pointer`}
                          onClick={() => toggleExpand(item.topic)}
                        >
                          {/* Topic Name */}
                          <td className="py-3 px-4 font-medium text-zinc-200">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer transition-transform"
                                aria-label={isExpanded ? 'Collapse problems' : 'Expand problems'}
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <span className="font-semibold text-zinc-100 group-hover:text-violet-300 transition-colors">
                                {item.topic}
                              </span>
                              {item.topic === 'Uncategorized' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                                  <AlertCircle size={10} />
                                  Needs labeling
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Problems Solved Count & Mini Proportional Bar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-semibold text-zinc-100 tabular-nums w-8">
                                {item.count}
                              </span>
                              <div className="flex-1 max-w-[120px] h-1.5 bg-[#202029] rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Difficulty Distribution Chips */}
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono">
                              {item.easyCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#00b8a3]/10 text-[#00b8a3] border border-[#00b8a3]/20">
                                  {item.easyCount} Easy
                                </span>
                              )}
                              {item.mediumCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#ffc01e]/10 text-[#ffc01e] border border-[#ffc01e]/20">
                                  {item.mediumCount} Med
                                </span>
                              )}
                              {item.hardCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-[#ff375f]/10 text-[#ff375f] border border-[#ff375f]/20">
                                  {item.hardCount} Hard
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={<ArrowRight size={11} />}
                                iconPosition="right"
                                onClick={() => handleNavigateToTopic(item.topic)}
                              >
                                View in Problems
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Drawer: Shows all problem titles and numbers for this topic */}
                        {isExpanded && (
                          <tr className="bg-[#101014] border-t border-[#1e1e28]">
                            <td colSpan={4} className="p-3 sm:px-6 sm:py-3.5">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-zinc-400 pb-1.5 border-b border-[#1f1f28]">
                                  <span className="font-mono text-[11px] text-zinc-500">
                                    {item.problems.length} problem{item.problems.length === 1 ? '' : 's'} tagged with &ldquo;{item.topic}&rdquo; (sorted by number):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleNavigateToTopic(item.topic)}
                                    className="text-violet-400 hover:text-violet-300 text-xs inline-flex items-center gap-1 font-medium cursor-pointer"
                                  >
                                    <span>Open filtered list in Problems page</span>
                                    <ArrowRight size={11} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                  {item.problems.map((prob) => {
                                    const canonicalUrl = prob.url || `https://leetcode.com/problems/${prob.slug}/`;

                                    let difficultyColor = 'text-zinc-300';
                                    if (prob.difficulty === 'Easy') difficultyColor = 'text-[#00b8a3]';
                                    else if (prob.difficulty === 'Medium') difficultyColor = 'text-[#ffc01e]';
                                    else if (prob.difficulty === 'Hard') difficultyColor = 'text-[#ff375f]';

                                    const cleanDisplayTitle =
                                      prob.frontendId !== undefined
                                        ? prob.title.replace(new RegExp(`^(?:#|\\[)?${prob.frontendId}(?:\\]|\\.|\\s|-)+`, 'i'), '').trim() || prob.title
                                        : prob.title;

                                    return (
                                      <div
                                        key={prob.id}
                                        className="p-2.5 rounded bg-[#15151c] border border-[#232330] hover:border-[#323246] transition-colors flex flex-col justify-between gap-1.5 group"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0 flex-1">
                                            <a
                                              href={canonicalUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs font-medium text-zinc-200 hover:text-violet-300 transition-colors inline-flex items-center gap-1.5 truncate max-w-full"
                                              title={`Open ${prob.title} on LeetCode`}
                                            >
                                              <span className="font-mono text-zinc-400 shrink-0">
                                                {prob.frontendId !== undefined ? `#${prob.frontendId}` : '•'}
                                              </span>
                                              <span className="truncate">{cleanDisplayTitle}</span>
                                              <ExternalLink size={10} className="shrink-0 text-zinc-600 group-hover:text-violet-400" />
                                            </a>
                                          </div>

                                          <span className={`text-[11px] font-mono shrink-0 ${difficultyColor}`}>
                                            {prob.difficulty}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-[#1e1e28]">
                                          <span className="font-mono tabular-nums text-[10px]">
                                            Solved: {prob.solvedAt}
                                          </span>

                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenSchedule(prob.id)}
                                              className="p-1 text-zinc-500 hover:text-violet-400 rounded transition-colors cursor-pointer"
                                              title="Schedule review"
                                            >
                                              <Calendar size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEdit(prob)}
                                              className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                                              title="Edit problem labels"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
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
        mode={editingProblem ? 'edit' : 'add'}
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
    </AppLayout>
  );
}
