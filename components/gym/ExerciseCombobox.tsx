"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ExerciseCombobox({
  groups,
  value,
  onSelect,
  placeholder = "Select exercise...",
  disabled = false,
  className,
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const selectedName = React.useMemo(() => {
    for (const group of groups) {
      const found = group.exercises.find((e) => e.key === value);
      if (found) return found.name;
    }
    return "";
  }, [groups, value]);

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "w-full justify-between text-left font-normal h-12",
        !value && "text-muted-foreground",
        className,
      )}
    >
      {value ? selectedName : placeholder}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const commandContent = (
    <Command>
      <CommandInput placeholder="Search exercises..." />
      <CommandList>
        <CommandEmpty>No exercise found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.exercises.map((exercise) => (
              <CommandItem
                key={exercise.key}
                value={`${exercise.name}`}
                onSelect={() => {
                  onSelect(exercise.key);
                  setOpen(false);
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
            "w-full justify-between text-left font-normal h-12",
            !value && "text-muted-foreground",
            className,
          )}
        >
          {value ? selectedName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
