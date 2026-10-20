import { Problem, RevisionItem, LeetCodeConnection } from '@/types';

const STORAGE_KEY_PROBLEMS = 'leettrack_user_problems_v1';
const STORAGE_KEY_REVISIONS = 'leettrack_user_revisions_v1';
const STORAGE_KEY_LEETCODE = 'leettrack_leetcode_connection_v1';

let cachedTodayStr = '';
let cachedTodayMidnight = 0;
let cachedDateDay = -1;

function getTodayMidnight() {
  if (typeof window === 'undefined') {
    return { todayStr: '2026-10-20', todayMidnight: 1792454400000 };
  }
  const now = new Date();
  const day = now.getDate();
  if (cachedDateDay === day && cachedTodayStr) {
    return { todayStr: cachedTodayStr, todayMidnight: cachedTodayMidnight };
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  cachedTodayStr = `${year}-${month}-${dayStr}`;
  cachedTodayMidnight = new Date(cachedTodayStr + 'T00:00:00').getTime();
  cachedDateDay = day;
  return { todayStr: cachedTodayStr, todayMidnight: cachedTodayMidnight };
}

/**
 * Returns today's date in local YYYY-MM-DD format (SSR safe and cached)
 */
export function getTodayDateString(): string {
  return getTodayMidnight().todayStr;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Calculates human-readable due date label based on scheduled date (O(1) cached computation)
 */
export function formatDueDate(scheduledDate: string): string {
  if (!scheduledDate) return 'Unscheduled';
  if (typeof window === 'undefined') return 'Scheduled';

  const { todayStr, todayMidnight } = getTodayMidnight();
  if (scheduledDate === todayStr) return 'Today';

  const targetMidnight = new Date(scheduledDate + 'T00:00:00').getTime();
  const diffDays = Math.round((targetMidnight - todayMidnight) / ONE_DAY_MS);

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return 'Overdue';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  const target = new Date(targetMidnight);
  return `${MONTH_NAMES[target.getMonth()]} ${target.getDate()}`;
}

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formattedLongDateCache = new Map<string, string>();
const formattedDateTimeCache = new Map<string, string>();

/**
 * Safely formats a YYYY-MM-DD or ISO string into "Month D, YYYY" (e.g. "October 10, 2026").
 * Safely handles invalid or missing dates without throwing. Cached for O(1) performance.
 */
export function formatLongDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return 'No date recorded';
  const trimmed = dateStr.trim();
  if (!trimmed) return 'No date recorded';

  const cached = formattedLongDateCache.get(trimmed);
  if (cached) return cached;

  let formatted = trimmed;

  // Fast path for YYYY-MM-DD without timezone shifts
  const dateOnly = trimmed.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12 && d >= 1 && d <= 31) {
      formatted = `${FULL_MONTH_NAMES[m]} ${d}, ${y}`;
      if (formattedLongDateCache.size < 500) {
        formattedLongDateCache.set(trimmed, formatted);
      }
      return formatted;
    }
  }

  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      formatted = `${FULL_MONTH_NAMES[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`;
    }
  } catch {
    // fallback
  }

  if (formattedLongDateCache.size < 500) {
    formattedLongDateCache.set(trimmed, formatted);
  }
  return formatted;
}

