import { WorkspaceStats } from '@/types';

/**
 * Initial empty workspace statistics
 */
export const EMPTY_STATS: WorkspaceStats = {
  totalSolved: 0,
  easyCount: 0,
  mediumCount: 0,
  hardCount: 0,
  upcomingRevisionsCount: 0,
  completedRevisionsCount: 0,
  isDemo: false,
};
