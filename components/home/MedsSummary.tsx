"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
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
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Pill className="w-4 h-4 text-violet-400" />
          Meds & Supplements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No medications or supplements logged today
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <MedsSessionRow key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MedsSessionRow({ session }: { session: MedsSession }) {
  const timeStr = formatTime(session.loggedAt);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{timeStr}</p>
      <ul className="space-y-0.5">
        {session.items.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-1.5">
            <span className="text-violet-400 mt-1.5 flex-shrink-0">·</span>
            <span>
              {item.substanceName}
              {item.compoundServings != null ? (
                <span className="text-muted-foreground">
                  {" "}— {item.compoundServings} serving{item.compoundServings !== 1 ? "s" : ""}
                </span>
              ) : item.doseValue != null ? (
                <span className="text-muted-foreground">
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
