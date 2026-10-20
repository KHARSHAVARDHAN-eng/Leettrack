'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkspace } from '@/context/WorkspaceContext';
import dynamic from 'next/dynamic';
import { RevisionItem, Problem } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarCheck2,
  Plus,
  History,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getTodayDateString } from '@/lib/storage';

const ScheduleRevisionModal = dynamic(
  () => import('@/components/calendar/ScheduleRevisionModal').then((m) => m.ScheduleRevisionModal),
  { ssr: false }
);
const RevisionDetailsModal = dynamic(
  () => import('@/components/calendar/RevisionDetailsModal').then((m) => m.RevisionDetailsModal),
  { ssr: false }
);
const ProblemDetailsModal = dynamic(
  () => import('@/components/problems/ProblemDetailsModal').then((m) => m.ProblemDetailsModal),
  { ssr: false }
);

interface CalendarDateSummary {
  items: RevisionItem[];
  pendingCount: number;
  completedCount: number;
}

export default function CalendarPage() {
  const {
    problems,
    revisions,
    scheduleRevision,
    completeRevision,
    rescheduleRevision,
    cancelRevision,
  } = useWorkspace();

  // Active view date (year & month) - initialized safely for SSR
  const [viewYear, setViewYear] = useState<number>(() => {
    if (typeof window === 'undefined') return 2026;
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (typeof window === 'undefined') return 9;
    return new Date().getMonth();
  });

  // Selected date filter (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => getTodayDateString());

  // Filter tab: 'pending' | 'completed' | 'cancelled' | 'all'
  const [historyTab, setHistoryTab] = useState<'pending' | 'completed' | 'cancelled' | 'all'>('pending');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<string>(getTodayDateString());
  const [selectedRevision, setSelectedRevision] = useState<RevisionItem | null>(null);
  const [selectedProblemForHistory, setSelectedProblemForHistory] = useState<Problem | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation
  const { totalDays, firstDayIndex } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return {
      firstDayIndex: firstDay,
      totalDays: daysInMonth,
    };
  }, [viewYear, viewMonth]);

  // Map revisions by date string YYYY-MM-DD with precomputed counts for O(1) cell lookup
  const revisionsByDate = useMemo(() => {
    const map = new Map<string, CalendarDateSummary>();
    for (let i = 0; i < revisions.length; i++) {
      const rev = revisions[i];
      let entry = map.get(rev.scheduledDate);
      if (!entry) {
        entry = { items: [], pendingCount: 0, completedCount: 0 };
        map.set(rev.scheduledDate, entry);
      }
      entry.items.push(rev);
      if (rev.status === 'pending' || rev.status === 'scheduled') {
        entry.pendingCount++;
      } else if (rev.status === 'completed') {
        entry.completedCount++;
      }
    }
    return map;
  }, [revisions]);

  // Queue filtered by tab and selected date
  const displayedQueue = useMemo(() => {
    let list = revisions;
    if (historyTab === 'pending') {
      list = revisions.filter((r) => r.status === 'pending' || r.status === 'scheduled');
    } else if (historyTab === 'completed') {
      list = revisions.filter((r) => r.status === 'completed');
    } else if (historyTab === 'cancelled') {
      list = revisions.filter((r) => r.status === 'cancelled');
    }

    if (selectedDate) {
      return list.filter((r) => r.scheduledDate === selectedDate);
    }
    return list;
  }, [revisions, historyTab, selectedDate]);

  const todayStr = getTodayDateString();

  return (
    <AppLayout
      title="Revision Calendar"
      onQuickAdd={() => {
        setScheduleDefaultDate(selectedDate || todayStr);
        setIsScheduleModalOpen(true);
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
              Revision Calendar
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review schedule and spaced repetition timeline across tracked problems.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setScheduleDefaultDate(selectedDate || todayStr);
                setIsScheduleModalOpen(true);
              }}
            >
              Schedule revision
            </Button>
          </div>
        </div>

        {/* Calendar Grid & Queue Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Calendar Month Grid */}
          <div className="lg:col-span-7 rounded-md border border-[#23232b] bg-[#141418] p-4 flex flex-col justify-between">
            {/* Month Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#21212a] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  {monthNames[viewMonth]} {viewYear}
                </span>
                {typeof window !== 'undefined' &&
                  viewYear === new Date().getFullYear() &&
                  viewMonth === new Date().getMonth() && (
                    <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.2 rounded border border-violet-500/20">
                      Current
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-[#1f1f28] hover:text-zinc-200 transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                    setSelectedDate(todayStr);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1f1f28] rounded transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-[#1f1f28] hover:text-zinc-200 transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono uppercase text-zinc-500 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Empty offset days for start of month */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 rounded bg-transparent" />
              ))}

              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const dateKey = `${viewYear}-${mStr}-${dStr}`;

                const isToday = dateKey === todayStr;
                const isSelected = dateKey === selectedDate;

                const dateSummary = revisionsByDate.get(dateKey);
                const pendingCount = dateSummary ? dateSummary.pendingCount : 0;
                const completedCount = dateSummary ? dateSummary.completedCount : 0;
                const dayRevsCount = dateSummary ? dateSummary.items.length : 0;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`h-12 rounded-md border p-1.5 flex flex-col justify-between text-left transition-colors relative cursor-pointer group ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/15 ring-1 ring-violet-500/50'
                        : isToday
                        ? 'border-violet-500/40 bg-violet-500/5'
                        : dayRevsCount > 0
                        ? 'border-[#2e2e3e] bg-[#171720] hover:border-zinc-500'
                        : 'border-[#1e1e25] bg-[#121215] text-zinc-500 hover:border-[#2a2a35]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          isToday
                            ? 'font-bold text-violet-300'
                            : isSelected
                            ? 'text-zinc-100 font-semibold'
                            : dayRevsCount > 0
                            ? 'text-zinc-200 font-medium'
                            : 'text-zinc-600'
                        }`}
                      >
                        {day}
                      </span>

                      {/* Small dots for revisions */}
                      <div className="flex items-center gap-0.5">
                        {pendingCount > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            title={`${pendingCount} pending review(s)`}
                          />
                        )}
                        {completedCount > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                            title={`${completedCount} completed review(s)`}
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] font-mono truncate text-zinc-400">
                      {isToday && <span className="text-violet-400">Today</span>}
                      {!isToday && dayRevsCount > 0 && (
                        <span className="text-zinc-400">
                          {dayRevsCount} rev
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-4 mt-3 border-t border-[#202027] flex items-center justify-between text-[11px] text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  Pending
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-violet-500/30 border border-violet-500/50" />
                  Today
                </span>
              </div>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-zinc-400 hover:text-zinc-200 underline text-[11px]"
                >
                  View all dates
                </button>
              )}
            </div>
          </div>

          {/* Queue & History Panel */}
          <div className="lg:col-span-5 rounded-md border border-[#23232b] bg-[#141418] overflow-hidden flex flex-col">
            {/* Queue Header & Tabs */}
            <div className="px-4 py-3 border-b border-[#23232b] bg-[#16161b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck2 size={15} className="text-zinc-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {selectedDate ? `Schedule for ${selectedDate}` : 'Revisions'}
                </h3>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center bg-[#1c1c24] p-0.5 rounded border border-[#2b2b38] text-[11px]">
                <button
                  type="button"
                  onClick={() => setHistoryTab('pending')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    historyTab === 'pending'
                      ? 'bg-[#282836] text-violet-300 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('completed')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    historyTab === 'completed'
                      ? 'bg-[#282836] text-emerald-300 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('cancelled')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    historyTab === 'cancelled'
                      ? 'bg-[#282836] text-zinc-300 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Cancelled
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('all')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    historyTab === 'all'
                      ? 'bg-[#282836] text-zinc-200 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* List */}
            {displayedQueue.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={historyTab === 'pending' ? Clock : History}
                  title={
                    historyTab === 'pending'
                      ? selectedDate
                        ? `No pending reviews on ${selectedDate}`
                        : 'No pending revisions'
                      : 'No completed revisions yet'
                  }
                  description={
                    historyTab === 'pending'
                      ? 'Schedule a review for any of your tracked problems.'
                      : 'Completed revisions are preserved here for spaced retention tracking.'
                  }
                  actionLabel={historyTab === 'pending' ? 'Schedule revision' : undefined}
                  onAction={
                    historyTab === 'pending'
                      ? () => {
                          setScheduleDefaultDate(selectedDate || todayStr);
                          setIsScheduleModalOpen(true);
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[#1e1e25] max-h-[460px] overflow-y-auto">
                {displayedQueue.map((rev) => {
                  const leetCodeUrl = rev.problemUrl || `https://leetcode.com/problemset/all/`;

                  return (
                    <div
                      key={rev.id}
                      onClick={() => setSelectedRevision(rev)}
                      className="p-3.5 hover:bg-[#181820] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {rev.frontendId && (
                            <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                              #{rev.frontendId}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-zinc-200 truncate group-hover:text-violet-300 transition-colors">
                            {rev.problemTitle}
                          </span>
                          <Badge variant={rev.difficulty} size="xs">
                            {rev.difficulty}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                          <span
                            className={`font-mono px-1.5 py-0.2 rounded text-[10px] ${
                              rev.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : rev.dueDate === 'Today'
                                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                : rev.dueDate === 'Overdue'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-[#1e1e26] text-zinc-400 border border-[#2a2a35]'
                            }`}
                          >
                            {rev.status === 'completed'
                              ? `Completed ${rev.completedAt || rev.scheduledDate}`
                              : rev.dueDate || rev.scheduledDate}
                          </span>
                          <span>•</span>
                          <span>{rev.intervalStep || 'Review'}</span>
                          <span>•</span>
                          <a
                            href={leetCodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-600 hover:text-violet-400 inline-flex items-center gap-0.5"
                            title="Open on LeetCode"
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center pl-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {rev.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => completeRevision(rev.id)}
                            className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Mark completed"
                            aria-label={`Mark problem ${rev.frontendId || rev.problemTitle} reviewed`}
                          >
                            <CheckCircle2 size={16} strokeWidth={1.8} />
                          </button>
                        ) : (
                          <span className="p-1 text-emerald-400" title="Completed">
                            <CheckCircle2 size={16} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Revision Modal */}
      <ScheduleRevisionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        problems={problems}
        initialDate={scheduleDefaultDate}
        onSchedule={(probId, date, interval, notes) =>
          scheduleRevision(probId, date, interval, notes)
        }
      />

      {/* Revision Details Modal */}
      <RevisionDetailsModal
        isOpen={Boolean(selectedRevision)}
        onClose={() => setSelectedRevision(null)}
        revision={selectedRevision}
        onComplete={completeRevision}
        onReschedule={rescheduleRevision}
        onCancel={cancelRevision}
        onViewProblemHistory={(problemId) => {
          const prob = problems.find((p) => p.id === problemId);
          if (prob) setSelectedProblemForHistory(prob);
        }}
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
      />
    </AppLayout>
  );
}
