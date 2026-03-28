"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
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
  createRetailChainAction,
  listRetailChainsAction,
} from "@/actions/nutrition";
import {
  createRetailIngestionRunAction,
  listRetailStagingItemsAction,
  publishRetailIngestionRunAction,
  setRetailStagingItemApprovalAction,
  stageRetailItemsForRunAction,
  updateRetailStagingItemAction,
} from "@/actions/nutritionAdmin";
import { extractRetailMenuAction } from "@/actions/ocr";
import type { RetailChainView } from "@/lib/nutrition";

interface ExtractedItem {
  id: string;
  name: string;
  category: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

function emptyItem(): ExtractedItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  };
}

type ImageStatus = "pending" | "processing" | "done" | "error";

interface UploadedImage {
  id: string;
  name: string;
  base64: string;
  status: ImageStatus;
  error?: string;
}

type WorkflowStep = "extract" | "review" | "publish";

interface StagingIssue {
  id: string;
  severity: "hard" | "soft" | "info";
  code: string;
  message: string;
}

interface StagingItem {
  id: string;
  runId: string;
  chainId: string;
  name: string;
  normalizedName: string;
  category: string | null;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    [key: string]: number | undefined;
  };
  servingSize: number | null;
  servingUnit: string | null;
  extractionMethod: "csv_parser" | "xlsx_parser" | "pdf_table_parser" | "ocr_llm";
  confidence: number | null;
  hardIssueCount: number;
  softIssueCount: number;
  reviewed: boolean;
  approved: boolean;
  issues: StagingIssue[];
}

