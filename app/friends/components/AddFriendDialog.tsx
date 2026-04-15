"use client";

import { useState } from "react";
import { Copy, Check, UserPlus, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui_primitives/dialog";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import type { UserProfile } from "@/lib/friends/types";
import { useToast } from "@/hooks/use-toast";

interface AddFriendDialogProps {
  currentUser: UserProfile;
}

export function AddFriendDialog({ currentUser }: AddFriendDialogProps) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const { toast } = useToast();

  function copyCode() {
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLookup() {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) return;

    if (cleaned === currentUser.friendCode) {
      setLookupResult("That's your own code!");
      return;
    }

    setLookupResult("Morgan Wright");
  }

  function handleSend() {
    setSent(true);
    toast({
      title: "Request sent!",
      description: `Friend request sent to ${lookupResult}.`,
    });
    setTimeout(() => {
      setCode("");
      setLookupResult(null);
      setSent(false);
    }, 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full bg-white/[0.06] hover:bg-white/10"
        >
          <UserPlus className="h-4 w-4 text-green-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-5">
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
          <DialogDescription>
            Share your code or enter a friend&apos;s code to connect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
              Your Friend Code
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
                <span className="text-lg font-mono font-semibold tracking-widest text-white/90">
                  {currentUser.friendCode}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-xl bg-white/[0.06] hover:bg-white/10 shrink-0"
                onClick={copyCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-white/50" />
                )}
              </Button>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
              Enter Friend Code
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setLookupResult(null);
                  setSent(false);
                }}
                placeholder="APEX-XXXX"
                className="flex-1 rounded-xl bg-white/[0.04] border-white/[0.08] font-mono tracking-widest text-center uppercase"
                maxLength={9}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-white/[0.06] hover:bg-white/10 shrink-0"
                onClick={handleLookup}
                disabled={code.trim().length < 4}
              >
                <Send className="h-4 w-4 text-white/50" />
              </Button>
            </div>

            {lookupResult && lookupResult !== "That's your own code!" && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3">
                <div>
                  <p className="text-sm font-medium text-white/90">{lookupResult}</p>
                  <p className="text-xs text-white/40">Found user</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  onClick={handleSend}
                  disabled={sent}
                >
                  {sent ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Sent
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </div>
            )}

            {lookupResult === "That's your own code!" && (
              <p className="mt-2 text-xs text-amber-400/80">
                That&apos;s your own code! Enter a friend&apos;s code instead.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