/**
 * Formats an ISO string or date into "Month D, YYYY at h:mm AM/PM" (or date-only if no time).
 * Safely handles invalid or missing dates without throwing. Cached for O(1) performance.
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return 'No date recorded';
  const trimmed = dateStr.trim();
  if (!trimmed) return 'No date recorded';

  const cached = formattedDateTimeCache.get(trimmed);
  if (cached) return cached;

  let formatted = '';

  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const month = FULL_MONTH_NAMES[d.getMonth()];
      const day = d.getDate();
      const year = d.getFullYear();

      // Check if time information is present
      if (trimmed.includes('T') || trimmed.includes(':')) {
        let hours = d.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const minutes = String(d.getMinutes()).padStart(2, '0');
        formatted = `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
      } else {
        formatted = `${month} ${day}, ${year}`;
      }
    }
  } catch {
    // fallback
  }

  if (!formatted) {
    formatted = formatLongDate(trimmed);
  }

  if (formattedDateTimeCache.size < 500) {
    formattedDateTimeCache.set(trimmed, formatted);
  }
  return formatted;
}

export const KNOWN_PROBLEM_SLUG_MAP: Record<string, number> = {
  'two-sum': 1,
  'add-two-numbers': 2,
  'longest-substring-without-repeating-characters': 3,
  'median-of-two-sorted-arrays': 4,
  'longest-palindromic-substring': 5,
  'zigzag-conversion': 6,
  'reverse-integer': 7,
  'string-to-integer-atoi': 8,
  'palindrome-number': 9,
  'regular-expression-matching': 10,
  'container-with-most-water': 11,
  'integer-to-roman': 12,
  'roman-to-integer': 13,
  'longest-common-prefix': 14,
  '3sum': 15,
  '3sum-closest': 16,
  'letter-combinations-of-a-phone-number': 17,
  '4sum': 18,
  'remove-nth-node-from-end-of-list': 19,
  'valid-parentheses': 20,
  'merge-two-sorted-lists': 21,
  'generate-parentheses': 22,
  'merge-k-sorted-lists': 23,
  'swap-nodes-in-pairs': 24,
  'reverse-nodes-in-k-group': 25,
  'remove-duplicates-from-sorted-array': 26,
  'remove-element': 27,
  'find-the-index-of-the-first-occurrence-in-a-string': 28,
  'divide-two-integers': 29,
  'substring-with-concatenation-of-all-words': 30,
  'next-permutation': 31,
  'longest-valid-parentheses': 32,
  'search-in-rotated-sorted-array': 33,
  'find-first-and-last-position-of-element-in-sorted-array': 34,
  'search-insert-position': 35,
  'valid-sudoku': 36,
  'sudoku-solver': 37,
  'count-and-say': 38,
  'combination-sum': 39,
  'combination-sum-ii': 40,
  'first-missing-positive': 41,
  'trapping-rain-water': 42,
  'multiply-strings': 43,
  'wildcard-matching': 44,
  'jump-game-ii': 45,
  'permutations': 46,
  'permutations-ii': 47,
  'rotate-image': 48,
  'group-anagrams': 49,
  'powx-n': 50,
  'maximum-subarray': 53,
  'spiral-matrix': 54,
  'jump-game': 55,
  'merge-intervals': 56,
  'insert-interval': 57,
  'length-of-last-word': 58,
  'unique-paths': 62,
  'climbing-stairs': 70,
  'edit-distance': 72,
  'set-matrix-zeroes': 73,
  'search-a-2d-matrix': 74,
  'sort-colors': 75,
  'minimum-window-substring': 76,
  'combinations': 77,
  'subsets': 78,
  'word-search': 79,
  'merge-sorted-array': 88,
  'decode-ways': 91,
  'reverse-linked-list-ii': 92,
  'binary-tree-inorder-traversal': 94,
  'validate-binary-search-tree': 98,
  'same-tree': 100,
  'symmetric-tree': 101,
  'binary-tree-level-order-traversal': 102,
  'maximum-depth-of-binary-tree': 104,
  'path-sum': 112,
  'best-time-to-buy-and-sell-stock': 121,
  'valid-palindrome': 125,
  'word-ladder': 127,
  'longest-consecutive-sequence': 128,
  'single-number': 136,
  'word-break': 139,
  'linked-list-cycle': 141,
  'lru-cache': 146,
  'reverse-words-in-a-string': 151,
  'find-minimum-in-rotated-sorted-array': 153,
  'min-stack': 155,
  'two-sum-ii-input-array-is-sorted': 167,
  'house-robber': 198,
  'number-of-islands': 200,
  'reverse-linked-list': 206,
  'course-schedule': 207,
  'implement-trie-prefix-tree': 208,
  'kth-largest-element-in-an-array': 215,
  'invert-binary-tree': 226,
  'lowest-common-ancestor-of-a-binary-search-tree': 235,
  'product-of-array-except-self': 238,
  'search-a-2d-matrix-ii': 240,
  'meeting-rooms': 252,
  'meeting-rooms-ii': 253,
  'graph-valid-tree': 261,
  'alien-dictionary': 269,
  'find-median-from-data-stream': 295,
  'longest-increasing-subsequence': 300,
  'coin-change': 322,
  'number-of-connected-components-in-an-undirected-graph': 323,
  'non-overlapping-intervals': 435,
  'target-sum': 494,
  'diameter-of-binary-tree': 543,
  'subarray-sum-equals-k': 560,
  'palindromic-substrings': 647,
  'daily-temperatures': 739,
};

/**
 * Extracts numeric LeetCode problem number from title or URL
 */
