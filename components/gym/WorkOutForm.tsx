"use client"

import React, { useState, useEffect } from "react"
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

export const dynamic = 'force-dynamic';

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

  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      month: '',
      day: '',
      year: '',
      startHour: '',
      startMinute: '',
      startAmpm: '',
      useCurrentEndTime: true,
      endHour: '',
      endMinute: '',
      endAmpm: '',
      exercises: []
    }
  })

  useEffect(() => {
    const now = new Date()
    methods.reset({
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
      startHour: (now.getHours() % 12 || 12).toString(),
      startMinute: now.getMinutes().toString().padStart(2, '0'),
      startAmpm: now.getHours() >= 12 ? 'PM' : 'AM',
      useCurrentEndTime: true,
      endHour: (now.getHours() % 12 || 12).toString(),
      endMinute: now.getMinutes().toString().padStart(2, '0'),
      endAmpm: now.getHours() >= 12 ? 'PM' : 'AM',
      exercises: []
    })
  }, [methods])

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
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
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
                    <p>Start Time:</p>
                    <div className="flex space-x-3">
                      <FormField
                        control={methods.control}
                        name="startHour"
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
                        name="startMinute"
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
                        name="startAmpm"
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
                  <div className="flex flex-col gap-2 items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={methods.control}
                        name="useCurrentEndTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Use the current time when the form is submitted as end time
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    {!methods.watch("useCurrentEndTime") && (
                      <div className="flex gap-2 items-center justify-between">
                        <p>End Time:</p>
                        <div className="flex space-x-3">
                          <FormField
                            control={methods.control}
                            name="endHour"
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
                            name="endMinute"
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
                            name="endAmpm"
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
                    )}
                  </div>
                </div>
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

