// import React from "react"
// import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
// import { Button } from "@/components/ui/button"
// import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
// import { Input } from "@/components/ui/input"
// import { X } from "lucide-react"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// export type StrengthExerciseForm = {
//   exerciseType: string
//   sets: { weight: number; reps: number }[]
// }

// const exercises = [
//   { group: "Upper Body", items: [
//     "Arnold Press", "Barbell Row", "Bench Press", "Bicep Curl", "Chest Fly", "Chest Press",
//     "Dumbbell Press", "Hammer Curl", "Incline Press", "Lateral Pulldown", "Overhead Press",
//     "Pec Fly", "Pull Up", "Push Up", "Rear Delt", "Seated Row", "Shoulder Press", "Shrugs",
//     "Tricep Extension", "Upright Row"
//   ]},
//   { group: "Lower Body", items: [
//     "Back Squat", "Box Jump", "Bulgarian Split Squat", "Calf Raise", "Deadlift", "Front Squat",
//     "Glute Bridge", "Goblet Squat", "Hack Squat", "Hip Thrust", "Jump Squat", "Kettlebell Swing",
//     "Lateral Lunge", "Leg Curl", "Leg Extension", "Leg Press", "Lunge", "Romanian Deadlift",
//     "Step Up", "Sumo Deadlift"
//   ]}
// ]

// function SetForm({ exerciseIndex, setIndex, onRemove }: { exerciseIndex: number; setIndex: number; onRemove: () => void }) {
//   const { control } = useFormContext()

//   return (
//     <div className="flex space-x-4 mb-1 items-end">
//       <FormField
//         control={control}
//         name={`exercises.${exerciseIndex}.sets.${setIndex}.weight`}
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel className="font-extralight">Weight:</FormLabel>
//             <FormControl>
//               <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//       <FormField
//         control={control}
//         name={`exercises.${exerciseIndex}.sets.${setIndex}.reps`}
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel className="font-extralight">Reps:</FormLabel>
//             <FormControl>
//               <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//       <Button
//         type="button"
//         variant="ghost"
//         size="icon"
//         onClick={onRemove}
//         className="h-10 w-10"
//       >
//         <X className="h-4 w-4" />
//         <span className="sr-only">Remove set</span>
//       </Button>
//     </div>
//   )
// }

// export default function StrengthExercise({ index, isOpen, onOpenChange, onDelete }: { index: number; isOpen: boolean; onOpenChange: (open: boolean) => void; onDelete: () => void }) {
//   const { control } = useFormContext()

//   const getExerciseName = (value: string) => {
//     for (const group of exercises) {
//       const exercise = group.items.find(item => item.toLowerCase().replace(/\s+/g, '') === value)
//       if (exercise) return exercise
//     }
//     return value
//   }
  
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: `exercises.${index}.sets`,
//   })

//   const sets = useWatch({
//     control,
//     name: `exercises.${index}.sets`,
//   })

//   const exerciseType = useWatch({
//     control,
//     name: `exercises.${index}.exerciseType`,
//   })

//   const addSet = () => {
//     const lastSet = sets[sets.length - 1]
//     const newSet = lastSet 
//       ? { weight: lastSet.weight, reps: lastSet.reps }
//       : { weight: 0, reps: 1 }
//     append(newSet)
//   }

//   return (
//     <Accordion type="single" collapsible value={isOpen ? `item-${index}` : ""} onValueChange={(value) => onOpenChange(value === `item-${index}`)}>
//       <AccordionItem value={`item-${index}`}>
//       <AccordionTrigger>{getExerciseName(exerciseType) || "New Exercise"}</AccordionTrigger>
//         <AccordionContent>
//           <div className="flex bg-neutral-900 flex-col md:flex-row border p-4 rounded-md">
//             <div className="flex items-center mb-4">
//               <FormField
//                 control={control}
//                 name={`exercises.${index}.exerciseType`}
//                 render={({ field }) => (
//                   <FormItem className="w-full">
//                     <FormLabel>Exercise</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select Exercise" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {exercises.map((group) => (
//                           <SelectGroup key={group.group}>
//                             <SelectLabel>{group.group}</SelectLabel>
//                             {group.items.map((exercise) => (
//                               <SelectItem key={exercise} value={exercise.charAt(0).toLowerCase() + exercise.slice(1).replace(/\s+/g, '')}>
//                                 {exercise}
//                               </SelectItem>
//                             ))}
//                           </SelectGroup>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <div className="flex-1">
//               <div className="space-y-4">
//                 {fields.map((field, setIndex) => (
//                   <SetForm 
//                     key={field.id} 
//                     exerciseIndex={index} 
//                     setIndex={setIndex} 
//                     onRemove={() => remove(setIndex)}
//                   />
//                 ))}
//               </div>
//               <Button
//                 type="button"
//                 variant="secondary"
//                 onClick={addSet}
//                 className="mt-8 w-full"
//               >
//                 Add Set
//               </Button>
//             </div>
//           </div>
//           <AlertDialog>
//             <AlertDialogTrigger asChild>
//               <Button variant="outline" className="mt-4 w-full bg-transparent border-red-500 font-thin">Delete Exercise</Button>
//             </AlertDialogTrigger>
//             <AlertDialogContent>
//               <AlertDialogHeader>
//                 <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//                 <AlertDialogDescription>
//                   This action cannot be undone. This will permanently delete the exercise 
//                   {exerciseType && ` "${getExerciseName(exerciseType)}"`} and all its data.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <AlertDialogFooter>
//                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//                 <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
//         </AccordionContent>
//       </AccordionItem>
//     </Accordion>
//   )
// }