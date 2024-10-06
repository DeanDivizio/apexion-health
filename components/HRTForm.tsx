"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { addItemToTable } from "@/actions/AWS"

const FormSchema = z.object({
  category: z.string(),
  type: z.string(),
  dose: z.string().transform(Number),
  depth: z.string().optional(),
  month: z.string(),
  day: z.string(),
  year: z.string(),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
})

export default function HRTForm({ onSuccess }: { onSuccess: () => void }) {
  const [category, setCategory] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [buttonText, setButtonText] = useState<string>("Log Data")

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const hour = currentDate.getHours() % 12 || 12

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: "",
      type: "",
      dose: 0,
      month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
      day: currentDate.getDate().toString().padStart(2, '0'),
      year: currentYear.toString(),
      hour: hour.toString(),
      minute: currentDate.getMinutes().toString().padStart(2, '0'),
      ampm: currentDate.getHours() >= 12 ? 'PM' : 'AM',
    },
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
        Object.entries(formattedData).filter(([key]) => key !== 'day' && key !== 'month' && key !== 'year' && key !== 'hour' && key !== 'minute' && key !== 'ampm')
      );
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row mt-8 gap-6 items-center justify-center">
          <div className="flex gap-2 items-center">
            <p>Date:</p>
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Month</FormLabel> */}
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
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Day</FormLabel> */}
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
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Year</FormLabel> */}
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
          <div className="flex gap-2 items-center">
            <p>Time:</p>
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="hour"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Hour</FormLabel> */}
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
                control={form.control}
                name="minute"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>Minute</FormLabel> */}
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
                control={form.control}
                name="ampm"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>AM/PM</FormLabel> */}
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
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={(value) => { setCategory(value); field.onChange(value); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a medication category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="testosterone">Testosterone</SelectItem>
                  <SelectItem value="estrogen">Estrogen</SelectItem>
                  <SelectItem value="ai">Aromatase Inhibitor</SelectItem>
                  <SelectItem value="pde5i">{`PDE5 Inhibitor (i.e. Cialis)`}</SelectItem>
                  <SelectItem value="gonadotropin">{`Gonadotropin (HCG, Gonadorelin)`}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dose</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormDescription>
                {`Enter your dose in milligrams (mG)`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {category ? (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={(value) => { setType(value); field.onChange(value); }} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a your type of ${category}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {category === "testosterone" ? (
                      <>
                        <SelectItem value="cypionate">{`Injection - Cypionate`}</SelectItem>
                        <SelectItem value="propionate">{`Injection - Propionate`}</SelectItem>
                        <SelectItem value="enanthate">{`Injection - Enanthate`}</SelectItem>
                        <SelectItem value="cream">{`Cream`}</SelectItem>
                      </>
                    ) : category === "ai" ? (
                      <>
                        <SelectItem value="anastrozole">{`Anastrozole`}</SelectItem>
                        <SelectItem value="letrozole">{`Letrozole`}</SelectItem>
                        <SelectItem value="exemestane">{`Exemestane`}</SelectItem>
                      </>
                    ) : category === "estrogen" ? (
                      <>
                        <SelectItem value="e2tablet">{`Estrodiol - Tablet`}</SelectItem>
                        <SelectItem value="e2cream">{`Estrodiol - Cream`}</SelectItem>
                        <SelectItem value="e2ring">{`Estrodiol - Vaginal Ring`}</SelectItem>
                        <SelectItem value="estriolsupp">{`Estriol - Suppository`}</SelectItem>
                        <SelectItem value="estriolcream">{`Estriol - Cream`}</SelectItem>
                      </>
                    ) : category === "pde5i" ? (
                      <>
                        <SelectItem value="tadalafil">{`Tadalafil (Cialis)`}</SelectItem>
                        <SelectItem value="sildenafil">{`Sildenafil (Viagra, Revatio)`}</SelectItem>
                        <SelectItem value="vardenafil">{`Vardenafil (Levitra)`}</SelectItem>
                        <SelectItem value="avanafil">{`Avanafil (Stendra)`}</SelectItem>
                      </>
                    ) : category === "gonadotropin" ? (
                      <>
                        <SelectItem value="gonadorelin">{`Gonadorelin (Factrel, Lutropin)`}</SelectItem>
                        <SelectItem value="hcg">{`HCG (Pregnyl, Profasi, Novarel, Ovidrel)`}</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {(category === "testosterone" || category === "gonadotropin") && type && type !== "cream" ? (
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Injection Depth</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an injection depth" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sq">Sub-Cutaneous</SelectItem>
                    <SelectItem value="im">Intra-Muscular</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <Button type="submit">{buttonText}</Button>
      </form>
    </Form>
  )
}