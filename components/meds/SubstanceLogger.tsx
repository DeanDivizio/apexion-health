"use client";

import * as React from "react";
import { Beaker } from "lucide-react";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { cn } from "@/lib/utils";
import { INJECTION_DEPTHS } from "@/lib/medication/catalog";
import type {
  SubstanceCatalogItemView,
  SubstanceLogValues,
} from "@/lib/medication";

interface SubstanceLoggerProps {
  substance: SubstanceCatalogItemView;
  values: SubstanceLogValues;
  onChange: (next: Partial<SubstanceLogValues>) => void;
}

export function SubstanceLogger({
  substance,
  values,
  onChange,
}: SubstanceLoggerProps) {
  const showDose = !substance.isCompound;
  const showServings = substance.isCompound;
  const showMethod = substance.methods.length > 0;

  const activeMethodIsInjection = React.useMemo(() => {
    if (!values.deliveryMethodId) return false;
    const method = substance.methods.find(
      (m) => m.id === values.deliveryMethodId,
    );
    return method?.key === "injection";
  }, [substance.methods, values.deliveryMethodId]);

  const filteredVariants = React.useMemo(() => {
    if (!values.deliveryMethodId) return substance.variants;
    return substance.variants.filter(
      (v) =>
        !v.deliveryMethodId || v.deliveryMethodId === values.deliveryMethodId,
    );
  }, [substance.variants, values.deliveryMethodId]);

  const showVariant = filteredVariants.length > 0;

  const ingredientTotals = React.useMemo(() => {
    if (!substance.isCompound || !substance.ingredients.length) return null;
    const servings = values.compoundServings ?? 0;
    return substance.ingredients.map((ing) => ({
      key: ing.ingredientKey,
      name: ing.ingredientName,
      perServing: ing.amountPerServing,
      total: ing.amountPerServing * servings,
      unit: ing.unit,
    }));
  }, [substance, values.compoundServings]);

  return (
    <div className="w-full space-y-5">
        {/* ── Dose ──────────────────────────────────────────────────── */}
        {showDose && (
          <div className="space-y-1.5">
            <Label>Dose</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={values.doseValue ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange({
                    doseValue: raw === "" ? null : Number(raw),
                  });
                }}
                placeholder="Amount"
                className="flex-1"
                min={0}
              />
              <span className="text-sm text-muted-foreground font-medium min-w-10">
                {values.doseUnit}
              </span>
            </div>
          </div>
        )}

        {/* ── Servings ─────────────────────────────────────────────── */}
        {showServings && (
          <div className="space-y-1.5">
            <Label>Servings</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={values.compoundServings ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({
                  compoundServings: raw === "" ? null : Number(raw),
                });
              }}
              placeholder="Number of servings"
              min={0}
            />
          </div>
        )}

        {/* ── Delivery method ──────────────────────────────────────── */}
        {showMethod && (
          <div className="space-y-1.5">
            <Label>Method</Label>
            <div className="flex flex-wrap gap-2">
              {substance.methods.map((method) => {
                const active = values.deliveryMethodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      const next =
                        values.deliveryMethodId === method.id
                          ? null
                          : method.id;
                      onChange({
                        deliveryMethodId: next,
                        variantId: null,
                        injectionDepth: null,
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      active
                        ? "border-green-500 bg-green-500/15 text-green-400"
                        : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Injection depth ────────────────────────────────────── */}
        {activeMethodIsInjection && (
          <div className="space-y-1.5">
            <Label>Injection Depth</Label>
            <div className="flex flex-wrap gap-2">
              {INJECTION_DEPTHS.map((depth) => {
                const active = values.injectionDepth === depth.key;
                return (
                  <button
                    key={depth.key}
                    type="button"
                    onClick={() =>
                      onChange({
                        injectionDepth:
                          values.injectionDepth === depth.key
                            ? null
                            : depth.key,
                      })
                    }
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      active
                        ? "border-green-500 bg-green-500/15 text-green-400"
                        : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {depth.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Variant ──────────────────────────────────────────────── */}
        {showVariant && (
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={values.variantId ?? ""}
              onValueChange={(id) => onChange({ variantId: id || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {filteredVariants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── Ingredient breakdown (compounds) ─────────────────────── */}
        {ingredientTotals && ingredientTotals.length > 0 && (
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Beaker className="h-3.5 w-3.5" />
              Ingredients
              {(values.compoundServings ?? 0) > 0 && (
                <span className="ml-auto normal-case tracking-normal text-foreground/70">
                  &times; {values.compoundServings}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {ingredientTotals.map((ing) => (
                <div
                  key={ing.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{ing.name}</span>
                  <span className="font-medium tabular-nums">
                    {(values.compoundServings ?? 0) > 0
                      ? `${ing.total.toLocaleString()} ${ing.unit}`
                      : `${ing.perServing.toLocaleString()} ${ing.unit}/srv`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
