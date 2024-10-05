"use client";

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { addItemToTable } from "@/actions/AWS"

//define the form schema
const FormSchema = z.object({
  category: z.string(),
  type: z.string(),
  dose: z.string().transform(Number),
  depth: z.string().optional(),
  date: z.string(),
  time: z.string(),

})

// Feature needed: save the current form values as defaults and populate based on defaults with subsequent uses
export default function HRTForm({ onSuccess }: { onSuccess: () => void }) {

  const [category, setCategory] = useState<string | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [buttonText, setButtonText] = useState<string>("Log Data")

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: "",
      type: "",
      dose: 0,
      date: "",
      time: "",
    },
  })
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try { 
      setButtonText("sending...");
      await addItemToTable(data, "Apexion-Hormone");
      setButtonText("Sent!");
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('An error occurred:', error);
      setButtonText("Error occurred");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="number" placeholder="20240914" {...field} />
              </FormControl>
              <FormDescription>
                {`Enter the date in YYYYMMDD format, or leave blank to use current date`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <FormControl>
                <Input type="text" placeholder="8:30am" {...field} />
              </FormControl>
              <FormDescription>
                {`Enter the time in am/pm format, or leave blank to use current time`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
                {`Enter your dose in milograms (mG)`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {category ? <FormField
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
                  {category === "testosterone" ?
                    <>
                      <SelectItem value="cypionate">{`Injection - Cypionate`}</SelectItem>
                      <SelectItem value="propionate">{`Injection - Propionate`}</SelectItem>
                      <SelectItem value="enanthate">{`Injection - Enanthate`}</SelectItem>
                      <SelectItem value="cream">{`Cream`}</SelectItem>
                    </>
                    : category === "ai" ?
                      <>
                        <SelectItem value="anastrozole">{`Anastrozole`}</SelectItem>
                        <SelectItem value="letrozole">{`Letrozole`}</SelectItem>
                        <SelectItem value="exemestane">{`Exemestane`}</SelectItem>
                      </>
                      : category === "estrogen" ?
                        <>
                          <SelectItem value="e2tablet">{`Estrodiol - Tablet`}</SelectItem>
                          <SelectItem value="e2cream">{`Estrodiol - Cream`}</SelectItem>
                          <SelectItem value="e2ring">{`Estrodiol - Vaginal Ring`}</SelectItem>
                          <SelectItem value="estriolsupp">{`Estriol - Suppository`}</SelectItem>
                          <SelectItem value="estriolcream">{`Estriol - Cream`}</SelectItem>
                        </>
                        : category === "pde5i" ?
                          <>
                            <SelectItem value="tadalafil">{`Tadalafil (Cialis)`}</SelectItem>
                            <SelectItem value="sildenafil">{`Sildenafil (Viagra, Revatio)`}</SelectItem>
                            <SelectItem value="vardenafil">{`Vardenafil (Levitra)`}</SelectItem>
                            <SelectItem value="avanafil">{`Avanafil (Stendra)`}</SelectItem>
                          </>
                          :  category === "gonadotropin" ?
                          <>
                            <SelectItem value="gonadorelin">{`Gonadorelin (Factrel, Lutropin)`}</SelectItem>
                            <SelectItem value="hcg">{`HCG (Pregnyl, Profasi, Novarel, Ovidrel)`}</SelectItem>
                          </>
                          : null
                  }
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        /> : null}
        {category === "testosterone" || category=== "gonadotropin" && type && type != "cream" ?
          <FormField
            control={form.control}
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Injection Depth</FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); }} defaultValue={field.value}>
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
          /> : null
        }
        <Button type="submit">{buttonText}</Button>
      </form>
    </Form>
  )
}