export function extractProblemNumber(titleOrUrl: string): number | undefined {
  if (!titleOrUrl) return undefined;
  const cleaned = titleOrUrl.trim();

  // 1. Check title for leading number: "1. Two Sum", "#1 Two Sum", "1 - Two Sum", "[1] Two Sum", "1 Two Sum"
  const titleMatch = cleaned.match(/^(?:#|\[)?(\d+)(?:\]|\.|\s|-)+/);
  if (titleMatch && titleMatch[1]) {
    const num = parseInt(titleMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Check if URL/slug has number prefix like "0001-two-sum" or "1-two-sum"
  const slug = extractProblemSlug(cleaned);
  if (slug) {
    const slugNumMatch = slug.match(/^(\d+)-/);
    if (slugNumMatch && slugNumMatch[1]) {
      const num = parseInt(slugNumMatch[1], 10);
      if (!isNaN(num) && num > 0) return num;
    }

    // 3. Check known problem slug map
    if (KNOWN_PROBLEM_SLUG_MAP[slug]) {
      return KNOWN_PROBLEM_SLUG_MAP[slug];
    }
  }

  return undefined;
}

/**
 * Extracts a normalized LeetCode problem slug from a URL or title
 */
export function extractProblemSlug(input: string): string {
  const cleaned = input.trim();
  if (!cleaned) return '';

  // Check if it's a URL like https://leetcode.com/problems/two-sum/...
  const urlMatch = cleaned.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }

  // Otherwise convert string into slug
  return cleaned
    .toLowerCase()
    .replace(/^#?\d+[\s.-]*/, '') // strip leading problem number if present
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Returns canonical LeetCode URL for a problem
 */
export function canonicalProblemUrl(urlOrSlugOrTitle: string): string {
  const slug = extractProblemSlug(urlOrSlugOrTitle);
  return `https://leetcode.com/problems/${slug || 'unknown'}/`;
}

/**
 * Gets unified topic labels for a problem, ensuring backwards compatibility
 */
export function getProblemTopics(problem: Partial<Problem>): string[] {
  if (!problem) return [];
  if (Array.isArray(problem.topics) && problem.topics.length > 0) {
    return problem.topics;
  }
  if (Array.isArray(problem.tags) && problem.tags.length > 0) {
    return problem.tags;
  }
  if (problem.category && problem.category.trim()) {
    return [problem.category.trim()];
  }
  return [];
}

/**
 * Safely loads user problems from localStorage
 */
export function loadStoredProblems(): Problem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROBLEMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (p) =>
            p &&
            typeof p.id === 'string' &&
            typeof p.title === 'string' &&
            (p.difficulty === 'Easy' || p.difficulty === 'Medium' || p.difficulty === 'Hard')
        )
        .map((p) => {
          // Fast path: if already normalized with frontendId and topics, return directly
          const hasFrontendId = typeof p.frontendId === 'number' && !isNaN(p.frontendId);
          const hasTopics = Array.isArray(p.topics) && p.topics.length > 0;
          if (hasFrontendId && hasTopics) {
            return p;
          }

          const topics = getProblemTopics(p);
          const frontendId =
            hasFrontendId
              ? p.frontendId
              : extractProblemNumber(p.title) || extractProblemNumber(p.url) || extractProblemNumber(p.slug || '');

          return {
            ...p,
            frontendId,
            topics: topics.length > 0 ? topics : (p.category ? [p.category] : ['General']),
            tags: topics.length > 0 ? topics : (p.category ? [p.category] : ['General']),
          };
        });
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse stored problems from localStorage:', err);
    return [];
  }
}

/**
 * Safely saves user problems to localStorage
 */
export function saveStoredProblems(problems: Problem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(problems));
  } catch (err) {
    console.warn('Unable to persist problems to browser storage (quota exceeded or disabled):', err);
  }
}

/**
 * Ensures all revisions for each individual problem have consistent, sequentially assigned revision numbers.
 * Safe migration function that preserves all existing user revision records without resetting storage.
 */
