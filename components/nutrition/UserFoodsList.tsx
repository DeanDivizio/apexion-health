"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import { Input } from "@/components/ui_primitives/input";
import { UserFoodCard } from "./UserFoodCard";
import { UserFoodEditor } from "./UserFoodEditor";
import { deleteUserFoodAction } from "@/actions/nutrition";
import { useToast } from "@/hooks/use-toast";
import type { NutritionUserFoodView } from "@/lib/nutrition";

interface UserFoodsListProps {
  initialUserFoods: NutritionUserFoodView[];
}

export function UserFoodsList({ initialUserFoods }: UserFoodsListProps) {
  const { toast } = useToast();
  const [userFoods, setUserFoods] = React.useState(initialUserFoods);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingFood, setEditingFood] = React.useState<NutritionUserFoodView | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredFoods = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return userFoods;
    return userFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q)),
    );
  }, [userFoods, search]);

  function handleEdit(food: NutritionUserFoodView) {
    setEditingFood(food);
    setEditorOpen(true);
  }

  function handleSaved(saved: NutritionUserFoodView) {
    setUserFoods((prev) => {
      const idx = prev.findIndex((f) => f.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteUserFoodAction(deleteId);
      setUserFoods((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Food deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete food.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {userFoods.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No custom foods yet. Scan a label or create one manually.
        </p>
      )}

      {userFoods.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search my foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="space-y-2">
        {filteredFoods.length === 0 && userFoods.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No foods matching &ldquo;{search.trim()}&rdquo;
          </p>
        )}
        {filteredFoods.map((food) => (
          <UserFoodCard
            key={food.id}
            food={food}
            onEdit={() => handleEdit(food)}
            onDelete={() => setDeleteId(food.id)}
          />
        ))}
      </div>

      <UserFoodEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingFood={editingFood}
        onSaved={handleSaved}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this food?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your personal database. Past meal logs are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
