"use client"

import React, { useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addItemToTable } from "@/actions/AWS"
import StrengthExercise, { StrengthExerciseForm } from "@/components/strength-exercise"
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "../ui/accordion"

const FormSchema = z.object({
  month: z.string(),
  day: z.string(),
  year: z.string(),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
  exercises: z.array(z.object({
    exerciseType: z.string(),
    sets: z.array(z.object({
      weight: z.number(),
      reps: z.number()
    }))
  }))
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
      hour: hour.toString(),
      minute: currentDate.getMinutes().toString().padStart(2, '0'),
      ampm: currentDate.getHours() >= 12 ? 'PM' : 'AM',
      exercises: []
    }
  })

  const { fields, append } = useFieldArray({
    control: methods.control,
    name: "exercises"
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setButtonText("sending...")
      const formattedDate = `${data.year}${data.month}${data.day}`
      const formattedTime = `${data.hour}:${data.minute} ${data.ampm}`
      const formattedData = {
        ...data,
        date: formattedDate,
        time: formattedTime,
      }
      const cleanedData = Object.fromEntries(
        Object.entries(formattedData).filter(([key]) => !['day', 'month', 'year', 'hour', 'minute', 'ampm'].includes(key))
      )
      await addItemToTable(cleanedData, "Apexion-Hormone")
      setButtonText("Sent!")
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error) {
      console.error('An error occurred:', error)
      setButtonText("Error occurred")
    }
  }

  const addExercise = () => {
    const newIndex = fields.length
    append({ exerciseType: "", sets: [{ weight: 0, reps: 1 }] })
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
          <div className="flex flex-col md:flex-row mt-8 gap-6 items-center justify-center">
            <div className="flex gap-2 items-center justify-between">
              <p>Date:</p>
              <div className="flex space-x-3">
                <FormField
                  control={methods.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                              {day.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center justify-between">
              <p>Time:</p>
              <div className="flex space-x-3">
                <FormField
                  control={methods.control}
                  name="hour"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="minute"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                            <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                              {minute.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={methods.control}
                  name="ampm"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          </AccordionContent>
          </AccordionItem>
          </Accordion>
          {fields.map((field, index) => (
            <StrengthExercise
              key={field.id}
              index={index}
              isOpen={openExercises.includes(index)}
              onOpenChange={(open) => handleOpenChange(index, open)}
            />
          ))}
          <Button variant='outline' type="button" onClick={addExercise}>Add Strength Exercise</Button>
          <Button variant='outline' type="button" style={{marginBottom: "2rem"}}>Add Cardio</Button>
          <Button type="submit">{buttonText}</Button>
        </form>
      </Form>
    </FormProvider>
  )
}