export default function AddChainDataPage() {
  const { toast } = useToast();
  const [step, setStep] = React.useState<WorkflowStep>("extract");
  const [chains, setChains] = React.useState<RetailChainView[]>([]);
  const [selectedChainId, setSelectedChainId] = React.useState<string>("");
  const [newChainName, setNewChainName] = React.useState("");
  const [creatingChain, setCreatingChain] = React.useState(false);
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [items, setItems] = React.useState<ExtractedItem[]>([]);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [stagingItems, setStagingItems] = React.useState<StagingItem[]>([]);
  const [staging, setStaging] = React.useState(false);
  const [loadingReview, setLoadingReview] = React.useState(false);
  const [savingRowId, setSavingRowId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    listRetailChainsAction().then(setChains).catch(() => {});
  }, []);

  const selectedChain = chains.find((c) => c.id === selectedChainId);

  async function handleCreateChain() {
    if (!newChainName.trim()) return;
    setCreatingChain(true);
    try {
      const created = await createRetailChainAction({ name: newChainName.trim() });
      setChains((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedChainId(created.id);
      setNewChainName("");
      toast({ title: `${created.name} created` });
    } catch {
      toast({ title: "Error creating chain", variant: "destructive" });
    } finally {
      setCreatingChain(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const img: UploadedImage = {
          id: crypto.randomUUID(),
          name: file.name,
          base64: reader.result as string,
          status: "pending",
        };
        setImages((prev) => [...prev, img]);
        processImage(img);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }

  async function processImage(img: UploadedImage) {
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, status: "processing" as const } : i)));
    try {
      const result = await extractRetailMenuAction(img.base64, selectedChain?.name ?? "");
      const newItems: ExtractedItem[] = result.map((r) => ({
        id: crypto.randomUUID(),
        name: r.name,
        category: r.category ?? "",
        calories: String(r.nutrients.calories ?? 0),
        protein: String(r.nutrients.protein ?? 0),
        carbs: String(r.nutrients.carbs ?? 0),
        fat: String(r.nutrients.fat ?? 0),
      }));
      setItems((prev) => [...prev, ...newItems]);
      setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, status: "done" as const } : i)));
    } catch (err) {
      setImages((prev) =>
        prev.map((i) =>
          i.id === img.id
            ? { ...i, status: "error" as const, error: err instanceof Error ? err.message : "Failed" }
            : i,
        ),
      );
    }
  }

  function updateItem(id: string, field: keyof ExtractedItem, value: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function refreshStaging(runIdValue: string) {
    setLoadingReview(true);
    try {
      const rows = await listRetailStagingItemsAction(runIdValue);
      setStagingItems(rows as StagingItem[]);
    } catch {
      toast({
        title: "Failed to load staging rows",
        variant: "destructive",
      });
    } finally {
      setLoadingReview(false);
    }
  }

  async function handleStageItems() {
    if (!selectedChainId || items.length === 0) return;
    setStaging(true);
    try {
      const runIdValue = await createRetailIngestionRunAction(selectedChainId);
      const payload = items.map((item) => ({
        name: item.name,
        category: item.category || null,
        nutrients: {
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
        },
        servingSize: null,
        servingUnit: null,
        extractionMethod: "ocr_llm" as const,
        confidence: null,
      }));
      const result = await stageRetailItemsForRunAction(runIdValue, payload);
      setRunId(runIdValue);
      await refreshStaging(runIdValue);
      setStep("review");
      toast({
        title: `${result.stagedCount} items staged`,
        description:
          result.hardIssues > 0 || result.softIssues > 0
            ? `${result.hardIssues} hard issue(s), ${result.softIssues} soft issue(s) found`
            : "No validation issues found",
      });
    } catch {
      toast({ title: "Error staging items", variant: "destructive" });
    } finally {
      setStaging(false);
    }
  }

  function handleDownloadJson() {
    const data = items.map((item) => ({
      name: item.name,
      category: item.category || null,
      nutrients: {
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
      },
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedChain?.key ?? "chain"}-nutrition.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function updateStagingItemField(
    itemId: string,
    updater: (item: StagingItem) => StagingItem,
  ) {
    setStagingItems((prev) =>
      prev.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  }

  async function handleSaveStagingRow(item: StagingItem) {
    setSavingRowId(item.id);
    try {
      const updated = await updateRetailStagingItemAction(item.id, {
        name: item.name,
        category: item.category,
        calories: item.nutrients.calories,
        protein: item.nutrients.protein,
        carbs: item.nutrients.carbs,
        fat: item.nutrients.fat,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
      });
      setStagingItems((prev) =>
        prev.map((row) => (row.id === item.id ? (updated as StagingItem) : row)),
      );
      toast({
        title: "Row saved",
      });
    } catch {
      toast({
        title: "Failed to save row",
        variant: "destructive",
      });
    } finally {
      setSavingRowId(null);
    }
  }

  async function handleToggleApproval(item: StagingItem) {
    try {
      const updated = await setRetailStagingItemApprovalAction(item.id, {
        approved: !item.approved,
      });
      setStagingItems((prev) =>
        prev.map((row) => (row.id === item.id ? (updated as StagingItem) : row)),
      );
    } catch (error) {
      toast({
        title: "Approval update failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not update approval status",
        variant: "destructive",
      });
    }
  }

  async function handlePublishRun() {
    if (!runId) return;
    setPublishing(true);
    try {
      const result = await publishRetailIngestionRunAction(runId);
      toast({
        title: `${result.publishedCount} items published`,
        description: selectedChain
          ? `Published to ${selectedChain.name}`
          : "Published successfully",
      });
      setStep("extract");
      setRunId(null);
      setStagingItems([]);
      setItems([]);
      setImages([]);
    } catch (error) {
      toast({
        title: "Publish failed",
        description:
          error instanceof Error ? error.message : "Could not publish this run",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  }

  const totalRows = stagingItems.length;
  const approvedRows = stagingItems.filter((item) => item.approved).length;
  const reviewedRows = stagingItems.filter((item) => item.reviewed).length;
  const hardIssueRows = stagingItems.filter((item) => item.hardIssueCount > 0).length;
  const canPublish = approvedRows > 0 && hardIssueRows === 0 && reviewedRows === totalRows;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Import Restaurant Nutrition Data</h1>
      <p className="text-sm text-muted-foreground">
        Official-source workflow: Extract → Review → Publish
      </p>

      <div className="flex gap-2">
        <Button
          variant={step === "extract" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("extract")}
        >
          1. Extract
        </Button>
        <Button
          variant={step === "review" ? "default" : "outline"}
          size="sm"
          onClick={() => runId && setStep("review")}
          disabled={!runId}
        >
          2. Review
        </Button>
        <Button
          variant={step === "publish" ? "default" : "outline"}
          size="sm"
          onClick={() => runId && setStep("publish")}
          disabled={!runId}
        >
          3. Publish
        </Button>
      </div>

      {/* Chain selection */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label>Restaurant Chain</Label>
          <Select value={selectedChainId} onValueChange={setSelectedChainId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a chain..." />
            </SelectTrigger>
            <SelectContent>
              {chains.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Input
            value={newChainName}
            onChange={(e) => setNewChainName(e.target.value)}
            placeholder="New chain name"
            className="w-48"
            onKeyDown={(e) => e.key === "Enter" && handleCreateChain()}
          />
          <Button onClick={handleCreateChain} disabled={creatingChain || !newChainName.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </div>
      </div>

      {/* Upload area */}
      {selectedChainId && step === "extract" && (
        <>
          <div className="space-y-3">
            <Label>Upload Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="w-28 h-28 rounded-lg border border-border/40 flex flex-col items-center justify-center text-xs p-1.5">
                  <p className="truncate w-full text-center">{img.name}</p>
                  {img.status === "processing" && <Loader2 className="h-4 w-4 animate-spin mt-1" />}
                  {img.status === "done" && <span className="text-green-400 mt-1">Done</span>}
                  {img.status === "error" && <span className="text-red-400 mt-1 truncate w-full text-center">{img.error}</span>}
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-lg border border-dashed border-border/60 hover:border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs">Add</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Extracted items table */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Extracted Items ({items.length})
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadJson}>
                    <Download className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button size="sm" onClick={handleStageItems} disabled={staging}>
                    {staging ? "Staging..." : "Stage Items"}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-accent/30">
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium w-28">Category</th>
                      <th className="text-right px-3 py-2 font-medium w-20">Cal</th>
                      <th className="text-right px-3 py-2 font-medium w-20">Pro</th>
                      <th className="text-right px-3 py-2 font-medium w-20">Carb</th>
                      <th className="text-right px-3 py-2 font-medium w-20">Fat</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-accent/20">
                        <td className="px-2 py-1">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.category}
                            onChange={(e) => updateItem(item.id, "category", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="tel"
                            value={item.calories}
                            onChange={(e) => updateItem(item.id, "calories", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1 text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="tel"
                            value={item.protein}
                            onChange={(e) => updateItem(item.id, "protein", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1 text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="tel"
                            value={item.carbs}
                            onChange={(e) => updateItem(item.id, "carbs", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1 text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="tel"
                            value={item.fat}
                            onChange={(e) => updateItem(item.id, "fat", e.target.value)}
                            className="h-7 text-xs border-none bg-transparent px-1 text-right"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
                <Button onClick={handleStageItems} disabled={staging}>
                  {staging ? "Staging..." : "Stage Items"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-medium">Review Staged Items</h2>
              <p className="text-xs text-muted-foreground">
                {runId ? `Run ${runId}` : "No active run"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!runId || loadingReview}
                onClick={() => runId && refreshStaging(runId)}
              >
                {loadingReview ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                size="sm"
                disabled={!runId}
                onClick={() => setStep("publish")}
              >
                Continue to Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs text-muted-foreground">Rows</p>
              <p className="text-lg font-semibold">{totalRows}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs text-muted-foreground">Reviewed</p>
              <p className="text-lg font-semibold">{reviewedRows}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-lg font-semibold">{approvedRows}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs text-muted-foreground">Rows with hard issues</p>
              <p className="text-lg font-semibold">{hardIssueRows}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-accent/30">
                  <th className="text-left px-3 py-2 font-medium">Item</th>
                  <th className="text-left px-3 py-2 font-medium w-32">Category</th>
                  <th className="text-right px-3 py-2 font-medium w-20">Cal</th>
                  <th className="text-right px-3 py-2 font-medium w-20">Pro</th>
                  <th className="text-right px-3 py-2 font-medium w-20">Carb</th>
                  <th className="text-right px-3 py-2 font-medium w-20">Fat</th>
                  <th className="text-left px-3 py-2 font-medium w-44">Validation</th>
                  <th className="text-center px-3 py-2 font-medium w-32">Approval</th>
                  <th className="text-center px-3 py-2 font-medium w-28">Save</th>
                </tr>
              </thead>
              <tbody>
                {stagingItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-accent/20">
                    <td className="px-2 py-1">
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateStagingItemField(item.id, (current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                        className="h-7 text-xs border-none bg-transparent px-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        value={item.category ?? ""}
                        onChange={(e) =>
                          updateStagingItemField(item.id, (current) => ({
                            ...current,
                            category: e.target.value || null,
                          }))
                        }
                        className="h-7 text-xs border-none bg-transparent px-1"
                      />
                    </td>
                    {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
                      <td key={key} className="px-2 py-1">
                        <Input
                          type="tel"
                          value={String(item.nutrients[key] ?? 0)}
                          onChange={(e) =>
                            updateStagingItemField(item.id, (current) => ({
                              ...current,
                              nutrients: {
                                ...current.nutrients,
                                [key]: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="h-7 text-xs border-none bg-transparent px-1 text-right"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 align-top">
                      <div className="space-y-1">
                        {item.hardIssueCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            {item.hardIssueCount} hard
                          </div>
                        )}
                        {item.softIssueCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {item.softIssueCount} soft
                          </div>
                        )}
                        {item.hardIssueCount === 0 && item.softIssueCount === 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            clean
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        size="sm"
                        variant={item.approved ? "default" : "outline"}
                        disabled={item.hardIssueCount > 0}
                        onClick={() => handleToggleApproval(item)}
                      >
                        {item.approved ? "Approved" : "Approve"}
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={savingRowId === item.id}
                        onClick={() => handleSaveStagingRow(item)}
                      >
                        {savingRowId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === "publish" && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Publish Approved Items</h2>
          <div className="rounded-lg border border-border/40 p-4 space-y-2 text-sm">
            <p>Total rows: {totalRows}</p>
            <p>Reviewed: {reviewedRows}</p>
            <p>Approved: {approvedRows}</p>
            <p>Rows with hard issues: {hardIssueRows}</p>
            <p className="text-xs text-muted-foreground">
              Publish is enabled only when all rows are reviewed, approved rows exist,
              and no approved rows have hard issues.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("review")}
              disabled={publishing}
            >
              Back to Review
            </Button>
            <Button onClick={handlePublishRun} disabled={!canPublish || publishing}>
              {publishing ? "Publishing..." : "Publish Approved Items"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
