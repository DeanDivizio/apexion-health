"use client"
import React, {useState, useEffect} from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Button } from "@/components/ui_primitives/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui_primitives/select"
import { Input } from "@/components/ui_primitives/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui_primitives/accordion"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui_primitives/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui_primitives/dialog"
import { Plus } from "lucide-react"
import { capitalize } from "@/lib/utils"

function AddCustomSupplementDialog({ 
    open, 
    onOpenChange, 
    categories 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    categories: string[] 
}) {
    const [customSupplement, setCustomSupplement] = useState<string>("")
    const [selectedCategory, setSelectedCategory] = useState<string>("")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Custom Supplement</DialogTitle>
                    <DialogDescription>Enter the name of your custom supplement below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <FormLabel htmlFor="custom-supplement">Supplement Name</FormLabel>
                        <Input
                            id="custom-supplement"
                            value={customSupplement}
                            onChange={(e) => setCustomSupplement(e.target.value)}
                            placeholder="e.g., Magnesium L-Threonate"
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <FormLabel htmlFor="supplement-category">Category</FormLabel>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger id="supplement-category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {capitalize(category)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setCustomSupplement("")
                            setSelectedCategory("")
                            onOpenChange(false)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button disabled={!customSupplement.trim() || !selectedCategory}>
                        Add Supplement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SupplementItem({ 
    index, 
    onDelete, 
    supplementList, 
    customSupplements 
}: { 
    index: number; 
    onDelete: () => void; 
    supplementList: {
        foundational: string[];
        athletic: string[];
        cognitive: string[];
        sleep: string[];
        hormone: string[];
    };
    customSupplements: any;
}) {
    const { control } = useFormContext()
    const [itemName, setItemName] = useState("Select Supplement Below")  
    const supplementType = useWatch({ control, name: `supplements.${index}.name` });
    const [dialogOpen, setDialogOpen] = useState<boolean>(false)
    const categories = ["foundational", "athletic", "cognitive", "sleep", "hormone"]

    useEffect(() => { 
        setItemName(supplementType)
    }, [supplementType])   

    return (
        <>
            <Accordion type={"single"} collapsible defaultValue={`item-${index}`} 
                className={`border rounded shadow-lg px-4 py-2 bg-gradient-to-br ${index % 2 != 0 ? "from-green-950/25" : "from-blue-950/25"} to-neutral-950 to-80% mb-6`}>
                <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger className="flex flex-row mb-6">
                    {capitalize(itemName)}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-wrap justify-center md:justify-between items-center">
                    <FormField
                            control={control}
                            name={`supplements.${index}.name`}
                            render={({ field }) => (
                                <FormItem className="flex-row flex items-center w-full">
                                    <FormControl>
                                        <Select 
                                            onValueChange={(value) => {
                                                if (value === "add-custom") {
                                                    setDialogOpen(true)
                                                } else {
                                                    field.onChange(value)
                                                }
                                            }}
                                            value={field.value}
                                        >
                                            <SelectTrigger className="mb-8">{capitalize(field.value)}</SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup className="flex flex-col gap-4">
                                                    {categories.map((category) => (
                                                        <div key={category}>
                                                            <SelectLabel>{capitalize(category)}</SelectLabel>
                                                            {supplementList[category as keyof typeof supplementList].map((supplement: string) => (
                                                                supplement && supplement.trim() !== "" && (
                                                                    <SelectItem 
                                                                        className="font-extralight" 
                                                                        key={supplement} 
                                                                        value={supplement}
                                                                    >
                                                                        {capitalize(supplement)}
                                                                    </SelectItem>
                                                                )
                                                            ))}
                                                        </div>
                                                    ))}
                                                    {/* <SelectItem value="add-custom" className="text-primary font-medium border-t pt-4 border-neutral-600">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Plus className="h-4 w-4" />
                                                            Add custom supplement...
                                                        </div>
                                                    </SelectItem> */}
                                                </SelectGroup>
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

            <AddCustomSupplementDialog 
                open={dialogOpen} 
                onOpenChange={setDialogOpen} 
                categories={categories}
            />
        </>
    )
}