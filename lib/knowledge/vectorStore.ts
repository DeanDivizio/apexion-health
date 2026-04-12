import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Chunk, VectorChunk } from "./types";

const TABLE = "knowledge_chunks";

export async function insertChunks(
  sourceId: string,
  sourceType: string,
  chunks: Chunk[],
  embeddings: number[][],
): Promise<void> {
  const supabase = createSupabaseServerClient();

  const rows = chunks.map((chunk, i) => ({
    source_id: sourceId,
    source_type: sourceType,
    chunk_index: chunk.index,
    content: chunk.content,
    embedding: JSON.stringify(embeddings[i]),
    metadata: chunk.metadata,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(TABLE).insert(batch);
    if (error) {
      throw new Error(`Failed to insert chunks batch ${i}: ${error.message}`);
    }
    console.log(`[vectorStore] Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} chunks`);
  }
}

export async function searchChunks(
  queryEmbedding: number[],
  options: {
    matchThreshold?: number;
    matchCount?: number;
    sourceType?: string;
    sourceId?: string;
  } = {},
): Promise<VectorChunk[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: options.matchThreshold ?? 0.7,
    match_count: options.matchCount ?? 10,
    filter_source_type: options.sourceType ?? null,
    filter_source_id: options.sourceId ?? null,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    sourceId: row.source_id as string,
    sourceType: row.source_type as string,
    chunkIndex: row.chunk_index as number,
    content: row.content as string,
    metadata: row.metadata as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

export async function deleteChunksBySourceId(sourceId: string): Promise<void> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("source_id", sourceId);

  if (error) {
    throw new Error(`Failed to delete chunks for source ${sourceId}: ${error.message}`);
  }
}

export async function getChunksBySourceId(sourceId: string): Promise<VectorChunk[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, source_id, source_type, chunk_index, content, metadata")
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chunks: ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    sourceId: row.source_id as string,
    sourceType: row.source_type as string,
    chunkIndex: row.chunk_index as number,
    content: row.content as string,
    metadata: row.metadata as Record<string, unknown>,
  }));
}
