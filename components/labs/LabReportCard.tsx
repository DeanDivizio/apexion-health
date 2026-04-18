"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui_primitives/card";
import { Badge } from "@/components/ui_primitives/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import { Button } from "@/components/ui_primitives/button";
import { FileText, Lock, MoreHorizontal, Trash2 } from "lucide-react";
import { deleteLabReportAction } from "@/actions/labs";
import type { LabReportGroupView, LabReportSourceView } from "@/lib/labs/types";

interface LabReportCardProps {
  group: LabReportGroupView;
  isSelected: boolean;
  onSelect: (group: LabReportGroupView) => void;
  onReportDeleted: (deletedReportId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LabReportCard({
  group,
  isSelected,
  onSelect,
  onReportDeleted,
}: LabReportCardProps) {
  const [singleConfirmOpen, setSingleConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, startDeleteTransition] = useTransition();

  const isMulti = group.sources.length > 1;

  const confirmDeleteSingle = () => {
    const sole = group.sources[0];
    if (!sole) return;
    startDeleteTransition(async () => {
      await deleteLabReportAction(sole.id);
      setSingleConfirmOpen(false);
      onReportDeleted(sole.id);
    });
  };

  const confirmDeleteFromPicker = (sourceId: string) => {
    startDeleteTransition(async () => {
      await deleteLabReportAction(sourceId);
      setPendingDeleteId(null);
      onReportDeleted(sourceId);
      if (group.sources.length <= 1) {
        setPickerOpen(false);
      }
    });
  };

  const openDeleteFlow = () => {
    if (isMulti) {
      setPickerOpen(true);
    } else {
      setSingleConfirmOpen(true);
    }
  };

  return (
    <>
      <Card
        className={`cursor-pointer p-4 transition-colors ${
          isSelected
            ? "border-green-500/60 bg-green-500/10"
            : "hover:border-white/20 hover:bg-white/[0.04]"
        }`}
        onClick={() => onSelect(group)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/90">
              {formatDate(group.reportDate)}
            </p>
            {group.institution && (
              <p className="mt-0.5 truncate text-xs text-white/50">
                {group.institution}
              </p>
            )}
            {group.providerName && (
              <p className="truncate text-xs text-white/40">
                {group.providerName}
              </p>
            )}
            {isMulti && (
              <p className="mt-0.5 text-[11px] text-white/30">
                {group.sources.length} uploads
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {group.sources.some((s) => s.hasFile) && (
              <span className="text-white/30">
                {group.sources.some((s) => s.hasFile && s.fileEncrypted) ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Report actions"
                  className="-mr-1 -mt-1 rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400"
                  onSelect={(e) => {
                    e.preventDefault();
                    openDeleteFlow();
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {isMulti ? "Manage uploads" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2">
          <Badge variant="secondary" className="text-[11px] font-normal">
            {group.resultCount} marker{group.resultCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </Card>

      <AlertDialog open={singleConfirmOpen} onOpenChange={setSingleConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lab Report</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this report and all its results.
              {group.sources[0]?.hasFile &&
                " The stored original file will also be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteSingle();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Manage uploads</DialogTitle>
            <DialogDescription>
              This visit contains multiple uploads. Delete any one of them
              individually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {group.sources.map((source, idx) => (
              <SourceRow
                key={source.id}
                index={idx}
                source={source}
                deleting={deleting && pendingDeleteId === source.id}
                onDelete={() => {
                  setPendingDeleteId(source.id);
                  confirmDeleteFromPicker(source.id);
                }}
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SourceRow({
  index,
  source,
  deleting,
  onDelete,
}: {
  index: number;
  source: LabReportSourceView;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/80">
          {source.originalFileName ?? `Upload #${index + 1}`}
        </p>
        <p className="text-xs text-white/40">
          {formatUploadedAt(source.createdAt)} · {source.resultCount} marker
          {source.resultCount !== 1 ? "s" : ""}
          {source.hasFile && source.fileEncrypted ? " · encrypted" : ""}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
