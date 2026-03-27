"use client";

import { useContext, useState, useTransition, useCallback, useRef } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useSyncStatus } from "@/context/SyncStatusContext";
import { SideNav } from "@/components/global/SideNav";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui_primitives/popover";
import { Button } from "@/components/ui_primitives/button";
import { submitFeedback } from "@/actions/feedback";
import { captureClientEvent } from "@/lib/posthog-client";
import { Send, Check } from "lucide-react";

export default function MobileHeader() {
  const { headerInnerLeft, headerInnerRight } =
    useContext(MobileHeaderContext);
  const { isSyncing } = useSyncStatus();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        captureClientEvent("feedback_popover_opened");
      }
      if (!next) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setMessage("");
        setSubmitted(false);
        setError(null);
      }
      setOpen(next);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!message.trim()) return;
    startTransition(async () => {
      const result = await submitFeedback(message.trim());
      if (result.success) {
        setSubmitted(true);
        setError(null);
        timeoutRef.current = setTimeout(() => setOpen(false), 1500);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }, [message]);

  return (
    <header className="fixed z-10 w-full px-4 pt-2 md:hidden">
      <div className="relative flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex items-center justify-center rounded-full p-2.5 backdrop-blur-md">
            <SideNav />
          </div>
          {headerInnerLeft && (
            <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
              {headerInnerLeft}
            </div>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button className="liquid-glass flex min-h-[44px] w-fit flex-col items-center justify-center rounded-[22px] px-4 py-2 backdrop-blur-md">
                <span className="relative z-[1] flex flex-col items-center">
                  <div className="flex items-center gap-4">
                    <Image src="/logo.webp" width={24} height={24} alt="logo" />
                    <p className="text-md mt-0.5 font-mono font-thin uppercase tracking-wider text-neutral-400">
                      Preview
                    </p>
                  </div>
                  {isSyncing && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                      <span className="text-[10px] text-blue-400">
                        Syncing External Data
                      </span>
                    </div>
                  )}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              sideOffset={8}
              className="w-80 rounded-xl border-neutral-800 bg-neutral-950/95 p-4 backdrop-blur-xl"
            >
              {submitted ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Check className="h-6 w-6 text-green-400" />
                  <p className="text-sm text-neutral-300">
                    Thanks for your feedback!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-neutral-200">
                    Send Feedback
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
                  />
                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}
                  <Button
                    size="sm"
                    disabled={isPending || !message.trim()}
                    onClick={handleSubmit}
                    className="gap-2 self-end"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isPending ? "Sending..." : "Submit"}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          {headerInnerRight && (
            <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
              {headerInnerRight}
            </div>
          )}
          <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton />
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
