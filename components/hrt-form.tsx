"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { addItemToTable } from "@/actions/AWS"

const FormSchema = z.object({
  category: z.string(),
  type: z.string(),
  dose: z.string().transform(Number),
  depth: z.string().optional(),
  date: z.date(),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
})

export function HrtForm({ onSuccess }: { onSuccess: () => void }) {
  const [category, setCategory] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [buttonText, setButtonText] = useState<string>("Log Data")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: "",
      type: "",
      dose: 0,
      date: new Date(),
      hour: format(new Date(), "h"),
      minute: format(new Date(), "mm"),
      ampm: format(new Date(), "a"),
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setButtonText("sending...")
      const formattedTime = `${data.hour}:${data.minute} ${data.ampm}`
      const formattedData = {
        ...data,
        date: format(data.date, "yyyyMMdd"),
        time: formattedTime,
      }
      await addItemToTable(formattedData, "Apexion-Hormone")
      setButtonText("Sent!")
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      console.error('An error occurred:', error)
      setButtonText("Error occurred")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        setIsCalendarOpen(true)
                      }}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date)
                      setIsCalendarOpen(false)
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the date for this entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="hour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hour</FormLabel>
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
                <FormLabel>Minute</FormLabel>
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
                <FormLabel>AM/PM</FormLabel>
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