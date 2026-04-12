import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { RawTranscript, RawTranscriptSegment, VideoMetadata } from "../types";

const execFileAsync = promisify(execFile);

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YT_DLP_TIMEOUT_MS = 30_000;

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string; tOffsetMs?: number }[];
  aAppend?: number;
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is required.");
  return key;
}

export function extractVideoId(urlOrId: string): string {
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

  const url = new URL(urlOrId);
  if (url.hostname === "youtu.be") return url.pathname.slice(1);

  const v = url.searchParams.get("v");
  if (v) return v;

  const pathMatch = url.pathname.match(/\/(?:embed|v|shorts)\/([A-Za-z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  throw new Error(`Cannot extract video ID from: ${urlOrId}`);
}

export function extractChannelId(url: string): string {
  const parsed = new URL(url);
  const channelMatch = parsed.pathname.match(/\/channel\/([A-Za-z0-9_-]+)/);
  if (channelMatch) return channelMatch[1];

  const handleMatch = parsed.pathname.match(/\/@([A-Za-z0-9_.-]+)/);
  if (handleMatch) return `@${handleMatch[1]}`;

  throw new Error(`Cannot extract channel ID from: ${url}`);
}

function parseJson3Events(events: Json3Event[]): RawTranscriptSegment[] {
  const segments: RawTranscriptSegment[] = [];

  for (const event of events) {
    if (event.aAppend || !event.segs || event.tStartMs == null) continue;

    const text = event.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .trim();

    if (!text || text === "\n") continue;

    segments.push({
      text,
      offset: event.tStartMs / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
    });
  }

  return segments;
}

export async function fetchTranscript(videoId: string): Promise<RawTranscript> {
  const tempDir = await mkdtemp(join(tmpdir(), "yt-transcript-"));
  const outputTemplate = join(tempDir, "sub");

  try {
    console.log(`[youtube] Fetching transcript for ${videoId} via yt-dlp`);

    await execFileAsync(
      "yt-dlp",
      [
        "--write-auto-subs",
        "--sub-lang", "en",
        "--sub-format", "json3",
        "--skip-download",
        "-o", outputTemplate,
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      { timeout: YT_DLP_TIMEOUT_MS },
    );

    const subFile = join(tempDir, "sub.en.json3");
    const raw = await readFile(subFile, "utf-8");
    const data = JSON.parse(raw) as { events?: Json3Event[] };

    if (!data.events || data.events.length === 0) {
      throw new TranscriptUnavailableError(videoId, "yt-dlp returned no transcript events");
    }

    const segments = parseJson3Events(data.events);

    if (segments.length === 0) {
      throw new TranscriptUnavailableError(videoId, "Transcript parsed to zero segments");
    }

    console.log(`[youtube] Got ${segments.length} segments for ${videoId}`);
    return { videoId, segments };
  } catch (error) {
    if (error instanceof TranscriptUnavailableError) throw error;

    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("ENOENT") && msg.includes("yt-dlp")) {
      throw new Error(
        "yt-dlp is not installed. Install it with: brew install yt-dlp",
      );
    }

    if (msg.includes("no subtitles") || msg.includes("No automatic captions")) {
      throw new TranscriptUnavailableError(videoId, "No captions available");
    }

    throw new TranscriptUnavailableError(videoId, msg);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export class TranscriptUnavailableError extends Error {
  constructor(
    public readonly videoId: string,
    reason: string,
  ) {
    super(`Transcript unavailable for ${videoId}: ${reason}`);
    this.name = "TranscriptUnavailableError";
  }
}

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const key = getApiKey();
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  return {
    videoId,
    channelId: item.snippet.channelId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails.duration,
    channelTitle: item.snippet.channelTitle,
  };
}

export async function resolveChannelHandle(handle: string): Promise<string> {
  const key = getApiKey();
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${key}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`Channel search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();
  const channelId = searchData.items?.[0]?.snippet?.channelId;
  if (!channelId) throw new Error(`Channel not found: ${handle}`);
  return channelId;
}

export async function fetchChannelVideos(
  channelIdOrHandle: string,
  options: { maxResults?: number; publishedAfter?: string } = {},
): Promise<VideoMetadata[]> {
  const key = getApiKey();
  const maxResults = options.maxResults ?? 50;

  let resolvedChannelId = channelIdOrHandle;
  if (channelIdOrHandle.startsWith("@")) {
    resolvedChannelId = await resolveChannelHandle(channelIdOrHandle);
  }

  const videos: VideoMetadata[] = [];
  let pageToken: string | undefined;

  while (videos.length < maxResults) {
    const perPage = Math.min(50, maxResults - videos.length);
    let searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${resolvedChannelId}&type=video&order=date&maxResults=${perPage}&key=${key}`;
    if (pageToken) searchUrl += `&pageToken=${pageToken}`;
    if (options.publishedAfter) searchUrl += `&publishedAfter=${options.publishedAfter}`;

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`YouTube search API error: ${res.status}`);

    const data = await res.json();
    const items = data.items ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      videos.push({
        videoId: item.id.videoId,
        channelId: resolvedChannelId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        duration: "",
        channelTitle: item.snippet.channelTitle,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return enrichVideoDetails(videos);
}

async function enrichVideoDetails(
  videos: VideoMetadata[],
): Promise<VideoMetadata[]> {
  if (videos.length === 0) return videos;

  const key = getApiKey();
  const detailsMap = new Map<
    string,
    { duration: string; hasCaptions: boolean }
  >();

  const BATCH_SIZE = 50;
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    const ids = batch.map((v) => v.videoId).join(",");
    const url = `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${ids}&key=${key}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[youtube] Failed to enrich video details batch: ${res.status}`);
      continue;
    }

    const data = await res.json();
    for (const item of data.items ?? []) {
      detailsMap.set(item.id, {
        duration: item.contentDetails.duration,
        hasCaptions: item.contentDetails.caption === "true",
      });
    }
  }

  return videos.map((v) => {
    const details = detailsMap.get(v.videoId);
    return {
      ...v,
      duration: details?.duration ?? v.duration,
      hasCaptions: details?.hasCaptions ?? false,
    };
  });
}
