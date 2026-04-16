"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Apple,
  ClipboardPlus,
  Clock3,
  Dumbbell,
  Settings,
  TestTube,
  type LucideIcon,
} from "lucide-react";

interface NavEntry {
  href: string;
  icon: LucideIcon;
  label: string;
  placeholder?: boolean;
}

const categories: NavEntry[] = [
  { href: "/gymsessions", icon: Dumbbell, label: "Gym Sessions" },
  { href: "/meals", icon: Apple, label: "Meals" },
  { href: "/meds", icon: ClipboardPlus, label: "Medication & Supplements" },
  { href: "/activities", icon: Clock3, label: "Habits & Activities" },
  // { href: "/bodymeasurements", icon: Scale, label: "Body Measurements" },
  // { href: "/biometrics", icon: Activity, label: "Biometrics" },
  { href: "/labs", icon: TestTube, label: "Clinical Labs" },
];


function NavItem({ href, icon: Icon, label, placeholder, isActive }: NavEntry & { isActive: boolean }) {
  if (placeholder) {
    return (
      <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/25 cursor-default">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-light">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white/80"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "text-green-400" : ""}`} />
      <span className="text-sm font-light">{label}</span>
    </Link>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-white/30">
      {children}
    </p>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl md:flex">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.webp" width={28} height={28} alt="Apexion Health" />
          <span className="text-sm font-light tracking-wide text-white/70">
            Apexion Health
          </span>
        </div>
        {user?.firstName && (
          <p className="mt-3 text-xs font-thin italic text-white/40">
            {getGreeting()}, {user.firstName}
          </p>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
        <div>
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isHome
                ? "bg-white/[0.08] text-white"
                : "text-white/60 hover:bg-white/[0.05] hover:text-white/80"
            }`}
          >
            <span className="text-sm font-light">Home</span>
          </Link>
        </div>

        <div>
          <SectionHeading>Categories</SectionHeading>
          <div className="space-y-0.5">
            {categories.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={!item.placeholder && pathname.startsWith(item.href)}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading>Dashboards</SectionHeading>
          <p className="px-3 text-[10px] italic text-white/20">Coming Soon</p>
        </div>
      </nav>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-light transition-colors ${
              pathname.startsWith("/settings")
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </div>
    </aside>
  );
}
