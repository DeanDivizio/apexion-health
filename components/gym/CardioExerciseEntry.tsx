import React from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui_primitives/alert-dialog"

const cardioExercises = [
  "Running",
  "Cycling",
  "Swimming",
  "Rowing",
  "Elliptical",
  "Stair Climber",
  "Jump Rope",
  "Walking",
  "Hiking",
]

export default function CardioExercise({ index, isOpen, onOpenChange, onDelete }: { index: number; isOpen: boolean; onOpenChange: (open: boolean) => void; onDelete: () => void }) {
  const { control, watch } = useFormContext()

  const exerciseType = watch(`exercises.${index}.exerciseType`)

  return (
    <Accordion type="single" collapsible value={isOpen ? `item-${index}` : ""} onValueChange={(value) => onOpenChange(value === `item-${index}`)}>
      <AccordionItem value={`item-${index}`}>
        <AccordionTrigger>{exerciseType || "New Cardio Exercise"}</AccordionTrigger>
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
                        {cardioExercises.map((exercise) => (
                          <SelectItem key={exercise} value={exercise}>
                            {exercise}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1 space-y-4">
              <FormField
                control={control}
                name={`exercises.${index}.duration`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input t9 {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`exercises.${index}.distance`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance</FormLabel>
                    <FormControl>
                      <Input t9 {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`exercises.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="km">Kilometers</SelectItem>
                        <SelectItem value="mi">Miles</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="mt-4 w-full bg-transparent border-red-500 font-thin">Delete Exercise</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the exercise 
                  {exerciseType && ` "${exerciseType}"`} and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}