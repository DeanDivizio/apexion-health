"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, Upload, Download } from "lucide-react";
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
  bulkCreateRetailItemsAction,
  createRetailChainAction,
  listRetailChainsAction,
} from "@/actions/nutrition";
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

export default function AddChainDataPage() {
  const { toast } = useToast();
  const [chains, setChains] = React.useState<RetailChainView[]>([]);
  const [selectedChainId, setSelectedChainId] = React.useState<string>("");
  const [newChainName, setNewChainName] = React.useState("");
  const [creatingChain, setCreatingChain] = React.useState(false);
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [items, setItems] = React.useState<ExtractedItem[]>([]);
  const [saving, setSaving] = React.useState(false);
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

  async function handleSaveAll() {
    if (!selectedChainId || items.length === 0) return;
    setSaving(true);
    try {
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
      }));
      const count = await bulkCreateRetailItemsAction(selectedChainId, payload);
      toast({ title: `${count} items saved to ${selectedChain?.name}` });
      setItems([]);
      setImages([]);
    } catch {
      toast({ title: "Error saving items", variant: "destructive" });
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Import Restaurant Nutrition Data</h1>

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
      {selectedChainId && (
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
                  <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                    {saving ? "Saving..." : "Save All"}
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
                <Button onClick={handleSaveAll} disabled={saving}>
                  {saving ? "Saving..." : "Save All"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
