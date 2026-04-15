"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Dumbbell,
  Apple,
  Droplets,
  Activity,
  Pill,
  Clock3,
  Lock,
} from "lucide-react";
import { Switch } from "@/components/ui_primitives/switch";
import { Button } from "@/components/ui_primitives/button";
import type { Friendship, SocialDomain } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";

interface DomainConfig {
  domain: SocialDomain;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  available: boolean;
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: "GYM",
    label: "Gym & Workouts",
    description: "Workout sessions, exercises, PRs, and streaks",
    icon: Dumbbell,
    color: "text-teal-400",
    available: true,
  },
  {
    domain: "NUTRITION",
    label: "Nutrition",
    description: "Meals, macro breakdowns, and daily goals",
    icon: Apple,
    color: "text-green-400",
    available: true,
  },
  {
    domain: "HYDRATION",
    label: "Hydration",
    description: "Water intake, daily goals, and streaks",
    icon: Droplets,
    color: "text-sky-400",
    available: true,
  },
  {
    domain: "BIOMETRICS",
    label: "Biometrics",
    description: "Sleep, recovery, and wearable data",
    icon: Activity,
    color: "text-violet-400",
    available: false,
  },
  {
    domain: "MEDICATION",
    label: "Medications & Supplements",
    description: "Dose logging and supplement tracking",
    icon: Pill,
    color: "text-amber-400",
    available: false,
  },
  {
    domain: "ACTIVITY",
    label: "Habits & Activities",
    description: "Custom activity tracking and streaks",
    icon: Clock3,
    color: "text-pink-400",
    available: false,
  },
];

interface SharingPermissionsProps {
  friendship: Friendship;
  onBack: () => void;
}

export function SharingPermissions({ friendship, onBack }: SharingPermissionsProps) {
  const [permissions, setPermissions] = useState(friendship.permissions);

  function toggleDomain(domain: SocialDomain) {
    setPermissions((prev) =>
      prev.map((p) => (p.domain === domain ? { ...p, enabled: !p.enabled } : p))
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        className="p-0 px-0 bg-transparent hover:bg-transparent active:scale-95 transition-transform -ml-1"
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4 text-neutral-400" />
        <span className="text-xs font-medium text-neutral-400">Friends</span>
      </Button>

      <div className="flex items-center gap-3 mb-2">
        <UserAvatar user={friendship.friend} size="lg" />
        <div>
          <p className="text-lg font-medium text-white/90">
            {friendship.friend.displayName}
          </p>
          <p className="text-xs text-white/40">
            Friends since{" "}
            {friendship.createdAt.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
          What you share with {friendship.friend.displayName.split(" ")[0]}
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-neutral-800/40 divide-y divide-white/[0.04] overflow-hidden">
          {DOMAIN_CONFIGS.map((config) => {
            const perm = permissions.find((p) => p.domain === config.domain);
            const enabled = perm?.enabled ?? false;
            const Icon = config.icon;

            return (
              <div
                key={config.domain}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  !config.available ? "opacity-40" : ""
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] shrink-0">
                  <Icon className={`h-4.5 w-4.5 ${config.available ? config.color : "text-white/30"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-white/80">
                      {config.label}
                    </p>
                    {!config.available && (
                      <Lock className="h-3 w-3 text-white/30" />
                    )}
                  </div>
                  <p className="text-xs text-white/35">
                    {config.available
                      ? config.description
                      : "Coming soon"}
                  </p>
                </div>
                <Switch
                  checked={config.available ? enabled : false}
                  onCheckedChange={() => config.available && toggleDomain(config.domain)}
                  disabled={!config.available}
                  className="shrink-0"
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-white/25 text-center px-4 pt-2">
        This controls what {friendship.friend.displayName.split(" ")[0]} sees in
        their feed from you. They control what you see from them independently.
      </p>
    </div>
  );
}
