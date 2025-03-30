import React from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"

export type StrengthExerciseForm = {
  exerciseType: string
  sets: { weight: number; reps: number }[]
}

const exercises = [
  {
    group: "Upper Body", items: [
      "Arnold Press", "Barbell Row", "Bench Press", "Bicep Curl", "Chest Fly", "Chest Press",
      "Dumbbell Press", "Egyptian Lateral Raise", "Hammer Curl", "Incline Press", "Lateral Pulldown", "Overhead Press",
      "Pec Fly", "Pull Up", "Push Up", "Rear Delt", "Seated Row", "Shoulder Press", "Shrugs",
      "Tricep Extension", "Upright Row"
    ]
  },{
    group: "Core", items: [
      "Abdominal Crunch", "Back Extension", 
    ]},
  {
    group: "Lower Body", items: [
      "Back Squat", "Box Jump", "Bulgarian Split Squat", "Calf Raise", "Deadlift", "Front Squat",
      "Glute Bridge", "Goblet Squat", "Hack Squat", "Hip Thrust", "Jump Squat", "Kettlebell Swing",
      "Lateral Lunge", "Leg Curl", "Leg Extension", "Leg Press", "Lunge", "Romanian Deadlift",
      "Step Up", "Sumo Deadlift"
    ]
  }
]

function SetForm({ exerciseIndex, setIndex, onRemove }: { exerciseIndex: number; setIndex: number; onRemove: () => void }) {
  const { control } = useFormContext()

  return (
    <div className="flex space-x-4 mb-1 items-end">
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-extralight">Weight:</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-extralight">Reps:</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-10 w-10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove set</span>
      </Button>
    </div>
  )
}

export default function StrengthExercise({ index, isOpen, onOpenChange, onDelete }: { index: number; isOpen: boolean; onOpenChange: (open: boolean) => void; onDelete: () => void }) {
  const { control } = useFormContext()

  const getExerciseName = (value: string) => {
    for (const group of exercises) {
      const exercise = group.items.find(item => item.toLowerCase().replace(/\s+/g, '') === value.toLowerCase())
      if (exercise) return exercise
    }
    return value
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercises.${index}.sets`,
  })

  const sets = useWatch({
    control,
    name: `exercises.${index}.sets`,
  })

  const exerciseType = useWatch({
    control,
    name: `exercises.${index}.exerciseType`,
  })

  const addSet = () => {
    const lastSet = sets[sets.length - 1]
    const newSet = lastSet
      ? { weight: lastSet.weight, reps: lastSet.reps }
      : { weight: 0, reps: 1 }
    append(newSet)
  }

  return (
    <Accordion type="single" collapsible value={isOpen ? `item-${index}` : ""} onValueChange={(value) => onOpenChange(value === `item-${index}`)}
      className={`border rounded shadow-lg py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6 justify-center`}>
      <AccordionItem value={`item-${index}`}>
        <AccordionTrigger className="px-4">{getExerciseName(exerciseType) || "New Exercise"}</AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="flex flex-col md:flex-row py-4 rounded-md">
            <div className="flex items-center mb-4">
              <FormField
                control={control}
                name={`exercises.${index}.exerciseType`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Exercise</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Exercise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exercises.map((group) => (
                          <SelectGroup key={group.group} className="mb-6">
                            <SelectLabel className="font-medium text-lg">{group.group}</SelectLabel>
                            {group.items.map((exercise) => (
                              <SelectItem key={exercise} value={exercise.charAt(0).toLowerCase() + exercise.slice(1).replace(/\s+/g, '')}>
                                {exercise}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
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
                  <SetForm
                    key={field.id}
                    exerciseIndex={index}
                    setIndex={setIndex}
                    onRemove={() => remove(setIndex)}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addSet}
                className="mt-8 mb-8 w-full"
              >
                Add Set
              </Button>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant={"destructive"} className="w-full">
                {"Delete exercise"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl text-center">{`Are you sure?`}</AlertDialogTitle>
                <AlertDialogDescription>{`This will delete the current exercise and cannot be undone.`}</AlertDialogDescription>
              </AlertDialogHeader>
              <Button variant={"destructive"} onClick={onDelete}>Delete</Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}