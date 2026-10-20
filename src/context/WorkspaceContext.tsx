'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Problem, RevisionItem, WorkspaceStats, Difficulty, LeetCodeConnection, LeetCodeSyncSummary, LeetCodeSyncApiResponse } from '@/types';
import {
  loadStoredProblems,
  saveStoredProblems,
  loadStoredRevisions,
  saveStoredRevisions,
  loadStoredLeetCodeConnection,
  saveStoredLeetCodeConnection,
  canonicalProblemUrl,
  extractProblemSlug,
  extractProblemNumber,
  formatDueDate,
  getTodayDateString,
} from '@/lib/storage';

export interface AddProblemInput {
  title: string;
  url: string;
  difficulty: Difficulty;
  solvedAt: string;
  frontendId?: number;
  category?: string;
  tags?: string[];
  topics?: string[];
  timeSpentMinutes?: number;
  initialRevisionDate?: string;
}

interface WorkspaceContextType {
  isDemo?: boolean;
  toggleDemoMode?: (demo: boolean) => void;
  problems: Problem[];
  revisions: RevisionItem[];
  stats: WorkspaceStats;
  userProblemsCount: number;
  leetCodeConnection: LeetCodeConnection | null;
  isSyncingLeetCode: boolean;
  syncLeetCodeAccount: (username: string) => Promise<{ success: boolean; error?: string; summary?: LeetCodeSyncSummary }>;
  disconnectLeetCodeAccount: () => void;
  addProblem: (input: AddProblemInput) => { success: boolean; error?: string; problem?: Problem };
  updateProblem: (id: string, updates: Partial<Problem>) => { success: boolean; error?: string };
  deleteProblem: (id: string) => void;
  scheduleRevision: (problemId: string, scheduledDate: string, intervalStep?: string, notes?: string) => { success: boolean; error?: string };
  completeRevision: (revisionId: string, completionTimestamp?: string) => void;
  rescheduleRevision: (revisionId: string, newDate: string) => void;
  cancelRevision: (revisionId: string) => void;
  getProblemById: (id: string) => Problem | undefined;
  getRevisionsForProblem: (problemId: string) => RevisionItem[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure persistent state from localStorage
  const [userProblems, setUserProblems] = useState<Problem[]>(() => {
    return loadStoredProblems();
  });

  const [userRevisions, setUserRevisions] = useState<RevisionItem[]>(() => {
    return loadStoredRevisions();
  });

  const [leetCodeConnection, setLeetCodeConnection] = useState<LeetCodeConnection | null>(() => {
    return loadStoredLeetCodeConnection();
  });
  const [isSyncingLeetCode, setIsSyncingLeetCode] = useState<boolean>(false);

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Sync userProblems to localStorage (skips redundant write on initial mount)
  useEffect(() => {
    if (!isMounted.current) {
      return;
    }
    saveStoredProblems(userProblems);
  }, [userProblems]);

  // Sync userRevisions to localStorage (skips redundant write on initial mount)
  useEffect(() => {
    if (!isMounted.current) {
      return;
    }
    saveStoredRevisions(userRevisions);
  }, [userRevisions]);

  // Sync leetCodeConnection to localStorage (skips redundant write on initial mount)
  useEffect(() => {
    if (!isMounted.current) {
      return;
    }
    saveStoredLeetCodeConnection(leetCodeConnection);
  }, [leetCodeConnection]);

  // Active revisions with human-readable due date computed
  const activeRevisions = useMemo(() => {
    return userRevisions.map((rev) => ({
      ...rev,
      dueDate: formatDueDate(rev.scheduledDate),
    }));
  }, [userRevisions]);

  const getProblemById = useCallback((id: string): Problem | undefined => {
    return userProblems.find((p) => p.id === id);
  }, [userProblems]);

  // Add problem with duplicate prevention
  const addProblem = useCallback((input: AddProblemInput): { success: boolean; error?: string; problem?: Problem } => {
    const title = input.title.trim();
    const rawUrl = input.url.trim();

    if (!title) {
      return { success: false, error: 'Problem title is required.' };
    }
    if (!rawUrl) {
      return { success: false, error: 'LeetCode problem URL is required.' };
    }

    const canonicalUrl = canonicalProblemUrl(rawUrl);
    const slug = extractProblemSlug(rawUrl) || extractProblemSlug(title);

    // Check duplicate URL, slug, or title against stored problems
    const duplicate = userProblems.find(
      (p) =>
        p.url.toLowerCase() === canonicalUrl.toLowerCase() ||
        (p.slug && slug && p.slug.toLowerCase() === slug.toLowerCase()) ||
        p.title.toLowerCase() === title.toLowerCase()
    );

    if (duplicate) {
      return {
        success: false,
        error: `Problem "${duplicate.title}" (${canonicalUrl}) already exists in your workspace.`,
      };
    }

    const rawTopics = input.topics && input.topics.length > 0
      ? input.topics
      : input.tags && input.tags.length > 0
      ? input.tags
      : input.category ? [input.category] : [];
    const cleanTopics = Array.from(new Set(rawTopics.map((t) => t.trim()).filter(Boolean)));
    const finalTopics = cleanTopics.length > 0 ? cleanTopics : ['General'];

    const frontendId =
      typeof input.frontendId === 'number' && !isNaN(input.frontendId) && input.frontendId > 0
        ? input.frontendId
        : extractProblemNumber(title) || extractProblemNumber(rawUrl) || extractProblemNumber(slug);

    const newProblem: Problem = {
      id: `prob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      frontendId,
      title,
      url: canonicalUrl,
      slug,
      difficulty: input.difficulty,
      category: input.category?.trim() || finalTopics[0] || 'Algorithms',
      tags: finalTopics,
      topics: finalTopics,
      solvedAt: input.solvedAt || getTodayDateString(),
      timeSpentMinutes: input.timeSpentMinutes || 20,
      revisionCount: 0,
      isDemo: false,
    };

    setUserProblems((prev) => [newProblem, ...prev]);

    // Schedule initial revision if requested
    if (input.initialRevisionDate) {
      const newRev: RevisionItem = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        problemId: newProblem.id,
        problemTitle: newProblem.title,
        problemUrl: newProblem.url,
        frontendId: newProblem.frontendId,
        difficulty: newProblem.difficulty,
        category: newProblem.category,
        revisionNumber: 1,
        scheduledDate: input.initialRevisionDate,
        dueDate: formatDueDate(input.initialRevisionDate),
        intervalStep: '1st review (24h)',
        status: 'pending',
        isDemo: false,
      };

      setUserRevisions((prev) => [newRev, ...prev]);
    }

    return { success: true, problem: newProblem };
  }, [userProblems]);

  // Update existing problem
  const updateProblem = useCallback((id: string, updates: Partial<Problem>): { success: boolean; error?: string } => {
    const existing = userProblems.find((p) => p.id === id);

    if (!existing) {
      return { success: false, error: 'Problem not found.' };
    }

    // If URL or title changed, verify duplicate
    if (updates.url || updates.title) {
      const checkUrl = updates.url ? canonicalProblemUrl(updates.url) : existing.url;
      const checkTitle = updates.title ? updates.title.trim() : existing.title;
      const checkSlug = updates.url ? extractProblemSlug(updates.url) : existing.slug;

      const duplicate = userProblems.find(
        (p) =>
          p.id !== id &&
          (p.url.toLowerCase() === checkUrl.toLowerCase() ||
            (p.slug && checkSlug && p.slug.toLowerCase() === checkSlug.toLowerCase()) ||
            p.title.toLowerCase() === checkTitle.toLowerCase())
      );

      if (duplicate) {
        return {
          success: false,
          error: `Another problem with this URL or title already exists ("${duplicate.title}").`,
        };
      }
    }

    // Merge topics and tags
    let updatedTopics: string[] | undefined = undefined;
    if (updates.topics) {
      updatedTopics = Array.from(new Set(updates.topics.map((t) => t.trim()).filter(Boolean)));
    } else if (updates.tags) {
      updatedTopics = Array.from(new Set(updates.tags.map((t) => t.trim()).filter(Boolean)));
    }

    const mergedUpdates: Partial<Problem> = {
      ...updates,
      ...(updatedTopics ? { topics: updatedTopics, tags: updatedTopics } : {}),
    };

    setUserProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...mergedUpdates } : p))
    );

    // Cascade updates to revisions
    setUserRevisions((prev) =>
      prev.map((r) => {
        if (r.problemId === id) {
          return {
            ...r,
            problemTitle: updates.title ?? r.problemTitle,
            difficulty: updates.difficulty ?? r.difficulty,
            problemUrl: updates.url ? canonicalProblemUrl(updates.url) : r.problemUrl,
            category: updates.category ?? r.category,
          };
        }
        return r;
      })
    );

    return { success: true };
  }, [userProblems]);

  // Delete problem and cascade delete revisions
  const deleteProblem = useCallback((id: string) => {
    setUserProblems((prev) => prev.filter((p) => p.id !== id));
    setUserRevisions((prev) => prev.filter((r) => r.problemId !== id));
  }, []);

  // Schedule revision for any problem on a specific date (supports unlimited revisions with consistent numbering)
  const scheduleRevision = useCallback(
    (problemId: string, scheduledDate: string, intervalStep?: string, notes?: string): { success: boolean; error?: string } => {
      const problem = userProblems.find((p) => p.id === problemId);
      if (!problem) {
        return { success: false, error: 'Problem not found.' };
      }
      if (!scheduledDate) {
        return { success: false, error: 'Scheduled date is required.' };
      }

      // Calculate next sequential revision number for this individual problem
      const existingForProblem = userRevisions.filter((r) => r.problemId === problemId);
      const maxRevNum = existingForProblem.reduce(
        (max, r) => Math.max(max, typeof r.revisionNumber === 'number' ? r.revisionNumber : 0),
        0
      );
      const nextRevNum = Math.max(maxRevNum, existingForProblem.length) + 1;

      const newRev: RevisionItem = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        problemId: problem.id,
        problemTitle: problem.title,
        problemUrl: problem.url,
        frontendId: problem.frontendId,
        difficulty: problem.difficulty,
        category: problem.category,
        revisionNumber: nextRevNum,
        scheduledDate,
        dueDate: formatDueDate(scheduledDate),
        intervalStep: intervalStep || `Revision ${nextRevNum}`,
        status: 'pending',
        notes: notes?.trim() || undefined,
        isDemo: false,
      };

      setUserRevisions((prev) => [newRev, ...prev]);
      setUserProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, nextRevisionDate: scheduledDate } : p))
      );

      return { success: true };
    },
    [userProblems, userRevisions]
  );

  // Complete a revision: records actual completion timestamp, preserves original scheduled date & solve date
  const completeRevision = useCallback(
    (revisionId: string, completionTimestamp?: string) => {
      const rev = userRevisions.find((r) => r.id === revisionId);
      if (!rev) return;

      const actualCompletionTime = completionTimestamp || new Date().toISOString();

      setUserRevisions((prev) =>
        prev.map((r) =>
          r.id === revisionId
            ? {
                ...r,
                status: 'completed' as const,
                completedAt: actualCompletionTime,
              }
            : r
        )
      );

      // Increment review counter while strictly preserving problem.solvedAt (original solve date)
      setUserProblems((prev) =>
        prev.map((p) => {
          if (p.id === rev.problemId) {
            const problemRevs = userRevisions.filter((r) => r.problemId === rev.problemId);
            const totalCompleted = problemRevs.filter(
              (r) => r.id === revisionId || r.status === 'completed'
            ).length;
            return {
              ...p,
              revisionCount: totalCompleted,
            };
          }
          return p;
        })
      );
    },
    [userRevisions]
  );

  // Reschedule a revision: updates date in-place without creating duplicate
  const rescheduleRevision = useCallback(
    (revisionId: string, newDate: string) => {
      if (!newDate) return;

      setUserRevisions((prev) =>
        prev.map((r) =>
          r.id === revisionId
            ? {
                ...r,
                scheduledDate: newDate,
                dueDate: formatDueDate(newDate),
                status: 'pending' as const,
              }
            : r
        )
      );
    },
    []
  );

  // Cancel a revision: marks status as cancelled so it remains identifiable in problem history
  const cancelRevision = useCallback(
    (revisionId: string) => {
      setUserRevisions((prev) =>
        prev.map((r) =>
          r.id === revisionId
            ? {
                ...r,
                status: 'cancelled' as const,
              }
            : r
        )
      );
    },
    []
  );

  // Synchronize with public LeetCode profile
  const syncLeetCodeAccount = useCallback(
    async (
      rawUsername: string
    ): Promise<{ success: boolean; error?: string; summary?: LeetCodeSyncSummary }> => {
      const cleanUsername = rawUsername.trim();
      if (!cleanUsername) {
        return { success: false, error: 'Please enter a valid LeetCode username.' };
      }

      setIsSyncingLeetCode(true);

      try {
        const res = await fetch('/api/leetcode/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: cleanUsername }),
        });

        const data: LeetCodeSyncApiResponse = await res.json();

        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || 'Failed to sync with LeetCode. Please check your username and network.',
          };
        }

        const retrieved = data.retrievedProblems || [];
        const totalOnProfile = data.meta?.totalProfileSolved ?? 0;

        let newlyImportedCount = 0;
        let alreadyExistingCount = 0;
        const newProblemsToAdd: Problem[] = [];

        for (const item of retrieved) {
          const itemUrl = canonicalProblemUrl(item.url);
          const itemSlug = extractProblemSlug(item.url) || extractProblemSlug(item.title);

          const exists = userProblems.some(
            (p) =>
              p.url.toLowerCase() === itemUrl.toLowerCase() ||
              (p.slug && itemSlug && p.slug.toLowerCase() === itemSlug.toLowerCase()) ||
              p.title.toLowerCase() === item.title.toLowerCase()
          );

          if (exists) {
            alreadyExistingCount++;
          } else {
            newlyImportedCount++;
            const itemTopics = item.topics && item.topics.length > 0 ? item.topics : ['General'];
            const newProblem: Problem = {
              id: `prob-lc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              frontendId: item.frontendId,
              title: item.title,
              url: itemUrl,
              slug: itemSlug,
              difficulty: item.difficulty,
              category: item.category || itemTopics[0] || 'Algorithms',
              tags: itemTopics,
              topics: itemTopics,
              solvedAt: item.solvedAt,
              revisionCount: 0,
              isDemo: false,
            };
            newProblemsToAdd.push(newProblem);
          }
        }

        // Add new problems while strictly keeping existing problems and revisions intact
        if (newProblemsToAdd.length > 0) {
          setUserProblems((prev) => [...newProblemsToAdd, ...prev]);
        }

        const unretrievableCount = Math.max(0, totalOnProfile - retrieved.length);

        const summary: LeetCodeSyncSummary = {
          totalOnProfile,
          retrievedCount: retrieved.length,
          importedCount: newlyImportedCount,
          alreadyExistingCount,
          unretrievableCount,
          timestamp: new Date().toISOString(),
          limitationNotice: data.meta?.limitationNotice,
        };

        const updatedConnection: LeetCodeConnection = {
          username: data.profile?.username || cleanUsername,
          isConnected: true,
          lastSyncTime: summary.timestamp,
          profile: data.profile,
          lastSyncSummary: summary,
        };

        setLeetCodeConnection(updatedConnection);
        saveStoredLeetCodeConnection(updatedConnection);

        return {
          success: true,
          summary,
        };
      } catch (err: unknown) {
        console.error('Error during LeetCode sync:', err);
        return {
          success: false,
          error: 'An unexpected connection error occurred. Please verify your internet connection.',
        };
      } finally {
        setIsSyncingLeetCode(false);
      }
    },
    [userProblems]
  );

  // Disconnect LeetCode account (preserves all imported and manually logged problems)
  const disconnectLeetCodeAccount = useCallback(() => {
    setLeetCodeConnection(null);
    saveStoredLeetCodeConnection(null);
  }, []);

  // Derived stats accurately calculated from real user data in a single pass O(N + M)
  const stats: WorkspaceStats = useMemo(() => {
    let easy = 0;
    let med = 0;
    let hard = 0;
    for (let i = 0; i < userProblems.length; i++) {
      const diff = userProblems[i].difficulty;
      if (diff === 'Easy') easy++;
      else if (diff === 'Medium') med++;
      else if (diff === 'Hard') hard++;
    }

    let upcoming = 0;
    let completed = 0;
    for (let j = 0; j < activeRevisions.length; j++) {
      const st = activeRevisions[j].status;
      if (st === 'pending' || st === 'scheduled') upcoming++;
      else if (st === 'completed') completed++;
    }

    return {
      totalSolved: userProblems.length,
      easyCount: easy,
      mediumCount: med,
      hardCount: hard,
      upcomingRevisionsCount: upcoming,
      completedRevisionsCount: completed,
      isDemo: false,
    };
  }, [userProblems, activeRevisions]);

  const getRevisionsForProblem = useCallback(
    (problemId: string): RevisionItem[] => {
      return activeRevisions.filter((r) => r.problemId === problemId);
    },
    [activeRevisions]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        isDemo: false,
        toggleDemoMode: () => {},
        problems: userProblems,
        revisions: activeRevisions,
        stats,
        userProblemsCount: userProblems.length,
        leetCodeConnection,
        isSyncingLeetCode,
        syncLeetCodeAccount,
        disconnectLeetCodeAccount,
        addProblem,
        updateProblem,
        deleteProblem,
        scheduleRevision,
        completeRevision,
        rescheduleRevision,
        cancelRevision,
        getProblemById,
        getRevisionsForProblem,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
