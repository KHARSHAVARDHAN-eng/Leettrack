'use client';

import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, Calendar as CalendarIcon, Ban, History } from 'lucide-react';
import { RevisionItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatLongDate, formatDateTime } from '@/lib/storage';

interface RevisionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  revision: RevisionItem | null;
  onComplete: (id: string) => void;
  onReschedule: (id: string, newDate: string) => void;
  onCancel: (id: string) => void;
  onViewProblemHistory?: (problemId: string) => void;
}

export const RevisionDetailsModal: React.FC<RevisionDetailsModalProps> = ({
  isOpen,
  onClose,
  revision,
  onComplete,
  onReschedule,
  onCancel,
  onViewProblemHistory,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(revision?.scheduledDate || '');

  if (!isOpen || !revision) return null;

  const leetCodeUrl = revision.problemUrl || `https://leetcode.com/problemset/all/`;

  const handleSaveReschedule = () => {
    if (newDate) {
      onReschedule(revision.id, newDate);
      setIsRescheduling(false);
      onClose();
    }
  };

  const handleMarkComplete = () => {
    onComplete(revision.id);
    onClose();
  };

  const handleCancelRev = () => {
    onCancel(revision.id);
    onClose();
  };

  const scheduledDateFormatted = formatLongDate(revision.scheduledDate);
  const completedDateFormatted = revision.completedAt ? formatDateTime(revision.completedAt) : '';
  const completedDateOnly = revision.completedAt ? formatLongDate(revision.completedAt) : '';
  const datesDiffer =
    revision.status === 'completed' &&
    Boolean(revision.completedAt) &&
    scheduledDateFormatted !== completedDateOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-lg bg-[#141419] border border-[#272733] shadow-2xl p-5"
        role="dialog"
        aria-labelledby="rev-details-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#21212b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
              Revision #{revision.revisionNumber || 1}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {revision.frontendId ? `#${revision.frontendId}` : ''}
            </span>
            <Badge variant={revision.difficulty} size="xs">
              {revision.difficulty}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/60"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Problem Title & LeetCode Link */}
        <div className="mt-4 space-y-3">
          <div>
            <h3 id="rev-details-title" className="text-base font-semibold text-zinc-100">
              {revision.problemTitle}
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <a
                href={leetCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-mono transition-colors"
              >
                <span>View on LeetCode</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">{revision.category}</span>
            </div>
          </div>

          {/* Schedule metadata */}
          <div className="p-3 rounded-md bg-[#181820] border border-[#252532] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Scheduled Date:</span>
              <span className="font-mono text-zinc-200">{scheduledDateFormatted}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Revision Status:</span>
              <span
                className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                  revision.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : revision.status === 'cancelled'
                    ? 'bg-[#22222d] text-zinc-400 border border-[#30303e]'
                    : revision.dueDate === 'Today'
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                    : revision.dueDate === 'Overdue'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-[#20202a] text-zinc-300 border border-[#2b2b3a]'
                }`}
              >
                {revision.status === 'completed'
                  ? 'Completed'
                  : revision.status === 'cancelled'
                  ? 'Cancelled'
                  : revision.dueDate || 'Scheduled'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Interval Stage:</span>
              <span className="text-zinc-300">{revision.intervalStep || 'Manual review'}</span>
            </div>

            {revision.completedAt && (
              <div className="flex items-center justify-between pt-1 border-t border-[#22222d]">
                <span className="text-zinc-400">Actual Completion:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {completedDateFormatted}
                </span>
              </div>
            )}

            {datesDiffer && (
              <div className="text-[10px] text-amber-400/90 italic pt-0.5">
                Note: Completed on a different date than initially scheduled ({scheduledDateFormatted}).
              </div>
            )}

            {revision.notes && (
              <div className="pt-2 border-t border-[#22222d]">
                <p className="text-zinc-500 text-[11px] mb-0.5">Notes:</p>
                <p className="text-zinc-300 text-xs italic">{revision.notes}</p>
              </div>
            )}
          </div>

          {/* Reschedule inline date picker */}
          {isRescheduling && (
            <div className="p-3 rounded-md bg-[#191922] border border-[#2d2d3d] space-y-2 text-xs">
              <label htmlFor="reschedule-date" className="block text-zinc-300 font-medium">
                Select new revision date:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="reschedule-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded bg-[#131317] border border-[#2c2c38] text-zinc-100 text-xs focus:outline-none"
                />
                <Button variant="primary" size="xs" onClick={handleSaveReschedule}>
                  Confirm
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setIsRescheduling(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#21212b] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {revision.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<Ban size={12} className="text-zinc-500 hover:text-rose-400" />}
                  onClick={handleCancelRev}
                >
                  Cancel revision
                </Button>
              )}

              {onViewProblemHistory && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<History size={12} className="text-violet-400" />}
                  onClick={() => {
                    onClose();
                    onViewProblemHistory(revision.problemId);
                  }}
                >
                  View History
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRescheduling && (
                <Button
                  variant="secondary"
                  size="xs"
                  icon={<CalendarIcon size={12} />}
                  onClick={() => {
                    setNewDate(revision.scheduledDate);
                    setIsRescheduling(true);
                  }}
                >
                  Reschedule
                </Button>
              )}

              {revision.status !== 'completed' && (
                <Button
                  variant="primary"
                  size="xs"
                  icon={<CheckCircle2 size={13} />}
                  onClick={handleMarkComplete}
                >
                  Mark completed
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
