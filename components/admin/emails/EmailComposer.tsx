"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Monitor,
  Save,
  Send,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { EmailBroadcast } from "@prisma/client";
import {
  createEmailBroadcast,
  updateEmailBroadcast,
  deleteEmailBroadcast,
} from "@/actions/emails";

interface Props {
  email: EmailBroadcast | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type SendState = "idle" | "confirming" | "sending" | "sent" | "error";
type TestState = "idle" | "sending" | "sent" | "error";

export function EmailComposer({ email }: Props) {
  const router = useRouter();
  const [persistedId, setPersistedId] = useState<string | null>(
    email?.id ?? null,
  );
  const [subject, setSubject] = useState(email?.subject ?? "");
  const [body, setBody] = useState(email?.body ?? "");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [sendState, setSendState] = useState<SendState>(
    email?.sentAt ? "sent" : "idle",
  );
  const [sendError, setSendError] = useState<string>("");
  const [sentCount, setSentCount] = useState<number | null>(
    email?.sentCount ?? null,
  );
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientCountLoading, setRecipientCountLoading] = useState(false);

  const [testState, setTestState] = useState<TestState>("idle");
  const [testEmail, setTestEmail] = useState<string>("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPreview = useCallback(async (s: string, b: string) => {
    try {
      const res = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, body: b }),
      });
      const data = await res.json();
      if (data.html) setPreviewHtml(data.html);
    } catch {
      // silently ignore preview errors
    }
  }, []);

  useEffect(() => {
    fetchPreview(subject, body);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const schedulePreview = useCallback(
    (s: string, b: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPreview(s, b), 400);
    },
    [fetchPreview],
  );

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value);
    schedulePreview(e.target.value, body);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    schedulePreview(subject, e.target.value);
  };

  const handleSave = async () => {
    setSaveState("saving");

    if (persistedId) {
      const result = await updateEmailBroadcast(persistedId, subject, body);
      if (result.success) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } else {
        setSaveState("error");
      }
    } else {
      const result = await createEmailBroadcast(subject, body);
      if (result.success && result.id) {
        setPersistedId(result.id);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
        router.replace(`/admin/emails/${result.id}`);
      } else {
        setSaveState("error");
      }
    }
  };

  const handleDelete = async () => {
    if (!persistedId) {
      router.push("/admin/emails");
      return;
    }
    if (!confirm("Delete this email draft? This cannot be undone.")) return;
    await deleteEmailBroadcast(persistedId);
    router.push("/admin/emails");
  };

  const fetchRecipientCount = async () => {
    setRecipientCountLoading(true);
    try {
      const res = await fetch("/api/admin/emails/recipients");
      const data = await res.json();
      if (typeof data.count === "number") {
        setRecipientCount(data.count);
      }
    } catch {
      // leave count as null
    } finally {
      setRecipientCountLoading(false);
    }
  };

  const handleSendConfirm = () => {
    setSendState("confirming");
    fetchRecipientCount();
  };

  const handleSendCancel = () => {
    setSendState("idle");
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      setSendError("Subject cannot be empty.");
      setSendState("error");
      return;
    }
    if (!body.trim()) {
      setSendError("Body cannot be empty.");
      setSendState("error");
      return;
    }

    setSendState("sending");
    setSendError("");

    let idToSend = persistedId;
    if (!idToSend) {
      const createResult = await createEmailBroadcast(subject, body);
      if (!createResult.success || !createResult.id) {
        setSendError("Failed to save email before sending.");
        setSendState("error");
        return;
      }
      idToSend = createResult.id;
      setPersistedId(idToSend);
    } else {
      await updateEmailBroadcast(idToSend, subject, body);
    }

    try {
      const res = await fetch(`/api/admin/emails/${idToSend}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? "Failed to send email.");
        setSendState("error");
      } else {
        setSentCount(data.sentCount);
        setSendState("sent");
        router.replace(`/admin/emails/${idToSend}`);
      }
    } catch {
      setSendError("Network error. Please try again.");
      setSendState("error");
    }
  };

  const handleSendTest = async () => {
    if (!subject.trim() || !body.trim()) return;
    setTestState("sending");

    try {
      const res = await fetch("/api/admin/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestState("error");
      } else {
        setTestEmail(data.to);
        setTestState("sent");
        setTimeout(() => setTestState("idle"), 4000);
      }
    } catch {
      setTestState("error");
      setTimeout(() => setTestState("idle"), 3000);
    }
  };

  const alreadySent = sendState === "sent";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/emails"
            className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Emails
          </Link>
          <span className="text-neutral-700">/</span>
          <span className="text-sm text-neutral-400">
            {alreadySent ? "Sent" : "Draft"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!alreadySent && (
            <>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={handleSendTest}
                disabled={
                  testState === "sending" ||
                  !subject.trim() ||
                  !body.trim()
                }
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-40"
              >
                {testState === "sending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : testState === "sent" ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <SendHorizonal className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {testState === "sent"
                    ? `Sent to ${testEmail}`
                    : testState === "error"
                      ? "Failed"
                      : "Send Test"}
                </span>
              </button>
              <button
                onClick={handleSave}
                disabled={saveState === "saving"}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {saveState === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveState === "saved" ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {saveState === "saved" ? "Saved" : "Save"}
                </span>
              </button>
              <button
                onClick={handleSendConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Send to All Users</span>
              </button>
            </>
          )}
          {alreadySent && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" />
              Sent to {sentCount?.toLocaleString() ?? "?"} recipients
            </div>
          )}
        </div>
      </div>

      {/* Send confirmation dialog */}
      {sendState === "confirming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-neutral-100">
              Send to all users?
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              This will send{" "}
              <span className="font-medium text-neutral-200">
                {subject || "(No subject)"}
              </span>{" "}
              to{" "}
              {recipientCountLoading ? (
                <Loader2 className="inline h-3 w-3 animate-spin" />
              ) : recipientCount != null ? (
                <span className="font-medium text-neutral-200">
                  {recipientCount.toLocaleString()}
                </span>
              ) : (
                "all"
              )}{" "}
              {recipientCount === 1 ? "user" : "users"}. This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSendCancel}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <Send className="h-3.5 w-3.5" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sending overlay */}
      {sendState === "sending" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-neutral-300">Sending emails…</p>
        </div>
      )}

      {/* Error banner */}
      {sendState === "error" && (
        <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {sendError || "Something went wrong."}
          <button
            onClick={() => setSendState("idle")}
            className="ml-3 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Side-by-side editor + preview */}
      <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
        {/* Left: editor */}
        <div className="flex flex-col gap-3 overflow-auto">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={handleSubjectChange}
              disabled={alreadySent}
              placeholder="Your email subject…"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Body
              </label>
              <span className="text-xs text-neutral-600">
                Markdown supported
              </span>
            </div>
            <textarea
              value={body}
              onChange={handleBodyChange}
              disabled={alreadySent}
              placeholder={`Write your email in Markdown…\n\nHello,\n\nWe have some exciting news to share!\n\n**Bold text**, *italics*, and [links](https://example.com) are all supported.`}
              className="min-h-[300px] flex-1 resize-none rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 font-mono text-sm leading-relaxed text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[400px]"
            />
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-neutral-800 md:min-h-0">
          <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/60 px-3 py-2">
            <Monitor className="h-3.5 w-3.5 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-500">
              Preview
            </span>
          </div>
          {previewHtml ? (
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full flex-1"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
