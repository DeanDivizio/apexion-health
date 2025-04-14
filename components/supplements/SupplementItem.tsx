"use client"
import React, {useState, useEffect} from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"

export default function SupplementItem({ index, onDelete }: { index: number; onDelete: () => void }) {
    const { control } = useFormContext()
    const [itemName, setItemName] = useState("Select Supplement Below")  
    const supplementType = useWatch({ control, name: `supplements.${index}.name` });
    useEffect(() => { 
        setItemName(supplementType)
    }, [supplementType])   

    return (
        <Accordion type={"single"} collapsible defaultValue={`item-${index}`} 
            className={`border rounded shadow-lg px-4 py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6`}>
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="flex flex-row mb-6">
                {itemName}
                </AccordionTrigger>
                <AccordionContent className="flex flex-wrap justify-center md:justify-between items-center">
                <FormField
                        control={control}
                        name={`supplements.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-row flex items-center w-full">
                                <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={"Select..."}>
                                        <SelectTrigger className="mb-8">{field.value}</SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Alpha-GPC">{`Alpha-GPC`}</SelectItem>
                                            <SelectItem value="Creatine">Creatine</SelectItem>
                                            <SelectItem value="Fadogia Agrestis">Fadogia Agrestis</SelectItem>
                                            <SelectItem value="Inositol">Inositol</SelectItem>
                                            <SelectItem value="Omega-3">{`Omega-3's`}</SelectItem>
                                            <SelectItem value="Rhodiola Rosea">Rhodiola Rosea</SelectItem>
                                            <SelectItem value="Tongkat Ali">Tongkat Ali</SelectItem>
                                            <SelectItem value="Tyrosine">Tyrosine</SelectItem>
                                            <SelectItem value="Vitamin D">Vitamin D</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <p className="text-center w-full mb-2">{`Dose & Details`}</p>
                    <hr className="w-full mb-4"></hr>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10 w-5/6 md:w-full">
                    <FormField
                        control={control}
                        name={`supplements.${index}.dose`}
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