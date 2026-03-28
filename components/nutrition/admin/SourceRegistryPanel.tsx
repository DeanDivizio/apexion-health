"use client";

import * as React from "react";
import { Loader2, Play, Plus, Upload } from "lucide-react";
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
  createRetailChainAdminAction,
  createRetailChainSourceAction,
  deactivateRetailChainSourceAction,
  listRetailChainSourcesAction,
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
  manualStoragePath: string | null;
  manualFileName: string | null;
  manualMimeType: string | null;
  manualFileSizeBytes: number | null;
  manualChecksumSha256: string | null;
  manualUploadedAt: string | null;
  sourceType: "csv" | "xlsx" | "pdf" | "html_link" | "manual_upload";
  fetchMethod: "direct_download" | "manual_upload_only";
  parserPreference: "deterministic_first" | "ocr_allowed";
  active: boolean;
  priority: number;
  lastVerifiedAt: string | null;
  notes: string | null;
}

const FILE_FORMAT_OPTIONS: {
  value: SourceRow["sourceType"];
  label: string;
}[] = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "html_link", label: "Web page (auto-detect)" },
];

const FETCH_METHOD_OPTIONS: {
  value: SourceRow["fetchMethod"];
  label: string;
}[] = [
  { value: "manual_upload_only", label: "Manual file upload" },
  { value: "direct_download", label: "Download from URL" },
];

const PARSER_PREF_OPTIONS: {
  value: SourceRow["parserPreference"];
  label: string;
}[] = [
  { value: "deterministic_first", label: "Structured parser (CSV/XLSX)" },
  { value: "ocr_allowed", label: "OCR + AI extraction (PDF/images)" },
];

const SOURCE_TYPE_LABELS: Record<SourceRow["sourceType"], string> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "Excel",
  html_link: "Web page",
  manual_upload: "Manual upload",
};

const FETCH_METHOD_LABELS: Record<SourceRow["fetchMethod"], string> = {
  direct_download: "URL download",
  manual_upload_only: "Manual upload",
};

const PARSER_PREF_LABELS: Record<SourceRow["parserPreference"], string> = {
  deterministic_first: "Structured",
  ocr_allowed: "OCR + AI",
};

function defaultParserForSourceType(
  sourceType: SourceRow["sourceType"],
): SourceRow["parserPreference"] {
  return sourceType === "pdf" ? "ocr_allowed" : "deterministic_first";
}

