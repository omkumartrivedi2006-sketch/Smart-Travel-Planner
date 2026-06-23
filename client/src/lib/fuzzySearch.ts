/**
 * Fuzzy search utility for destination search.
 *
 * Search priority:
 *  1. Exact name match
 *  2. Name starts-with query
 *  3. Partial name match (substring)
 *  4. Partial word match (any word starts with query)
 *  5. Country/region starts-with
 *  6. Fuzzy match (Levenshtein distance ≤ 2)
 */

export type MatchType =
  | "exact"
  | "starts-with"
  | "partial"
  | "word-starts"
  | "country"
  | "fuzzy";

export interface SearchResult<T> {
  item: T;
  matchType: MatchType;
  score: number; // lower = better
}

/** Compute Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Search destinations by query string with ranked results.
 *
 * @param query - Search string (can be partial, fuzzy, mixed case)
 * @param items - Array of items to search
 * @param getName - Function to extract the name from an item
 * @param getCountry - Optional function to extract country from an item
 * @param limit - Max results to return (default 50)
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getName: (item: T) => string,
  getCountry?: (item: T) => string,
  limit = 50
): SearchResult<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit).map((item) => ({ item, matchType: "partial", score: 999 }));

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const name = getName(item).toLowerCase();
    const country = getCountry ? getCountry(item).toLowerCase() : "";

    let matchType: MatchType | null = null;
    let score = Infinity;

    if (name === q) {
      matchType = "exact";
      score = 0;
    } else if (name.startsWith(q)) {
      matchType = "starts-with";
      score = 1 + name.length - q.length;
    } else if (name.includes(q)) {
      matchType = "partial";
      score = 10 + name.indexOf(q);
    } else {
      // Word-level: any word in name starts with query
      const words = name.split(/[\s,\-]+/);
      const wordMatch = words.some((w) => w.startsWith(q));
      if (wordMatch) {
        matchType = "word-starts";
        score = 20;
      } else if (country && (country.startsWith(q) || country.includes(q))) {
        matchType = "country";
        score = 30;
      } else {
        // Fuzzy: check Levenshtein on name and on each word
        const dist = levenshtein(q, name.substring(0, q.length + 2));
        const wordDist = Math.min(...words.map((w) => levenshtein(q, w.substring(0, q.length + 2))));
        const bestDist = Math.min(dist, wordDist);
        if (bestDist <= Math.max(1, Math.floor(q.length / 3))) {
          matchType = "fuzzy";
          score = 50 + bestDist * 10;
        }
      }
    }

    if (matchType !== null) {
      results.push({ item, matchType, score });
    }
  }

  // Sort by score ascending
  results.sort((a, b) => a.score - b.score);
  return results.slice(0, limit);
}

/**
 * Get autocomplete suggestions for a query.
 * Returns top results with their names highlighted.
 */
export function getSuggestions<T>(
  query: string,
  items: T[],
  getName: (item: T) => string,
  getCountry?: (item: T) => string,
  limit = 8
): Array<SearchResult<T> & { highlightedName: string }> {
  const results = fuzzySearch(query, items, getName, getCountry, limit);
  const q = query.trim().toLowerCase();

  return results.map((r) => {
    const name = getName(r.item);
    const lname = name.toLowerCase();
    const idx = lname.indexOf(q);
    let highlightedName = name;
    if (idx !== -1) {
      highlightedName =
        name.slice(0, idx) +
        `<mark>${name.slice(idx, idx + q.length)}</mark>` +
        name.slice(idx + q.length);
    }
    return { ...r, highlightedName };
  });
}

/**
 * Rank a list of pre-filtered items by how well they match the query.
 */
export function rankByQuery<T>(
  query: string,
  items: T[],
  getName: (item: T) => string
): T[] {
  if (!query.trim()) return items;
  const results = fuzzySearch(query, items, getName);
  const rankedIds = new Set(results.map((r) => getName(r.item)));
  const ranked = results.map((r) => r.item);
  const rest = items.filter((item) => !rankedIds.has(getName(item)));
  return [...ranked, ...rest];
}
