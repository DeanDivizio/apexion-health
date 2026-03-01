"use client";

import * as React from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { FoodResultCard } from "./FoodResultCard";
import { FoodDetailDialog } from "./FoodDetailDialog";
import { RetailItemCreator } from "./RetailItemCreator";
import { searchRetailItemsAction } from "@/actions/nutrition";
import type { MealItemDraft, RetailChainView, RetailItemView } from "@/lib/nutrition";

interface RetailFlowProps {
  chains: RetailChainView[];
  selectedChainId: string | null;
  onSelectedChainIdChange: (id: string | null) => void;
  onAddItem: (item: MealItemDraft) => void;
}

export function RetailFlow({
  chains,
  selectedChainId,
  onSelectedChainIdChange,
  onAddItem,
}: RetailFlowProps) {
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<RetailItemView[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<RetailItemView | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [creatorOpen, setCreatorOpen] = React.useState(false);

  const selectedChain = chains.find((c) => c.id === selectedChainId);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    if (!selectedChainId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchRetailItemsAction(selectedChainId, query.trim());
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedChainId, query]);

  function handleBack() {
    onSelectedChainIdChange(null);
    setQuery("");
    setResults([]);
  }

  // Chain selection grid
  if (!selectedChainId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Select a restaurant</p>
        {chains.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No restaurant chains available yet. Import chain data at /logmeal/addchaindata.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {chains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => onSelectedChainIdChange(chain.id)}
                className="rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 p-4 text-center transition-colors"
              >
                <p className="text-sm font-medium">{chain.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Menu search
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">{selectedChain?.name ?? "Restaurant"}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu items..."
          className="pl-9 h-10"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2">
        {results.map((item) => (
          <FoodResultCard
            key={item.id}
            name={item.name}
            subtitle={
              item.isUserItem
                ? `My item${item.category ? ` · ${item.category}` : ""}`
                : item.category ?? ""
            }
            calories={item.nutrients.calories}
            onClick={() => {
              setSelectedItem(item);
              setDetailOpen(true);
            }}
          />
        ))}
      </div>

      {!searching && results.length === 0 && query.trim().length >= 2 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No results found.
        </p>
      )}

      <div className="text-center pt-2">
        <Button variant="link" size="sm" onClick={() => setCreatorOpen(true)}>
          Can&apos;t find it? Add item
        </Button>
      </div>

      <FoodDetailDialog
        food={
          selectedItem
            ? { type: "retail", data: selectedItem, chainName: selectedChain?.name }
            : null
        }
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddItem={onAddItem}
      />

      <RetailItemCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        chainId={selectedChainId}
        chainName={selectedChain?.name ?? ""}
        onAddItem={onAddItem}
      />
    </div>
  );
}
