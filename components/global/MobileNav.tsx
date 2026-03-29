"use client";

import Link from "next/link";
import {
  House,
  Plus,
  Dumbbell,
  Pill,
  Apple,
  Droplets,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu-raw";
import { useState } from "react";
import LogHydrationDialog from "@/components/hydration/LogHydrationDialog";

const navItems = [
  { href: "/", icon: House, label: "Home" },
  { href: "/meals", icon: Apple, label: "Meals" },
  { href: "/gymsessions", icon: Dumbbell, label: "Gym" },
  { href: "/meds", icon: Pill, label: "Meds" },
];

const logItems = [
  { href: "/logmeal", icon: Apple, label: "Meal" },
  { href: "/logmedication", icon: Pill, label: "Meds / Supplements" },
  { href: "/logworkout", icon: Dumbbell, label: "Workout" },
];

function AddButton({
  open,
  setOpen,
  onHydrationClick,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onHydrationClick: () => void;
}) {
  function handleNavClick(state: boolean) {
    setTimeout(() => setOpen(state), 60);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="liquid-glass-green backdrop-blur-md flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 data-[state=open]:rotate-45">
          <Plus className="relative z-[1] h-7 w-7 text-green-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="add-menu-pop liquid-glass backdrop-blur-md w-56 !rounded-2xl !border-white/[0.08] !bg-transparent p-2 !shadow-none"
        align="end"
        sideOffset={12}
      >
        <p className="px-3 pb-2 pt-1 text-xs font-medium tracking-wide text-white/40">
          LOG
        </p>

        {logItems.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem
            key={href}
            className="!rounded-xl px-3 py-3 focus:!bg-white/[0.08]"
            onClick={() => handleNavClick(false)}
          >
            <Link href={href} className="flex w-full items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                <Icon className="h-4 w-4 text-green-400" />
              </span>
              <span className="text-[15px] font-light text-white/90">
                {label}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="mx-2 my-2 !bg-white/[0.06]" />

        <p className="px-3 pb-2 text-xs font-medium tracking-wide text-white/40">
          QUICK LOG
        </p>

        <DropdownMenuItem
          className="!rounded-xl px-3 py-3 focus:!bg-white/[0.08]"
          onClick={() => {
            handleNavClick(false);
            onHydrationClick();
          }}
        >
          <span className="flex w-full items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
              <Droplets className="h-4 w-4 text-blue-400" />
            </span>
            <span className="text-[15px] font-light text-white/90">Water</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hydrationOpen, setHydrationOpen] = useState(false);

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-[9] transition duration-500 ${
          open ? "bg-black/20 backdrop-blur-sm" : "bg-transparent"
        }`}
      />

      <nav className="fixed bottom-0 z-10 flex w-full items-center justify-center gap-3 px-4 pb-2 md:hidden">
        <div className="liquid-glass backdrop-blur-md flex flex-1 items-center justify-around rounded-[28px] py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className="relative z-[1] flex flex-col items-center gap-0.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                    isActive ? "bg-white/[0.12]" : ""
                  }`}
                >
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/45"
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </span>
                <span
                  className={`text-[10px] font-medium transition-colors duration-300 ${
                    isActive ? "text-green-400" : "text-white/45"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <AddButton
          open={open}
          setOpen={setOpen}
          onHydrationClick={() => setHydrationOpen(true)}
        />
      </nav>

      <LogHydrationDialog open={hydrationOpen} onOpenChange={setHydrationOpen} />
    </>
  );
}
