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

  const selectedName = React.useMemo(() => {
    for (const group of groups) {
      const found = group.exercises.find((e) => e.key === value);
      if (found) return found.name;
    }
    return "";
  }, [groups, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
      </PopoverContent>
    </Popover>
  );
}
