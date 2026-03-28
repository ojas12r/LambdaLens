import { Index } from "@upstash/vector";

let _vectorIndex: Index | null = null;

export function getVectorIndex(): Index {
  if (!_vectorIndex) {
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      throw new Error("Missing Upstash Vector environment variables");
    }
    _vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return _vectorIndex;
}

/**
 * Store an anomaly description as a vector for semantic search.
 * Upstash Vector supports raw text with built-in embedding models,
 * so we don't need to compute embeddings ourselves.
 */
export async function upsertAnomaly(
  id: string,
  description: string,
  metadata: Record<string, unknown>
) {
  await getVectorIndex().upsert({
    id,
    // Upstash Vector with built-in embeddings accepts `data` as raw text
    data: description,
    metadata,
  });
}

/**
 * Search for similar past anomalies to provide context to the agent.
 */
export async function searchSimilarAnomalies(
  queryText: string,
  topK = 5
): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
  const results = await getVectorIndex().query({
    data: queryText,
    topK,
    includeMetadata: true,
  });

  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
  }));
}
