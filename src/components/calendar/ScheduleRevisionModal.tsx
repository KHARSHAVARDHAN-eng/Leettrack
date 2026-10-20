'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Problem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getTodayDateString } from '@/lib/storage';

interface ScheduleRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: Problem[];
  initialProblemId?: string;
  initialDate?: string;
  onSchedule: (problemId: string, date: string, intervalStep?: string, notes?: string) => { success: boolean; error?: string };
}

function ScheduleRevisionContent({
  onClose,
  problems,
  initialProblemId,
  initialDate,
  onSchedule,
}: Omit<ScheduleRevisionModalProps, 'isOpen'>) {
  const [selectedProblemId, setSelectedProblemId] = useState<string>(
    initialProblemId || (problems.length > 0 ? problems[0].id : '')
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    initialDate || getTodayDateString()
  );
  const [intervalStep, setIntervalStep] = useState<string>('Manual review');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProblemId) {
      setErrorMessage('Please select a problem to schedule.');
      return;
    }
    if (!scheduledDate) {
      setErrorMessage('Please pick a scheduled revision date.');
      return;
    }

    const res = onSchedule(selectedProblemId, scheduledDate, intervalStep, notes.trim() || undefined);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Failed to schedule revision.');
    }
  };

  const selectedProblem = problems.find((p) => p.id === selectedProblemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-lg bg-[#141419] border border-[#272733] shadow-2xl p-5"
        role="dialog"
        aria-labelledby="schedule-modal-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#21212b]">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-violet-400" />
            <h2 id="schedule-modal-title" className="text-sm font-semibold text-zinc-100">
              Schedule Revision
            </h2>
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

        {errorMessage && (
          <div className="mt-3.5 p-2.5 rounded bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label htmlFor="problem-picker" className="block text-zinc-300 font-medium mb-1">
              Select Problem <span className="text-rose-400">*</span>
            </label>
            {problems.length === 0 ? (
              <p className="text-zinc-500 italic p-2 bg-[#191921] rounded border border-[#2c2c38]">
                No problems logged yet. Add a problem first.
              </p>
            ) : (
              <select
                id="problem-picker"
                value={selectedProblemId}
                onChange={(e) => setSelectedProblemId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 focus-visible:border-violet-500/60 focus-visible:outline-none"
              >
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.frontendId ? `#${p.frontendId} ` : ''}{p.title} ({p.difficulty})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedProblem && (
            <div className="p-2.5 rounded bg-[#181820] border border-[#262633] flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  Rev #{(selectedProblem.revisionCount || 0) + 1}
                </span>
                <span className="text-zinc-300 truncate font-medium">
                  {selectedProblem.title}
                </span>
              </div>
              <Badge variant={selectedProblem.difficulty} size="xs">
                {selectedProblem.difficulty}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="revision-date-input" className="block text-zinc-300 font-medium mb-1">
                Revision Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="revision-date-input"
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 focus-visible:border-violet-500/60 focus-visible:outline-none"
              />
            </div>

            <div>
              <label htmlFor="interval-select" className="block text-zinc-300 font-medium mb-1">
                Interval Stage
              </label>
              <select
                id="interval-select"
                value={intervalStep}
                onChange={(e) => setIntervalStep(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 focus-visible:border-violet-500/60 focus-visible:outline-none"
              >
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
            <label htmlFor="revision-notes" className="block text-zinc-300 font-medium mb-1">
              Review Notes (optional)
            </label>
            <input
              id="revision-notes"
              type="text"
              placeholder="e.g. Focus on recursive vs iterative approach..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md bg-[#191921] border border-[#2c2c38] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#21212b]">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={problems.length === 0}
            >
              Schedule revision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const ScheduleRevisionModal: React.FC<ScheduleRevisionModalProps> = (props) => {
  if (!props.isOpen) return null;
  const key = `sched-${props.initialProblemId || 'none'}-${props.initialDate || 'none'}`;
  return <ScheduleRevisionContent key={key} {...props} />;
};
