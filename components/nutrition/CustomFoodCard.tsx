import { useMealForm } from "@/context/MealFormContext"
import { Button } from "@/components/ui_primitives/button"
import { useToast } from "@/hooks/use-toast"
import { PlusIcon, Trash2 } from "lucide-react"
import { capitalize, generateApexionID } from "@/lib/utils"
import { deleteCustomFoodItem } from "@/actions/AWS"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui_primitives/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui_primitives/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui_primitives/select"
import { useState } from "react"
import type { FoodItem } from "@/utils/newtypes"

interface CustomFoodCardProps extends FoodItem {
  index: number
  onDelete: () => void
}
// Renders food item from user's custom foods. handles adding to meal. handles deleting from
// user's custom foods.
export default function CustomFoodCard({ index, onDelete, ...props }: CustomFoodCardProps) {
  const { addMealItem } = useMealForm()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [servings, setServings] = useState(1)

  const handleAddToMeal = (servingsToAdd: number = servings) => {
    addMealItem({
      name: props.name,
      numberOfServings: servingsToAdd,
      apexionid: props.apexionid,
      fdcid: props.fdcid,
      servinginfo: {
        size: props.servinginfo.size,
        unit: props.servinginfo.unit,
      },
      nutrients: {
        calories: props.nutrients.calories,
        protein: props.nutrients.protein,
        carbs: props.nutrients.carbs,
        fats: {
          total: props.nutrients.fats.total,
          saturated: props.nutrients.fats.saturated,
          trans: props.nutrients.fats.trans,
        },
        sugars: props.nutrients.sugars,
        fiber: props.nutrients.fiber,
        cholesterol: props.nutrients.cholesterol,
        sodium: props.nutrients.sodium,
        calcium: props.nutrients.calcium,
        iron: props.nutrients.iron,
        potassium: props.nutrients.potassium,
      },
      ingredients: props.ingredients,
      variationlabels: props.variationlabels,
      brand: props.brand,
    })
    setServings(1)
    toast({
      title: "Food Added",
      description: `${props.name} has been added to your meal`,
      duration: 1500,
    })
  }

  const handleDelete = async () => {
    try {
      await deleteCustomFoodItem(index)
      onDelete()
      setIsDeleteDialogOpen(false)
      toast({
        title: "Item Deleted",
        description: `${props.name} has been removed from your custom foods`,
        duration: 1500,
      })
    } catch (error) {
      console.error('Error deleting custom food item:', error)
      toast({
        title: "Error",
        description: "Failed to delete custom food item",
        variant: "destructive",
        duration: 1500,
      })
    }
  }

  return (
    <Card className="w-full mb-4 relative rounded-2xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium max-w-72 mb-1">{props.name} <span className="text-xs text-neutral-400">{props.variationlabels && props.variationlabels.length > 0 && <span className="text-xs text-neutral-400">{`( ${props.variationlabels.join(", ")} )`}</span> }</span></CardTitle>
            <CardDescription className="text-sm text-neutral-400">
              {props.brand && <span>{props.brand} <br /></span>}
              Serving Size: {props.servinginfo.size}{props.servinginfo.unit === "pieces" ? props.servinginfo.size > 1 ? " Pieces" : " Piece" : props.servinginfo.unit}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(value) => {
              const servingsValue = parseFloat(value)
              setServings(servingsValue)
              handleAddToMeal(servingsValue)
            }}>
              <SelectTrigger className="outline-none border-none active:scale-95 active:brightness-50 active:rotate-45">
                <PlusIcon className="w-6 h-6 text-green-400" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5).map((value) => (
                  value === 1 ? (
                    <SelectItem key={value} value={value.toString()}>
                      {value} serving
                    </SelectItem>
                  ) : (
                    <SelectItem key={value} value={value.toString()}>
                      {value} servings
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 right-4"
                >
                  <Trash2 className="w-5 h-5 text-red-800/60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[400px] sm:max-w-[425px]">
                <DialogHeader className="mb-4">
                  <DialogTitle className="mb-4">Delete Custom Food</DialogTitle>
                  <DialogDescription>
                    This will remove {props.name} from your custom foods and cannot be undone. Your existing logged meals and your favorite foods will not be affected.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="mb-4" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Calories</span>
            <span className="text-lg">{props.nutrients.calories}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Protein</span>
            <span className="text-lg">{props.nutrients.protein}g</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Carbs</span>
            <span className="text-lg">{props.nutrients.carbs}g</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Fat</span>
            <span className="text-lg">{props.nutrients.fats.total}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 