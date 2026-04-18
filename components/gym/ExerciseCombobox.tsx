"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui_primitives/button";
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
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui_primitives/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ExerciseOption {
  key: string;
  name: string;
}

export interface ExerciseGroupOption {
  label: string;
  exercises: ExerciseOption[];
}

interface ExerciseComboboxProps {
  groups: ExerciseGroupOption[];
  value: string;
  onSelect: (key: string) => void;
  onCreateCustom?: (searchQuery: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function ExerciseCombobox({
  groups,
  value,
  onSelect,
  onCreateCustom,
  placeholder = "Open Selector",
  disabled = false,
  className,
  icon,
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const isMobile = useIsMobile();

  const selectedName = React.useMemo(() => {
    for (const group of groups) {
      const found = group.exercises.find((e) => e.key === value);
      if (found) return found.name;
    }
    return "";
  }, [groups, value]);

  const handleCreateCustom = React.useCallback(() => {
    onCreateCustom?.(search.trim());
    setOpen(false);
    setSearch("");
  }, [onCreateCustom, search]);

  const createCtaLabel = search.trim()
    ? `Create "${search.trim()}" as custom exercise`
    : "Create custom exercise";

  const commandContent = (
    <Command shouldFilter={true}>
      <CommandInput
        placeholder="Search exercises..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-2 text-center text-sm text-muted-foreground">
            No exercise found.
          </div>
        </CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.exercises.map((exercise) => (
              <CommandItem
                key={exercise.key}
                value={`${exercise.name}`}
                onSelect={() => {
                  onSelect(exercise.key);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === exercise.key ? "opacity-100" : "opacity-0",
                  )}
                />
                {exercise.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {onCreateCustom && (
          <CommandGroup heading="" forceMount>
            <CommandItem
              value="__create_custom__"
              onSelect={handleCreateCustom}
              className="text-blue-400 cursor-pointer"
              forceMount
            >
              <Plus className="mr-2 h-4 w-4" />
              {createCtaLabel}
            </CommandItem>
          </CommandGroup>
        )}
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
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-center font-normal h-12",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {icon && <span className="mr-2 shrink-0">{icon}</span>}
          {value ? selectedName : placeholder}
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <VisuallyHidden>
            <DrawerTitle>Select Exercise</DrawerTitle>
          </VisuallyHidden>
          <DrawerContent className="h-[80vh] max-h-[85vh] p-0 bg-gradient-to-br from-blue-900/10 to-blue-950/10 backdrop-blur-sm">
            {commandContent}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "w-full justify-center font-normal h-12",
        !value && "text-muted-foreground",
        className,
      )}
    >
      {icon && <span className="mr-2 shrink-0">{icon}</span>}
      {value ? selectedName : placeholder}
    </Button>
  );

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
