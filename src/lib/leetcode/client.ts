import { Difficulty, LeetCodeProfile, LeetCodeRetrievedProblem } from '@/types';

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';
const REQUEST_TIMEOUT_MS = 10000;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
}

interface RawUserProfileData {
  matchedUser: {
    username: string;
    profile: {
      realName?: string;
      ranking?: number;
      userAvatar?: string;
    } | null;
    submitStatsGlobal: {
      acSubmissionNum: Array<{
        difficulty: string;
        count: number;
      }>;
    } | null;
    userCalendar: {
      streak?: number;
      totalActiveDays?: number;
    } | null;
  } | null;
  recentAcSubmissionList?: Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
  }>;
}

interface RawQuestionData {
  questionFrontendId?: string;
  difficulty?: string;
  categoryTitle?: string;
  topicTags?: Array<{ name: string }>;
}

export interface FetchLeetCodeSyncResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  profile?: LeetCodeProfile;
  retrievedProblems?: LeetCodeRetrievedProblem[];
  meta?: {
    totalProfileSolved: number;
    retrievedCount: number;
    unretrievableCount: number;
    limitationNotice: string;
  };
}

/**
 * Normalizes difficulty string from LeetCode to 'Easy' | 'Medium' | 'Hard'
 */
function normalizeDifficulty(raw?: string): Difficulty {
  if (!raw) return 'Medium';
  const lower = raw.toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'hard') return 'Hard';
  return 'Medium';
}

/**
 * Converts a Unix epoch timestamp string (in seconds) to YYYY-MM-DD
 */
function formatTimestampToDate(timestampStr: string): string {
  try {
    const timestampSec = parseInt(timestampStr, 10);
    if (isNaN(timestampSec) || timestampSec <= 0) {
      return new Date().toISOString().split('T')[0];
    }
    const d = new Date(timestampSec * 1000);
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Executes a GraphQL query against LeetCode's public endpoint with timeout and headers
 */
async function queryLeetCodeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://leetcode.com',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    throw new Error(`HTTP_ERROR_${response.status}`);
  }

  const data = (await response.json()) as GraphQLResponse<T>;
  return data;
}

/**
 * Batches question metadata queries using GraphQL aliases
 */
async function batchFetchQuestionMetadata(slugs: string[]): Promise<Map<string, RawQuestionData>> {
  const metadataMap = new Map<string, RawQuestionData>();
  if (slugs.length === 0) return metadataMap;

  // Process in chunks of 25 to respect query complexity limits
  const CHUNK_SIZE = 25;
  for (let i = 0; i < slugs.length; i += CHUNK_SIZE) {
    const chunk = slugs.slice(i, i + CHUNK_SIZE);

    // Build aliased fields: q_0: question(titleSlug: "two-sum") { ... }
    const fieldQueries = chunk
      .map((slug, idx) => {
        // Slugs are strictly sanitized to prevent GraphQL syntax manipulation
        const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
        return `q_${idx}: question(titleSlug: "${safeSlug}") {
          questionFrontendId
          difficulty
          categoryTitle
          topicTags { name }
        }`;
      })
      .join('\n');

    const batchQuery = `query BatchQuestionsQuery { ${fieldQueries} }`;

    try {
      const result = await queryLeetCodeGraphQL<Record<string, RawQuestionData | null>>(batchQuery);
      if (result.data) {
        chunk.forEach((slug, idx) => {
          const item = result.data?.[`q_${idx}`];
          if (item) {
            metadataMap.set(slug, item);
          }
        });
      }
    } catch (err) {
      console.warn(`[LeetTrack] Batch question metadata fetch failed for chunk starting at ${i}:`, err);
      // Fallback: individual question enrichment could be attempted if needed, but continuing
    }
  }

  return metadataMap;
}

/**
 * Main entry point: Retrieves profile statistics and confirmed recent accepted problems
 * for a LeetCode username via public unauthenticated GraphQL endpoints.
 */
