"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { PROVIDER_CONFIGS } from "@/lib/providers/types";

interface ScopeOption {
  scope: string;
  label: string;
  description: string;
}

const WHOOP_SCOPES: ScopeOption[] = [
  {
    scope: "read:sleep",
    label: "Sleep Data",
    description:
      "Correlate sleep patterns with your training, nutrition, and recovery.",
  },
  {
    scope: "read:recovery",
    label: "Recovery Data",
    description:
      "Track HRV, resting heart rate, and readiness alongside your regimen.",
  },
  {
    scope: "read:workout",
    label: "Workout Data",
    description:
      "Associate heart rate, strain, and energy burn with your gym sessions.",
  },
  {
    scope: "read:cycles",
    label: "Cycle Data",
    description: "Daily strain and physiological cycle tracking.",
  },
  {
    scope: "read:body_measurement",
    label: "Body Measurements",
    description:
      "Sync weight and height without manual entry.",
  },
  {
    scope: "read:profile",
    label: "Profile",
    description: "Verify your Whoop identity (name and email).",
  },
];

function generateState(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function ConnectWhoopPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { setMobileHeading } = useContext(MobileHeaderContext);

  const [selected, setSelected] = useState<Set<string>>(
    new Set(WHOOP_SCOPES.map((s) => s.scope)),
  );

  useEffect(() => {
    setMobileHeading("Connect Whoop");
    return () => {
      setMobileHeading("generic");
    };
  }, [setMobileHeading]);

  const toggleScope = (scope: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(WHOOP_SCOPES.map((s) => s.scope)));

  const allSelected = selected.size === WHOOP_SCOPES.length;

  const errorMessage = useMemo(() => {
    if (!error) return null;
    const messages: Record<string, string> = {
      denied: "You declined authorization. You can try again whenever you're ready.",
      no_code: "No authorization code received. Please try again.",
      invalid_state: "Security check failed. Please try again.",
      exchange_failed: "Failed to connect. Please try again.",
    };
    return messages[error] ?? "An unknown error occurred.";
  }, [error]);

  const handleConnect = () => {
    if (selected.size === 0) return;

    const state = generateState();
    const scopes = [...selected, "offline"].join(" ");

    // Store state + scopes in cookies for the callback to validate
    document.cookie = `whoop_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;
    document.cookie = `whoop_oauth_scopes=${[...selected].join(",")}; path=/; max-age=600; SameSite=Lax`;

    const clientId = process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID ?? "";
    const redirectUri = process.env.NEXT_PUBLIC_WHOOP_REDIRECT_URI ?? "";
    const { authUrl } = PROVIDER_CONFIGS.whoop;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      state,
    });

    window.location.href = `${authUrl}?${params.toString()}`;
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center px-4 pb-24 pt-24 md:pt-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-3xl font-light tracking-wide text-neutral-100">
          Connect Whoop
        </h1>
        <p className="mb-8 text-sm text-neutral-400">
          Apexion will passively capture data from your Whoop to help you draw
          insights across your training, nutrition, and recovery.
        </p>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {!allSelected && (
          <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-sm text-blue-300">
            We recommend granting access to all categories for the most
            comprehensive insights.{" "}
            <button
              onClick={selectAll}
              className="underline underline-offset-2 hover:text-blue-200"
            >
              Select all
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {WHOOP_SCOPES.map((opt) => (
            <button
              key={opt.scope}
              onClick={() => toggleScope(opt.scope)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected.has(opt.scope)
                  ? "border-green-500/40 bg-green-950/20"
                  : "border-white/10 bg-neutral-900/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-100">
                  {opt.label}
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    selected.has(opt.scope)
                      ? "border-green-500 bg-green-500"
                      : "border-neutral-600"
                  }`}
                >
                  {selected.has(opt.scope) && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {opt.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={handleConnect}
          disabled={selected.size === 0}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-600 py-3 text-center text-lg font-medium text-white transition-opacity disabled:opacity-40"
        >
          Connect to Whoop
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          You&apos;ll be redirected to Whoop to authorize access. You can
          disconnect at any time from settings.
        </p>
      </div>
    </main>
  );
}
