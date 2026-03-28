"use client";

import * as React from "react";
import { Loader2, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { useToast } from "@/hooks/use-toast";
import {
  createRetailChainSourceAction,
  deactivateRetailChainSourceAction,
  listRetailChainSourcesAction,
  runRetailChainIngestionAction,
} from "@/actions/nutritionAdmin";
import { listRetailChainsAction } from "@/actions/nutrition";

interface ChainOption {
  id: string;
  name: string;
  key: string;
}

interface SourceRow {
  id: string;
  chainId: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceType: "csv" | "xlsx" | "pdf" | "html_link" | "manual_upload";
  fetchMethod: "direct_download" | "manual_upload_only";
  parserPreference: "deterministic_first" | "ocr_allowed";
  active: boolean;
  priority: number;
  lastVerifiedAt: string | null;
  notes: string | null;
}

const SOURCE_TYPES = [
  "csv",
  "xlsx",
  "pdf",
  "html_link",
  "manual_upload",
] as const;

const FETCH_METHODS = ["direct_download", "manual_upload_only"] as const;
const PARSER_PREFS = ["deterministic_first", "ocr_allowed"] as const;

export function SourceRegistryPanel() {
  const { toast } = useToast();
  const [chains, setChains] = React.useState<ChainOption[]>([]);
  const [selectedChainId, setSelectedChainId] = React.useState<string>("");
  const [sources, setSources] = React.useState<SourceRow[]>([]);
  const [loadingChains, setLoadingChains] = React.useState(true);
  const [loadingSources, setLoadingSources] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [form, setForm] = React.useState({
    sourceName: "",
    sourceUrl: "",
    sourceType: "html_link" as SourceRow["sourceType"],
    fetchMethod: "direct_download" as SourceRow["fetchMethod"],
    parserPreference: "deterministic_first" as SourceRow["parserPreference"],
    priority: "0",
    notes: "",
  });

  const selectedChain = chains.find((chain) => chain.id === selectedChainId);

  const loadSources = React.useCallback(async (chainId: string) => {
    setLoadingSources(true);
    try {
      const rows = await listRetailChainSourcesAction(chainId, true);
      setSources(rows as SourceRow[]);
    } catch {
      toast({
        title: "Failed to load chain sources",
        variant: "destructive",
      });
    } finally {
      setLoadingSources(false);
    }
  }, [toast]);

  React.useEffect(() => {
    setLoadingChains(true);
    listRetailChainsAction()
      .then((rows) => {
        const chainRows = rows as ChainOption[];
        setChains(chainRows);
        if (chainRows.length > 0) {
          setSelectedChainId(chainRows[0].id);
        }
      })
      .catch(() => {
        toast({
          title: "Failed to load chains",
          variant: "destructive",
        });
      })
      .finally(() => setLoadingChains(false));
  }, [toast]);

  React.useEffect(() => {
    if (!selectedChainId) return;
    loadSources(selectedChainId);
  }, [selectedChainId, loadSources]);

  async function handleCreateSource() {
    if (!selectedChainId) return;
    if (!form.sourceName.trim()) return;
    setCreating(true);
    try {
      await createRetailChainSourceAction({
        chainId: selectedChainId,
        sourceName: form.sourceName.trim(),
        sourceUrl: form.sourceUrl.trim() || null,
        sourceType: form.sourceType,
        fetchMethod: form.fetchMethod,
        parserPreference: form.parserPreference,
        priority: Number(form.priority) || 0,
        notes: form.notes.trim() || null,
      });
      setForm((prev) => ({
        ...prev,
        sourceName: "",
        sourceUrl: "",
        priority: "0",
        notes: "",
      }));
      await loadSources(selectedChainId);
      toast({ title: "Source added" });
    } catch (error) {
      toast({
        title: "Failed to add source",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(sourceId: string) {
    if (!selectedChainId) return;
    try {
      await deactivateRetailChainSourceAction(sourceId);
      await loadSources(selectedChainId);
      toast({ title: "Source deactivated" });
    } catch {
      toast({
        title: "Failed to deactivate source",
        variant: "destructive",
      });
    }
  }

  async function handleRunIngestion() {
    if (!selectedChainId) return;
    setRunning(true);
    try {
      const result = await runRetailChainIngestionAction(selectedChainId);
      toast({
        title: `Run created (${result.status})`,
        description: result.errorMessage ?? undefined,
      });
    } catch (error) {
      toast({
        title: "Run failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Chain</Label>
        <Select value={selectedChainId} onValueChange={setSelectedChainId}>
          <SelectTrigger>
            <SelectValue placeholder="Select chain" />
          </SelectTrigger>
          <SelectContent>
            {chains.map((chain) => (
              <SelectItem key={chain.id} value={chain.id}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-200">
            Add Source {selectedChain ? `for ${selectedChain.name}` : ""}
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Source name</Label>
            <Input
              value={form.sourceName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sourceName: event.target.value }))
              }
              placeholder="Primary Nutrition PDF"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source URL</Label>
            <Input
              value={form.sourceUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))
              }
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source type</Label>
            <Select
              value={form.sourceType}
              onValueChange={(value: SourceRow["sourceType"]) =>
                setForm((prev) => ({ ...prev, sourceType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fetch method</Label>
            <Select
              value={form.fetchMethod}
              onValueChange={(value: SourceRow["fetchMethod"]) =>
                setForm((prev) => ({ ...prev, fetchMethod: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FETCH_METHODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Parser preference</Label>
            <Select
              value={form.parserPreference}
              onValueChange={(value: SourceRow["parserPreference"]) =>
                setForm((prev) => ({ ...prev, parserPreference: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARSER_PREFS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Priority</Label>
            <Input
              type="number"
              value={form.priority}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, priority: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Optional notes for this source"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateSource} disabled={creating || !selectedChainId}>
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add source
          </Button>
          <Button
            variant="outline"
            onClick={handleRunIngestion}
            disabled={running || !selectedChainId}
          >
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run ingestion now
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-300">Configured sources</h2>
          {loadingSources && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/40 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Fetch</th>
              <th className="px-4 py-2 font-medium">Parser</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Verified</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingChains ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-neutral-500">
                  Loading chains...
                </td>
              </tr>
            ) : sources.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-neutral-500">
                  No sources configured for this chain yet.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr key={source.id} className="border-b border-neutral-800/50 last:border-0">
                  <td className="px-4 py-3 text-neutral-200">
                    <div className="max-w-[280px]">
                      <p>{source.sourceName}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {source.sourceUrl ?? "No URL"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{source.sourceType}</td>
                  <td className="px-4 py-3 text-neutral-400">{source.fetchMethod}</td>
                  <td className="px-4 py-3 text-neutral-400">{source.parserPreference}</td>
                  <td className="px-4 py-3 text-neutral-400">{source.priority}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {source.lastVerifiedAt
                      ? new Date(source.lastVerifiedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {source.active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!source.active}
                      onClick={() => handleDeactivate(source.id)}
                    >
                      Deactivate
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
