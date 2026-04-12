import type {
  KnowledgeSourceType,
  KnowledgeSourceStatus,
  KnowledgeIngestionStep,
} from "@prisma/client";

export interface RawTranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface RawTranscript {
  videoId: string;
  segments: RawTranscriptSegment[];
}

export interface VideoMetadata {
  videoId: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  hasCaptions?: boolean;
  relevanceScore?: number;
  relevantTopics?: string[];
}

export interface Chunk {
  content: string;
  index: number;
  metadata: ChunkMetadata;
}

export interface PodcastChunkMetadata {
  sourceType: "podcast";
  startTimestamp: number;
  endTimestamp: number;
  speaker?: string;
}

export interface PaperChunkMetadata {
  sourceType: "paper";
  section?: string;
  subsection?: string;
}

export type ChunkMetadata = PodcastChunkMetadata | PaperChunkMetadata;

export interface VectorChunk {
  id: string;
  sourceId: string;
  sourceType: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity?: number;
}

export interface PaperFullText {
  title: string;
  authors: string[];
  abstract: string;
  sections: PaperSection[];
  doi?: string;
  pmid?: string;
  journal?: string;
  publishedAt?: string;
  fetchTier: string;
}

export interface PaperSection {
  heading: string;
  content: string;
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  aliases: string[];
  description?: string;
}

export type EntityType =
  | "nutrient"
  | "supplement"
  | "exercise"
  | "biomarker"
  | "condition"
  | "mechanism"
  | "person"
  | "food";

export interface ExtractedRelationship {
  subject: string;
  predicate: RelationshipPredicate;
  object: string;
  confidence: number;
  context: string;
}

export type RelationshipPredicate =
  | "INCREASES"
  | "DECREASES"
  | "TREATS"
  | "PREVENTS"
  | "CORRELATES_WITH"
  | "CO_OCCURS_WITH"
  | "ACTIVATES"
  | "INHIBITS"
  | "REGULATES"
  | "MODULATES"
  | "IS_FORM_OF"
  | "IS_METABOLITE_OF"
  | "IS_PRECURSOR_TO"
  | "IS_BIOMARKER_FOR"
  | "HAS_MECHANISM"
  | "INTERACTS_WITH"
  | "SYNERGIZES_WITH"
  | "ANTAGONIZES_WITH"
  | "REQUIRES"
  | "MENTIONED_IN"
  | "SUPPORTS"
  | "CONTRADICTS"
  | "AUTHORED_BY";

export interface ExtractedClaim {
  claimText: string;
  confidence: number;
  entities: string[];
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  claims: ExtractedClaim[];
}

export interface PipelineOptions {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  steps?: KnowledgeIngestionStep[];
  useBatchApi?: boolean;
}

export interface PipelineProgress {
  step: KnowledgeIngestionStep;
  status: KnowledgeSourceStatus;
  stats?: Record<string, number>;
  error?: string;
}

export interface TopicRelevanceResult {
  videoId: string;
  title: string;
  relevanceScore: number;
  relevantTopics: string[];
}
