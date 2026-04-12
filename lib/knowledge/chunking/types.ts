import type { Chunk } from "../types";

export interface ChunkerOptions {
  maxTokens: number;
  overlapTokens: number;
}

export type { Chunk };
