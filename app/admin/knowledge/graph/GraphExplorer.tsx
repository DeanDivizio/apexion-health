"use client";

import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";

interface GraphNode {
  name: string;
  type: string;
  aliases: string[];
}

interface GraphRelationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  context: string;
}

export function GraphExplorer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    nodes: GraphNode[];
    relationships: GraphRelationship[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSearch() {
    if (!query.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/knowledge/graph?concept=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for a concept (e.g., Vitamin D, Creatine, Zone 2)..."
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-500"
        />
        <button
          onClick={handleSearch}
          disabled={isPending || !query.trim()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {results && (
        <div className="space-y-4">
          {results.nodes.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">
                Related Concepts ({results.nodes.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.nodes.map((node) => (
                  <button
                    key={node.name}
                    onClick={() => {
                      setQuery(node.name);
                      handleSearch();
                    }}
                    className="rounded-full border border-neutral-700 bg-neutral-800/50 px-3 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    <span className="mr-1 text-neutral-500">{node.type}</span>
                    {node.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.relationships.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-300">
                Relationships ({results.relationships.length})
              </h3>
              <div className="space-y-1">
                {results.relationships.map((rel, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2"
                  >
                    <p className="text-sm text-neutral-200">
                      <span className="font-medium">{rel.subject}</span>
                      <span className="mx-2 rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        {rel.predicate}
                      </span>
                      <span className="font-medium">{rel.object}</span>
                    </p>
                    {rel.context && (
                      <p className="mt-1 text-xs italic text-neutral-500">
                        &ldquo;{rel.context}&rdquo;
                      </p>
                    )}
                    {rel.confidence > 0 && (
                      <span className="text-xs text-neutral-600">
                        Confidence: {(rel.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.nodes.length === 0 &&
            results.relationships.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-500">
                No results found for &ldquo;{query}&rdquo;.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
