"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui_primitives/button"
import { Input } from "@/components/ui_primitives/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { useMealForm } from "@/context/MealFormContext"
import { useToast } from "@/hooks/use-toast"
import type { FoodItem } from "@/utils/newtypes"
import { Checkbox } from "@/components/ui_primitives/checkbox"
import { updateCustomFoodItems } from "@/actions/AWS"
import { generateApexionID } from "@/lib/utils"
import NumberInput from "../ui/NumberInput"
import { useRouter } from "next/navigation"
import MealSheet from "@/components/nutrition/MealSheet"
import { MobileHeaderContext } from "@/context/MobileHeaderContext"
import { useContext } from "react"
import BackButton from "@/components/global/BackButton"

interface FormData extends FoodItem {
  numberOfServings: number;
}

export default function CustomFoodForm() {

  const { setHeaderComponentRight, setHeaderComponentLeft } = useContext(MobileHeaderContext)
  const router = useRouter()
  const { addMealItem, addToFavorites } = useMealForm()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldSaveToFavorites, setShouldSaveToFavorites] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    numberOfServings: 1,
    apexionid: "",
    fdcid: null,
    variationlabels: null,
    brand: "",
    ingredients: null,
    servinginfo: {
      size: 0,
      unit: "g"
    },
    nutrients: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: {
        total: 0,
        saturated: 0,
        trans: 0
      },
      sugars: 0,
      fiber: 0,
      cholesterol: 0,
      sodium: 0,
      calcium: 0,
      iron: 0,
      potassium: 0
    }
  })

  useEffect(() => {
    setHeaderComponentLeft(<BackButton />)
    setHeaderComponentRight(<MealSheet />)
    return () => {
      setHeaderComponentRight(null)
    }
  }, [setHeaderComponentRight])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const mealItem: FormData = {
        name: formData.name,
        fdcid: null,
        apexionid: generateApexionID(),
        numberOfServings: formData.numberOfServings,
        variationlabels: formData.variationlabels,
        brand: formData.brand,
        ingredients: null,
        servinginfo: {
          size: formData.servinginfo.size,
          unit: formData.servinginfo.unit
        },
        nutrients: {
          calories: formData.nutrients.calories || 0,
          protein: formData.nutrients.protein || 0,
          carbs: formData.nutrients.carbs || 0,
          fats: {
            total: formData.nutrients.fats.total || 0,
            saturated: formData.nutrients.fats.saturated,
            trans: formData.nutrients.fats.trans
          },
          sugars: formData.nutrients.sugars || null,
          fiber: formData.nutrients.fiber || null,
          cholesterol: formData.nutrients.cholesterol || null,
          sodium: formData.nutrients.sodium || null,
          calcium: formData.nutrients.calcium || null,
          iron: formData.nutrients.iron || null,
          potassium: formData.nutrients.potassium || null
        }
      }
      updateCustomFoodItems(mealItem)
      addMealItem(mealItem)
      if (shouldSaveToFavorites) {
        addToFavorites(mealItem)
      }
      setFormData({
        name: "",
        numberOfServings: 1,
        apexionid: "",
        fdcid: null,
        variationlabels: null,
        brand: "",
        ingredients: null,
        servinginfo: {
          size: 0,
          unit: "g"
        },
        nutrients: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: {
            total: 0,
            saturated: 0,
            trans: 0
          },
          sugars: 0,
          fiber: 0,
          cholesterol: 0,
          sodium: 0,
          calcium: 0,
          iron: 0,
          potassium: 0
        }
      })
      router.push("/logmeal")
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
      <h1 className="text-2xl font-bold text-center mb-2">
        Add Custom Food Item
      </h1>
      <p className="text-xs italic text-neutral-400 text-center mb-8">
        Create a new custom food item to be saved to your custom foods database.
      </p>
      <form onSubmit={onSubmit} className="space-y-6 mb-12">
        <div className="space-y-4 mb-12">
          <div className="space-y-2">
            <label className="text-sm font-medium">Food Name</label>
            <Input
              placeholder="ie. Chicken Breast"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <Input
              placeholder="ie. Tyson"
              value={formData.brand || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Variation Labels <span className="text-xs text-neutral-400">(comma separated, optional)</span></label>
            <Input
              placeholder="ie. Boneless, Skinless, Organic"
              value={formData.variationlabels?.join(", ") || ""}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                variationlabels: e.target.value ? e.target.value.split(",").map(label => label.trim()) : null
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Serving Size</label>
              <NumberInput
                placeholder="i.e. 84"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  servinginfo: {
                    ...prev.servinginfo,
                    size: e.target.value ? Number(e.target.value) : 0
                  }
                }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Select
                value={formData.servinginfo.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, servinginfo: { ...prev.servinginfo, unit: value } }))}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Calories</label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, calories: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Protein (g)</label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, protein: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Carbs (g)</label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, carbs: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Total Fat<span className="text-xs text-neutral-400"> (g)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  fats: {
                    ...prev.nutrients.fats,
                    total: e.target.value ? Number(e.target.value) : 0
                  }
                }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Saturated Fat<span className="text-xs text-neutral-400"> (g)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  fats: {
                    ...prev.nutrients.fats,
                    saturated: e.target.value ? Number(e.target.value) : 0
                  }
                }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Trans Fat<span className="text-xs text-neutral-400"> (g)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  fats: {
                    ...prev.nutrients.fats,
                    trans: e.target.value ? Number(e.target.value) : 0
                  }
                }
              }))}
              className="w-24"
            />
          </div>
        </div>

        <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500">Micro Nutrients <span className="text-xs text-neutral-400">(optional)</span></h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Total Sugars<span className="text-xs text-neutral-400"> (g)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, sugars: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Sodium<span className="text-xs text-neutral-400"> (mg)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, sodium: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Calcium<span className="text-xs text-neutral-400"> (mg)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: { ...prev.nutrients, calcium: e.target.value ? Number(e.target.value) : 0 }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Iron<span className="text-xs text-neutral-400"> (mg)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  iron: e.target.value ? Number(e.target.value) : 0
                }
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Potassium<span className="text-xs text-neutral-400"> (mg)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  potassium: e.target.value ? Number(e.target.value) : 0
                }
              }))}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Cholesterol<span className="text-xs text-neutral-400"> (mg)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  cholesterol: e.target.value ? Number(e.target.value) : 0
                }
              }))}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm font-medium">Fiber<span className="text-xs text-neutral-400"> (g)</span></label>
            <NumberInput
              placeholder="i.e. 100"
              onChange={(e) => setFormData(prev => ({
                ...prev,
                nutrients: {
                  ...prev.nutrients,
                  fiber: e.target.value ? Number(e.target.value) : 0
                }
              }))}
              className="w-24"
            />
          </div>
        </div>

      </form>
      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Servings This Meal</label>
        <NumberInput
          placeholder="i.e. 2"
          onChange={(e) => setFormData(prev => ({
            ...prev,
            numberOfServings: e.target.value ? Number(e.target.value) : 0
          }
          ))}
        />
      </div>
      <div className="backdrop-blur-sm bg-black/50 flex flex-col gap-2">
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
        <Button variant="outline" className="w-full border-red-700 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 active:scale-95 transition-transform touch-manipulation">
          <p className="font-medium bg-clip-text text-transparent bg-gradient-to-br from-neutral-400 to-neutral-500 py-2">
            Cancel
          </p>
        </Button>
      </div>
    </div>
  )
} 