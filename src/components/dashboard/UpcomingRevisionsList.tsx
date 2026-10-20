import React from 'react';
import Link from 'next/link';
import { RevisionItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

interface UpcomingRevisionsListProps {
  revisions: RevisionItem[];
  onCompleteRevision?: (id: string) => void;
  onScheduleRevision?: () => void;
  onSelectRevision?: (rev: RevisionItem) => void;
}

export const UpcomingRevisionsList: React.FC<UpcomingRevisionsListProps> = React.memo(({
  revisions,
  onCompleteRevision,
  onScheduleRevision,
  onSelectRevision,
}) => {
  // Only show pending revisions in the upcoming queue
  const pendingRevisions = React.useMemo(
    () => revisions.filter((r) => r.status === 'pending'),
    [revisions]
  );

  return (
    <div className="rounded-md border border-[#23232b] bg-[#141418] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#23232b] bg-[#16161b]">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-zinc-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Upcoming Revisions
          </h2>
          <span className="text-[11px] font-mono text-zinc-500" suppressHydrationWarning>
            ({pendingRevisions.length})
          </span>
        </div>

        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60 rounded px-1.5 py-0.5"
          aria-label="Open revision calendar"
        >
          <span>Open calendar</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Content */}
      {pendingRevisions.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Calendar}
            title="No revisions scheduled"
            description="When you solve problems, schedule spaced reviews to maintain mastery over key patterns."
            actionLabel="Schedule revision"
            onAction={onScheduleRevision}
          />
        </div>
      ) : (
        <div className="divide-y divide-[#1e1e25]">
          {pendingRevisions.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#18181f]/80 transition-colors group cursor-pointer"
              onClick={() => onSelectRevision?.(item)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      item.dueDate === 'Today'
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                        : item.dueDate === 'Overdue'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-[#1b1b22] text-zinc-400 border border-[#262631]'
                    }`}
                  >
                    <Clock size={10} />
                    <span>{item.dueDate}</span>
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.frontendId && (
                      <span className="font-mono text-xs text-zinc-500 tabular-nums">
                        #{item.frontendId}
                      </span>
                    )}
                    <span className="text-xs font-medium text-zinc-200 truncate max-w-[140px] sm:max-w-[200px]">
                      {item.problemTitle}
                    </span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Rev #{item.revisionNumber || 1}
                    </span>
                    <Badge variant={item.difficulty} size="xs">
                      {item.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="truncate max-w-[100px]">{item.category}</span>
                    <span>•</span>
                    <span className="font-mono text-zinc-400">{item.intervalStep}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center pl-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onCompleteRevision?.(item.id)}
                  className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60"
                  title="Mark revision reviewed"
                  aria-label={`Mark revision for problem ${item.frontendId || item.problemTitle} as reviewed`}
                >
                  <CheckCircle2 size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

UpcomingRevisionsList.displayName = 'UpcomingRevisionsList';
