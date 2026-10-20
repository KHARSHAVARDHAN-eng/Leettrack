'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DifficultyBreakdown } from '@/components/dashboard/DifficultyBreakdown';
import { RecentProblemsTable } from '@/components/dashboard/RecentProblemsTable';
import { UpcomingRevisionsList } from '@/components/dashboard/UpcomingRevisionsList';
import dynamic from 'next/dynamic';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Problem, RevisionItem, Difficulty } from '@/types';

const ProblemModal = dynamic(
  () => import('@/components/dashboard/ProblemModal').then((m) => m.ProblemModal),
  { ssr: false }
);
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
import { CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const {
    problems,
    revisions,
    stats,
    addProblem,
    updateProblem,
    deleteProblem,
    scheduleRevision,
    completeRevision,
    rescheduleRevision,
    cancelRevision,
  } = useWorkspace();

  // Modals state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [problemModalMode, setProblemModalMode] = useState<'add' | 'edit'>('add');
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleProblemId, setScheduleProblemId] = useState<string | undefined>();

  const [selectedRevision, setSelectedRevision] = useState<RevisionItem | null>(null);
  const [selectedProblemForHistory, setSelectedProblemForHistory] = useState<Problem | null>(null);

  // Memoized handlers to avoid unnecessary child table re-renders
  const handleOpenAdd = useCallback(() => {
    setEditingProblem(null);
    setProblemModalMode('add');
    setIsProblemModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((prob: Problem) => {
    setEditingProblem(prob);
    setProblemModalMode('edit');
    setIsProblemModalOpen(true);
  }, []);

  const handleOpenSchedule = useCallback((problemId?: string) => {
    setScheduleProblemId(problemId);
    setIsScheduleModalOpen(true);
  }, []);

  const handleProblemSubmit = useCallback((data: {
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
  }, [problemModalMode, editingProblem, updateProblem, addProblem]);

  const dueTodayCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < revisions.length; i++) {
      const r = revisions[i];
      if (r.status === 'pending' && (r.dueDate === 'Today' || r.dueDate === 'Overdue')) {
        count++;
      }
    }
    return count;
  }, [revisions]);

  return (
    <AppLayout title="Your workspace" onQuickAdd={handleOpenAdd}>
      <div className="space-y-6">
        {/* Workspace Title */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Your workspace
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Overview of logged solutions, difficulty distribution, and scheduled reviews.
              </p>
            </div>
          </div>
        </div>

        {/* Top Statistics Row (Accurate totals derived from actual records) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <StatCard
            label="Total Solved"
            value={stats.totalSolved}
            subtext={stats.totalSolved === 0 ? 'No problems logged yet' : `${stats.totalSolved} saved in browser storage`}
            icon={CheckCircle2}
          />

          <DifficultyBreakdown
            easyCount={stats.easyCount}
            mediumCount={stats.mediumCount}
            hardCount={stats.hardCount}
            total={stats.totalSolved}
          />

          <StatCard
            label="Revisions Due"
            value={stats.upcomingRevisionsCount}
            subtext={
              stats.upcomingRevisionsCount > 0
                ? `${dueTodayCount} due today / overdue`
                : 'No reviews pending'
            }
            icon={Clock}
          />
        </div>

        {/* Main Grid: Recent Problems & Upcoming Revisions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <RecentProblemsTable
              problems={problems}
              onAddProblem={handleOpenAdd}
              onEditProblem={handleOpenEdit}
              onDeleteProblem={deleteProblem}
              onScheduleRevision={handleOpenSchedule}
              onViewHistory={(prob) => setSelectedProblemForHistory(prob)}
            />
          </div>

          <div className="lg:col-span-5">
            <UpcomingRevisionsList
              revisions={revisions}
              onCompleteRevision={completeRevision}
              onScheduleRevision={() => handleOpenSchedule()}
              onSelectRevision={(rev) => setSelectedRevision(rev)}
            />
          </div>
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
        onEditProblem={handleOpenEdit}
      />
    </AppLayout>
  );
}
