"use client"

import { useCallback, useEffect, useState } from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { EllipsisVertical, InfoIcon, Settings } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui_primitives/dropdown-menu"
import type { ExerciseGroup } from "@/utils/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui_primitives/dialog"
import { Plus } from "lucide-react"
import { Textarea } from "../ui_primitives/textarea"
import { capitalize, quickSort, spellOutDate, toCamelCase } from "@/lib/utils"
import { addCustomExercise } from "@/actions/InternalLogic"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui_primitives/slider"
import { Popover, PopoverContent, PopoverTrigger } from "../ui_primitives/popover"


function SetForm({ exerciseIndex, setIndex, onRemove }: { exerciseIndex: number; setIndex: number; onRemove: () => void }) {
  const { control } = useFormContext()
  const [isLRSplit, setISLRSplit] = useState<boolean>(false)

  return (
    <div>
      <div className={`grid grid-cols-11 gap-2 items-end mb-6`}>
        <FormField
          control={control}
          name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
          render={({ field }) => (
            <FormItem className={` ${isLRSplit ? "col-span-4" : "col-span-5"}`}>
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
            <FormItem className={isLRSplit ? "col-span-3" : "col-span-5"}>
              <FormLabel className="font-extralight">{isLRSplit ? "Left" : "Reps"}</FormLabel>
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
              <FormItem className={isLRSplit ? "col-span-3" : "col-span-5"}>
                <FormLabel className="font-extralight">{`Right`}</FormLabel>
                <FormControl>
                  <Input t9 {...field} onChange={(e) => field.onChange(Number.parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className={`w-full col-span-1 flex justify-end`}>
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
      </div>
      <FormField
        control={control}
        name={`exercises.${exerciseIndex}.sets.${setIndex}.effort`}
        render={({ field }) => (
          <FormItem className="grid grid-cols-5 items-center">
            <div className="col-span-1 flex items-center gap-2">
              <p className="text-sm font-extralight">Effort:</p>
              <Popover>
                <PopoverTrigger asChild>
                  <InfoIcon className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="translate-x-6 space-y-2">
                  <p className="font-light text-sm">Recording your subjective effort per set lets Apexion track intra-lift variability and overall performance in more detail.</p>
                  <p className="font-light text-sm">This option can be disabled in settings. Leaving the slider at 0 will effectively disable recording for that set.</p>
                  <p className="font-light text-sm">Reserve 10 for when you take a set to failure.</p>
                </PopoverContent>
              </Popover>
            </div>
            <Slider {...field}
              onValueChange={(value) => field.onChange(value[0])}
              className="col-span-4"
              defaultValue={[0]}
              max={10}
              min={0}
              step={1}
              value={field.value ? [field.value] : [0]}
            />
          </FormItem>
        )}
      />
    </div>
  )
}

function ExerciseSettingDialog({ control, index }: { control: any, index: number }) {
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
                  <SelectItem value="rotatedNeutral">{`Rotated Neutral`}</SelectItem>
                  <SelectItem value="pronated">{`Pronated (upward)`}</SelectItem>
                  <SelectItem value="supinated">{`Supinated (downward)`}</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
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
                  <SelectItem value="inclined">{`Inclined`}</SelectItem>
                  <SelectItem value="declined">{`Declined`}</SelectItem>
                  <SelectItem value="supine">{`Supine`}</SelectItem>
                  <SelectItem value="prone">{`Prone`}</SelectItem>
                  <SelectItem value="normal">{`Normal`}</SelectItem>
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
              <Textarea {...field} placeholder="The notes dont work right now. whatever you type here wont be saved."/>
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
  gymMeta,
}: {
  index: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  exercises: ExerciseGroup[]
  gymMeta: any
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
  const [exerciseList, setExerciseList] = useState<ExerciseGroup[]>(exercises)
  const [selectKey, setSelectKey] = useState<number>(0)
  const categories = exercises
    .filter(group => group.group !== "cardio")
    .map(group => group.group);
  const { toast } = useToast()
  const [exerciseName, setExerciseName] = useState<string>(`New Exercise`)
  const [internalExerciseName, setInternalExerciseName] = useState<string>(exerciseName)

  const handleAddCustomExercise = useCallback(async () => {
    if (customExercise.trim() && selectedCategory) {
      const formattedName = toCamelCase(customExercise)
      const categoryIndex = exercises.findIndex((category: any) => category.group === selectedCategory);
      exercises[categoryIndex].items.push(formattedName);
      setExerciseList(exercises)
      setValue(`exercises.${index}.exerciseType`, formattedName)
      setSelectKey((prev) => prev + 1)
      setCustomExercise("")
      setSelectedCategory("")
      setDialogOpen(false)
      try {
        const response = await addCustomExercise(gymMeta.customExercises, formattedName, selectedCategory);
        if (response.$metadata.httpStatusCode === 200) {
          toast({
            title: "Success",
            description: `${customExercise} has been added to your Personal Database`,
          })
        } else {
          toast({
            title: "Error",
            description: "There was an AWS error. Please delete the exercise and try again.",
          })
        }
      } catch (error) {
        console.error("Error adding custom exercise:", error);
        toast({
          title: "Error",
          description: "There was an error adding your custom exercise. Please delete the exercise and try again.",
        })
      }
    }
  }, [customExercise, selectedCategory, setValue, index])
  /********************************************************* */

  /***********************NAME UPDATING**************************/

  useEffect(() => {
    if (exerciseType) {
      setExerciseName(capitalize(exerciseType))
    }
  }, [exerciseType])
  useEffect(() => {
    setInternalExerciseName(exerciseType)
    if (mod_grip && mod_grip != "normal") {
      if (mod_plane && mod_plane != "normal") {
        setInternalExerciseName(exerciseType + "_" + mod_grip + "_" + mod_plane)
      } else { setInternalExerciseName(exerciseType + "_" + mod_grip) }
    } else if (mod_plane && mod_plane != "normal") {
      setInternalExerciseName(exerciseType + "_" + mod_plane)
    }
  }, [exerciseType, mod_grip, mod_plane])
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
              {(mod_grip != undefined && mod_grip != "normal") || (mod_plane != undefined && mod_plane != "normal")
                ? " // "
                : ""}
            </span>
            <span className="text-xs font-extralight italic flex flex-wrap">
              {`${mod_grip != "normal" && mod_grip != undefined ? capitalize(mod_grip) : ""}`}
              {mod_grip && mod_grip != "normal" && mod_plane && mod_plane != "normal" && <p className="mr-1">,</p>}
              {`${mod_plane != "normal" && mod_plane != undefined ? capitalize(mod_plane) : ""}`}
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
                        <ExerciseSettingDialog control={control} index={index} />
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
                        {exerciseList.map((group) => {
                          if (group.group !== "cardio") {
                            return (
                              <SelectGroup key={group.group} className="mb-6">
                                <SelectLabel className="font-medium text-lg">{capitalize(group.group)}</SelectLabel>
                                {group.items.map((exercise) => (
                                  exercise && exercise.trim() !== "" && (
                                    <SelectItem
                                      key={exercise}
                                      value={exercise}
                                    >
                                      {capitalize(exercise)}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectGroup>
                            )
                          }
                        })}
                        <SelectItem value="add-custom" className="text-primary font-medium border-t pt-4 border-neutral-600">
                          <div className="flex items-center gap-2 mb-2">
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
            {gymMeta.exerciseData[internalExerciseName] && (
              <div id={`${index}_reference`} className="mb-6">
                {gymMeta.exerciseData[internalExerciseName]?.mostRecentSession && (
                  <div className="flex gap-2 mb-2">
                    <p className="font-xs text-neutral-200 font-medium">{`Previous: `}</p>
                    {gymMeta.exerciseData[internalExerciseName]?.mostRecentSession.sets.map((set: any, index: number) => (
                      <p className="font-xs text-neutral-400 font-light" key={index}>{set.reps}@{set.weight}
                        {index == gymMeta.exerciseData[internalExerciseName]?.mostRecentSession.sets.length - 1 ? "" : ", "}</p>
                    ))}
                  </div>
                )}
                {gymMeta.exerciseData[internalExerciseName]?.recordSet && (
                  <div className="flex gap-2">
                    <p className="font-xs text-neutral-200 font-medium">{`Your PR: `}</p>
                    <p className="font-xs text-neutral-400 font-extralight">
                      <span className="underline font-light">{`${gymMeta.exerciseData[internalExerciseName]?.recordSet.reps}${gymMeta.exerciseData[internalExerciseName].repsRight ? `/${gymMeta.exerciseData[internalExerciseName].repsRight}` : ""}@${gymMeta.exerciseData[internalExerciseName]?.recordSet.weight}`}</span>
                      {` (${gymMeta.exerciseData[internalExerciseName]?.recordSet.totalVolume} lbs)`}
                      {` on `}
                      <span className="underline font-light">{spellOutDate(gymMeta.exerciseData[internalExerciseName]?.recordSet.date)}</span>
                    </p>
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
                      {capitalize(category)}
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
