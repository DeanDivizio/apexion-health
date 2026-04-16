"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Dumbbell, type LucideIcon } from "lucide-react";

interface SettingsSection {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const SECTIONS: SettingsSection[] = [
  {
    href: "/settings/nutrition",
    icon: Apple,
    title: "Nutrition",
    description: "Macros, hydration & targets",
  },
  {
    href: "/settings/gym",
    icon: Dumbbell,
    title: "Gym",
    description: "Rep input & logging prefs",
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1">
      <h2 className="mb-3 text-lg font-medium tracking-wide text-neutral-100">
        Settings
      </h2>
      {SECTIONS.map((section) => {
        const isActive = pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive
                ? "bg-white/[0.08] text-white"
                : "text-white/60 hover:bg-white/[0.05] hover:text-white/80"
            }`}
          >
            <section.icon
              className={`h-4 w-4 shrink-0 ${isActive ? "text-green-400" : "text-white/40"}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{section.title}</p>
              <p className={`text-[11px] ${isActive ? "text-white/40" : "text-white/25"}`}>
                {section.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
