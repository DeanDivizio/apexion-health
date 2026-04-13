"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
import { Coffee, CupSoda, Leaf, Zap } from "lucide-react";
import {
  SUBTYPE_MAP,
  DEFAULT_SUBTYPE,
  estimateCaffeineMg,
} from "@/lib/hydration/caffeineData";

type Unit = "oz" | "ml" | "cup";

const OZ_PER_CUP = 8;
const ML_PER_OZ = 29.5735;

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

function toOz(amount: number, unit: Unit): number {
  if (unit === "ml") return amount / ML_PER_OZ;
  if (unit === "cup") return amount * OZ_PER_CUP;
  return amount;
}

interface LogHydrationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogHydrationDrawer({
  open,
  onOpenChange,
}: LogHydrationDrawerProps) {
  const [beverageType, setBeverageType] = useState<BeverageType>("water");
  const [beverageSubtype, setBeverageSubtype] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("oz");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    html.style.position = "fixed";
    html.style.top = `-${scrollY}px`;
    html.style.left = "0";
    html.style.right = "0";
    html.style.overflow = "hidden";
    return () => {
      html.style.position = "";
      html.style.top = "";
      html.style.left = "";
      html.style.right = "";
      html.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const subtypeOptions = SUBTYPE_MAP[beverageType] ?? null;
  const activeSubtype =
    beverageSubtype ?? DEFAULT_SUBTYPE[beverageType] ?? null;

  const caffeineEstimate = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !activeSubtype) return 0;
    return estimateCaffeineMg(beverageType, activeSubtype, toOz(parsed, unit));
  }, [beverageType, activeSubtype, amount, unit]);

  function reset() {
    setBeverageType("water");
    setBeverageSubtype(null);
    setAmount("");
    setUnit("oz");
  }

  function handleBeverageChange(type: BeverageType) {
    const option = BEVERAGE_OPTIONS.find((o) => o.value === type)!;
    setBeverageType(type);
    setBeverageSubtype(null);
    setUnit(option.defaultUnit);
    setAmount(option.defaultAmount);
  }

  function handleLog() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    const amountOz = toOz(parsed, unit);

    startTransition(async () => {
      await logHydrationAction({
        amount: parsed,
        unit,
        beverageType,
        beverageSubtype: activeSubtype,
      });
      captureClientEvent("hydration_logged", {
        amount: parsed,
        unit,
        beverageType,
        beverageSubtype: activeSubtype,
        caffeineMg: caffeineEstimate,
      });
      window.dispatchEvent(
        new CustomEvent("hydration:logged", {
          detail: {
            amountOz,
            beverageType,
          },
        }),
      );
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
    <Drawer open={open} onOpenChange={onOpenChange} modal>
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

          {/* Subtype selector — only for coffee & tea */}
          {subtypeOptions && (
            <div className="mb-4">
              <p className="text-[11px] text-white/40 mb-1.5">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {subtypeOptions.map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setBeverageSubtype(st.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                      activeSubtype === st.key
                        ? beverageType === "coffee"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <div className="flex items-center justify-between mt-1.5">
            {unit === "cup" ? (
              <p className="text-[11px] text-white/30">1 cup = 8 oz</p>
            ) : (
              <span />
            )}

            {caffeineEstimate > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
                <Zap className="h-3 w-3" />
                ~{caffeineEstimate} mg caffeine
              </span>
            )}
          </div>

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
