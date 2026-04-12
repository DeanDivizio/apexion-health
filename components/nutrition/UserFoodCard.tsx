"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui_primitives/badge";
import { Button } from "@/components/ui_primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import type { NutritionUserFoodView } from "@/lib/nutrition";

interface UserFoodCardProps {
  food: NutritionUserFoodView;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function UserFoodCard({ food, onEdit, onDelete }: UserFoodCardProps) {
  const { nutrients } = food;

  return (
    <div className="rounded-lg border border-border/40 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{food.name}</p>
          <p className="text-xs text-muted-foreground">
            {food.brand && <>{food.brand} &middot; </>}
            {Math.round(nutrients.calories)} cal &middot; {food.servingSize}{food.servingUnit} serving
          </p>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
          P: {Math.round(nutrients.protein)}g
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
          C: {Math.round(nutrients.carbs)}g
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
          F: {Math.round(nutrients.fat)}g
        </Badge>
      </div>
    </div>
  );
}
