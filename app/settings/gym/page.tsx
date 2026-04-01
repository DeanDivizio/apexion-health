"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getGymUserPreferencesAction,
  updateGymUserPreferencesAction,
} from "@/actions/gym";
import type { RepInputStyle } from "@/lib/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Label } from "@/components/ui_primitives/label";
import { Button } from "@/components/ui_primitives/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GymPrefsState {
  repInputStyle: RepInputStyle;
}

const DEFAULT_PREFS: GymPrefsState = {
  repInputStyle: "dropdown",
};

function toRepInputStyle(value: string | undefined | null): RepInputStyle {
  return value === "freeform" ? "freeform" : "dropdown";
}

export default function GymSettingsPage() {
  const [prefs, setPrefs] = useState<GymPrefsState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getGymUserPreferencesAction().then((data) => {
      setPrefs({
        repInputStyle: toRepInputStyle(data?.repInputStyle),
      });
    });
  }, []);

  if (!prefs) return <GymSettingsSkeleton />;

  function handleSave() {
    if (!prefs) return;
    startTransition(async () => {
      try {
        await updateGymUserPreferencesAction({ repInputStyle: prefs.repInputStyle });
        toast({ title: "Gym settings saved" });
      } catch {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    });
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Customize your gym logging experience.
      </p>

      <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">UI Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Rep Input Style</Label>
            <Select
              value={prefs.repInputStyle ?? DEFAULT_PREFS.repInputStyle}
              onValueChange={(val) =>
                setPrefs({ ...prefs, repInputStyle: toRepInputStyle(val) })
              }
            >
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="freeform">Freeform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={isPending}
        onClick={handleSave}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save
      </Button>
    </div>
  );
}

function GymSettingsSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="rounded-xl bg-neutral-800/50 p-4 space-y-3">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 rounded-md bg-neutral-900/50 animate-pulse" />
      </div>
      <div className="h-11 rounded-md bg-muted animate-pulse" />
    </div>
  );
}
