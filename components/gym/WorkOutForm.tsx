"use client"

import React, { useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { addItemToTable } from "@/actions/AWS"
import StrengthExercise from "@/components/strength-exercise"
import CardioExercise from "@/components/gym/CardioExerciseEntry"
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "../ui/accordion"

const FormSchema = z.object({
  month: z.string(),
  day: z.string(),
  year: z.string(),
  startHour: z.string(),
  startMinute: z.string(),
  startAmpm: z.string(),
  useCurrentEndTime: z.boolean(),
  endHour: z.string().optional(),
  endMinute: z.string().optional(),
  endAmpm: z.string().optional(),
  exercises: z.array(
    z.object({
      type: z.enum(["strength", "cardio"]),
      exerciseType: z.string(),
      sets: z.array(z.object({
        weight: z.number(),
        reps: z.number()
      })).optional(),
      duration: z.number().optional(),
      distance: z.number().optional(),
      unit: z.enum(["km", "mi"]).optional()
    })
  )
})

export default function WorkoutForm({ onSuccess }: { onSuccess: () => void }) {
  const [buttonText, setButtonText] = useState<string>("Log Data")
  const [openExercises, setOpenExercises] = useState<number[]>([])

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const hour = currentDate.getHours() % 12 || 12

  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
      day: currentDate.getDate().toString().padStart(2, '0'),
      year: currentYear.toString(),
      startHour: hour.toString(),
      startMinute: currentDate.getMinutes().toString().padStart(2, '0'),
      startAmpm: currentDate.getHours() >= 12 ? 'PM' : 'AM',
      useCurrentEndTime: true,
      endHour: hour.toString(),
      endMinute: currentDate.getMinutes().toString().padStart(2, '0'),
      endAmpm: currentDate.getHours() >= 12 ? 'PM' : 'AM',
      exercises: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "exercises"
  })

  const onDelete = (index: number) => {
    remove(index)
    setOpenExercises(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i))
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setButtonText("sending...")
      const formattedDate = `${data.year}${data.month}${data.day}`
      const formattedStartTime = `${data.startHour}:${data.startMinute} ${data.startAmpm}`
      let formattedEndTime
      if (data.useCurrentEndTime) {
        const now = new Date()
        formattedEndTime = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`
      } else {
        formattedEndTime = `${data.endHour}:${data.endMinute} ${data.endAmpm}`
      }
      const formattedData = {
        ...data,
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      }
      const cleanedData = Object.fromEntries(
        Object.entries(formattedData).filter(([key]) => !['day', 'month', 'year', 'startHour', 'startMinute', 'startAmpm', 'endHour', 'endMinute', 'endAmpm', 'useCurrentEndTime'].includes(key))
      )
      await addItemToTable(cleanedData, "Apexion-Gym")
      setButtonText("Sent!")
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error) {
      console.error('An error occurred:', error)
      setButtonText("Error occurred")
    }
  }

  const addExercise = (type: "strength" | "cardio") => {
    const newIndex = fields.length
    if (type === "strength") {
      append({ type, exerciseType: "", sets: [{ weight: 0, reps: 1 }] })
    } else {
      append({ type, exerciseType: "", duration: 0, distance: 0, unit: "km" })
    }
    setOpenExercises(prev => [...prev, newIndex])
  }

  const handleOpenChange = (index: number, open: boolean) => {
    setOpenExercises(prev => 
      open 
        ? [...prev, index]
        : prev.filter(i => i !== index)
    )
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="w-2/3 space-y-6 flex flex-col justify-center">
          <Accordion type="single" collapsible>
            <AccordionItem value="dateTime">
              <AccordionTrigger><p className="text-center w-full ">{`Date & Time`}</p></AccordionTrigger>
              <AccordionContent>
                {/* Date and Time fields remain unchanged */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {fields.map((field, index) => (
            field.type === "strength" ? (
              <StrengthExercise
                key={field.id}
                index={index}
                isOpen={openExercises.includes(index)}
                onOpenChange={(open) => handleOpenChange(index, open)}
                onDelete={() => onDelete(index)}
              />
            ) : (
              <CardioExercise
                key={field.id}
                index={index}
                isOpen={openExercises.includes(index)}
                onOpenChange={(open) => handleOpenChange(index, open)}
                onDelete={() => onDelete(index)}
              />
            )
          ))}
          <Button variant='outline' type="button" onClick={() => addExercise("strength")}>Add Strength Exercise</Button>
          <Button variant='outline' type="button" onClick={() => addExercise("cardio")} style={{marginBottom: "2rem"}}>Add Cardio</Button>
          <Button type="submit">{buttonText}</Button>
        </form>
      </Form>
    </FormProvider>
  )
}