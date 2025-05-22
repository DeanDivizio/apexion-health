"use client"

import { useState, useEffect, useContext } from "react"
import { MobileHeaderContext } from "@/context/MobileHeaderContext"
import { useIsMobile } from "@/hooks/use-mobile"
import BackButton from "../global/BackButton"
import { getAllDataFromTableByUser, updateMeal } from "@/actions/AWS"
import { capitalize, spellOutDate } from "@/lib/utils"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui_primitives/accordion"
import { Skeleton } from "@/components/ui_primitives/skeleton"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui_primitives/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose, DrawerTrigger } from "@/components/ui_primitives/drawer"
import { Button } from "@/components/ui_primitives/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Input } from "@/components/ui_primitives/input"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ScrollArea, ScrollBar } from "@/components/ui_primitives/scroll-area"

const calculateMacrosFromFoodItems = (meal: any) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    meal.foodItems.forEach((item: any) => {
        if (item.stats) {
            calories += item.stats.calories * item.numberOfServings;
            protein += item.stats.protein * item.numberOfServings;
            carbs += item.stats.carbs * item.numberOfServings;
            fat += item.stats.fat * item.numberOfServings;
        } else {
            calories += item.nutrients.calories * item.numberOfServings;
            protein += item.nutrients.protein * item.numberOfServings;
            carbs += item.nutrients.carbs * item.numberOfServings;
            fat += item.nutrients.fats.total * item.numberOfServings;
        }
    });

    return { calories, protein, carbs, fat };
};

const calculateMacrosFromMealItems = (meal: any) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    meal.mealItems.forEach((item: any) => {
        if (item.stats) {
            calories += item.stats.calories * item.numberOfServings;
            protein += item.stats.protein * item.numberOfServings;
            carbs += item.stats.carbs * item.numberOfServings;
            fat += item.stats.fat * item.numberOfServings;
        } else {
            calories += item.nutrients.calories * item.numberOfServings;
            protein += item.nutrients.protein * item.numberOfServings;
            carbs += item.nutrients.carbs * item.numberOfServings;
            fat += item.nutrients.fats.total * item.numberOfServings;
        }
    });

    return { calories, protein, carbs, fat };
};

const calculateMacrosForMeal = (meal: any) => {
    if (meal.foodItems) {
        return calculateMacrosFromFoodItems(meal);
    } else if (meal.mealItems) {
        return calculateMacrosFromMealItems(meal);
    }
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
};

const getMealItems = (meal: any) => {
    if (meal.foodItems) {
        return meal.foodItems;
    } else if (meal.mealItems) {
        return meal.mealItems;
    }
    return [];
};

const mealItemSchema = z.object({
    name: z.string(),
    numberOfServings: z.number().min(0.25),
    stats: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number()
    }).optional(),
    nutrients: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fats: z.object({
            total: z.number()
        })
    }).optional()
})

const mealSchema = z.object({
    time: z.string(),
    mealItems: z.array(mealItemSchema).optional(),
    foodItems: z.array(mealItemSchema).optional()
})

