import React from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"

export default function MedItem({ index, onDelete }: { index: number; onDelete: () => void }) {
    const { control } = useFormContext()

    return (
        <Accordion type={"single"} collapsible defaultValue={`item-${index}`} className={`border rounded shadow-lg py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6`}>
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="flex flex-row px-4 mb-6">
                <FormField
                        control={control}
                        name={`meds.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-row flex items-center w-full">
                                <FormControl>
                                    <Input className="w-full mx-4" type="string" placeholder="Medication Name"{...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionTrigger>
                <AccordionContent className="flex flex-wrap justify-center md:justify-between items-center">
                    <p className="text-center w-full mb-2">{`Dose & Details`}</p>
                    <hr className="w-full mb-4"></hr>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10 w-2/3 md:w-full">
                    <FormField
                        control={control}
                        name={`meds.${index}.dose`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Dose:</FormLabel>
                                <FormControl>
                                    <Input t9 {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`meds.${index}.unit`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Unit:</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>{field.value}</SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grams">Grams</SelectItem>
                                            <SelectItem value="milligrams">Milligrams</SelectItem>
                                            <SelectItem value="micrograms">Micrograms</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`meds.${index}.method`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-4 ">
                                <FormLabel className="font-extralight">Method:</FormLabel>
                                <FormControl>
                                    {/*@ts-ignore*/}
                                <Select onValueChange={field.onChange} >
                                    {/*start here. fix trigger label*/}
                                        <SelectTrigger>{field.value === `inhaler`? "Inhaler" : field.value == `nasalSpray` ? "Nasal Spray" : field.value == "cream" ? "Cream" :field.value == "injection" ? "Injection" : "Pill / Capsule"}</SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pill-capsule">{`Pill / Capsule`}</SelectItem>
                                            <SelectItem value="inhaler">Inhaler</SelectItem>
                                            <SelectItem value="nasalSpray">Nasal Spray</SelectItem>
                                            <SelectItem value="cream">Cream</SelectItem>
                                            <SelectItem value="injection">Injection</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant={"destructive"}>
                                {"Delete Item"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl text-center">{`Are you sure?`}</AlertDialogTitle>
                                <AlertDialogDescription>{`This will delete the current item and cannot be undone.`}</AlertDialogDescription>
                            </AlertDialogHeader>
                                <Button variant={"destructive"} onClick={onDelete}>Delete</Button>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                        </AlertDialogContent>
                    </AlertDialog>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}