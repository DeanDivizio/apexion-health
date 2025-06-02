"use client"
import { Plus, X } from "lucide-react"
import { Button } from "../ui_primitives/button"
import { fromAllCaps } from "@/lib/utils"
import { Input } from "../ui_primitives/input"
import { useMealForm } from "@/context/MealFormContext"
import { useState } from "react"
import { FoodItem } from "@/utils/newtypes"

function RenderMacros({item}: {item: FoodItem}) {
        return (
            <div id="branded-macros" className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-500">Macros</h3>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Calories</p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={item.nutrients.calories} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Protein <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={item.nutrients.protein} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Carbs <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={item.nutrients.carbs} />
                </div>
                <div className="flex items-center justify-start gap-2 mb-4 ml-4">
                    <p>Total Fat <span className="text-xs text-neutral-400">(grams)</span></p>
                    <Input t9 type="number" className="w-20 h-6 bg-neutral-800 border-none rounded" defaultValue={item.nutrients.fats.total} />
                </div>
            </div>
        )
}

function RenderMicros({item}: {item: FoodItem}) {
    const nutrients = item.nutrients;
    const nonZeroMicros = Object.entries(nutrients).filter(([key, value]) => {
        return key !== "calories" && 
               key !== "protein" && 
               key !== "carbs" && 
               key !== "fats" && 
               value !== null &&
               typeof value === "number";
    });
    
    return (
        <div id="micros">
            <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500">Micros</h3>
            <div className="grid grid-cols-2 gap-4">
                {nonZeroMicros.map(([key, value]) => (
                    <div key={key} className="flex flex-col mb-4 ml-4">
                        <div className="flex items-center gap-2">
                            <p className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <Input 
                                type="number"
                                className="w-20 h-6 bg-neutral-800 border-none rounded"
                                defaultValue={value as number}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FoodItemDrawer({item}: {item: FoodItem}) {
    const { addMealItem } = useMealForm()
    const [servings, setServings] = useState<number>(1)
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const handleAddFood = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addMealItem({ ...item, numberOfServings: servings });
        setIsOpen(false)
    };

    return (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 p-0 h-8 w-8 touch-manipulation"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="text-green-400 w-6 h-6" />
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 mt-0">
                    {/* Backdrop */}
                    <div 
                        className="absolute w-screen h-screen inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Modal */}
                    <div className="absolute w-screen h-screen inset-0 flex flex-col bg-gradient-to-br from-teal-950/50 to-indigo-950/40 via-neutral-950/30 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="h-[10vh] mt-6 flex flex-col items-center justify-center px-4">
                            <h2 className="text-2xl font-semibold">Add Food</h2>
                            <p className="text-sm text-neutral-400 italic">{fromAllCaps(item.name)}</p>
                        </div>

                        {/* Content */}
                        <div className="p-4 h-[70vh] overflow-y-auto">
                            <RenderMacros item={item} />
                            <RenderMicros item={item} />
                            <div className="flex flex-col items-center justify-start w-full mt-12 mb-4">
                                <p className="text-xl font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-500">Number of Servings</p>
                                <Input 
                                    type="number" 
                                    min="0" 
                                    step="0.5"
                                    value={servings}
                                    onChange={(e) => setServings(parseFloat(e.target.value))}
                                    className="w-20 h-8 bg-neutral-800 border-none rounded"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="backdrop-blur-sm p-4">
                            <Button 
                                className="w-full mb-4 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700 rounded-xl active:scale-95 transition-transform touch-manipulation"
                                onClick={handleAddFood}
                            >
                                <p className="font-medium bg-clip-text text-transparent bg-gradient-to-br from-green-300 to-blue-500 py-2">
                                    Add Food
                                </p>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full border-red-900 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 active:scale-95 transition-transform touch-manipulation"
                                onClick={() => setIsOpen(false)}
                            >
                                <p className="font-medium text-transparent bg-clip-text bg-gradient-to-br from-neutral-400 to-neutral-500 py-2">
                                    Cancel
                                </p>
                            </Button>
                        </div>

                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 p-0 h-8 w-8 touch-manipulation"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="text-neutral-400 w-6 h-6" />
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}