export function SourceRegistryPanel() {
  const { toast } = useToast();
  const [chains, setChains] = React.useState<ChainOption[]>([]);
  const [selectedChainId, setSelectedChainId] = React.useState<string>("");
  const [newChainName, setNewChainName] = React.useState("");
  const [sources, setSources] = React.useState<SourceRow[]>([]);
  const [loadingChains, setLoadingChains] = React.useState(true);
  const [loadingSources, setLoadingSources] = React.useState(false);
  const [creatingChain, setCreatingChain] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [uploadingSourceId, setUploadingSourceId] = React.useState<
    string | null
  >(null);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const createFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [createFile, setCreateFile] = React.useState<File | null>(null);
  const [form, setForm] = React.useState({
    sourceName: "",
    sourceUrl: "",
    sourceType: "pdf" as SourceRow["sourceType"],
    fetchMethod: "manual_upload_only" as SourceRow["fetchMethod"],
    parserPreference: "ocr_allowed" as SourceRow["parserPreference"],
    priority: "0",
    notes: "",
  });

  const selectedChain = chains.find((chain) => chain.id === selectedChainId);
  const isManualUpload = form.fetchMethod === "manual_upload_only";

  const loadSources = React.useCallback(
    async (chainId: string) => {
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
    },
    [toast],
  );

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

  function handleSourceTypeChange(value: SourceRow["sourceType"]) {
    setForm((prev) => ({
      ...prev,
      sourceType: value,
      parserPreference: defaultParserForSourceType(value),
      fetchMethod:
        value === "html_link" ? "direct_download" : prev.fetchMethod,
    }));
  }

  function handleFetchMethodChange(value: SourceRow["fetchMethod"]) {
    setForm((prev) => ({
      ...prev,
      fetchMethod: value,
      sourceUrl: value === "manual_upload_only" ? "" : prev.sourceUrl,
      sourceType:
        value === "manual_upload_only" && prev.sourceType === "html_link"
          ? "pdf"
          : prev.sourceType,
    }));
    if (value !== "manual_upload_only") {
      setCreateFile(null);
    }
  }

  async function handleCreateChain() {
    const name = newChainName.trim();
    if (!name) return;
    setCreatingChain(true);
    try {
      const created = await createRetailChainAdminAction({ name });
      const chain = created as ChainOption;
      setChains((prev) =>
        [...prev, chain].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedChainId(chain.id);
      setNewChainName("");
      toast({ title: `Chain added: ${chain.name}` });
    } catch (error) {
      toast({
        title: "Failed to add chain",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreatingChain(false);
    }
  }

  async function uploadFileToSource(sourceId: string, file: File) {
    const formData = new FormData();
    formData.set("sourceId", sourceId);
    formData.set("file", file);
    const response = await fetch("/api/admin/nutrition/source/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "Upload failed");
    }
  }

  async function handleCreateSource() {
    if (!selectedChainId) return;
    if (!form.sourceName.trim()) return;
    if (isManualUpload && !createFile) {
      toast({
        title: "No file selected",
        description: "Choose a file to upload for this source.",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      const created = await createRetailChainSourceAction({
        chainId: selectedChainId,
        sourceName: form.sourceName.trim(),
        sourceUrl: isManualUpload ? null : form.sourceUrl.trim() || null,
        sourceType: form.sourceType,
        fetchMethod: form.fetchMethod,
        parserPreference: form.parserPreference,
        priority: Number(form.priority) || 0,
        notes: form.notes.trim() || null,
      });

      if (isManualUpload && createFile) {
        const source = created as SourceRow;
        await uploadFileToSource(source.id, createFile);
        toast({ title: "Source added and file uploaded" });
      } else {
        toast({ title: "Source added" });
      }

      setForm((prev) => ({
        ...prev,
        sourceName: "",
        sourceUrl: "",
        priority: "0",
        notes: "",
      }));
      setCreateFile(null);
      if (createFileInputRef.current) createFileInputRef.current.value = "";
      await loadSources(selectedChainId);
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
      const response = await fetch("/api/admin/ingestion/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainId: selectedChainId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Ingestion request failed");
      }
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

  async function handleManualSourceFileSelected(
    sourceId: string,
    file: File | null,
  ) {
    if (!file || !selectedChainId) return;
    setUploadingSourceId(sourceId);
    try {
      await uploadFileToSource(sourceId, file);
      await loadSources(selectedChainId);
      toast({ title: "Manual source file uploaded" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploadingSourceId(null);
      const input = fileInputRefs.current[sourceId];
      if (input) input.value = "";
    }
  }

  const sourceTypeOptions = isManualUpload
    ? FILE_FORMAT_OPTIONS.filter((o) => o.value !== "html_link")
    : FILE_FORMAT_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Chain selector + Run ingestion */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <Label>Restaurant chain</Label>
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
          {!loadingChains && chains.length === 0 ? (
            <p className="text-xs text-neutral-500">
              No chains exist yet. Add one below to configure sources.
            </p>
          ) : null}
        </div>
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
          Run ingestion
        </Button>
      </div>

      {/* Add Chain */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
        <h2 className="text-sm font-medium text-neutral-200">
          Add restaurant chain
        </h2>
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full space-y-1 md:max-w-md">
            <Label className="text-xs">Chain name</Label>
            <Input
              value={newChainName}
              onChange={(event) => setNewChainName(event.target.value)}
              placeholder="e.g. Chipotle"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateChain();
                }
              }}
            />
          </div>
          <Button
            onClick={handleCreateChain}
            disabled={creatingChain || !newChainName.trim()}
          >
            {creatingChain ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add chain
          </Button>
        </div>
      </div>

      {/* Add Source */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
        <h2 className="text-sm font-medium text-neutral-200">
          Add source{selectedChain ? ` for ${selectedChain.name}` : ""}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Source name</Label>
            <Input
              value={form.sourceName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  sourceName: event.target.value,
                }))
              }
              placeholder="e.g. Chipotle Nutrition PDF 2026"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">How will you provide the file?</Label>
            <Select
              value={form.fetchMethod}
              onValueChange={handleFetchMethodChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FETCH_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isManualUpload && (
            <div className="space-y-1">
              <Label className="text-xs">Source URL</Label>
              <Input
                value={form.sourceUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sourceUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">File format</Label>
            <Select
              value={form.sourceType}
              onValueChange={handleSourceTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Parser strategy</Label>
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
                {PARSER_PREF_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

        {isManualUpload && (
          <div className="space-y-1">
            <Label className="text-xs">Upload file</Label>
            <div className="flex items-center gap-3">
              <input
                ref={createFileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCreateFile(file);
                  if (file) {
                    const ext = file.name.split(".").pop()?.toLowerCase();
                    if (ext === "pdf" || ext === "csv" || ext === "xlsx" || ext === "xls") {
                      const detectedType = ext === "xls" ? "xlsx" : ext;
                      handleSourceTypeChange(
                        detectedType as SourceRow["sourceType"],
                      );
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => createFileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {createFile ? "Change file" : "Choose file"}
              </Button>
              {createFile && (
                <span className="text-sm text-neutral-400">
                  {createFile.name}{" "}
                  <span className="text-neutral-600">
                    ({(createFile.size / 1024).toFixed(0)} KB)
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

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

        <Button
          onClick={handleCreateSource}
          disabled={creating || !selectedChainId || !form.sourceName.trim()}
        >
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isManualUpload && createFile ? "Add source & upload" : "Add source"}
        </Button>
      </div>

      {/* Sources table */}
      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-300">
            Configured sources
          </h2>
          {loadingSources && (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/40 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Format</th>
              <th className="px-4 py-2 font-medium">Source</th>
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
                <tr
                  key={source.id}
                  className="border-b border-neutral-800/50 last:border-0"
                >
                  <td className="px-4 py-3 text-neutral-200">
                    <div className="max-w-[280px]">
                      <p>{source.sourceName}</p>
                      {source.sourceUrl && (
                        <p className="truncate text-xs text-neutral-500">
                          {source.sourceUrl}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {FETCH_METHOD_LABELS[source.fetchMethod] ??
                      source.fetchMethod}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {PARSER_PREF_LABELS[source.parserPreference] ??
                      source.parserPreference}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {source.priority}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    <div className="space-y-1">
                      <p>
                        {source.lastVerifiedAt
                          ? new Date(
                              source.lastVerifiedAt,
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                      {source.manualUploadedAt ? (
                        <p className="text-[11px] text-neutral-500">
                          uploaded{" "}
                          {new Date(
                            source.manualUploadedAt,
                          ).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {source.active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={(element) => {
                          fileInputRefs.current[source.id] = element;
                        }}
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleManualSourceFileSelected(source.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !source.active || uploadingSourceId === source.id
                        }
                        onClick={() =>
                          fileInputRefs.current[source.id]?.click()
                        }
                      >
                        {uploadingSourceId === source.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload file
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!source.active}
                        onClick={() => handleDeactivate(source.id)}
                      >
                        Deactivate
                      </Button>
                    </div>
                    {source.manualFileName ? (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {source.manualFileName}
                      </p>
                    ) : null}
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
