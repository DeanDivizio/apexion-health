import React from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"

export default function FoodItem({ index, onDelete }: { index: number; onDelete: () => void }) {
    const { control } = useFormContext()

    return (
        <Accordion type={"single"} collapsible defaultValue={`item-${index}`} className={`border rounded shadow-lg px-4 py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6`}>
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="flex flex-row mb-6">
                <FormField
                        control={control}
                        name={`foodItems.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-row flex items-center w-full">
                                <FormControl>
                                    <Input className="w-full mx-4" type="string" placeholder="Item Name"{...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionTrigger>
                <AccordionContent className="flex flex-wrap justify-between items-center">
                    <p className="text-center w-full mb-2">Macros per Serving</p>
                    <hr className="w-full mb-4"></hr>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10 w-full">
                    <FormField
                        control={control}
                        name={`foodItems.${index}.stats.calories`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-medium">Calories:</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`foodItems.${index}.stats.protein`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Protein:</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`foodItems.${index}.stats.carbs`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Carbs:</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`foodItems.${index}.stats.fat`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 ">
                                <FormLabel className="font-extralight">Fat:</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>
                    <FormField
                        control={control}
                        name={`foodItems.${index}.numberOfServings`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-baseline gap-4 border-t border-r px-2 bg-gradient-to-bl from-neutral-800/30 to-neutral-900/30">
                                <FormLabel className="font-semibold ">Servings:</FormLabel>
                                <FormControl className="max-w-20">
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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