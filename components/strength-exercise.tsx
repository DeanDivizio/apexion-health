'use client';

import React from "react";
import { z } from "zod";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const setSchema = z.object({
  weight: z.number().min(0, { message: "Weight must be positive" }),
  reps: z.number().min(1, { message: "Reps must be at least 1" }),
});

const strengthExerciseSchema = z.object({
  exerciseType: z.string().nonempty({ message: "Please select an exercise" }),
  sets: z.array(setSchema).min(1, { message: "At least one set is required" }),
});

export type StrengthExerciseForm = z.infer<typeof strengthExerciseSchema>;

function SetForm({ index, control }: { index: number; control: any }) {
  return (
    <div className="flex space-x-4 mb-4">
      <FormField
        control={control}
        name={`sets.${index}.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Weight:</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`sets.${index}.reps`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reps:</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function StrengthExerciseComponent({ index }: { index: number }) {
  const { control } = useFormContext<{ exercises: StrengthExerciseForm[] }>();
  
  const { fields, append } = useFieldArray({
    control,
    name: `exercises.${index}.sets`,
  });

  return (
    <div className="flex space-x-6">
      <div className="flex-1 flex items-center">
        <FormField
          control={control}
          name={`exercises.${index}.exerciseType`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Exercise</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exercise" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Upper Body</SelectLabel>
                    <SelectItem value="arnoldPress">Arnold Press</SelectItem>
                    <SelectItem value="barbellRow">Barbell Row</SelectItem>
                    <SelectItem value="benchPress">Bench Press</SelectItem>
                    <SelectItem value="bicepCurl">Bicep Curl</SelectItem>
                    <SelectItem value="chestFly">Chest Fly</SelectItem>
                    <SelectItem value="chestPress">Chest Press</SelectItem>
                    <SelectItem value="dumbbellPress">Dumbbell Press</SelectItem>
                    <SelectItem value="hammerCurl">Hammer Curl</SelectItem>
                    <SelectItem value="inclinePress">Incline Press</SelectItem>
                    <SelectItem value="latPull">Lateral Pulldown</SelectItem>
                    <SelectItem value="overheadPress">Overhead Press</SelectItem>
                    <SelectItem value="pecFly">Pec Fly</SelectItem>
                    <SelectItem value="pullUp">Pull Up</SelectItem>
                    <SelectItem value="pushUp">Push Up</SelectItem>
                    <SelectItem value="rearDelt">Rear Delt</SelectItem>
                    <SelectItem value="seatedRow">Seated Row</SelectItem>
                    <SelectItem value="shoulderPress">Shoulder Press</SelectItem>
                    <SelectItem value="shrugs">Shrugs</SelectItem>
                    <SelectItem value="tricepExtension">Tricep Extension</SelectItem>
                    <SelectItem value="uprightRow">Upright Row</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Lower Body</SelectLabel>
                    <SelectItem value="backSquat">Back Squat</SelectItem>
                    <SelectItem value="boxJump">Box Jump</SelectItem>
                    <SelectItem value="bulgarianSplitSquat">Bulgarian Split Squat</SelectItem>
                    <SelectItem value="calfRaise">Calf Raise</SelectItem>
                    <SelectItem value="deadlift">Deadlift</SelectItem>
                    <SelectItem value="frontSquat">Front Squat</SelectItem>
                    <SelectItem value="gluteBridge">Glute Bridge</SelectItem>
                    <SelectItem value="gobletSquat">Goblet Squat</SelectItem>
                    <SelectItem value="hackSquat">Hack Squat</SelectItem>
                    <SelectItem value="hipThrust">Hip Thrust</SelectItem>
                    <SelectItem value="jumpSquat">Jump Squat</SelectItem>
                    <SelectItem value="kettlebellSwing">Kettlebell Swing</SelectItem>
                    <SelectItem value="lateralLunge">Lateral Lunge</SelectItem>
                    <SelectItem value="legCurl">Leg Curl</SelectItem>
                    <SelectItem value="legExtension">Leg Extension</SelectItem>
                    <SelectItem value="legPress">Leg Press</SelectItem>
                    <SelectItem value="lunge">Lunge</SelectItem>
                    <SelectItem value="romanianDeadlift">Romanian Deadlift</SelectItem>
                    <SelectItem value="stepUp">Step Up</SelectItem>
                    <SelectItem value="sumoDeadlift">Sumo Deadlift</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex-1">
        <div className="space-y-4">
          {fields.map((field, setIndex) => (
            <SetForm key={field.id} index={setIndex} control={control} />
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({ weight: 0, reps: 1 })}
          className="mt-4"
        >
          Add Set
        </Button>
      </div>
    </div>
  );
}