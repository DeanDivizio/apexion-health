"use client"

import React, { useState, useEffect } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui_primitives/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { addItemToTable } from "@/actions/AWS"
import FoodItem from "./FoodItem"
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "../ui_primitives/accordion"

// i feel like force dynamic shouldnt be necessary
export const dynamic = 'force-dynamic';

const FormSchema = z.object({
  month: z.string(),
  day: z.string(),
  year: z.string(),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
  mealLabel: z.string().optional().or(z.literal('Breakfast')).or(z.literal('Lunch')).or(z.literal('Dinner')).or(z.literal(`Other`)),
  foodItems: z.array(
    z.object({
      name: z.string(),
      stats: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number()
      }),
      numberOfServings: z.number(),
    })
  )
})

export default function FoodForm({ onSuccess }: { onSuccess: () => void }) {
  const [buttonText, setButtonText] = useState<string>("Log Data")
  const [openFoodItems, setOpenFoodItems] = useState<number[]>([])

  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      month: '',
      day: '',
      year: '',
      hour: '',
      minute: '',
      ampm: '',
      foodItems: []
    }
  })

  useEffect(() => {
    const now = new Date()
    methods.reset({
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
      hour: (now.getHours() % 12 || 12).toString(),
      minute: now.getMinutes().toString().padStart(2, '0'),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM',
      foodItems: []
    })
  }, [methods])

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "foodItems"
  })

  const onDelete = (index: number) => {
    remove(index)
    setOpenFoodItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i))
  }

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
      await addItemToTable(cleanedData, "Apexion-Nutrition")
      setButtonText("Sent!")
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error) {
      console.error('An error occurred:', error)
      setButtonText("Error occurred")
    }
  }

  const addItem = () => {
    const newIndex = fields.length
    append({ name: "", stats: {calories: 0, protein: 0, carbs: 0, fat: 0}, numberOfServings: 1})
    setOpenFoodItems(prev => [...prev, newIndex])
  }

  const handleOpenChange = (index: number, open: boolean) => {
    setOpenFoodItems(prev => 
      open 
        ? [...prev, index]
        : prev.filter(i => i !== index)
    )
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="w-3/4 2xl:w-1/2 py-36 flex flex-col justify-start">
          <Accordion type="single" collapsible>
            <AccordionItem value="dateTime" className="mb-6">
              <AccordionTrigger><p className="text-center w-full ">{`Date, Time, & Label`}</p></AccordionTrigger>
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
                  <div className="flex gap-2 items-center justify-between">
                    <p>{`Meal (optional)`}</p>
                    <div className="flex space-x-3">
                      <FormField
                        control={methods.control}
                        name="mealLabel"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem key={"Breakfast"} value={"Breakfast"} >Breakfast</SelectItem>
                                  <SelectItem key={"Lunch"} value={"Lunch"} >Lunch</SelectItem>
                                  <SelectItem key={"Dinner"} value={"Dinner"} >Dinner</SelectItem>
                                  <SelectItem key={"Other"} value={"Other"} >Other</SelectItem>
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
              <FoodItem
                key={field.id}
                index={index}
                onDelete={() => onDelete(index)}
              />
            ) 
          )}
          <Button className="mt-8 mb-6" variant='outline' type="button" onClick={() => addItem()}>Add Food Item</Button>
          <Button type="submit">{buttonText}</Button>
        </form>
      </Form>
    </FormProvider>
  )
}

