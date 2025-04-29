import { useMealForm } from "@/context/MealFormContext"
import { Button } from "@/components/ui_primitives/button"
import { useToast } from "@/hooks/use-toast"
import { PlusIcon } from "lucide-react"
import { capitalize } from "@/lib/utils"
interface FavoriteFoodCardProps {
  item: {
    name: string
    servingSize: number
    servingSizeUnit: string
    stats: {
      calories: number
      protein: number
      carbs: number
      fat: number
      micros: Array<{
        id: number
        name: string
        amount: number
        unit: string
        note?: string
      }>
    }
  }
}

export default function FavoriteFoodCard({ item }: FavoriteFoodCardProps) {
  const { addFoodItem } = useMealForm()
  const { toast } = useToast()

  const handleAddToMeal = () => {
    addFoodItem({
      ...item,
      numberOfServings: 1
    })
    toast({
      title: "Food Added",
      description: `${item.name} has been added to your meal`,
      duration: 1500,
    })
  }

  return (
    <div className="w-full p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{item.name}</h3>
            <p className="text-sm text-neutral-400">
              Serving Size: {item.servingSize}{item.servingSizeUnit}
            </p>
          </div>
          <Button 
            onClick={handleAddToMeal}
            className="absolute top-2 right-2"
            variant="ghost"
          >
            <PlusIcon className="w-6 h-6 text-green-400" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Calories</span>
            <span className="text-lg">{item.stats.calories}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Protein</span>
            <span className="text-lg">{item.stats.protein}g</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Carbs</span>
            <span className="text-lg">{item.stats.carbs}g</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-400">Fat</span>
            <span className="text-lg">{item.stats.fat}g</span>
          </div>
        </div>
        {item.stats.micros.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-neutral-400 mb-1">Micro Nutrients</h4>
            <div className="flex flex-wrap gap-2">
              {item.stats.micros.map((micro, index) => (
                <span key={index} className="text-xs bg-neutral-800 px-2 py-1 rounded">
                  {capitalize(micro.name)}: {micro.amount}{micro.unit}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 