import { SERPAPI_KEY } from "../../utils/env/env";
import logger from "../../config/logger";

export type WebSearchResult = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  favicon?: string;
};

export async function webSearch(query: string, numResults: number = 5): Promise<WebSearchResult[]> {
  if (!SERPAPI_KEY) {
    logger.warn({ query }, "webSearch skipped: SERPAPI_KEY not set");
    return [];
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: SERPAPI_KEY,
    num: String(numResults),
  });

  const fetchFn = (globalThis as any).fetch as typeof fetch | undefined;
  if (!fetchFn) {
    logger.warn({ query }, "webSearch skipped: fetch not available in runtime");
    return [];
  }

  const startedAt = Date.now();
  logger.info({ query, numResults }, "webSearch: starting request");
  const resp = await fetchFn(`https://serpapi.com/search.json?${params.toString()}`);
  if (!resp.ok) {
    logger.warn({ query, status: resp.status }, "webSearch: non-200 response");
    return [];
  }
  const data = await resp.json();

  

  const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
  console.log("organic", organic)
  const results: WebSearchResult[] = organic.slice(0, numResults).map((r: any) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    source: r.source || "Google",
    favicon: r.favicon
  }));

  const elapsedMs = Date.now() - startedAt;
  logger.info({ query, returned: results.length, elapsedMs }, "webSearch: completed");
  console.log("web search results", results)
  return results;
} 