export function normalizeRevisionNumbers(revisions: RevisionItem[]): RevisionItem[] {
  if (!Array.isArray(revisions) || revisions.length === 0) return [];

  // Group by problemId while preserving order
  const problemRevisionMap = new Map<string, RevisionItem[]>();
  for (const rev of revisions) {
    let list = problemRevisionMap.get(rev.problemId);
    if (!list) {
      list = [];
      problemRevisionMap.set(rev.problemId, list);
    }
    list.push(rev);
  }

  const updatedRevisionsMap = new Map<string, RevisionItem>();

  problemRevisionMap.forEach((revList) => {
    // If all revisions already have distinct, valid revision numbers > 0, keep them
    const allHaveNumbers = revList.every(
      (r) => typeof r.revisionNumber === 'number' && !isNaN(r.revisionNumber) && r.revisionNumber > 0
    );

    if (allHaveNumbers) {
      for (const r of revList) {
        updatedRevisionsMap.set(r.id, r);
      }
      return;
    }

    // Sort chronologically and assign sequential 1, 2, 3...
    const sorted = [...revList].sort((a, b) => {
      if (a.revisionNumber && b.revisionNumber && a.revisionNumber !== b.revisionNumber) {
        return a.revisionNumber - b.revisionNumber;
      }
      const tsA = parseInt(a.id.replace(/^rev-/, '').split('-')[0], 10);
      const tsB = parseInt(b.id.replace(/^rev-/, '').split('-')[0], 10);
      if (!isNaN(tsA) && !isNaN(tsB) && tsA !== tsB) {
        return tsA - tsB;
      }
      const dateA = a.scheduledDate || '';
      const dateB = b.scheduledDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (a.completedAt || '').localeCompare(b.completedAt || '');
    });

    sorted.forEach((r, idx) => {
      const assignedNumber = r.revisionNumber && r.revisionNumber > 0 ? r.revisionNumber : idx + 1;
      updatedRevisionsMap.set(r.id, {
        ...r,
        revisionNumber: assignedNumber,
      });
    });
  });

  return revisions.map((r) => updatedRevisionsMap.get(r.id) || r);
}

/**
 * Safely loads user revisions from localStorage
 */
export function loadStoredRevisions(): RevisionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVISIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(
        (r) =>
          r &&
          typeof r.id === 'string' &&
          typeof r.problemId === 'string' &&
          typeof r.scheduledDate === 'string'
      );
      return normalizeRevisionNumbers(valid);
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse stored revisions from localStorage:', err);
    return [];
  }
}

/**
 * Safely saves user revisions to localStorage
 */
export function saveStoredRevisions(revisions: RevisionItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(revisions));
  } catch (err) {
    console.warn('Unable to persist revisions to browser storage (quota exceeded or disabled):', err);
  }
}

/**
 * Loads stored workspace mode preference ('user')
 */
export function loadStoredMode(): 'user' | 'demo' {
  return 'user';
}

/**
 * Saves stored workspace mode preference (no-op in production)
 */
export function saveStoredMode(): void {
  // Production application strictly runs in user mode
}

/**
 * Safely loads LeetCode connection data from localStorage
 */
export function loadStoredLeetCodeConnection(): LeetCodeConnection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEETCODE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string') {
      return parsed as LeetCodeConnection;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse LeetCode connection from localStorage:', err);
    return null;
  }
}

/**
 * Safely saves LeetCode connection data to localStorage
 */
export function saveStoredLeetCodeConnection(connection: LeetCodeConnection | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!connection) {
      localStorage.removeItem(STORAGE_KEY_LEETCODE);
    } else {
      localStorage.setItem(STORAGE_KEY_LEETCODE, JSON.stringify(connection));
    }
  } catch (err) {
    console.error('Failed to save LeetCode connection to localStorage:', err);
  }
}

/**
 * Formats a sync timestamp into a clean, human-readable format
 */
export function formatSyncTimestamp(isoStr: string | null | undefined): string {
  if (!isoStr) return 'Never synced';
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return 'Never synced';

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  } catch {
    return 'Never synced';
  }
}

/**
 * Formats a timestamp into relative time string (e.g. "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatSyncTimestamp(isoStr);
  } catch {
    return '';
  }
}

