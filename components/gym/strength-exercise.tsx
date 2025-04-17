"use client"

import { useCallback, useEffect, useState } from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { EllipsisVertical, Settings } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui_primitives/dropdown-menu"
import type { ExerciseGroup, ClerkUserMetadata } from "@/utils/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui_primitives/dialog"
import { Plus } from "lucide-react"
import { Textarea } from "../ui_primitives/textarea"

type CustomExercise = {
  name: string
  value: string
  category: string
}

function SetForm({ exerciseIndex, setIndex, onRemove }: { exerciseIndex: number; setIndex: number; onRemove: () => void }) {
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
              <Input t9 {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
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
              <Input t9 {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {isLRSplit && (
        <FormField
          control={control}
          name={`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`}
          render={({ field }) => (
            <FormItem className={isLRSplit ? "col-span-3" : "col-span-4"}>
              <FormLabel className="font-extralight">{`Reps: Right`}</FormLabel>
              <FormControl>
                <Input t9 {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <div className={`w-full ${isLRSplit ? "col-span-1" : "col-span-2"} flex justify-end`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="flex justify-end">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Button type="button" variant="ghost" onClick={() => setISLRSplit(!isLRSplit)}>
                {`Split L/R Reps`}
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button type="button" variant="ghost" onClick={onRemove}>
                Delete Set
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div></div>
    </div>
  )
}
function ExerciseSettingDialog({control, index}:{control: any, index: number }) { 
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Settings size={16} />
      </AlertDialogTrigger>
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
          )}
        />
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
          )}
        />
        <FormField
          control={control}
          name={`exercises.${index}.modifications.notes`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Notes</FormLabel>
              <Textarea {...field} />
            </FormItem>
          )}
        />
        {/* Need a button to save notes to the database */}
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function StrengthExercise({
  index,
  isOpen,
  onOpenChange,
  onDelete,
  exercises,
}: {
  index: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  exercises: ExerciseGroup[]
}) {
  /**********************FORM LOGIC**************************/
  const { control, setValue } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: `exercises.${index}.sets` })
  function WatchTheseThings(index: number) {
    const sets = useWatch({ control, name: `exercises.${index}.sets` })
    const exerciseType = useWatch({ control, name: `exercises.${index}.exerciseType` })
    const mod_grip = useWatch({ control, name: `exercises.${index}.modifications.grip` })
    const mod_plane = useWatch({ control, name: `exercises.${index}.modifications.movementPlane` })
    return { sets, exerciseType, mod_grip, mod_plane }
  }
  const { sets, exerciseType, mod_grip, mod_plane } = WatchTheseThings(index)

  const [customExercise, setCustomExercise] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([])

  // Previous exercise data from Clerk metadata
  const [previousData, setPreviousData] = useState<{
    previousSets: string | null
    personalRecord: string | null
    notes: string | null
  }>({
    previousSets: null,
    personalRecord: null,
    notes: null,
  })

  // Get user from Clerk
  const { user } = useUser()

  // Force select to update when exerciseType changes
  const [selectKey, setSelectKey] = useState<number>(0)

  // Get available categories from exercises prop
  const categories = exercises.map((group) => group.group)

  const handleAddCustomExercise = useCallback(() => {
    if (customExercise.trim() && selectedCategory) {
      const formattedName = customExercise.charAt(0).toLowerCase() + customExercise.slice(1).replace(/\s+/g, "")

      // Add to custom exercises list
      const newCustomExercise: CustomExercise = {
        name: customExercise.trim(),
        value: formattedName,
        category: selectedCategory,
      }

      setCustomExercises((prev) => [...prev, newCustomExercise])

      // Update the form value
      setValue(`exercises.${index}.exerciseType`, formattedName)

      // Force select to update
      setSelectKey((prev) => prev + 1)

      // Reset dialog state
      setCustomExercise("")
      setSelectedCategory("")
      setDialogOpen(false)
    }
  }, [customExercise, selectedCategory, setValue, index])
  /********************************************************* */

  /***********************NAME UPDATING**************************/
  const [exerciseName, setExerciseName] = useState<string>(`New Exercise`)
  const getExerciseName = (value: string) => {
    // Check predefined exercises
    for (const group of exercises) {
      const exercise = group.items.find((item) => item.toLowerCase().replace(/\s+/g, "") === value.toLowerCase())
      if (exercise) return exercise.toString()
    }

    const customExercise = customExercises.find((ex) => ex.value === value)
    if (customExercise) return customExercise.name

    return value.toString()
  }

  useEffect(() => {
    if (exerciseType) {
      const name = getExerciseName(exerciseType).toString()
      setExerciseName(name)

      // Look for the exercise in Clerk metadata when exercise changes
      if (user?.publicMetadata) {
        const metadata = user.publicMetadata as ClerkUserMetadata

        if (metadata?.markers?.gym) {
          // Find the exercise in the gym markers
          const exerciseData = metadata.markers.gym.find(
            (marker) => marker.exercise.toLowerCase() === name.toLowerCase(),
          )

          if (exerciseData) {
            // Format previous sets from mostRecentSession
            let previousSetsString = null
            if (exerciseData.mostRecentSession && exerciseData.mostRecentSession.length > 0) {
              previousSetsString = exerciseData.mostRecentSession
                .map((session) => {
                  if (session.repsRight) {
                    return `${session.reps}/${session.repsRight}@${session.weight}`
                  }
                  return `${session.reps}@${session.weight}`
                })
                .join(", ")
            }

            // Format personal record from recordSet
            let personalRecordString = null
            if (exerciseData.recordSet) {
              personalRecordString = `${exerciseData.recordSet.reps}@${exerciseData.recordSet.weight}`
            }

            // Update state with the found data
            setPreviousData({
              previousSets: previousSetsString,
              personalRecord: personalRecordString,
              notes: exerciseData.notes || null,
            })

            // If we have data and no sets yet, pre-populate with the most recent session data
            if (exerciseData.mostRecentSession && (!sets || sets.length === 0)) {
              exerciseData.mostRecentSession.forEach((session) => {
                append({
                  weight: session.weight,
                  reps: session.reps,
                  ...(session.repsRight ? { repsRight: session.repsRight } : {}),
                })
              })
            }

            // If there are notes, set them in the form
            if (exerciseData.notes) {
              setValue(`exercises.${index}.modifications.notes`, exerciseData.notes)
            }
          } else {
            // Reset previous data if no entries found
            setPreviousData({
              previousSets: null,
              personalRecord: null,
              notes: null,
            })
          }
        }
      }
    }
  }, [exerciseType, exercises, customExercises, user, append, sets, setValue, index])
  /********************************************************* */

  const addSet = () => {
    const lastSet = sets[sets.length - 1]
    const newSet = lastSet ? { weight: lastSet.weight, reps: 0 } : {}
    append(newSet)
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? `item-${index}` : ""}
      onValueChange={(value) => onOpenChange(value === `item-${index}`)}
      className={`border rounded shadow-lg py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6 justify-center`}
    >
      <AccordionItem value={`item-${index}`}>
        <AccordionTrigger className="px-3">
          <div className="justify-start items-baseline flex">
            {`${exerciseName}`}
            <span className="px-2">
              {(mod_grip != undefined && mod_grip != "Normal") || (mod_plane != undefined && mod_plane != "Normal")
                ? " // "
                : ""}
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
                        <ExerciseSettingDialog control={control} index={index}/>  
                      </div>
                    </FormLabel>
                    <Select
                      key={selectKey} // Force re-render when key changes
                      onValueChange={(value) => {
                        if (value === "add-custom") {
                          setDialogOpen(true)
                        } else {
                          field.onChange(value)
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Exercise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exercises.map((group) => {
                          // Get custom exercises for this category
                          const categoryCustomExercises = customExercises.filter((ex) => ex.category === group.group)

                          return (
                            <SelectGroup key={group.group} className="mb-6">
                              <SelectLabel className="font-medium text-lg">{group.group}</SelectLabel>
                              {group.items.map((exercise) => (
                                <SelectItem
                                  key={exercise}
                                  value={exercise.charAt(0).toLowerCase() + exercise.slice(1).replace(/\s+/g, "")}
                                >
                                  {exercise}
                                </SelectItem>
                              ))}

                              {/* Add custom exercises for this category */}
                              {categoryCustomExercises.map((exercise) => (
                                <SelectItem key={exercise.value} value={exercise.value}>
                                  {exercise.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        })}

                        <SelectItem value="add-custom" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add custom exercise...
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {(previousData.previousSets || previousData.personalRecord) && (
              <div id={`${index}_reference`} className="mb-6">
                {previousData.previousSets && (
                  <div className="flex gap-2 mb-2">
                    <p className="font-xs text-neutral-200 font-medium">{`Previous: `}</p>
                    <p className="font-xs text-neutral-400 font-light">{previousData.previousSets}</p>
                  </div>
                )}
                {previousData.personalRecord && (
                  <div className="flex gap-2 ">
                    <p className="font-xs text-neutral-200 font-medium">{`Personal Record: `}</p>
                    <p className="font-xs text-neutral-400 font-light">{previousData.personalRecord}</p>
                  </div>
                )}
              </div>
            )}
            <hr className="mb-2"></hr>
            <div id={`${index}_setSection`} className="flex-1 py-4">
              <div className="space-y-6 mb-4">
                {fields.map((field, setIndex) => (
                  <SetForm key={field.id} exerciseIndex={index} setIndex={setIndex} onRemove={() => remove(setIndex)} />
                ))}
              </div>
              <Button type="button" variant="secondary" onClick={addSet} className="mt-8 mb-4 w-full">
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
              <Button variant={"destructive"} onClick={onDelete}>
                Delete
              </Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        </AccordionContent>
      </AccordionItem>
      {/* Dialog for adding custom exercise */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Exercise</DialogTitle>
            <DialogDescription>Enter the name of your custom exercise below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <FormLabel htmlFor="custom-exercise">Exercise Name</FormLabel>
              <Input
                id="custom-exercise"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="e.g., Mountain Climbers"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <FormLabel htmlFor="exercise-category">Category</FormLabel>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="exercise-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomExercise("")
                setSelectedCategory("")
                setDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomExercise} disabled={!customExercise.trim() || !selectedCategory}>
              Add Exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Accordion>
  )
}
