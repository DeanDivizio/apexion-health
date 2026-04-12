"use client";

import { useState, useTransition } from "react";
import { addChannel, scanChannelForVideos } from "@/actions/knowledge";
import { Loader2, Plus, RefreshCw } from "lucide-react";

interface Channel {
  id: string;
  channelId: string;
  name: string;
  url: string;
  topicDomains: string[];
  active: boolean;
  lastScannedAt: Date | null;
  _count: { sources: number };
}

export function ChannelManager({
  initialChannels,
  isIngestionEnabled,
}: {
  initialChannels: Channel[];
  isIngestionEnabled: boolean;
}) {
  const [channels, setChannels] = useState(initialChannels);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [isPending, startTransition] = useTransition();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleAdd() {
    startTransition(async () => {
      try {
        const topicDomains = topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const channel = await addChannel(name, url, topicDomains);
        setChannels((prev) => [
          ...prev,
          { ...channel, _count: { sources: 0 } },
        ]);
        setName("");
        setUrl("");
        setTopics("");
        setShowForm(false);
        setMessage("Channel added.");
      } catch (error) {
        setMessage(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  function handleScan(channelId: string, fullRescan: boolean = false) {
    setScanningId(channelId);
    startTransition(async () => {
      try {
        const result = await scanChannelForVideos(channelId, fullRescan);
        setMessage(
          `Scanned ${result.totalVideos} videos. ${result.relevant} relevant, ${result.borderline} borderline, ${result.irrelevant} irrelevant, ${result.failed} failed scoring. ${result.created} new sources queued.`,
        );
      } catch (error) {
        setMessage(
          `Scan error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setScanningId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm text-neutral-300">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="ml-2 text-neutral-500 hover:text-neutral-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-200">
                {channel.name}
              </p>
              <p className="text-xs text-neutral-500">
                {channel._count.sources} sources ·{" "}
                {channel.topicDomains.join(", ")}
                {channel.lastScannedAt &&
                  ` · Last scan: ${new Date(channel.lastScannedAt).toLocaleDateString()}`}
              </p>
            </div>
            {isIngestionEnabled && (
              <div className="ml-3 flex items-center gap-1.5">
                <button
                  onClick={() => handleScan(channel.id, false)}
                  disabled={isPending || scanningId === channel.id}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                  title="Scan for new videos since last scan"
                >
                  {scanningId === channel.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  New
                </button>
                <button
                  onClick={() => handleScan(channel.id, true)}
                  disabled={isPending || scanningId === channel.id}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                  title="Full rescan — re-fetches all videos ignoring last scan date"
                >
                  {scanningId === channel.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Full Rescan
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isIngestionEnabled && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-700"
        >
          <Plus className="h-4 w-4" />
          Add Channel
        </button>
      )}

      {showForm && (
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name (e.g., Huberman Lab)"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube channel URL"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <input
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Topic domains (comma-separated, e.g., nutrition, sleep, exercise)"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !name || !url}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
