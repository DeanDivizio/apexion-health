import React from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export type StrengthExerciseForm = {
  exerciseType: string
  sets: { weight: number; reps: number }[]
}

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

export default function StrengthExercise({ index, isOpen, onOpenChange }: { index: number; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { control } = useFormContext()
  
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
    <Accordion type="single" collapsible value={isOpen ? `item-${index}` : ""} onValueChange={(value) => onOpenChange(value === `item-${index}`)}>
      <AccordionItem value={`item-${index}`}>
        <AccordionTrigger>{exerciseType || "New Exercise"}</AccordionTrigger>
        <AccordionContent>
          <div className="flex bg-neutral-900 flex-col md:flex-row border p-4 rounded-md">
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
                className="mt-8 w-full"
              >
                Add Set
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}