"use client"
import { Plus, Info } from "lucide-react"
import { Button } from "../ui_primitives/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui_primitives/drawer"
import { USDABrandedFood, USDAFoundationFood } from "@/utils/types"
import { fromAllCaps } from "@/lib/utils"
import { findFoundationMacros, findMicros } from "./foodUtils"
import { Input } from "../ui_primitives/input"
import { useMealForm } from "@/context/MealFormContext"
import { useState } from "react"

function RenderMacros({item, type}: {item: USDABrandedFood | USDAFoundationFood, type: string}) {
    if (type === "branded") {
        const food = item as USDABrandedFood;
        return (
            <div id="branded-macros" className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-500">Macros</h3>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Calories</p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={food.label_nutrients?.calories?.value || 0} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Protein <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={food.label_nutrients?.protein?.value || 0} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Carbs <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={food.label_nutrients?.carbohydrates?.value || 0} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Fat <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={food.label_nutrients?.fat?.value || 0} />
                </div>
            </div>
        )
    } else {
        const food = item as USDAFoundationFood;
        const macros = findFoundationMacros(food)
        return (
            <div id="foundation-macros" className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-500">Macros</h3>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4"><p>Calories</p> <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={macros.calories || 0} /></div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4"><p>Protein <span className="text-xs text-neutral-400">(grams)</span></p> <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={macros.protein || 0} /></div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4"><p>Carbs <span className="text-xs text-neutral-400">(grams)</span></p> <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={macros.carbs || 0} /></div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4"><p>Fat <span className="text-xs text-neutral-400">(grams)</span></p> <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={macros.fat || 0} /></div>
            </div>
        )
    }
}

function RenderMicros({item, type}: {item: USDABrandedFood | USDAFoundationFood, type: string}) {
    const micros = findMicros(item, type)
    const nonZeroMicros = Object.entries(micros).filter(([_, value]) => value.amount > 0)
    
    return (
        <div id="micros">
            <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500">Micros</h3>
            <div className="">
                {nonZeroMicros.map(([key, value]) => (
                    <div key={key} className="flex flex-col mb-4 ml-4">
                        <div className="flex items-center gap-2">
                            <p className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()} 
                                <span className="text-xs text-neutral-400 ml-1">({value.unit})</span>
                            </p>
                            <Input 
                                type="number" 
                                className="w-20 h-6 bg-neutral-800 border-none rounded" 
                                defaultValue={value.amount} 
                            />
                        </div>
                        {'note' in value && value.note && (
                            <p className="text-xs font-light italic text-neutral-400 mt-1">{value.note}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function FoodItemDrawer({item, type}: {item: USDABrandedFood | USDAFoundationFood, type: string}) {
    const { addFoodItem } = useMealForm()
    const [servings, setServings] = useState<number>(1)
    const [open, setOpen] = useState(false)

    const transformFoodItem = (item: USDABrandedFood | USDAFoundationFood, type: string) => {
        let macros;
        if (type === "branded") {
            const food = item as USDABrandedFood;
            macros = {
                calories: food.label_nutrients.calories.value,
                protein: food.label_nutrients.protein.value,
                carbs: food.label_nutrients.carbohydrates.value,
                fat: food.label_nutrients.fat.value
            };
        } else {
            const food = item as USDAFoundationFood;
            const baseMacros = findFoundationMacros(food);
            macros = {
                calories: baseMacros.calories,
                protein: baseMacros.protein,
                carbs: baseMacros.carbs,
                fat: baseMacros.fat
            };
        }

        const micros = findMicros(item, type);
        const microsArray = Object.entries(micros).map(([name, value]) => ({
            id: value.id,
            name: name,
            amount: value.amount,
            unit: value.unit,
            // @ts-ignore
            note: value.note || ''
        }));

        return {
            name: fromAllCaps(item.description),
            numberOfServings: servings,
            servingSize: type === "branded" ? parseFloat((item as USDABrandedFood).serving_size) : 100,
            servingSizeUnit: type === "branded" ? (item as USDABrandedFood).serving_size_unit : "g",
            stats: {
                ...macros,
                micros: microsArray
            }
        };
    };

    const handleAddFood = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const transformedItem = transformFoodItem(item, type);
        addFoodItem(transformedItem);
        setOpen(false);
    };

    return (
        <div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 p-0 h-8 w-8 touch-manipulation"
                onClick={() => setOpen(true)}
            >
                <Plus className="text-green-400 w-6 h-6" />
            </Button>
            {open && (
                <div className="fixed inset-0 z-50 h-full">
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-br from-teal-950/50 to-indigo-950/40 via-neutral-950/30 backdrop-blur-xl rounded-t-[10px] overflow-hidden">
                        <div className="h-[10vh] mt-6 flex flex-col items-center justify-center px-4">
                            <h3 className="text-lg font-semibold">Add Food</h3>
                            <p className="text-sm text-muted-foreground italic">{fromAllCaps(item.description)}</p>
                        </div>
                        <div className="p-4 h-[70vh] overflow-y-auto">
                            <RenderMacros item={item} type={type} />
                            <RenderMicros item={item} type={type} />
                            <div className="flex flex-col items-center justify-start w-full mt-12 mb-4">
                                <p className="text-xl font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-500">Number of Servings</p>
                                <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.5"
                                    value={servings}
                                    onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                                    className="w-20 h-8 bg-neutral-800 border-none rounded"
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-[16vh] backdrop-blur-sm bg-black/50 flex flex-col gap-2 p-4">
                            <Button 
                                className="w-full mb-1 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700 rounded-xl active:scale-95 transition-transform touch-manipulation"
                                onClick={handleAddFood}
                            >
                                <p className="font-medium bg-clip-text text-transparent bg-gradient-to-br from-green-300 to-blue-500 py-2">
                                    Add Food
                                </p>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full border-red-900 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 active:scale-95 transition-transform touch-manipulation"
                                onClick={() => setOpen(false)}
                            >
                                <p className="font-medium text-transparent bg-clip-text bg-gradient-to-br from-neutral-400 to-neutral-500 py-2">
                                    Cancel
                                </p>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}