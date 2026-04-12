"use client";

import { useState, useTransition } from "react";
import {
  ingestSource,
  addSourceManually,
  updateSource,
  deleteSource,
} from "@/actions/knowledge";
import Link from "next/link";
import { Loader2, Play, Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Source {
  id: string;
  sourceType: string;
  title: string;
  status: string;
  externalId: string | null;
  url: string | null;
  relevanceScore: number | null;
  fetchTier: string | null;
  createdAt: Date;
  channel: { name: string } | null;
  _count: { ingestionRuns: number; claims: number };
}

export function SourceManager({
  initialSources,
  isIngestionEnabled,
}: {
  initialSources: Source[];
  isIngestionEnabled: boolean;
}) {
  const [sources, setSources] = useState(initialSources);
  const [isPending, startTransition] = useTransition();
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    title: "",
    externalId: "",
    url: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [useBatchApi, setUseBatchApi] = useState(false);

  const [formType, setFormType] = useState<"PODCAST" | "PAPER">("PODCAST");
  const [formTitle, setFormTitle] = useState("");
  const [formExternalId, setFormExternalId] = useState("");
  const [formUrl, setFormUrl] = useState("");

  function startEdit(source: Source) {
    setEditingId(source.id);
    setEditFields({
      title: source.title,
      externalId: source.externalId ?? "",
      url: source.url ?? "",
    });
  }

  function handleSaveEdit(sourceId: string) {
    startTransition(async () => {
      try {
        await updateSource(sourceId, {
          title: editFields.title,
          externalId: editFields.externalId || undefined,
          url: editFields.url || undefined,
        });
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId
              ? {
                  ...s,
                  title: editFields.title,
                  externalId: editFields.externalId || null,
                  url: editFields.url || null,
                }
              : s,
          ),
        );
        setEditingId(null);
        setMessage("Source updated.");
      } catch (error) {
        setMessage(
          `Update failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  function handleDelete(sourceId: string) {
    if (!confirm("Delete this source? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteSource(sourceId);
        setSources((prev) => prev.filter((s) => s.id !== sourceId));
        setMessage("Source deleted.");
      } catch (error) {
        setMessage(
          `Delete failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  function handleResetStatus(sourceId: string) {
    startTransition(async () => {
      try {
        await updateSource(sourceId, { status: "PENDING" });
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...s, status: "PENDING" } : s,
          ),
        );
        setMessage("Status reset to PENDING.");
      } catch (error) {
        setMessage(
          `Reset failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  function handleIngest(sourceId: string) {
    setIngestingId(sourceId);
    startTransition(async () => {
      try {
        await ingestSource(sourceId, useBatchApi || undefined);
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...s, status: "COMPLETED" } : s,
          ),
        );
        setMessage("Ingestion completed.");
      } catch (error) {
        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...s, status: "FAILED" } : s,
          ),
        );
        setMessage(
          `Ingestion failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setIngestingId(null);
      }
    });
  }

  function handleAddSource() {
    startTransition(async () => {
      try {
        const source = await addSourceManually({
          sourceType: formType,
          title: formTitle,
          externalId: formExternalId || undefined,
          url: formUrl || undefined,
        });
        setSources((prev) => [
          {
            ...source,
            channel: null,
            _count: { ingestionRuns: 0, claims: 0 },
          },
          ...prev,
        ]);
        setFormTitle("");
        setFormExternalId("");
        setFormUrl("");
        setShowForm(false);
        setMessage("Source added.");
      } catch (error) {
        setMessage(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
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

      {isIngestionEnabled && (
        <label
          className="flex items-center gap-2 text-sm text-neutral-400"
          title="Use OpenAI Batch API for verification (~50% cost reduction, up to 24h latency). When unchecked, auto-batches for >10 claims."
        >
          <input
            type="checkbox"
            checked={useBatchApi}
            onChange={(e) => setUseBatchApi(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900"
          />
          Batch API
          <span className="text-xs text-neutral-600">
            (50% cheaper, async)
          </span>
        </label>
      )}

      <div className="space-y-1">
        {sources.map((source) => (
          <div
            key={source.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            {editingId === source.id ? (
              <div className="space-y-2">
                <input
                  value={editFields.title}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200"
                  placeholder="Title"
                />
                <input
                  value={editFields.externalId}
                  onChange={(e) =>
                    setEditFields((f) => ({
                      ...f,
                      externalId: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200"
                  placeholder="External ID (Video ID or PMID)"
                />
                <input
                  value={editFields.url}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, url: e.target.value }))
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200"
                  placeholder="URL"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(source.id)}
                    disabled={isPending}
                    className="flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1 rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-600"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/knowledge/sources/${source.id}`}
                    className="block truncate text-sm text-neutral-200 hover:text-white hover:underline"
                  >
                    {source.title}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {source.sourceType} ·{" "}
                    {source.channel?.name ?? "Manual"} ·{" "}
                    {source._count.ingestionRuns} runs ·{" "}
                    {source._count.claims} claims
                    {source.relevanceScore != null &&
                      ` · Relevance: ${(source.relevanceScore * 100).toFixed(0)}%`}
                    {source.fetchTier && ` · ${source.fetchTier}`}
                    {source.externalId && (
                      <span className="ml-1 text-neutral-600">
                        [{source.externalId}]
                      </span>
                    )}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-1.5">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      source.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-400"
                        : source.status === "FAILED"
                          ? "bg-red-950 text-red-400"
                          : source.status === "PROCESSING"
                            ? "bg-blue-950 text-blue-400"
                            : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {source.status}
                  </span>
                  {isIngestionEnabled && (
                    <>
                      {source.status === "PENDING" && (
                        <button
                          onClick={() => handleIngest(source.id)}
                          disabled={isPending || ingestingId === source.id}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                          title="Ingest"
                        >
                          {ingestingId === source.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      {source.status === "FAILED" && (
                        <button
                          onClick={() => handleResetStatus(source.id)}
                          disabled={isPending}
                          className="rounded-lg bg-yellow-700 px-2 py-1 text-xs text-white hover:bg-yellow-600 disabled:opacity-50"
                          title="Reset to PENDING"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(source)}
                        disabled={isPending}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        disabled={isPending}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-500">
            No sources found.
          </p>
        )}
      </div>

      {isIngestionEnabled && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-700"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      )}

      {showForm && (
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <select
            value={formType}
            onChange={(e) =>
              setFormType(e.target.value as "PODCAST" | "PAPER")
            }
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200"
          >
            <option value="PODCAST">Podcast</option>
            <option value="PAPER">Paper</option>
            <option value="MANUAL">Manual</option>
          </select>
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <input
            value={formExternalId}
            onChange={(e) => setFormExternalId(e.target.value)}
            placeholder={
              formType === "PODCAST"
                ? "YouTube Video ID or URL"
                : "PubMed ID or DOI"
            }
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="URL (optional)"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddSource}
              disabled={isPending || !formTitle}
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
