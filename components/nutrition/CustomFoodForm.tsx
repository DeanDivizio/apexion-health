"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui_primitives/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui_primitives/form"
import { Input } from "@/components/ui_primitives/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { useMealForm } from "@/context/MealFormContext"
import { useToast } from "@/hooks/use-toast"
import type { FoodItem } from "@/context/MealFormContext"
import { Checkbox } from "@/components/ui_primitives/checkbox"
import { updateCustomFoodItems } from "@/actions/AWS"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui_primitives/drawer"
import { Plus } from "lucide-react"

const MICRO_NUTRIENTS = [
  { id: 1063, name: "totalSugars", unit: "g" },
  { id: 1092, name: "potassium", unit: "mg" },
  { id: 1087, name: "calcium", unit: "mg" },
  { id: 1089, name: "iron", unit: "mg" },
  { id: 1093, name: "sodium", unit: "mg" },
  { id: 1079, name: "fiber", unit: "g" },
  { id: 1006, name: "vitaminA", unit: "IU", note: "This is bioavailable vitamin A" },
  { id: 1007, name: "vitaminC", unit: "mg" },
  { id: 1110, name: "vitaminD", unit: "IU", note: "This is total vitamin D. D2 and D3" },
  { id: 1253, name: "cholesterol", unit: "mg" }
]

export default function CustomFoodForm() {
  const { addFoodItem, addToFavorites } = useMealForm()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMicro, setSelectedMicro] = useState<string>("")
  const [microAmount, setMicroAmount] = useState<string>("")
  const [isAddingMicro, setIsAddingMicro] = useState(false)
  const [shouldSaveToFavorites, setShouldSaveToFavorites] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    numberOfServings: 1,
    servingSize: 100,
    servingSizeUnit: "g",
    stats: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      micros: [] as Array<{
        id: number
        name: string
        amount: number
        unit: string
        note?: string
      }>
    }
  })

  const addMicro = () => {
    if (!selectedMicro || !microAmount) return

    const micro = MICRO_NUTRIENTS.find(m => m.name === selectedMicro)
    if (!micro) return

    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        micros: [
          ...prev.stats.micros,
          {
            id: micro.id,
            name: micro.name,
            amount: parseFloat(microAmount),
            unit: micro.unit,
            note: micro.note
          }
        ]
      }
    }))

    setSelectedMicro("")
    setMicroAmount("")
    setIsAddingMicro(false)
  }

  const removeMicro = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        micros: prev.stats.micros.filter((_, i) => i !== index)
      }
    }))
  }

  const cancelAddMicro = () => {
    setSelectedMicro("")
    setMicroAmount("")
    setIsAddingMicro(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const foodItem: FoodItem = {
        name: formData.name,
        numberOfServings: formData.numberOfServings,
        servingSize: formData.servingSize,
        servingSizeUnit: formData.servingSizeUnit,
        stats: {
          calories: formData.stats.calories,
          protein: formData.stats.protein,
          carbs: formData.stats.carbs,
          fat: formData.stats.fat,
          micros: formData.stats.micros
        }
      }
      updateCustomFoodItems(foodItem)
      addFoodItem(foodItem)
      if (shouldSaveToFavorites) {
        addToFavorites(foodItem)
      }
      setFormData({
        name: "",
        numberOfServings: 1,
        servingSize: 100,
        servingSizeUnit: "g",
        stats: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          micros: []
        }
      })
      toast({
        title: "Success",
        description: shouldSaveToFavorites 
          ? "Custom food item added to meal and saved to favorites" 
          : "Custom food item added to meal",
        duration: 2000,
      })
    } catch (error) {
      console.error('Error adding custom food:', error)
      toast({
        title: "Error",
        description: "Failed to add custom food item",
        variant: "destructive",
        duration: 2000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full p-4">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full h-12 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-800"
          >
            <Plus className="text-green-400 w-6 h-6" />
            <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-500">Add Custom Food Item</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-gradient-to-br from-teal-950/50 to-indigo-950/40 via-neutral-950/30 backdrop-blur-xl">
          <DrawerHeader className="h-[10vh] mt-6 flex flex-col items-center justify-center px-4">
            <DrawerTitle>Add Custom Food Item</DrawerTitle>
            <DrawerDescription>Create a new custom food item with your desired nutritional values</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 h-[70vh] overflow-y-auto">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Food Name</label>
                  <Input 
                    placeholder="Enter food name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Servings</label>
                  <Input 
                    type="number" 
                    min="0.1"
                    step="0.1"
                    value={formData.numberOfServings}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfServings: Number(e.target.value) }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serving Size</label>
                    <Input 
                      type="number" 
                      min="0.1"
                      step="0.1"
                      value={formData.servingSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, servingSize: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Select 
                      value={formData.servingSizeUnit}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, servingSizeUnit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveToFavorites"
                    checked={shouldSaveToFavorites}
                    onCheckedChange={(checked) => setShouldSaveToFavorites(checked as boolean)}
                  />
                  <label
                    htmlFor="saveToFavorites"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Save to favorites
                  </label>
                  <p className="text-sm text-neutral-400">
                    Save this item for quick access later
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-b from-green-200 to-green-500">Macro Nutrients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium">Calories</label>
                  <Input 
                    type="number" 
                    min="0"
                    className="w-32"
                    value={formData.stats.calories}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, calories: Number(e.target.value) } 
                    }))}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium">Protein (g)</label>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-32"
                    value={formData.stats.protein}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, protein: Number(e.target.value) } 
                    }))}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium">Carbs (g)</label>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-32"
                    value={formData.stats.carbs}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, carbs: Number(e.target.value) } 
                    }))}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-sm font-medium">Fat (g)</label>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-32"
                    value={formData.stats.fat}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, fat: Number(e.target.value) } 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500">Micro Nutrients</h3>
                  <span className="text-sm text-neutral-400">(Optional)</span>
                </div>
                {!isAddingMicro ? (
                  <Button type="button" variant="outline" onClick={() => setIsAddingMicro(true)} className="w-full">
                    Add Nutrient
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={selectedMicro} onValueChange={setSelectedMicro}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select nutrient" />
                        </SelectTrigger>
                        <SelectContent>
                          {MICRO_NUTRIENTS.map((nutrient) => (
                            <SelectItem key={nutrient.id} value={nutrient.name}>
                              {nutrient.name.replace(/([A-Z])/g, ' $1').trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={microAmount}
                        onChange={(e) => setMicroAmount(e.target.value)}
                        className="w-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={addMicro} className="flex-1">
                        Add
                      </Button>
                      <Button type="button" onClick={cancelAddMicro} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {formData.stats.micros.map((micro, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm">
                        {micro.name.replace(/([A-Z])/g, ' $1').trim()}: {micro.amount} {micro.unit}
                        {micro.note && <span className="text-xs text-neutral-400 ml-1">({micro.note})</span>}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMicro(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
          <DrawerFooter className="backdrop-blur-sm bg-black/50">
            <Button 
              type="submit"
              className="w-full mb-1 bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700 rounded-xl active:scale-95 transition-transform touch-manipulation"
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              <p className="font-medium bg-clip-text text-transparent bg-gradient-to-br from-green-300 to-blue-500 py-2">
                {isSubmitting ? "Adding..." : "Add to Meal"}
              </p>
            </Button>
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                className="w-full border-red-900 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 active:scale-95 transition-transform touch-manipulation"
              >
                <p className="font-medium text-transparent bg-clip-text bg-gradient-to-br from-neutral-400 to-neutral-500 py-2">
                  Cancel
                </p>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
} 