import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type { TopicRelevanceResult, VideoMetadata } from "../types";
import { CLASSIFICATION_MODEL } from "../config";

const MODEL = CLASSIFICATION_MODEL;
const CONCURRENCY_LIMIT = 5;
const RETRY_DELAY_MS = 2000;

const DEFAULT_TOPIC_DOMAINS = [
  "nutrition",
  "exercise physiology",
  "sleep",
  "biomarkers",
  "supplementation",
  "recovery",
  "athletic performance",
  "metabolism",
  "hormones",
  "cardiovascular health",
  "longevity",
  "body composition",
  "gut health",
  "mental health",
  "neuroscience of performance",
];

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

export async function scoreVideoRelevance(
  video: VideoMetadata,
  topicDomains: string[] = DEFAULT_TOPIC_DOMAINS,
): Promise<TopicRelevanceResult> {
  const client = getClient();

  const prompt = `You are classifying YouTube videos for a health/fitness knowledge base. Given the video title and description, determine if this video is relevant to any of the listed topic domains.

Video title: ${video.title}
Description: ${(video.description || "").slice(0, 500)}

Topic domains: ${topicDomains.join(", ")}

Return JSON with exactly these fields:
{
  "relevanceScore": <number from 0.0 to 1.0>,
  "relevantTopics": [<list of matching topic domains from the list above>],
  "reasoning": "<one sentence>"
}

Scoring guide:
- 0.9-1.0: Episode is entirely about one or more listed topics
- 0.7-0.9: Episode is primarily about a listed topic
- 0.5-0.7: Episode touches on listed topics but isn't the main focus
- 0.3-0.5: Loosely related
- 0.0-0.3: Completely unrelated

Be generous — if the title suggests ANY meaningful discussion of a listed topic, score 0.7+.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 256,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) {
        console.error(`[topicFilter] Empty response for "${video.title}" (attempt ${attempt})`);
        continue;
      }

      const parsed = JSON.parse(rawText);
      return {
        videoId: video.videoId,
        title: video.title,
        relevanceScore: typeof parsed.relevanceScore === "number" ? parsed.relevanceScore : 0.5,
        relevantTopics: Array.isArray(parsed.relevantTopics) ? parsed.relevantTopics : [],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[topicFilter] Error scoring "${video.title}" (attempt ${attempt}): ${msg}`);
      continue;
    }
  }

  console.error(`[topicFilter] All attempts failed for "${video.title}"`);
  return {
    videoId: video.videoId,
    title: video.title,
    relevanceScore: -1,
    relevantTopics: [],
  };
}

async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return results;
}

export async function filterVideosByRelevance(
  videos: VideoMetadata[],
  topicDomains: string[] = DEFAULT_TOPIC_DOMAINS,
  threshold: number = 0.7,
): Promise<{
  relevant: TopicRelevanceResult[];
  borderline: TopicRelevanceResult[];
  irrelevant: TopicRelevanceResult[];
  failed: TopicRelevanceResult[];
}> {
  const results = await processInBatches(
    videos,
    CONCURRENCY_LIMIT,
    (v) => scoreVideoRelevance(v, topicDomains),
  );

  const relevant: TopicRelevanceResult[] = [];
  const borderline: TopicRelevanceResult[] = [];
  const irrelevant: TopicRelevanceResult[] = [];
  const failed: TopicRelevanceResult[] = [];

  for (const result of results) {
    if (result.relevanceScore < 0) {
      failed.push(result);
    } else if (result.relevanceScore >= threshold) {
      relevant.push(result);
    } else if (result.relevanceScore >= threshold - 0.2) {
      borderline.push(result);
    } else {
      irrelevant.push(result);
    }
  }

  return { relevant, borderline, irrelevant, failed };
}
