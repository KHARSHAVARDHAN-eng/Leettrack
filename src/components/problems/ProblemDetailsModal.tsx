'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Tag,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { Problem, RevisionItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatLongDate,
  formatDateTime,
  getTodayDateString,
  canonicalProblemUrl,
  getProblemTopics,
} from '@/lib/storage';

interface ProblemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
  revisions: RevisionItem[];
  onScheduleRevision: (
    problemId: string,
    scheduledDate: string,
    intervalStep?: string,
    notes?: string
  ) => { success: boolean; error?: string };
  onCompleteRevision: (revisionId: string, completionTimestamp?: string) => void;
  onRescheduleRevision: (revisionId: string, newDate: string) => void;
  onCancelRevision: (revisionId: string) => void;
  onEditProblem?: (problem: Problem) => void;
}

export const ProblemDetailsModal: React.FC<ProblemDetailsModalProps> = ({
  isOpen,
  onClose,
  problem,
  revisions,
  onScheduleRevision,
  onCompleteRevision,
  onRescheduleRevision,
  onCancelRevision,
  onEditProblem,
}) => {
  // Inline Reschedule state
  const [reschedulingRevId, setReschedulingRevId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');

  // Inline "Schedule Next Revision" state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [newRevisionDate, setNewRevisionDate] = useState(() => {
    if (typeof window === 'undefined') return '2026-10-21';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${tomorrow.getFullYear()}-${m}-${d}`;
  });
  const [intervalStep, setIntervalStep] = useState<string>('Manual review');
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Filter revisions for this problem
  const problemRevisions = useMemo(() => {
    if (!problem) return [];
    return revisions
      .filter((r) => r.problemId === problem.id)
      .sort((a, b) => {
        // Sort chronologically: by revisionNumber, then scheduledDate
        const numA = typeof a.revisionNumber === 'number' ? a.revisionNumber : 0;
        const numB = typeof b.revisionNumber === 'number' ? b.revisionNumber : 0;
        if (numA !== numB) return numA - numB;
        return (a.scheduledDate || '').localeCompare(b.scheduledDate || '');
      });
  }, [revisions, problem]);

  // Next revision number for this problem
  const nextRevisionNumber = useMemo(() => {
    if (problemRevisions.length === 0) return 1;
    const maxNum = problemRevisions.reduce(
      (max, r) => Math.max(max, typeof r.revisionNumber === 'number' ? r.revisionNumber : 0),
      0
    );
    return Math.max(maxNum, problemRevisions.length) + 1;
  }, [problemRevisions]);

  if (!isOpen || !problem) return null;

  const problemTopics = getProblemTopics(problem);
  const canonicalUrl = canonicalProblemUrl(problem.url || problem.slug || problem.title);

  const completedCount = problemRevisions.filter((r) => r.status === 'completed').length;
  const pendingCount = problemRevisions.filter(
    (r) => r.status === 'pending' || r.status === 'scheduled'
  ).length;
  const cancelledCount = problemRevisions.filter((r) => r.status === 'cancelled').length;

  const handleStartReschedule = (rev: RevisionItem) => {
    setReschedulingRevId(rev.id);
    setRescheduleDate(rev.scheduledDate || getTodayDateString());
  };

  const handleSaveReschedule = (revId: string) => {
    if (!rescheduleDate) return;
    onRescheduleRevision(revId, rescheduleDate);
    setReschedulingRevId(null);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);

    if (!newRevisionDate) {
      setScheduleError('Please pick a date for this revision.');
      return;
    }

    const stepLabel = intervalStep || `Revision ${nextRevisionNumber}`;
    const res = onScheduleRevision(
      problem.id,
      newRevisionDate,
      stepLabel,
      revisionNotes.trim() || undefined
    );

    if (res.success) {
      setRevisionNotes('');
      setIsScheduleOpen(false);
    } else {
      setScheduleError(res.error || 'Failed to schedule revision.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-2xl rounded-lg bg-[#141419] border border-[#272733] shadow-2xl p-5 my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="problem-details-title"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#21212b] shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#1e1e28] text-zinc-300 border border-[#2c2c3d]">
                {problem.frontendId !== undefined ? `#${problem.frontendId}` : 'Problem'}
              </span>
              <Badge variant={problem.difficulty} size="xs">
                {problem.difficulty}
              </Badge>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-medium">{problem.category}</span>
            </div>

            <h2 id="problem-details-title" className="text-base sm:text-lg font-bold text-zinc-100 truncate">
              {problem.title}
            </h2>

            {/* Topics & LeetCode link */}
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-mono transition-colors"
                title={`Open ${problem.title} on LeetCode`}
              >
                <span>View on LeetCode</span>
                <ExternalLink size={11} />
              </a>

              {problemTopics.length > 0 && (
                <>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag size={11} className="text-zinc-500" />
                    {problemTopics.map((topic) => (
                      <span
                        key={topic}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-[#191924] text-zinc-300 border border-[#262638]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEditProblem && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProblem(problem);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f2a] rounded transition-colors cursor-pointer"
                title="Edit problem details"
                aria-label={`Edit ${problem.title}`}
              >
                <Edit2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f2a] rounded transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Key Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Track the Original Solve Date */}
            <div className="p-3 rounded-md bg-[#181822] border border-[#262636] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                <CheckCircle2 size={13} className="text-[#00b8a3]" />
                <span>Original Solve Date</span>
              </div>
              <div className="mt-2 font-mono text-sm font-semibold text-zinc-100">
                {formatLongDate(problem.solvedAt)}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                Preserved initial solve date
              </p>
            </div>

            {/* 2. Revisions Progress */}
            <div className="p-3 rounded-md bg-[#181822] border border-[#262636] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                <Clock size={13} className="text-violet-400" />
                <span>Revision Count</span>
              </div>
              <div className="mt-2 font-mono text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>{completedCount} completed</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-normal text-violet-300">
                    ({pendingCount} scheduled)
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {problemRevisions.length} total revision record{problemRevisions.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* 3. Quick Action: Schedule Next */}
            <div className="p-3 rounded-md bg-[#181822] border border-[#262636] flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                <span>Next Revision</span>
                <span className="font-mono text-[10px] text-violet-400">
                  #{nextRevisionNumber}
                </span>
              </div>
              <Button
                variant="primary"
                size="xs"
                icon={<Plus size={12} />}
                onClick={() => setIsScheduleOpen((prev) => !prev)}
                className="mt-2 w-full justify-center"
              >
                {isScheduleOpen ? 'Hide scheduler' : `Schedule Rev ${nextRevisionNumber}`}
              </Button>
              <p className="mt-1 text-[10px] text-zinc-500 text-center">
                Unlimited revisions supported
              </p>
            </div>
          </div>

          {/* Schedule Next Revision Inline Card */}
          {isScheduleOpen && (
            <div className="p-4 rounded-md bg-[#171722] border border-violet-500/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#262636]">
                <h3 className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Schedule Revision {nextRevisionNumber} for {problem.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Cancel
                </button>
              </div>

              {scheduleError && (
                <div className="mb-3 p-2 rounded bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-sched-date" className="block text-zinc-300 font-medium mb-1">
                      Scheduled Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="modal-sched-date"
                      type="date"
                      required
                      value={newRevisionDate}
                      onChange={(e) => setNewRevisionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#131318] border border-[#2c2c3b] text-zinc-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-sched-interval" className="block text-zinc-300 font-medium mb-1">
                      Interval Stage
                    </label>
                    <select
                      id="modal-sched-interval"
                      value={intervalStep}
                      onChange={(e) => setIntervalStep(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#131318] border border-[#2c2c3b] text-zinc-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value={`Revision ${nextRevisionNumber}`}>Revision {nextRevisionNumber}</option>
                      <option value="1st review (24h)">1st review (24h)</option>
                      <option value="2nd review (3d)">2nd review (3d)</option>
                      <option value="3rd review (1w)">3rd review (1w)</option>
                      <option value="4th review (2w)">4th review (2w)</option>
                      <option value="5th review (1m)">5th review (1m)</option>
                      <option value="Manual review">Manual review</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-sched-notes" className="block text-zinc-300 font-medium mb-1">
                    Review Notes (optional)
                  </label>
                  <input
                    id="modal-sched-notes"
                    type="text"
                    placeholder="Key edge cases, optimal data structures to recall..."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#131318] border border-[#2c2c3b] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsScheduleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="xs">
                    Confirm & Schedule Revision {nextRevisionNumber}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Chronological History Timeline */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span>Problem Revision History</span>
                <span className="font-mono text-[11px] text-zinc-500 font-normal">
                  ({problemRevisions.length + 1} milestone{problemRevisions.length === 0 ? '' : 's'})
                </span>
              </h3>

              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00b8a3]" />
                  Original
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  Scheduled
                </span>
                {cancelledCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#252535]">
              {/* Timeline Node 0: Original Solve */}
              <div className="relative group">
                {/* Node icon / indicator */}
                <span className="absolute -left-6 top-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#00b8a3]/20 border border-[#00b8a3] text-[#00b8a3] shadow-sm">
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                </span>

                <div className="p-3 rounded-md bg-[#16161f] border border-[#242433] hover:border-[#2d2d40] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-100">
                        Original Solve
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00b8a3]/15 text-[#00b8a3] border border-[#00b8a3]/30">
                        First Solution
                      </span>
                    </div>

                    <div className="font-mono text-xs text-zinc-300 font-medium">
                      {formatLongDate(problem.solvedAt)}
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-400">
                    Problem was initially solved and logged into your archive. This milestone is permanently preserved.
                  </p>
                </div>
              </div>

              {/* Timeline Nodes 1..N: Each individual revision */}
              {problemRevisions.map((rev, index) => {
                const revNum = rev.revisionNumber || index + 1;
                const isCompleted = rev.status === 'completed';
                const isCancelled = rev.status === 'cancelled';
                const isPending = !isCompleted && !isCancelled;

                const scheduledDateFormatted = formatLongDate(rev.scheduledDate);
                const completedDateFormatted = rev.completedAt
                  ? formatDateTime(rev.completedAt)
                  : '';
                const completedDateOnly = rev.completedAt
                  ? formatLongDate(rev.completedAt)
                  : '';

                // Show scheduled and actual completion date separately whenever they differ
                const datesDiffer =
                  isCompleted &&
                  Boolean(rev.completedAt) &&
                  scheduledDateFormatted !== completedDateOnly;

                return (
                  <div key={rev.id} className="relative group">
                    {/* Node Dot */}
                    <span
                      className={`absolute -left-6 top-2 flex items-center justify-center w-5 h-5 rounded-full border shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : isPending
                          ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                          : 'bg-zinc-800 border-zinc-600 text-zinc-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                      ) : isPending ? (
                        <Clock size={11} strokeWidth={2} />
                      ) : (
                        <Ban size={10} strokeWidth={2} />
                      )}
                    </span>

                    <div
                      className={`p-3 rounded-md border transition-colors ${
                        isCompleted
                          ? 'bg-[#15181b] border-[#222c2a] hover:border-[#2f3d3b]'
                          : isPending
                          ? 'bg-[#171723] border-[#28283e] hover:border-violet-500/50'
                          : 'bg-[#141418] border-[#202028] text-zinc-500'
                      }`}
                    >
                      {/* Top Row: Revision Title & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#20202d]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                            <span>Revision {revNum}</span>
                          </span>

                          <span
                            className={`text-[10px] font-mono font-medium px-2 py-0.2 rounded ${
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : isPending
                                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                : 'bg-[#22222d] text-zinc-400 border border-[#30303e]'
                            }`}
                          >
                            {isCompleted
                              ? 'Completed'
                              : isPending
                              ? 'Scheduled'
                              : 'Cancelled'}
                          </span>

                          {rev.intervalStep && (
                            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                              • {rev.intervalStep}
                            </span>
                          )}
                        </div>

                        {/* Revision dates row */}
                        <div className="text-xs font-mono">
                          {isCompleted ? (
                            <span className="text-emerald-300 font-medium">
                              {completedDateFormatted}
                            </span>
                          ) : isPending ? (
                            <span className="text-violet-300 font-medium">
                              {scheduledDateFormatted}
                            </span>
                          ) : (
                            <span className="text-zinc-500 line-through">
                              {scheduledDateFormatted}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scheduled vs Completed Dates Breakdown (Whenever they differ or for completed reviews) */}
                      <div className="pt-2 space-y-1.5 text-xs">
                        {isCompleted && (
                          <div className="p-2 rounded bg-[#101314] border border-[#1b2523] space-y-1 text-[11px] font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400">Scheduled Date:</span>
                              <span className="text-zinc-300">{scheduledDateFormatted}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-medium">
                                Actual Completion:
                              </span>
                              <span className="text-emerald-400 font-semibold">
                                {completedDateFormatted || scheduledDateFormatted}
                              </span>
                            </div>
                            {datesDiffer && (
                              <div className="text-[10px] text-amber-400/90 pt-0.5 border-t border-[#1b2523] italic">
                                Note: Completed on a different date than initially scheduled.
                              </div>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span>Scheduled Review Date:</span>
                            <span className="text-zinc-200">{scheduledDateFormatted}</span>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="text-[11px] text-zinc-500 italic">
                            Cancelled on scheduled date {scheduledDateFormatted}. Preserved in history for record-keeping.
                          </div>
                        )}

                        {/* Optional notes */}
                        {rev.notes && (
                          <div className="mt-1.5 p-2 rounded bg-[#13131a] border border-[#22222e] text-[11px] text-zinc-300 italic">
                            <span className="not-italic font-semibold text-zinc-500 mr-1.5">
                              Notes:
                            </span>
                            {rev.notes}
                          </div>
                        )}

                        {/* Inline Reschedule date picker */}
                        {reschedulingRevId === rev.id && (
                          <div className="mt-2.5 p-2.5 rounded bg-[#1c1c28] border border-violet-500/40 space-y-2 animate-in fade-in duration-100">
                            <label className="block text-[11px] text-zinc-300 font-medium">
                              Select new scheduled date for Revision {revNum}:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded bg-[#14141b] border border-[#2e2e40] text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
                              />
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleSaveReschedule(rev.id)}
                              >
                                Save Date
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setReschedulingRevId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons on individual revisions */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isPending && (
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={<Calendar size={11} />}
                                onClick={() => handleStartReschedule(rev)}
                              >
                                Reschedule
                              </Button>
                            )}

                            {isCancelled && (
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={<RotateCcw size={11} />}
                                onClick={() => handleStartReschedule(rev)}
                              >
                                Reactivate / Reschedule
                              </Button>
                            )}

                            {isPending && (
                              <Button
                                variant="ghost"
                                size="xs"
                                icon={<Ban size={11} className="text-zinc-500 hover:text-rose-400" />}
                                onClick={() => onCancelRevision(rev.id)}
                              >
                                Cancel revision
                              </Button>
                            )}
                          </div>

                          {isPending && (
                            <Button
                              variant="primary"
                              size="xs"
                              icon={<CheckCircle2 size={12} />}
                              onClick={() => onCompleteRevision(rev.id)}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#21212b] flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            Problem #{problem.frontendId || problem.id.slice(-4)} • {problem.title}
          </div>

          <div className="flex items-center gap-2">
            {!isScheduleOpen && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setIsScheduleOpen(true)}
              >
                Schedule Revision {nextRevisionNumber}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
