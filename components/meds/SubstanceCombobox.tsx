"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui_primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui_primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui_primitives/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SubstanceCatalogItemView } from "@/lib/medication";

interface SubstanceComboboxProps {
  substances: SubstanceCatalogItemView[];
  value: string;
  onSelect: (substanceId: string) => void;
  onCreateNew: () => void;
  placeholder?: string;
}

export function SubstanceCombobox({
  substances,
  value,
  onSelect,
  onCreateNew,
  placeholder = "Open Selector",
}: SubstanceComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const selectedName = React.useMemo(() => {
    const selected = substances.find((substance) => substance.id === value);
    return selected?.displayName ?? "";
  }, [substances, value]);

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "w-full justify-between text-left font-normal h-12",
        !value && "text-muted-foreground",
      )}
    >
      {value ? selectedName : placeholder}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const commandContent = (
    <Command>
      <CommandInput placeholder="Search medications or supplements..." />
      <CommandList>
        <CommandEmpty>No match - create one below.</CommandEmpty>
        <CommandGroup heading="Catalog">
          {substances.map((substance) => (
            <CommandItem
              key={substance.id}
              value={substance.displayName}
              onSelect={() => {
                onSelect(substance.id);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === substance.id ? "opacity-100" : "opacity-0",
                )}
              />
              {substance.displayName}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator alwaysRender />
        <CommandGroup forceMount>
          <CommandItem
            forceMount
            value="create-new-substance"
            onSelect={() => {
              setOpen(false);
              onCreateNew();
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-green-400" />
            Create new substance
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-between text-left font-normal h-12",
            !value && "text-muted-foreground",
          )}
        >
          {value ? selectedName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <VisuallyHidden>
            <DrawerTitle>Select Substance</DrawerTitle>
          </VisuallyHidden>
          <DrawerContent className="h-[80vh] max-h-[85vh] p-0 bg-gradient-to-br from-blue-900/10 to-blue-950/10 backdrop-blur-sm">
            {commandContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        avoidCollisions={false}
      >
        {commandContent}
      </PopoverContent>
    </Popover>
  );
}
