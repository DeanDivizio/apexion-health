import { encode } from "gpt-tokenizer";
import type { RawTranscript } from "../types";
import type { Chunk, ChunkerOptions } from "./types";

const DEFAULT_OPTIONS: ChunkerOptions = {
  maxTokens: 500,
  overlapTokens: 50,
};

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
}

export function chunkPodcastTranscript(
  transcript: RawTranscript,
  options: Partial<ChunkerOptions> = {},
): Chunk[] {
  const { maxTokens, overlapTokens } = { ...DEFAULT_OPTIONS, ...options };
  const segments = transcript.segments;
  if (segments.length === 0) return [];

  const fullText = segments.map((s) => s.text).join(" ");
  const sentences = splitSentences(fullText);

  const chunks: Chunk[] = [];
  let currentSentences: string[] = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;

  const segmentTimestamps = buildTimestampMap(segments);

  for (const sentence of sentences) {
    const sentenceTokens = encode(sentence).length;

    if (currentTokenCount + sentenceTokens > maxTokens && currentSentences.length > 0) {
      const chunkText = currentSentences.join("").trim();
      const startTs = findTimestamp(chunkText, segmentTimestamps, "start");
      const endTs = findTimestamp(chunkText, segmentTimestamps, "end");

      chunks.push({
        content: chunkText,
        index: chunkIndex++,
        metadata: {
          sourceType: "podcast",
          startTimestamp: startTs,
          endTimestamp: endTs,
        },
      });

      const overlapSentences: string[] = [];
      let overlapTokens_ = 0;
      for (let i = currentSentences.length - 1; i >= 0; i--) {
        const t = encode(currentSentences[i]).length;
        if (overlapTokens_ + t > overlapTokens) break;
        overlapSentences.unshift(currentSentences[i]);
        overlapTokens_ += t;
      }
      currentSentences = overlapSentences;
      currentTokenCount = overlapTokens_;
    }

    currentSentences.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  if (currentSentences.length > 0) {
    const chunkText = currentSentences.join("").trim();
    const startTs = findTimestamp(chunkText, segmentTimestamps, "start");
    const endTs = findTimestamp(chunkText, segmentTimestamps, "end");

    chunks.push({
      content: chunkText,
      index: chunkIndex,
      metadata: {
        sourceType: "podcast",
        startTimestamp: startTs,
        endTimestamp: endTs,
      },
    });
  }

  return chunks;
}

interface TimestampEntry {
  textSnippet: string;
  offset: number;
  endOffset: number;
}

function buildTimestampMap(
  segments: RawTranscript["segments"],
): TimestampEntry[] {
  return segments.map((s) => ({
    textSnippet: s.text.slice(0, 40),
    offset: s.offset,
    endOffset: s.offset + s.duration,
  }));
}

function findTimestamp(
  chunkText: string,
  timestamps: TimestampEntry[],
  edge: "start" | "end",
): number {
  const snippet =
    edge === "start"
      ? chunkText.slice(0, 60)
      : chunkText.slice(-60);
  const normalizedSnippet = snippet.toLowerCase().trim();

  let bestMatch: TimestampEntry | undefined;
  let bestScore = 0;

  for (const entry of timestamps) {
    const entryText = entry.textSnippet.toLowerCase().trim();
    if (normalizedSnippet.includes(entryText)) {
      return edge === "start" ? entry.offset : entry.endOffset;
    }
    const snippetWords = new Set(normalizedSnippet.split(/\s+/));
    const entryWords = entryText.split(/\s+/);
    const overlap = entryWords.filter((w) => snippetWords.has(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = entry;
    }
  }

  if (!bestMatch) return 0;
  return edge === "start" ? bestMatch.offset : bestMatch.endOffset;
}