function EditMeal({ setShouldToast, setShouldToastBad, userRef, mealRef, meals }: { setShouldToast: any, setShouldToastBad: any, userRef: string | null, mealRef: any, meals: any }) {
    const isMobile = useIsMobile()
    const [open, setOpen] = useState(false)
    const form = useForm({
        resolver: zodResolver(mealSchema),
        defaultValues: {
            time: mealRef.time,
            mealItems: mealRef.mealItems?.map((item: any) => ({
                name: item.name,
                numberOfServings: item.numberOfServings,
                stats: item.stats ? {
                    calories: item.stats.calories,
                    protein: item.stats.protein,
                    carbs: item.stats.carbs,
                    fat: item.stats.fat
                } : undefined,
                nutrients: item.nutrients ? {
                    calories: item.nutrients.calories,
                    protein: item.nutrients.protein,
                    carbs: item.nutrients.carbs,
                    fats: {
                        total: item.nutrients.fats.total
                    }
                } : undefined
            })) || [],
            foodItems: mealRef.foodItems?.map((item: any) => ({
                name: item.name,
                numberOfServings: item.numberOfServings,
                stats: item.stats ? {
                    calories: item.stats.calories,
                    protein: item.stats.protein,
                    carbs: item.stats.carbs,
                    fat: item.stats.fat
                } : undefined,
                nutrients: item.nutrients ? {
                    calories: item.nutrients.calories,
                    protein: item.nutrients.protein,
                    carbs: item.nutrients.carbs,
                    fats: {
                        total: item.nutrients.fats.total
                    }
                } : undefined
            })) || []
        }
    })

    const { fields: mealItemFields, append: appendMealItem, remove: removeMealItem } = useFieldArray({
        control: form.control,
        name: "mealItems"
    })

    const { fields: foodItemFields, append: appendFoodItem, remove: removeFoodItem } = useFieldArray({
        control: form.control,
        name: "foodItems"
    })

    const onSubmit = async (data: any) => {
        let date = meals.find((meal: any) => meal.date === mealRef.date)
        let index = date.data.findIndex((meal: any) => meal.time === mealRef.time)
        date.data[index] = data
        let newData = date.data;
        try {
            let res = await updateMeal(mealRef.date, newData)
            if (res.$metadata.httpStatusCode === 200) {
                setShouldToast(true);
                setOpen(false)
            }
        } catch (error) {
            console.error(error)
            setShouldToastBad(true);
        }
    }

    const addMealItem = () => {
        appendMealItem({
            name: "",
            numberOfServings: 1,
            stats: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            }
        })
    }

    const addFoodItem = () => {
        appendFoodItem({
            name: "",
            numberOfServings: 1,
            nutrients: {
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: {
                    total: 0
                }
            }
        })
    }

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Pencil className="w-4 h-4" />
                </DrawerTrigger>
                <DrawerContent className="bg-neutral-950">
                    <DrawerHeader>
                        <DrawerTitle className="text-white">Edit Meal: <span className="text-neutral-200 font-light italic pl-2">{mealRef.time}</span></DrawerTitle>
                    </DrawerHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-neutral-950">
                            <div className="flex flex-row gap-4 items-center justify-center mb-4 px-2">
                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <ScrollArea className="w-full h-[600px] px-4 pt-2 pb-16">
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium">Meal Items</h3>
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                className="p-[1px] rounded bg-gradient-to-br from-blue-600 to-blue-950 text-white" 
                                                onClick={addMealItem}
                                            >
                                                <div className="w-full h-full rounded px-12 py-2 flex flex-row items-center justify-center bg-neutral-950">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Item
                                                </div>
                                            </Button>
                                        </div>
                                        {mealItemFields.map((field, index) => (
                                            <div key={field.id} className="mb-4 p-4 rounded bg-neutral-900">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMealItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.numberOfServings`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Servings</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        step="0.25"
                                                                        min="0.25"
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.calories`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Calories</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.calories`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.protein`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Protein (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.protein`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.carbs`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Carbs (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.carbs`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.fat`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Fat (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.fats.total`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium">Food Items</h3>
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                className="p-[1px] rounded bg-gradient-to-br from-blue-600 to-blue-950 text-white" 
                                                onClick={addFoodItem}
                                            >
                                                <div className="w-full h-full rounded px-12 py-2 flex flex-row items-center justify-center bg-neutral-950">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Item
                                                </div>
                                            </Button>
                                        </div>
                                        {foodItemFields.map((field, index) => (
                                            <div key={field.id} className="mb-4 p-4 rounded bg-neutral-900">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFoodItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.numberOfServings`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Servings</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        step="0.25"
                                                                        min="0.25"
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.calories`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Calories</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.calories`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.protein`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Protein (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.protein`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.carbs`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Carbs (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.carbs`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.fats.total`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Fat (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.fat`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <ScrollBar />
                            </ScrollArea>
                            <DrawerFooter className="absolute bottom-0 left-0 right-0 pb-8 flex flex-row gap-2 bg-black/80 backdrop-blur-sm">
                                <DrawerClose asChild>
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 rounded border-red-900"
                                    >
                                        Cancel
                                    </Button>
                                </DrawerClose>
                                <Button 
                                    type="submit" 
                                    className="p-[1px] rounded bg-gradient-to-br from-green-500 to-blue-900 text-white"
                                    onClick={form.handleSubmit(onSubmit)}
                                >
                                    <div className="w-full h-full rounded px-12 py-2 flex flex-row items-center justify-center bg-neutral-950">Save Changes</div>
                                </Button> 
                            </DrawerFooter>
                        </form>
                    </Form>
                </DrawerContent>
            </Drawer>
        )
    } else {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Pencil className="w-4 h-4" />
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Meal: {mealRef.time}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <ScrollArea className="w-full h-[500px]">
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium">Meal Items</h3>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={addMealItem}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>
                                        {mealItemFields.map((field, index) => (
                                            <div key={field.id} className="mb-4 p-4 rounded bg-neutral-900">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeMealItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.numberOfServings`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Servings</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        step="0.25"
                                                                        min="0.25"
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.calories`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Calories</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.calories`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.protein`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Protein (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.protein`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.carbs`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Carbs (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.carbs`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`mealItems.${index}.stats.fat`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Fat (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`mealItems.${index}.nutrients.fats.total`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-medium">Food Items</h3>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                onClick={addFoodItem}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </div>
                                        {foodItemFields.map((field, index) => (
                                            <div key={field.id} className="mb-4 p-4 rounded bg-neutral-900">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFoodItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.numberOfServings`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Servings</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        step="0.25"
                                                                        min="0.25"
                                                                        {...field} 
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.calories`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Calories</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.calories`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.protein`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Protein (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.protein`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.carbs`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Carbs (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.carbs`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`foodItems.${index}.nutrients.fats.total`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Fat (g)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="number" 
                                                                        {...field} 
                                                                        value={field.value || form.getValues(`foodItems.${index}.stats.fat`) || 0}
                                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <ScrollBar />
                            </ScrollArea>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        )
    }
}

export default function MealsList() {
    const { setMobileHeading, setHeaderComponentRight, setHeaderComponentLeft } = useContext(MobileHeaderContext)
    const [isLoading, setIsLoading] = useState(true)
    const [meals, setMeals] = useState<any[]>([])
    const [userRef, setUserRef] = useState<string | null>(null)
    const [shouldToast, setShouldToast] = useState(false)
    const [shouldToastBad, setShouldToastBad] = useState(false)
    const { toast } = useToast()
    const isMobile = useIsMobile()

    useEffect(() => {
        setMobileHeading("Your Meals")
        setHeaderComponentRight(null)
        setHeaderComponentLeft(<BackButton />)
        return () => {
            setMobileHeading("generic")
            setHeaderComponentRight(null)
            setHeaderComponentLeft(null)
        }
    }, [setMobileHeading, setHeaderComponentRight, setHeaderComponentLeft])

    useEffect(() => {
        const fetchMeals = async () => {
            if (meals.length === 0) {
                const response = await getAllDataFromTableByUser("Apexion-Nutrition")
                setMeals(response.reverse())
            } else {
                setIsLoading(false)
                setUserRef(meals[0].userID)
            }
        }
        fetchMeals()
    }, [meals])

    useEffect(() => {
        if (shouldToast) {
            toast({
                title: "Meal updated",
                description: "Your meal has been updated successfully",
                duration: 1500,
            })
            setShouldToast(false)
        }
        if (shouldToastBad) {
            toast({
                title: "Error updating meal",
                description: "Your meal could not be updated",
                variant: "destructive",
                duration: 2000,
            })
            setShouldToastBad(false)
        }
    }, [shouldToast, shouldToastBad])

    if (isLoading) {
        return (
            <main className="w-full min-h-screen pt-24 px-4">
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded mb-4" />
                <Skeleton className="w-full h-[75px] rounded" />
            </main>
        )
    }

    return (
        <main className="w-full min-h-screen pt-24 pb-16 bg-gradient-to-br from-indigo-950/15 to-neutral-950">
            <div className="w-full flex flex-col items-center justify-center">
                <Accordion type="single" collapsible defaultValue={meals[0].date}>
                    {meals.map((date, index) => (
                        <AccordionItem key={index} value={date.date}
                            className={`min-w-[350px] w-96 max-w-[400px] flex flex-col items-start justify-center mb-8 px-4 rounded
                    ${index % 2 === 0 ? "bg-gradient-to-br from-green-950/20 to-neutral-950" : "bg-gradient-to-br from-blue-950/20 to-neutral-950"}`}>
                            <div key={date.date} className="w-full flex flex-col items-between justify-center">
                                <AccordionTrigger className="w-full flex flex-row items-center justify-between">
                                    <h2 className="text-lg font-bold ">{spellOutDate(date.date)}</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {date.data.map((meal: any) => {
                                        const mealMacros = calculateMacrosForMeal(meal);
                                        const mealItems = getMealItems(meal);
                                        return (
                                            <div key={meal.time}>
                                                <div className="w-full flex flex-row items-center justify-between">
                                                    <h3 className="text-xs font-thin italic mb-2">{meal.time}</h3>
                                                    <EditMeal 
                                                        setShouldToast={setShouldToast} 
                                                        setShouldToastBad={setShouldToastBad} 
                                                        userRef={userRef} 
                                                        mealRef={{ ...meal, date: date.date }} 
                                                        meals={meals}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {mealItems.map((item: any) => {
                                                        const itemMacros = item.stats ? {
                                                            calories: item.stats.calories * item.numberOfServings,
                                                            protein: item.stats.protein * item.numberOfServings,
                                                            carbs: item.stats.carbs * item.numberOfServings,
                                                            fat: item.stats.fat * item.numberOfServings
                                                        } : {
                                                            calories: item.nutrients.calories * item.numberOfServings,
                                                            protein: item.nutrients.protein * item.numberOfServings,
                                                            carbs: item.nutrients.carbs * item.numberOfServings,
                                                            fat: item.nutrients.fats.total * item.numberOfServings
                                                        };
                                                        return (
                                                            <div key={item.name} className="mb-4">
                                                                <h4 className="text-md font-medium">{capitalize(item.name)}</h4>
                                                                <div className="flex flex-row items-center justify-start gap-1 pl-4 py-1 text-sm">
                                                                    <p className="font-medium">{item.numberOfServings || 1} <span className="text-neutral-200 font-thin">serving{item.numberOfServings > 1 ? 's' : ''}</span></p>
                                                                    <p className="text-neutral-400 text-xs">@</p>
                                                                    <p className="font-medium">{Math.round(item.stats ? item.stats.calories : item.nutrients.calories)}<span className="text-neutral-300 font-thin">cal</span></p>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2 pl-4 py-1 text-xs">
                                                                    <p>P: {Math.round(itemMacros.protein)}g</p>
                                                                    <p>C: {Math.round(itemMacros.carbs)}g</p>
                                                                    <p>F: {Math.round(itemMacros.fat)}g</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-4 pt-2 border-t border-neutral-800">
                                                    <div className="flex justify-between items-center px-4">
                                                        <span className="text-sm font-medium">Total:</span>
                                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                                            <span>{Math.round(mealMacros.calories)} cal</span>
                                                            <span>{Math.round(mealMacros.protein)}g P</span>
                                                            <span>{Math.round(mealMacros.carbs)}g C</span>
                                                            <span>{Math.round(mealMacros.fat)}g F</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </AccordionContent>
                            </div>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </main>
    )
}