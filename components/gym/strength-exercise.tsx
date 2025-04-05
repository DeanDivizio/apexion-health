import React, { useCallback, useEffect, useState } from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { EllipsisVertical, Settings } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui_primitives/dropdown-menu"
import { ExerciseGroup } from "@/utils/types"

export type StrengthExerciseForm = {
  exerciseType: string
  sets: { weight: number; reps: number }[]
  modifications?: { grip?: "Rotated Neutral" | "Pronated" | "Supinated" | "Normal", movementPlane?: "Inlcined" | "Declined" | "Prone" | "Supine" | "Normal" }
}

function SetForm({ exerciseIndex, setIndex, onRemove, exercises }: { exerciseIndex: number; setIndex: number; onRemove: () => void, exercises: ExerciseGroup[] }) {
  const { control } = useFormContext()
  const [isLRSplit, setISLRSplit] = useState<boolean>(false)

  return (
    <div className={`grid grid-cols-10 gap-2 items-end`}>
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
        render={({ field }) => (
          <FormItem className={` ${isLRSplit ? "col-span-3" : "col-span-4"}`}>
            <FormLabel className="font-base">Weight</FormLabel>
            <FormControl>
              <Input t9 {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
        render={({ field }) => (
          <FormItem className={isLRSplit ? "col-span-3" : "col-span-4"}>
            <FormLabel className="font-extralight">{isLRSplit ? "Reps: Left" : "Reps"}</FormLabel>
            <FormControl>
              <Input t9 {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {isLRSplit && <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`}
        render={({ field }) => (
          <FormItem className={isLRSplit ? "col-span-3" : "col-span-4"}>
            <FormLabel className="font-extralight">{`Reps: Right`}</FormLabel>
            <FormControl>
              <Input t9 {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />}
      <div className={`w-full ${isLRSplit ? "col-span-1" : "col-span-2"} flex justify-end`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="flex justify-end">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setISLRSplit(!isLRSplit)}
              >
                {`Split L/R Reps`}
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button
                type="button"
                variant="ghost"
                onClick={onRemove}
              >
                Delete Set
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>

      </div>

    </div>
  )
}

export default function StrengthExercise({ index, isOpen, onOpenChange, onDelete, exercises }: { index: number; isOpen: boolean; onOpenChange: (open: boolean) => void; onDelete: () => void, exercises: ExerciseGroup[] }) {
  const { control } = useFormContext()
  const [triggerText, setTriggerText] = useState<string>(`New Exercise`)

  const getExerciseName = (value: string) => {
    for (const group of exercises) {
      const exercise = group.items.find(item => item.toLowerCase().replace(/\s+/g, '') === value.toLowerCase())
      if (exercise) return exercise.toString()
    }
    return value.toString()
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
  const mod_grip = useWatch({
    control,
    name: `exercises.${index}.modifications.grip`,
  })
  const mod_plane = useWatch({
    control,
    name: `exercises.${index}.modifications.movementPlane`,
  })

  const addSet = () => {
    const lastSet = sets[sets.length - 1]
    const newSet = lastSet
      ? { weight: lastSet.weight, reps: 0 }
      : {}
    append(newSet)
  }
  let name:string = "";
  useEffect(() => {
    
    if (exerciseType) {
      if (name === "") { name = getExerciseName(exerciseType).toString() 
        setTriggerText(name)
      }
    }
  }, [exerciseType])

  return (
    <Accordion type="single" collapsible value={isOpen ? `item-${index}` : ""} onValueChange={(value) => onOpenChange(value === `item-${index}`)}
      className={`border rounded shadow-lg py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6 justify-center`}>
      <AccordionItem value={`item-${index}`}>
        <AccordionTrigger className="px-3">
          <div className="justify-start items-baseline flex">{`${triggerText}`} 
            <span className="px-2">
              {mod_grip != undefined && mod_grip != "Normal" || mod_plane != undefined && mod_plane != "Normal" ? " // " : ""}
            </span>
            <span className="text-xs font-extralight italic flex flex-wrap">
              {`${mod_grip != "Normal" && mod_grip != undefined ? mod_grip : ""}`}
              {mod_grip && mod_grip != "Normal" && mod_plane && mod_plane != "Normal" && <p className="mr-1">,</p>}
              {`${mod_plane != "Normal" && mod_plane != undefined ? mod_plane : ""}`}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="flex flex-col md:flex-row py-4 rounded-md">
            <div className="flex items-center mb-4">
              <FormField
                control={control}
                name={`exercises.${index}.exerciseType`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="w-full">
                      <div className="w-full flex flex-row justify-between mb-4">
                        Exercise
                        <AlertDialog>
                          <AlertDialogTrigger><Settings size={16} /></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                             <AlertDialogTitle>Exercise Settings</AlertDialogTitle>
                             <AlertDialogDescription>Alter the settings for this exercise</AlertDialogDescription>
                            </AlertDialogHeader>
                            <FormField
                             control={control}
                             name={`exercises.${index}.modifications.grip`}
                             render={({ field }) => (
                               <FormItem className="w-full">
                                <FormLabel>Hand Grip</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Normal" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Rotated Neutral">{`Rotated Neutral`}</SelectItem>
                                    <SelectItem value="Pronated">{`Pronated (upward)`}</SelectItem>
                                    <SelectItem value="Supinated">{`Supinated (downward)`}</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                  </SelectContent>
                                </Select>
                               </FormItem>
                             )}/>
                             <FormField
                             control={control}
                             name={`exercises.${index}.modifications.movementPlane`}
                             render={({ field }) => (
                               <FormItem className="w-full">
                                <FormLabel>Movement Plane</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Normal" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Inclined">{`Inclined`}</SelectItem>
                                    <SelectItem value="Declined">{`Declined`}</SelectItem>
                                    <SelectItem value="Supine">{`Supine`}</SelectItem>
                                    <SelectItem value="Prone">{`Prone`}</SelectItem>
                                    <SelectItem value="Normal">{`Normal`}</SelectItem>
                                  </SelectContent>
                                </Select>
                               </FormItem>
                             )}/>
                             <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                             </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </FormLabel>
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

            <div className="flex-1 py-4">
              <div className="space-y-6 mb-4">
                {fields.map((field, setIndex) => (
                  <SetForm
                    key={field.id}
                    exerciseIndex={index}
                    setIndex={setIndex}
                    onRemove={() => remove(setIndex)}
                    exercises={exercises}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addSet}
                className="mt-8 mb-4 w-full"
              >
                Add Set
              </Button>
            </div>
          </div>
          <hr className="border-neutral-400 mb-8 w-[36%] ml-[32%]"></hr>
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