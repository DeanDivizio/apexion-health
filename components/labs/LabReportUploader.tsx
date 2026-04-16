"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import { Switch } from "@/components/ui_primitives/switch";
import { Badge } from "@/components/ui_primitives/badge";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui_primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import {
  AlertTriangle,
  ChevronsUpDown,
  FileUp,
  Loader2,
  X,
} from "lucide-react";
import {
  extractLabReportAction,
  confirmLabReportAction,
  listMarkersAction,
} from "@/actions/labs";
import { encryptFile } from "@/lib/labs/client/fileEncryption";
import type { ResolvedResult } from "@/lib/labs/server/aliasResolver";
import type { LabResultItem } from "@/lib/labs/ocr/extractLabReport";
import type { MarkerCatalogView } from "@/lib/labs/types";

interface LabReportUploaderProps {
  onComplete: (newReportId: string) => void;
  onCancel: () => void;
}

type Step = "select" | "review";

interface EditableResult {
  raw: LabResultItem;
  markerId: string;
  markerKey: string;
  canonicalName: string;
  value: number;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  flag: string | null;
}

interface UnmatchedItem {
  raw: LabResultItem;
  mappedMarkerId: string | null;
  mappedMarkerName: string | null;
  skipped: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LabReportUploader({
  onComplete,
  onCancel,
}: LabReportUploaderProps) {
  const [step, setStep] = useState<Step>("select");
  const [extracting, startExtract] = useTransition();
  const [confirming, startConfirm] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  const [reportDate, setReportDate] = useState("");
  const [drawTime, setDrawTime] = useState("");
  const [institution, setInstitution] = useState("");
  const [providerName, setProviderName] = useState("");
  const [notes, setNotes] = useState("");

  const [matchedResults, setMatchedResults] = useState<EditableResult[]>([]);
  const [unmatchedResults, setUnmatchedResults] = useState<UnmatchedItem[]>(
    [],
  );
  const [markers, setMarkers] = useState<MarkerCatalogView[]>([]);

  const [storeFile, setStoreFile] = useState(false);
  const [encryptEnabled, setEncryptEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const passwordsMatch = password === passwordConfirm && password.length > 0;

  const handleFileDrop = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setError(null);

      const base64 = await fileToBase64(selectedFile);
      setFileBase64(base64);

      startExtract(async () => {
        try {
          const [result, markerList] = await Promise.all([
            extractLabReportAction(base64, selectedFile.type),
            listMarkersAction(),
          ]);
          setMarkers(markerList);

          setReportDate(result.extractedReport.reportDate ?? "");
          setDrawTime(result.extractedReport.drawTime ?? "");
          setInstitution(result.extractedReport.institution ?? "");
          setProviderName(result.extractedReport.providerName ?? "");

          setMatchedResults(
            result.matched.map((m: ResolvedResult) => ({
              raw: m.raw,
              markerId: m.markerId,
              markerKey: m.markerKey,
              canonicalName: m.canonicalName,
              value: m.raw.value,
              unit: m.raw.unit,
              rangeLow: m.raw.rangeLow,
              rangeHigh: m.raw.rangeHigh,
              flag: m.raw.flag,
            })),
          );

          setUnmatchedResults(
            result.unmatched.map((u: LabResultItem) => ({
              raw: u,
              mappedMarkerId: null,
              mappedMarkerName: null,
              skipped: false,
            })),
          );

          setStep("review");
        } catch (err: any) {
          setError(err?.message ?? "OCR extraction failed. Please try again.");
        }
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    startConfirm(async () => {
      setError(null);
      try {
        const allResults = [
          ...matchedResults.map((r) => ({
            markerId: r.markerId,
            value: r.value,
            unit: r.unit,
            rangeLow: r.rangeLow,
            rangeHigh: r.rangeHigh,
            flag: r.flag,
            rawName: r.raw.name,
          })),
          ...unmatchedResults
            .filter((u) => !u.skipped && u.mappedMarkerId)
            .map((u) => ({
              markerId: u.mappedMarkerId!,
              value: u.raw.value,
              unit: u.raw.unit,
              rangeLow: u.raw.rangeLow,
              rangeHigh: u.raw.rangeHigh,
              flag: u.raw.flag,
              rawName: u.raw.name,
            })),
        ];

        const newAliases = unmatchedResults
          .filter((u) => !u.skipped && u.mappedMarkerId)
          .map((u) => ({
            rawName: u.raw.name,
            markerId: u.mappedMarkerId!,
          }));

        let filePayload: {
          base64: string;
          fileName: string;
          mimeType: string;
          encrypted: boolean;
        } | null = null;

        if (storeFile && file && fileBase64) {
          if (encryptEnabled && password) {
            const buf = Uint8Array.from(atob(fileBase64), (c) =>
              c.charCodeAt(0),
            ).buffer;
            const encrypted = await encryptFile(buf, password);
            const encryptedBase64 = btoa(
              String.fromCharCode(...new Uint8Array(encrypted)),
            );
            filePayload = {
              base64: encryptedBase64,
              fileName: file.name,
              mimeType: file.type,
              encrypted: true,
            };
          } else {
            filePayload = {
              base64: fileBase64,
              fileName: file.name,
              mimeType: file.type,
              encrypted: false,
            };
          }
        }

        const reportId = await confirmLabReportAction({
          reportDate,
          drawTime: drawTime || null,
          institution: institution || null,
          providerName: providerName || null,
          notes: notes || null,
          results: allResults,
          newAliases: newAliases.length > 0 ? newAliases : undefined,
          file: filePayload,
        });

        onComplete(reportId);
      } catch (err: any) {
        setError(err?.message ?? "Failed to save report.");
      }
    });
  }, [
    matchedResults,
    unmatchedResults,
    storeFile,
    encryptEnabled,
    password,
    file,
    fileBase64,
    reportDate,
    drawTime,
    institution,
    providerName,
    notes,
    onComplete,
  ]);

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">
            Upload Lab Report
          </h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>

        {extracting ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            <p className="text-sm text-white/50">
              Analyzing your lab report...
            </p>
            <p className="text-xs text-white/30">
              This may take 5–15 seconds for multi-page documents
            </p>
          </div>
        ) : (
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-20 transition-colors ${
              dragActive
                ? "border-green-400 bg-green-500/10"
                : "border-white/15 bg-white/[0.02] hover:border-white/25"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) handleFileDrop(dropped);
            }}
          >
            <FileUp className="h-10 w-10 text-white/30" />
            <div className="text-center">
              <p className="text-sm text-white/60">
                Drag & drop a lab report, or click to browse
              </p>
              <p className="mt-1 text-xs text-white/30">
                PDF or image (JPG, PNG)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileDrop(f);
              }}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white/90">
          Review Extracted Results
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-sm font-medium text-white/60">
          Report Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs text-white/40">Report Date</Label>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-white/40">Draw Time</Label>
            <Input
              type="time"
              value={drawTime}
              onChange={(e) => setDrawTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-white/40">Institution</Label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Quest Diagnostics"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-white/40">Provider</Label>
            <Input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. Dr. Smith"
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-xs text-white/40">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this report..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      {matchedResults.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-medium text-white/60">
            Matched Results ({matchedResults.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="pb-2 pr-3 font-medium">Raw Name</th>
                  <th className="pb-2 pr-3 font-medium">Mapped To</th>
                  <th className="pb-2 pr-3 font-medium text-right">Value</th>
                  <th className="pb-2 pr-3 font-medium">Unit</th>
                  <th className="pb-2 pr-3 font-medium">Range</th>
                  <th className="pb-2 font-medium">Flag</th>
                </tr>
              </thead>
              <tbody>
                {matchedResults.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5"
                  >
                    <td className="py-2 pr-3 text-white/50">{r.raw.name}</td>
                    <td className="py-2 pr-3 text-green-400/80">
                      {r.canonicalName}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Input
                        type="number"
                        value={r.value}
                        onChange={(e) => {
                          const copy = [...matchedResults];
                          copy[i] = {
                            ...copy[i],
                            value: parseFloat(e.target.value) || 0,
                          };
                          setMatchedResults(copy);
                        }}
                        className="h-7 w-20 text-right text-xs"
                      />
                    </td>
                    <td className="py-2 pr-3 text-white/50">{r.unit}</td>
                    <td className="py-2 pr-3 text-white/40">
                      {r.rangeLow != null && r.rangeHigh != null
                        ? `${r.rangeLow} – ${r.rangeHigh}`
                        : "—"}
                    </td>
                    <td className="py-2">
                      {r.flag && (
                        <Badge
                          className={
                            r.flag === "H"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }
                        >
                          {r.flag}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unmatchedResults.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="mb-3 text-sm font-medium text-amber-400/80">
            Unmatched Results ({unmatchedResults.length})
          </h3>
          <p className="mb-4 text-xs text-white/40">
            These names could not be automatically matched to a known marker.
            Map them to an existing marker or skip.
          </p>
          <div className="space-y-3">
            {unmatchedResults.map((u, i) => (
              <UnmatchedRow
                key={i}
                item={u}
                markers={markers}
                onChange={(updated) => {
                  const copy = [...unmatchedResults];
                  copy[i] = updated;
                  setUnmatchedResults(copy);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-sm font-medium text-white/60">
          File Storage
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={storeFile}
              onCheckedChange={setStoreFile}
            />
            <Label className="text-sm text-white/70">
              Store original file
            </Label>
          </div>

          {storeFile && (
            <>
              <div className="flex items-center gap-3">
                <Switch
                  checked={encryptEnabled}
                  onCheckedChange={setEncryptEnabled}
                />
                <Label className="text-sm text-white/70">
                  Password-protect file
                </Label>
              </div>

              {encryptEnabled && (
                <div className="space-y-3 pl-14">
                  <div>
                    <Label className="text-xs text-white/40">Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 max-w-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/40">
                      Confirm Password
                    </Label>
                    <Input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="mt-1 max-w-xs"
                    />
                    {passwordConfirm && !passwordsMatch && (
                      <p className="mt-1 text-xs text-red-400">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs text-amber-300/90">
                      This password encrypts your file client-side. If
                      forgotten, the file cannot be recovered. We cannot reset
                      it for you.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={
            confirming ||
            matchedResults.length +
              unmatchedResults.filter(
                (u) => !u.skipped && u.mappedMarkerId,
              ).length ===
              0 ||
            !reportDate ||
            (storeFile && encryptEnabled && !passwordsMatch)
          }
        >
          {confirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Confirm & Save"
          )}
        </Button>
      </div>
    </div>
  );
}

function UnmatchedRow({
  item,
  markers,
  onChange,
}: {
  item: UnmatchedItem;
  markers: MarkerCatalogView[];
  onChange: (item: UnmatchedItem) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
        item.skipped
          ? "border-white/5 bg-white/[0.02] opacity-50"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/80">{item.raw.name}</p>
        <p className="text-xs text-white/40">
          {item.raw.value} {item.raw.unit}
          {item.raw.rangeLow != null &&
            item.raw.rangeHigh != null &&
            ` (${item.raw.rangeLow}–${item.raw.rangeHigh})`}
        </p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[180px] justify-between text-xs"
            disabled={item.skipped}
          >
            {item.mappedMarkerName ?? "Map to marker..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search markers..." />
            <CommandList>
              <CommandEmpty>No markers found.</CommandEmpty>
              <CommandGroup>
                {markers.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={m.canonicalName}
                    onSelect={() => {
                      onChange({
                        ...item,
                        mappedMarkerId: m.id,
                        mappedMarkerName: m.canonicalName,
                        skipped: false,
                      });
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1">{m.canonicalName}</span>
                    <span className="text-xs text-white/30">{m.unit}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() =>
          onChange({
            ...item,
            skipped: !item.skipped,
            mappedMarkerId: item.skipped ? item.mappedMarkerId : null,
            mappedMarkerName: item.skipped ? item.mappedMarkerName : null,
          })
        }
      >
        {item.skipped ? "Undo" : "Skip"}
      </Button>
    </div>
  );
}
