import React from 'react';
import Link from 'next/link';
import { Problem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowUpRight, Code2, ExternalLink, Calendar, Edit2, Trash2, History } from 'lucide-react';

interface RecentProblemsTableProps {
  problems: Problem[];
  onAddProblem?: () => void;
  onEditProblem?: (problem: Problem) => void;
  onDeleteProblem?: (id: string) => void;
  onScheduleRevision?: (problemId: string) => void;
  onViewHistory?: (problem: Problem) => void;
}

export const RecentProblemsTable: React.FC<RecentProblemsTableProps> = React.memo(({
  problems,
  onAddProblem,
  onEditProblem,
  onDeleteProblem,
  onScheduleRevision,
  onViewHistory,
}) => {
  return (
    <div className="rounded-md border border-[#23232b] bg-[#141418] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#23232b] bg-[#16161b]">
        <div className="flex items-center gap-2">
          <Code2 size={15} className="text-zinc-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Recent Problems
          </h2>
          <span className="text-[11px] font-mono text-zinc-500" suppressHydrationWarning>
            ({problems.length})
          </span>
        </div>

        <Link
          href="/problems"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60 rounded px-1.5 py-0.5"
          aria-label="Open full problem list"
        >
          <span>View all</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Content */}
      {problems.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Code2}
            title="No problems logged yet"
            description="Start tracking solved problems manually or import your history to view recent submissions."
            actionLabel="Add first problem"
            onAction={onAddProblem}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#202027] text-zinc-500 text-[11px] uppercase tracking-wider bg-[#131317]">
                <th className="py-2.5 px-4 font-medium w-16">#</th>
                <th className="py-2.5 px-4 font-medium">Title</th>
                <th className="py-2.5 px-4 font-medium w-24">Difficulty</th>
                <th className="py-2.5 px-4 font-medium hidden sm:table-cell">Category</th>
                <th className="py-2.5 px-4 font-medium text-right w-24">Solved</th>
                <th className="py-2.5 px-4 font-medium text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e25]">
              {problems.slice(0, 5).map((problem) => {
                const leetCodeUrl = problem.url || `https://leetcode.com/problems/${problem.slug}/`;

                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-[#18181f]/80 transition-colors group cursor-default"
                  >
                    <td className="py-2.5 px-4 font-mono text-zinc-500 tabular-nums">
                      {problem.frontendId || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewHistory?.(problem)}
                          className="truncate max-w-[160px] sm:max-w-[220px] text-left hover:text-violet-300 transition-colors cursor-pointer"
                          title={`View revision history for ${problem.title}`}
                        >
                          {problem.title}
                        </button>
                        <a
                          href={leetCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                          title="View problem on LeetCode"
                          aria-label={`Open ${problem.title} on LeetCode in new tab`}
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={problem.difficulty} size="xs">
                        {problem.difficulty}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 hidden sm:table-cell text-xs">
                      <span className="truncate block max-w-[130px]">
                        {problem.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-500 text-[11px] tabular-nums">
                      {problem.solvedAt}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onViewHistory && (
                          <button
                            type="button"
                            onClick={() => onViewHistory(problem)}
                            className="p-1 text-zinc-500 hover:text-violet-400 hover:bg-[#202029] rounded transition-colors cursor-pointer"
                            title="View revision history timeline"
                            aria-label={`View history for ${problem.title}`}
                          >
                            <History size={13} />
                          </button>
                        )}
                        {onScheduleRevision && (
                          <button
                            type="button"
                            onClick={() => onScheduleRevision(problem.id)}
                            className="p-1 text-zinc-500 hover:text-violet-400 hover:bg-[#202029] rounded transition-colors cursor-pointer"
                            title="Schedule revision"
                            aria-label={`Schedule revision for ${problem.title}`}
                          >
                            <Calendar size={13} />
                          </button>
                        )}
                        {onEditProblem && (
                          <button
                            type="button"
                            onClick={() => onEditProblem(problem)}
                            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-[#202029] rounded transition-colors cursor-pointer"
                            title="Edit problem"
                            aria-label={`Edit ${problem.title}`}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {onDeleteProblem && (
                          <button
                            type="button"
                            onClick={() => onDeleteProblem(problem.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-[#202029] rounded transition-colors cursor-pointer"
                            title="Delete problem"
                            aria-label={`Delete ${problem.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

RecentProblemsTable.displayName = 'RecentProblemsTable';
