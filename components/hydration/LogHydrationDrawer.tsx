"use client";

import { useState, useTransition } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui_primitives/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { logHydrationAction, type BeverageType } from "@/actions/hydration";
import { captureClientEvent } from "@/lib/posthog-client";
import { Coffee, CupSoda, Leaf } from "lucide-react";

type Unit = "oz" | "ml" | "cup";

const BEVERAGE_OPTIONS: {
  value: BeverageType;
  label: string;
  icon: typeof Coffee;
  defaultUnit: Unit;
  defaultAmount: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "water",
    label: "Water",
    icon: CupSoda,
    defaultUnit: "oz",
    defaultAmount: "",
    color: "text-blue-400",
    activeColor: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  },
  {
    value: "coffee",
    label: "Coffee",
    icon: Coffee,
    defaultUnit: "cup",
    defaultAmount: "1",
    color: "text-amber-500",
    activeColor: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  },
  {
    value: "tea",
    label: "Tea",
    icon: Leaf,
    defaultUnit: "cup",
    defaultAmount: "1",
    color: "text-emerald-400",
    activeColor: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  },
];

interface LogHydrationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogHydrationDrawer({
  open,
  onOpenChange,
}: LogHydrationDrawerProps) {
  const [beverageType, setBeverageType] = useState<BeverageType>("water");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("oz");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setBeverageType("water");
    setAmount("");
    setUnit("oz");
  }

  function handleBeverageChange(type: BeverageType) {
    const option = BEVERAGE_OPTIONS.find((o) => o.value === type)!;
    setBeverageType(type);
    setUnit(option.defaultUnit);
    setAmount(option.defaultAmount);
  }

  function handleLog() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    startTransition(async () => {
      await logHydrationAction({ amount: parsed, unit, beverageType });
      captureClientEvent("hydration_logged", {
        amount: parsed,
        unit,
        beverageType,
      });
      reset();
      onOpenChange(false);
    });
  }

  function handleCancel() {
    reset();
    onOpenChange(false);
  }

  const activeBeverage = BEVERAGE_OPTIONS.find((o) => o.value === beverageType)!;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent pb-1">
            Log Drink
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Log water, coffee, or tea intake
          </DrawerDescription>
        </DrawerHeader>

        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleLog();
          }}
          className="px-4 pb-2"
        >
          {/* Beverage type selector */}
          <div className="flex gap-2 mb-4">
            {BEVERAGE_OPTIONS.map(({ value, label, icon: Icon, activeColor }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleBeverageChange(value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  beverageType === value
                    ? activeColor
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Amount + unit */}
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
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger className="w-20" type="button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cup">cup</SelectItem>
                <SelectItem value="oz">oz</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {unit === "cup" && (
            <p className="mt-1.5 text-[11px] text-white/30">1 cup = 8 oz</p>
          )}

          <DrawerFooter className="px-0 flex-row gap-2">
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
              {isPending ? "Logging..." : `Log ${activeBeverage.label}`}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
