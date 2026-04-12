import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type { Chunk } from "./types";
import { insertChunks } from "./vectorStore";

const EMBEDDING_MODEL = "text-embedding-3-small";
const MAX_BATCH_SIZE = 2048;

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const client = getClient();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    const sorted = response.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d) => d.embedding));
  }

  return allEmbeddings;
}

export async function embedAndStoreChunks(
  sourceId: string,
  sourceType: string,
  chunks: Chunk[],
  onProgress?: (embedded: number, total: number) => void,
): Promise<{ chunkCount: number }> {
  const texts = chunks.map((c) => c.content);
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const batchEmbeddings = await embedTexts(batch);
    allEmbeddings.push(...batchEmbeddings);
    onProgress?.(allEmbeddings.length, texts.length);
  }

  await insertChunks(sourceId, sourceType, chunks, allEmbeddings);

  return { chunkCount: chunks.length };
}
