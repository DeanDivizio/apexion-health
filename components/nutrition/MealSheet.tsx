"use client"
import { useMealForm } from "@/context/MealFormContext"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui_primitives/sheet"
import { Apple, ChevronLeft, Plus, Trash, Trash2 } from "lucide-react"
import { Button } from "../ui_primitives/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui_primitives/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui_primitives/accordion"
import { Input } from "../ui_primitives/input"
import { Label } from "../ui_primitives/label"
import { roundToNearestTenth, roundToNearestWhole } from "@/lib/utils"

export default function MealSheet() {
    const { 
        mealItems, 
        removeMealItem, 
        mealFormData, 
        setMealFormData,
        submitMeal,
        sheetOpen,
        setSheetOpen,
        updateFoodItemServings
    } = useMealForm()

    const totalMacros = mealItems.reduce((acc, item) => ({
        calories: acc.calories + (item.nutrients.calories * (item.numberOfServings || 1)),
        protein: acc.protein + (item.nutrients.protein * (item.numberOfServings || 1)),
        carbs: acc.carbs + (item.nutrients.carbs * (item.numberOfServings || 1)),
        fat: acc.fat + (item.nutrients.fats.total * (item.numberOfServings || 1))
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="px-4 rounded bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 active:scale-95 transition-transform touch-manipulation">
                    <Apple className="w-4 h-4 text-green-400" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[90vw] bg-gradient-to-br from-neutral-950 to-neutral-900">
                <SheetHeader>
                    <SheetTitle>Meal</SheetTitle>
                </SheetHeader>
                <Accordion type="single" collapsible>
                    <AccordionItem value="dateTime" className="mb-6">
                        <AccordionTrigger className="flex items-end justify-center gap-4"><p className="text-sm font-thin italic text-center">{`Date, Time, & Label`}</p></AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-col md:flex-row mt-8 gap-6 items-center justify-center">
                                <div className="flex gap-2 items-center justify-between">
                                    <p>Date:</p>
                                    <div className="flex space-x-3">
                                        <Select 
                                            value={mealFormData.month} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, month: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                                    <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                                        {month.toString().padStart(2, '0')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={mealFormData.day} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, day: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                    <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                                                        {day.toString().padStart(2, '0')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={mealFormData.year} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, year: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center justify-between">
                                    <p>Time:</p>
                                    <div className="flex space-x-3">
                                        <Select 
                                            value={mealFormData.hour} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, hour: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Hour" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                                    <SelectItem key={hour} value={hour.toString()}>
                                                        {hour}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={mealFormData.minute} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, minute: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Minute" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                                    <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                                                        {minute.toString().padStart(2, '0')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select 
                                            value={mealFormData.ampm} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, ampm: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="AM/PM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AM">AM</SelectItem>
                                                <SelectItem value="PM">PM</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center justify-between">
                                    <p>{`Meal (optional)`}</p>
                                    <div className="flex space-x-3">
                                        <Select 
                                            value={mealFormData.mealLabel} 
                                            onValueChange={(value) => setMealFormData({...mealFormData, mealLabel: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Breakfast">Breakfast</SelectItem>
                                                <SelectItem value="Lunch">Lunch</SelectItem>
                                                <SelectItem value="Dinner">Dinner</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="flex flex-col gap-4 h-[85vh] pb-40 overflow-y-scroll">
                    {mealItems.map((item) => (
                        <Card key={`${item.name}-${item.variationlabels}-${item.numberOfServings}`} className="relative mb-4">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">{item.name}</CardTitle>
                                <CardDescription className="text-sm font-thin italic">
                                    {item.servinginfo.size && item.servinginfo.unit ? 
                                        `Serving Size: ${item.servinginfo.size}${item.servinginfo.unit === "pieces" ? item.servinginfo.size > 1 ? " Pieces" : " Piece" : item.servinginfo.unit}` :
                                        `${item.numberOfServings || 1} ${(item.numberOfServings || 1) > 1 ? "servings" : "serving"}`
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 items-center gap-4 mb-4">
                                    <Label htmlFor={`servings-${item.name}`} className="text-right">
                                        Servings
                                    </Label>
                                    <Input
                                        id={`servings-${item.name}`}
                                        type="number"
                                        min="0.25"
                                        step="0.25"
                                        value={item.numberOfServings}
                                        onChange={(e) => updateFoodItemServings(item.name, parseFloat(e.target.value))}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-sm text-neutral-400">Calories</span>
                                        <span className="text-lg">{Math.round(item.nutrients.calories * (item.numberOfServings || 1))}</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-sm text-neutral-400">Protein</span>
                                        <span className="text-lg">{Math.round(item.nutrients.protein * (item.numberOfServings || 1))}g</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-sm text-neutral-400">Carbs</span>
                                        <span className="text-lg">{Math.round(item.nutrients.carbs * (item.numberOfServings || 1))}g</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-sm text-neutral-400">Fat</span>
                                        <span className="text-lg">{Math.round(item.nutrients.fats.total * (item.numberOfServings || 1))}g</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute bottom-2 right-2"
                                    onClick={() => removeMealItem(item.name)}
                                >
                                    <Trash2 className="w-5 h-5 text-red-900" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {mealItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Apple className="w-10 h-10 text-neutral-400 mb-4" />
                            <p className="text-sm font-thin italic text-center">No food items added</p>
                        </div>
                    )}
                </div>
                <SheetFooter className="absolute w-full bottom-0 left-0 px-4 py-4 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xl">
                    <Card className="w-full py-0 mb-4 bg-gradient-to-br from-indigo-900/20 via-neutral-950 to-teal-950/30 border border-neutral-800">
                        {/* <CardHeader className="py-2">
                            <CardTitle className="text-base font-medium text-center">Total Macros</CardTitle>
                        </CardHeader> */}
                        <CardContent className="grid grid-cols-4 gap-4 py-2">
                            <div className="flex flex-col items-center">
                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-600">{roundToNearestWhole(totalMacros.calories)}</p>
                                <p className="text-xs text-neutral-400">calories</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-600">{roundToNearestWhole(totalMacros.protein)}g</p>
                                <p className="text-xs text-neutral-400">protein</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-200 to-purple-600">{roundToNearestWhole(totalMacros.carbs)}g</p>
                                <p className="text-xs text-neutral-400">carbs</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-orange-200 to-orange-600">{roundToNearestWhole(totalMacros.fat)}g</p>
                                <p className="text-xs text-neutral-400">fat</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Button 
                        className="mb-4 w-full bg-gradient-to-br from-green-600 to-blue-600 border border-neutral-700 rounded-xl shadow-lg shadow-neutral-600/40" 
                        onClick={submitMeal}
                        disabled={mealItems.length === 0}
                    >
                        <p className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 to-neutral-100 ">Log Meal</p>
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}