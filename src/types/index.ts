export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ProblemStatus = 'Solved' | 'Revising' | 'Mastered';

export interface Problem {
  id: string;
  frontendId?: number;
  title: string;
  url: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  topics?: string[];
  solvedAt: string; // YYYY-MM-DD
  notesCount?: number;
  timeSpentMinutes?: number;
  revisionCount: number;
  nextRevisionDate?: string;
  isDemo?: boolean;
}

export type RevisionStatus = 'scheduled' | 'pending' | 'completed' | 'cancelled';

export interface RevisionItem {
  id: string;
  problemId: string;
  problemTitle: string;
  problemUrl?: string;
  frontendId?: number;
  difficulty: Difficulty;
  category: string;
  revisionNumber?: number;
  scheduledDate: string; // YYYY-MM-DD
  dueDate?: string; // Human-friendly (e.g. 'Today', 'Tomorrow', 'Overdue')
  intervalStep?: string; // e.g. '1st review (24h)', 'Manual review'
  status: RevisionStatus;
  completedAt?: string; // ISO format or YYYY-MM-DD
  notes?: string;
  isDemo?: boolean;
}

export interface WorkspaceStats {
  totalSolved: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  upcomingRevisionsCount: number;
  completedRevisionsCount: number;
  isDemo: boolean;
}

export type NavItem = {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
};

export interface LeetCodeProfile {
  username: string;
  realName?: string;
  userAvatar?: string;
  ranking?: number;
  streak?: number;
  totalActiveDays?: number;
  solvedStats: {
    all: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface LeetCodeRetrievedProblem {
  title: string;
  slug: string;
  url: string;
  frontendId?: number;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  topics?: string[];
  solvedAt: string; // YYYY-MM-DD
}

export interface LeetCodeSyncSummary {
  totalOnProfile: number;
  retrievedCount: number;
  importedCount: number;
  alreadyExistingCount: number;
  unretrievableCount: number;
  timestamp: string; // ISO format
  limitationNotice?: string;
}

export interface LeetCodeConnection {
  username: string;
  isConnected: boolean;
  lastSyncTime: string | null; // ISO string
  profile?: LeetCodeProfile;
  lastSyncSummary?: LeetCodeSyncSummary;
}

export interface LeetCodeSyncApiResponse {
  success: boolean;
  error?: string;
  profile?: LeetCodeProfile;
  retrievedProblems?: LeetCodeRetrievedProblem[];
  meta?: {
    totalProfileSolved: number;
    retrievedCount: number;
    unretrievableCount: number;
    limitationNotice: string;
  };
}

