import OpenAI from "openai";
import { EXTRACTION_MODEL } from "./config";

interface BatchRequest {
  customId: string;
  systemPrompt: string;
  userContent: string;
  model?: string;
  maxTokens?: number;
}

export interface BatchResultEntry {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

export function buildBatchJsonl(requests: BatchRequest[]): string {
  return requests
    .map((req) =>
      JSON.stringify({
        custom_id: req.customId,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: req.model ?? EXTRACTION_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: req.systemPrompt },
            { role: "user", content: req.userContent },
          ],
          max_completion_tokens: req.maxTokens ?? 4096,
        },
      }),
    )
    .join("\n");
}

export async function submitBatch(
  jsonlContent: string,
  endpoint: string = "/v1/chat/completions",
): Promise<string> {
  const client = getClient();

  const blob = new Blob([jsonlContent], { type: "application/jsonl" });
  const file = await client.files.create({
    purpose: "batch",
    file: blob as any,
  });

  const batch = await client.batches.create({
    input_file_id: file.id,
    endpoint: endpoint as any,
    completion_window: "24h",
  });

  return batch.id;
}

export async function checkBatchStatus(
  batchId: string,
): Promise<{
  status: string;
  outputFileId: string | null;
  requestCounts: { total: number; completed: number; failed: number };
}> {
  const client = getClient();
  const batch = await client.batches.retrieve(batchId);

  return {
    status: batch.status,
    outputFileId: batch.output_file_id ?? null,
    requestCounts: {
      total: batch.request_counts?.total ?? 0,
      completed: batch.request_counts?.completed ?? 0,
      failed: batch.request_counts?.failed ?? 0,
    },
  };
}

export async function downloadBatchResults(
  outputFileId: string,
): Promise<Map<string, BatchResultEntry>> {
  const client = getClient();
  const response = await client.files.content(outputFileId);
  const text = await response.text();

  const results = new Map<string, BatchResultEntry>();
  for (const line of text.split("\n").filter(Boolean)) {
    const parsed = JSON.parse(line);
    const customId = parsed.custom_id;
    const content =
      parsed.response?.body?.choices?.[0]?.message?.content ?? null;
    if (customId && content) {
      const usage = parsed.response?.body?.usage;
      results.set(customId, {
        content,
        usage: usage
          ? {
              prompt_tokens: usage.prompt_tokens ?? 0,
              completion_tokens: usage.completion_tokens ?? 0,
            }
          : undefined,
      });
    }
  }

  return results;
}

export async function pollBatchUntilComplete(
  batchId: string,
  pollIntervalMs: number = 30_000,
  maxWaitMs: number = 3_600_000,
): Promise<Map<string, BatchResultEntry>> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkBatchStatus(batchId);

    if (status.status === "completed" && status.outputFileId) {
      return downloadBatchResults(status.outputFileId);
    }

    if (status.status === "failed" || status.status === "cancelled" || status.status === "expired") {
      throw new Error(`Batch ${batchId} ended with status: ${status.status}`);
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`Batch ${batchId} did not complete within ${maxWaitMs}ms`);
}
