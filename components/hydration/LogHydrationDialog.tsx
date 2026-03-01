"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui_primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { logHydrationAction } from "@/actions/hydration";

interface LogHydrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogHydrationDialog({
  open,
  onOpenChange,
}: LogHydrationDialogProps) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"oz" | "ml">("oz");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setAmount("");
    setUnit("oz");
  }

  function handleLog() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    startTransition(async () => {
      await logHydrationAction({ amount: parsed, unit });
      reset();
      onOpenChange(false);
    });
  }

  function handleCancel() {
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent pb-2">
            Log Water
          </DialogTitle>
          {/* <DialogDescription className="-translate-y-4"> */}
            {/* How much water did you drink? */}
          {/* </DialogDescription> */}
        </DialogHeader>

        <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleLog(); }}>
          <div className="flex gap-2">
            <Input
              t9
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              className="flex-1"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as "oz" | "ml")}>
              <SelectTrigger className="w-20" type="button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oz">oz</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-4 flex-row gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !amount || parseFloat(amount) <= 0}
            >
              {isPending ? "Logging..." : "Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
