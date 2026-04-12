"use client";

import { useState } from "react";

interface EvidenceItem {
  title: string;
  doi?: string;
  pmid?: string;
  verdict: "SUPPORTS" | "CONTRADICTS";
  confidence: number;
  passages: { text: string; section: string }[];
  fetchTier: string;
}

interface ClaimEvidenceProps {
  evidence: EvidenceItem[];
  paperCount: number;
}

export function ClaimEvidence({ evidence, paperCount }: ClaimEvidenceProps) {
  const [expanded, setExpanded] = useState(false);

  if (paperCount === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        {expanded ? "▾" : "▸"} {paperCount}{" "}
        {paperCount === 1 ? "paper" : "papers"}
      </button>

      {expanded && evidence.length > 0 && (
        <div className="mt-2 space-y-2 pl-3 border-l border-neutral-800">
          {evidence.map((ev, i) => (
            <div
              key={i}
              className="rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-neutral-300 leading-snug">
                  {ev.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    ev.verdict === "SUPPORTS"
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-red-950 text-red-400"
                  }`}
                >
                  {ev.verdict}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                <span>{(ev.confidence * 100).toFixed(0)}% conf</span>
                <span>·</span>
                <span>{ev.fetchTier}</span>
                {ev.doi && (
                  <>
                    <span>·</span>
                    <a
                      href={`https://doi.org/${ev.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      DOI
                    </a>
                  </>
                )}
              </div>

              {ev.passages.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {ev.passages.map((p, j) => (
                    <blockquote
                      key={j}
                      className="border-l-2 border-neutral-700 pl-2 text-[11px] text-neutral-400 italic"
                    >
                      &ldquo;{p.text}&rdquo;
                      <span className="not-italic text-neutral-600 ml-1">
                        — {p.section}
                      </span>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