export async function fetchLeetCodeSyncData(username: string): Promise<FetchLeetCodeSyncResult> {
  const cleanedUsername = username.trim();

  // Validate handle format
  if (!cleanedUsername) {
    return {
      success: false,
      statusCode: 400,
      error: 'Username cannot be empty.',
    };
  }

  if (!/^[a-zA-Z0-9_-]{1,60}$/.test(cleanedUsername)) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid LeetCode username format. Use letters, numbers, underscores, and hyphens.',
    };
  }

  const profileQuery = `
    query getLeetCodeProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          ranking
          userAvatar
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        userCalendar {
          streak
          totalActiveDays
        }
      }
      recentAcSubmissionList(username: $username, limit: 50) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const rawResult = await queryLeetCodeGraphQL<RawUserProfileData>(profileQuery, {
      username: cleanedUsername,
    });

    // Check for user existence
    if (
      !rawResult.data?.matchedUser ||
      (rawResult.errors && rawResult.errors.some((e) => e.message?.toLowerCase().includes('user does not exist')))
    ) {
      return {
        success: false,
        statusCode: 404,
        error: `LeetCode user "${cleanedUsername}" does not exist. Please check your username.`,
      };
    }

    const matchedUser = rawResult.data.matchedUser;
    const rawStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];

    const getCount = (diff: string): number => {
      const match = rawStats.find((s) => s.difficulty.toLowerCase() === diff.toLowerCase());
      return match ? match.count : 0;
    };

    const totalSolvedOnProfile = getCount('all');
    const easyCount = getCount('easy');
    const mediumCount = getCount('medium');
    const hardCount = getCount('hard');

    const profile: LeetCodeProfile = {
      username: matchedUser.username,
      realName: matchedUser.profile?.realName || undefined,
      userAvatar: matchedUser.profile?.userAvatar || undefined,
      ranking: matchedUser.profile?.ranking || undefined,
      streak: matchedUser.userCalendar?.streak || 0,
      totalActiveDays: matchedUser.userCalendar?.totalActiveDays || 0,
      solvedStats: {
        all: totalSolvedOnProfile,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
      },
    };

    // Extract recent accepted submissions and deduplicate by titleSlug (keeping newest)
    const rawSubmissions = rawResult.data.recentAcSubmissionList || [];
    const uniqueSlugsMap = new Map<string, { title: string; timestamp: string }>();

    for (const sub of rawSubmissions) {
      if (!sub.titleSlug) continue;
      const slug = sub.titleSlug.toLowerCase();
      // Since recentAcSubmissionList is sorted newest to oldest, keep the first occurrence
      if (!uniqueSlugsMap.has(slug)) {
        uniqueSlugsMap.set(slug, {
          title: sub.title || slug,
          timestamp: sub.timestamp,
        });
      }
    }

    const uniqueSlugs = Array.from(uniqueSlugsMap.keys());

    // Enrich questions with frontendId, category, tags, and difficulty
    const questionMetadata = await batchFetchQuestionMetadata(uniqueSlugs);

    const retrievedProblems: LeetCodeRetrievedProblem[] = uniqueSlugs.map((slug) => {
      const basic = uniqueSlugsMap.get(slug)!;
      const meta = questionMetadata.get(slug);

      const frontendIdNum = meta?.questionFrontendId
        ? parseInt(meta.questionFrontendId, 10)
        : undefined;

      const difficulty = normalizeDifficulty(meta?.difficulty);
      const category = meta?.categoryTitle || 'Algorithms';
      const tags = meta?.topicTags?.map((t) => t.name) || [category];

      return {
        title: basic.title,
        slug,
        url: `https://leetcode.com/problems/${slug}/`,
        frontendId: isNaN(frontendIdNum as number) ? undefined : frontendIdNum,
        difficulty,
        category,
        tags,
        solvedAt: formatTimestampToDate(basic.timestamp),
      };
    });

    const unretrievableCount = Math.max(0, totalSolvedOnProfile - retrievedProblems.length);

    return {
      success: true,
      statusCode: 200,
      profile,
      retrievedProblems,
      meta: {
        totalProfileSolved: totalSolvedOnProfile,
        retrievedCount: retrievedProblems.length,
        unretrievableCount,
        limitationNotice:
          'LeetCode public GraphQL limits unauthenticated access to recent accepted submissions (~20-50). Complete historical archives require private session authentication which LeetTrack avoids for your security.',
      },
    };
  } catch (error: unknown) {
    const err = error as Error;

    if (err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return {
        success: false,
        statusCode: 504,
        error: 'LeetCode request timed out after 10 seconds. LeetCode may be experiencing delays; please try again.',
      };
    }

    if (err.message === 'RATE_LIMITED' || err.message?.includes('429')) {
      return {
        success: false,
        statusCode: 429,
        error: 'LeetCode rate limit encountered. Please wait a moment before trying again.',
      };
    }

    console.error('[LeetTrack] LeetCode sync error:', err);
    return {
      success: false,
      statusCode: 500,
      error: 'Unable to connect to LeetCode public API. Please verify your internet connection and try again.',
    };
  }
}
