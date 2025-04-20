"use client"
import { useState, useEffect } from "react"
import { getAllDataFromTableByUser } from "@/actions/AWS"
import { capitalize, spellOutDate, toCamelCase } from "@/lib/utils"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui_primitives/accordion"
import { Skeleton } from "@/components/ui_primitives/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger } from "@/components/ui_primitives/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui_primitives/dialog"
import { Pencil, Plus, MoreVertical } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui_primitives/scroll-area"
import { z } from "zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Input } from "@/components/ui_primitives/input"
import { Button } from "@/components/ui_primitives/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui_primitives/dropdown-menu"

const setSchema = z.object({
    reps: z.number().min(1, "Must be at least 1 rep"),
    weight: z.number().min(0, "Weight cannot be negative"),
    repsRight: z.number().optional()
})

const exerciseSchema = z.object({
    exerciseType: z.string().min(1, "Exercise type is required"),
    sets: z.array(setSchema)
})

const workoutSchema = z.object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    exercises: z.array(exerciseSchema)
})

type WorkoutFormValues = z.infer<typeof workoutSchema>

function EditSession({ userRef, sessionRef }: { userRef: string | null, sessionRef: any }) {
    const isMobile = useIsMobile()
    const form = useForm<WorkoutFormValues>({
        resolver: zodResolver(workoutSchema),
        defaultValues: {
            startTime: sessionRef.startTime,
            endTime: sessionRef.endTime,
            exercises: sessionRef.exercises.map((exercise: any) => ({
                exerciseType: exercise.exerciseType,
                sets: exercise.sets.map((set: any) => ({
                    reps: set.reps,
                    weight: set.weight,
                    repsRight: set.repsRight
                }))
            }))
        }
    })

    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control: form.control,
        name: "exercises"
    })

    const addExercise = () => {
        appendExercise({
            exerciseType: "",
            sets: [{ reps: 0, weight: 0 }]
        })
    }

    const addSet = (exerciseIndex: number) => {
        const currentSets = form.getValues(`exercises.${exerciseIndex}.sets`)
        const lastSet = currentSets[currentSets.length - 1]
        const newSet = lastSet ? { ...lastSet, reps: 0, repsRight: undefined } : { reps: 0, weight: 0 }
        form.setValue(`exercises.${exerciseIndex}.sets`, [...currentSets, newSet])
    }

    const removeSet = (exerciseIndex: number, setIndex: number) => {
        const currentSets = form.getValues(`exercises.${exerciseIndex}.sets`)
        form.setValue(`exercises.${exerciseIndex}.sets`, currentSets.filter((_, i) => i !== setIndex))
    }

    const resetForm = () => {
        form.reset({
            startTime: sessionRef.startTime,
            endTime: sessionRef.endTime,
            exercises: sessionRef.exercises.map((exercise: any) => ({
                exerciseType: exercise.exerciseType,
                sets: exercise.sets.map((set: any) => ({
                    reps: set.reps,
                    weight: set.weight,
                    repsRight: set.repsRight
                }))
            }))
        })
    }

    const onSubmit = async (data: WorkoutFormValues) => {
        // TODO: Implement update logic
        console.log(data)
    }

    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger asChild>
                    <Pencil className="w-4 h-4" />
                </DrawerTrigger>
                <DrawerContent className="bg-transparent">
                    <DrawerHeader className="bg-neutral-950">
                        <DrawerTitle className="text-white">Edit Session: <span className="text-neutral-200 font-light italic pl-2">{spellOutDate(sessionRef.date)}</span></DrawerTitle>
                    </DrawerHeader>
                    <Form {...form} >
                        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-neutral-950">
                            <div className="flex flex-row gap-4 items-center justify-center mb-4 px-2">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between mb-4 px-4">
                                <h3 className="text-lg font-medium">Exercises</h3>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={addExercise}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Exercise
                                </Button>
                            </div>
                            <ScrollArea className="w-full h-[600px] px-4 pt-2 pb-16 bg-gradient-to-br from-neutral-950 to-neutral-900">
                                {form.watch("exercises").map((exercise, exerciseIndex) => (
                                    <div key={exerciseIndex} className="mb-8">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${exerciseIndex}.exerciseType`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Exercise Type</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            {...field} 
                                                            value={capitalize(field.value)}
                                                            onChange={(e) => field.onChange(toCamelCase(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="mt-4 space-y-4">
                                            {exercise.sets.map((set, setIndex) => (
                                                <div key={setIndex} className="flex gap-4 items-end">
                                                    <FormField
                                                        control={form.control}
                                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Weight</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) === undefined ? "Reps" : "Left Reps"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) !== undefined && (
                                                        <FormField
                                                            control={form.control}
                                                            name={`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Right Reps</FormLabel>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="number" 
                                                                            {...field} 
                                                                            value={field.value || ''}
                                                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const currentValue = form.getValues(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`)
                                                                    if (currentValue === undefined) {
                                                                        form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`, 0)
                                                                    } else {
                                                                        form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`, undefined)
                                                                    }
                                                                }}
                                                            >
                                                                {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) === undefined ? "Split L/R" : "Remove Split"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                                                className="text-red-500"
                                                            >
                                                                Delete Set
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="w-full mt-2"
                                                onClick={() => addSet(exerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Set
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <ScrollBar />
                            </ScrollArea>
                        </form>
                    </Form>
                    <DrawerFooter className="absolute bottom-0 left-0 right-0 pb-8 flex flex-row gap-2 bg-transparent backdrop-blur-sm">
                        <Button 
                            type="submit" 
                            className="flex-1 rounded bg-gradient-to-br from-green-500 to-blue-900 text-white"
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            Save Changes
                        </Button>
                        <DrawerClose asChild>
                            <Button 
                                variant="outline" 
                                className="flex-1 rounded border-red-900"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    } else {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Pencil className="w-4 h-4" />
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Session</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between">
                                <h3 className="text-lg font-medium">Exercises</h3>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={addExercise}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Exercise
                                </Button>
                            </div>
                            <ScrollArea className="w-full h-[500px] my-8 px-2 pb-8">
                                {form.watch("exercises").map((exercise, exerciseIndex) => (
                                    <div key={exerciseIndex} className="mb-8">
                                        <FormField
                                            control={form.control}
                                            name={`exercises.${exerciseIndex}.exerciseType`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Exercise Type</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            {...field} 
                                                            value={capitalize(field.value)}
                                                            onChange={(e) => field.onChange(toCamelCase(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="mt-4 space-y-4">
                                            {exercise.sets.map((set, setIndex) => (
                                                <div key={setIndex} className="flex gap-4 items-end">
                                                    <FormField
                                                        control={form.control}
                                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Weight</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) === undefined ? "Reps" : "Left Reps"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) !== undefined && (
                                                        <FormField
                                                            control={form.control}
                                                            name={`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Right Reps</FormLabel>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="number" 
                                                                            {...field} 
                                                                            value={field.value || ''}
                                                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="icon"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const currentValue = form.getValues(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`)
                                                                    if (currentValue === undefined) {
                                                                        form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`, 0)
                                                                    } else {
                                                                        form.setValue(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`, undefined)
                                                                    }
                                                                }}
                                                            >
                                                                {form.watch(`exercises.${exerciseIndex}.sets.${setIndex}.repsRight`) === undefined ? "Split L/R" : "Remove Split"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                                                className="text-red-500"
                                                            >
                                                                Delete Set
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="w-full mt-2"
                                                onClick={() => addSet(exerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Set
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <ScrollBar />
                            </ScrollArea>
                        </form>
                    </Form>
                    <DialogFooter className="flex flex-row gap-2">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            type="submit" 
                            className="flex-1"
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }
}

export default function GymSessions() {
    const [gymSessions, setGymSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userRef, setUserRef] = useState<string | null>(null)

    useEffect(() => {
        const fetchGymSessions = async () => {
            if (gymSessions.length === 0) {
                const response = await getAllDataFromTableByUser("Apexion-Gym")
                setGymSessions(response.reverse())
            } else {
                setLoading(false)
                setUserRef(gymSessions[0].userID)
            }
            console.log(gymSessions)
        }
        fetchGymSessions()
    }, [gymSessions])

    if (loading) {
        return (
            <main className="w-full min-h-screen pt-24 px-4">
                <h1 className="w-full text-center text-3xl font-medium mb-8">Gym Sessions</h1>
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded" />
            </main>
        )
    }

    return (
        <main className="w-full min-h-screen pt-24 pb-16 bg-gradient-to-br from-indigo-950/15 to-neutral-950">
            <h1 className="w-full text-center text-3xl font-medium mb-8">Gym Sessions</h1>
            <div className="w-full flex flex-col items-center justify-center">
                <Accordion type="single" collapsible>
                    {gymSessions.map((date, index) => (
                        <AccordionItem key={index} value={date.date}
                            className={`min-w-[350px] w-96 max-w-[400px] flex flex-col items-start justify-center mb-8 px-4 rounded
                    ${index % 2 === 0 ? "bg-gradient-to-br from-green-950/20 to-neutral-950" : "bg-gradient-to-br from-blue-950/20 to-neutral-950"}`}>
                            <div key={date.date} className="w-full flex flex-col items-between justify-center">
                                <AccordionTrigger className="w-full flex flex-row items-center justify-between">
                                    <h2 className="text-lg font-bold ">{spellOutDate(date.date)}</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {date.data.map((session: any) => (
                                        <div key={session.startTime}>
                                            <div className="w-full flex flex-row items-center justify-between">
                                                <h3 className="text-xs font-thin italic mb-2">{session.startTime} - {session.endTime}</h3>
                                                <EditSession userRef={userRef} sessionRef={{ ...session, date: date.date }} />
                                            </div>
                                            {session.exercises.map((exercise: any) => (
                                                <div key={exercise.exerciseType} className="mb-4">
                                                    <h4 className="text-md font-medium">{capitalize(exercise.exerciseType)}</h4>
                                                    {exercise.sets?.map((set: any, index: number) => (
                                                        <div key={index + 1} className="flex flex-row items-center justify-start gap-1 pl-4 py-1 text-sm">
                                                            <p className="font-medium">{set.reps} <span className="text-neutral-200 font-thin">reps</span></p>
                                                            <p className="text-neutral-400 text-xs">@</p>
                                                            <p className="font-medium">{set.weight}<span className="text-neutral-300 font-thin">lbs</span></p>
                                                        </div>
                                                    ))}
                                                </div>

                                            ))}
                                        </div>
                                    ))}
                                </AccordionContent>
                            </div>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </main>
    )
}