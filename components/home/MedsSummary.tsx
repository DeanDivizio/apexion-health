"use client";

import { Pill } from "lucide-react";

interface MedsSessionItem {
  substanceName: string;
  doseValue: number | null;
  doseUnit: string | null;
  compoundServings: number | null;
  deliveryMethod: string | null;
}

interface MedsSession {
  sessionId: string;
  loggedAt: string;
  items: MedsSessionItem[];
}

interface MedsSummaryProps {
  sessions: MedsSession[];
}

export function MedsSummary({ sessions }: MedsSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-teal-400 opacity-80">Meds &amp; Supplements</span>
        <Pill className="h-3.5 w-3.5 text-teal-200 opacity-40 shrink-0" aria-hidden />
      </div>
      <div>
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No medications or supplements logged today
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <MedsSessionRow key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MedsSessionRow({ session }: { session: MedsSession }) {
  const timeStr = formatTime(session.loggedAt);

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1">{timeStr}</p>
      <ul className="space-y-0.5">
        {session.items.map((item, i) => (
          <li key={i} className="text-sm text-neutral-100 flex items-start gap-1.5">
            <span className="text-violet-400 mt-1.5 flex-shrink-0">·</span>
            <span>
              {item.substanceName}
              {item.compoundServings != null ? (
                <span className="text-neutral-500">
                  {" "}— {item.compoundServings} serving{item.compoundServings !== 1 ? "s" : ""}
                </span>
              ) : item.doseValue != null ? (
                <span className="text-neutral-500">
                  {" "}— {item.doseValue} {item.doseUnit ?? "mg"}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}
