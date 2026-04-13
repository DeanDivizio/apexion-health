"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import { Button } from "@/components/ui_primitives/button";
import { useToast } from "@/hooks/use-toast";
import { useNavKeys, useSetNavKeys } from "@/hooks/useNavItems";
import { ALL_NAV_OPTIONS, NAV_OPTIONS_BY_KEY, DEFAULT_NAV_KEYS } from "@/lib/nav/navItems";
import { Navigation, RotateCcw, Check } from "lucide-react";

export default function NavigationSettingsPage() {
  const currentKeys = useNavKeys();
  const setNavKeys = useSetNavKeys();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(currentKeys);

  function toggle(key: string) {
    if (selected.includes(key)) {
      if (selected.length <= 1) return;
      setSelected(selected.filter((k) => k !== key));
    } else {
      if (selected.length >= 3) return;
      setSelected([...selected, key]);
    }
  }

  function handleSave() {
    setNavKeys(selected);
    toast({ title: "Navigation updated" });
  }

  function handleReset() {
    setSelected(DEFAULT_NAV_KEYS);
    setNavKeys(DEFAULT_NAV_KEYS);
    toast({ title: "Navigation reset to defaults" });
  }

  const hasChanges =
    selected.length !== currentKeys.length ||
    selected.some((k, i) => k !== currentKeys[i]);

  return (
    <div className="w-full max-w-lg space-y-4">
      <Card className="bg-gradient-to-br from-blue-950/20 to-neutral-950 backdrop-blur-xl border-blue-950/40 !rounded-xl ring-1 ring-blue-950/30">
        <CardHeader className="p-3 pb-4 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-400/90 shrink-0" />
            Navigation Bar
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Choose 3 tabs to show between Home and the log button.
          </p>
        </CardHeader>
        <CardContent className="space-y-1.5 p-3">
          {ALL_NAV_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected.includes(option.key);
            const isDisabled = !isSelected && selected.length >= 3;

            return (
              <button
                key={option.key}
                type="button"
                disabled={isDisabled}
                onClick={() => toggle(option.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                  isSelected
                    ? "bg-green-500/10 ring-1 ring-green-500/30"
                    : isDisabled
                      ? "bg-neutral-900/30 opacity-40 cursor-not-allowed"
                      : "bg-neutral-900/50 hover:bg-neutral-800/60"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-green-500/15" : "bg-neutral-700/50"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      isSelected ? "text-green-400" : "text-neutral-400"
                    }`}
                  />
                </span>
                <span
                  className={`flex-1 text-left text-sm font-medium ${
                    isSelected ? "text-white" : "text-neutral-400"
                  }`}
                >
                  {option.label}
                </span>
                {isSelected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  </span>
                )}
              </button>
            );
          })}

          {selected.length < 3 && (
            <p className="text-xs text-amber-400/80 px-1 pt-1">
              Select {3 - selected.length} more tab{selected.length < 2 ? "s" : ""} to fill the navigation bar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-neutral-900/50 backdrop-blur-xl border-neutral-700/50 !rounded-xl">
        <CardContent className="py-4 px-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Preview
          </p>
          <div className="flex items-center justify-around rounded-2xl bg-neutral-800/60 py-3 px-2">
            {[
              { label: "Home", icon: null as null },
              ...selected.map((k) => {
                const opt = NAV_OPTIONS_BY_KEY.get(k);
                return opt ? { label: opt.label, icon: opt.icon } : null;
              }).filter(Boolean),
            ].map((item) => {
              if (!item) return null;
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center">
                    {Icon ? (
                      <Icon className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                    ) : (
                      <span className="h-5 w-5 rounded-full bg-white/10" />
                    )}
                  </span>
                  <span className="text-[9px] text-white/40">{item.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={selected.length !== 3 || !hasChanges}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
