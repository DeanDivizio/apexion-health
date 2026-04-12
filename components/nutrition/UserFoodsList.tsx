"use client";

import * as React from "react";
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

      <div className="space-y-2">
        {userFoods.map((food) => (
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
