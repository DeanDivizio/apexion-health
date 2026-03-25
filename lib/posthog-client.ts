"use client";

import posthog from "posthog-js";

type CaptureProperties = Record<string, unknown>;

export function captureClientEvent(
  event: string,
  properties?: CaptureProperties,
) {
  if (typeof window === "undefined") return;

  const runCapture = () => {
    try {
      posthog.capture(event, properties);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[posthog] capture failed", error);
      }
    }
  };

  // Keep analytics completely off the critical interaction path.
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(runCapture, { timeout: 1000 });
    return;
  }

  window.setTimeout(runCapture, 0);
}
