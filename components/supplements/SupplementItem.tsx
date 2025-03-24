import React from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"

export default function SupplementItem({ index, onDelete }: { index: number; onDelete: () => void }) {
    const { control } = useFormContext()

    return (
        <Accordion type={"single"} collapsible defaultValue={`item-${index}`} className={`border rounded shadow-lg px-4 py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6`}>
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="flex flex-row mb-6">
                <FormField
                        control={control}
                        name={`supplements.${index}.name`}
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
                        name={`supplements.${index}.dose`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Dose:</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`supplements.${index}.unit`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Unit:</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>{field.value}</SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grams">Grams</SelectItem>
                                            <SelectItem value="milligrams">Milligrams</SelectItem>
                                            <SelectItem value="picograms">Picograms</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`supplements.${index}.method`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Method:</FormLabel>
                                <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={"pill-capsule"}>
                                        <SelectTrigger>{field.value === "powder" ? "Powder" : `Pill / Capsule`}</SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pill-capsule">{`Pill / Capsule`}</SelectItem>
                                            <SelectItem value="powder">Powder</SelectItem>
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