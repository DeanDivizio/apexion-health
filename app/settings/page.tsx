import Link from "next/link";
import { ChevronRight, Home, Apple, Dumbbell, Navigation, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui_primitives/card";

const SECTIONS = [
  {
    href: "/settings/home",
    icon: Home,
    title: "Home Screen",
    description: "Customize your dashboard",
  },
  {
    href: "/settings/navigation",
    icon: Navigation,
    title: "Navigation Bar",
    description: "Choose which tabs appear in the nav",
  },
  {
    href: "/settings/nutrition",
    icon: Apple,
    title: "Nutrition",
    description: "Macros, hydration & electrolyte targets",
  },
  {
    href: "/settings/gym",
    icon: Dumbbell,
    title: "Gym",
    description: "Rep input style and logging preferences",
  },
] as const;

export default function SettingsHubPage() {
  return (
    <>
      {/* Mobile: card links */}
      <div className="w-full space-y-3 md:hidden">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50 hover:bg-neutral-800/70 transition-colors cursor-pointer mb-3">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-700/50">
                  <section.icon className="w-5 h-5 text-neutral-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {section.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Desktop: prompt to pick a category */}
      <div className="hidden md:flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800/60 mb-4">
          <Settings className="h-6 w-6 text-neutral-500" />
        </div>
        <p className="text-sm text-neutral-400">
          Select a category to configure
        </p>
      </div>
    </>
  );
}
