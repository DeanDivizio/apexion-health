import { encode } from "gpt-tokenizer";
import type { PaperFullText } from "../types";
import type { Chunk, ChunkerOptions } from "./types";

const DEFAULT_OPTIONS: ChunkerOptions = {
  maxTokens: 800,
  overlapTokens: 100,
};

export function chunkPaper(
  paper: PaperFullText,
  options: Partial<ChunkerOptions> = {},
): Chunk[] {
  const { maxTokens, overlapTokens } = { ...DEFAULT_OPTIONS, ...options };
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  if (paper.abstract) {
    const abstractChunks = chunkSection(
      paper.abstract,
      "Abstract",
      maxTokens,
      overlapTokens,
    );
    for (const text of abstractChunks) {
      chunks.push({
        content: text,
        index: chunkIndex++,
        metadata: { sourceType: "paper", section: "Abstract" },
      });
    }
  }

  for (const section of paper.sections) {
    const sectionChunks = chunkSection(
      section.content,
      section.heading,
      maxTokens,
      overlapTokens,
    );
    for (const text of sectionChunks) {
      chunks.push({
        content: text,
        index: chunkIndex++,
        metadata: {
          sourceType: "paper",
          section: section.heading,
        },
      });
    }
  }

  return chunks;
}

function chunkSection(
  text: string,
  sectionName: string,
  maxTokens: number,
  overlapTokens: number,
): string[] {
  const sentences = splitSentences(text);
  const results: string[] = [];
  let currentSentences: string[] = [];
  let currentTokenCount = 0;

  const prefix = `[${sectionName}] `;

  for (const sentence of sentences) {
    const sentenceTokens = encode(sentence).length;

    if (currentTokenCount + sentenceTokens > maxTokens && currentSentences.length > 0) {
      results.push(prefix + currentSentences.join("").trim());

      const overlapSentences: string[] = [];
      let overlapCount = 0;
      for (let i = currentSentences.length - 1; i >= 0; i--) {
        const t = encode(currentSentences[i]).length;
        if (overlapCount + t > overlapTokens) break;
        overlapSentences.unshift(currentSentences[i]);
        overlapCount += t;
      }
      currentSentences = overlapSentences;
      currentTokenCount = overlapCount;
    }

    currentSentences.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  if (currentSentences.length > 0) {
    results.push(prefix + currentSentences.join("").trim());
  }

  return results;
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
}
