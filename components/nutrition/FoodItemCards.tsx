import type { USDABrandedFood, USDAFoundationFood } from "@/utils/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui_primitives/card"
import { findBrandCalories, findFoundationCalories } from "./foodUtils";
import { fromAllCaps } from "@/lib/utils";
import { Skeleton } from "../ui_primitives/skeleton";
import FoodItemDrawer from "./FoodItemDrawer";

export default function FoodItemCard({ item, type }: { item: USDABrandedFood | USDAFoundationFood, type: "branded" | "foundation" }) {
   
   let calories;
   let subTitle;
   let title = fromAllCaps(item.description);

   if (type === "branded") {
    item = item as USDABrandedFood
    calories = findBrandCalories(item)
    subTitle = fromAllCaps(item.brand_owner || "No Brand")
   } else {
    item = item as USDAFoundationFood
    calories = findFoundationCalories(item)
    subTitle = "No Brand, (Foundation Food)"
   }
  
    return (
    <Card className="w-full mb-4 relative">
      <CardHeader>
        <CardTitle className="text-base font-medium w-[90%]">{title}</CardTitle>
        <CardDescription className="text-sm text-neutral-400">{subTitle}</CardDescription>
        <FoodItemDrawer item={item} type={type} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-300">{calories} <span className="text-neutral-500 font-light">calories per serving</span></p>
      </CardContent>
    </Card>
  )
}

export function FoodItemCardSkeleton() {
  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-base font-medium w-[90%]">
          <Skeleton className="w-full h-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-4" />
      </CardContent>
    </Card>
  )
}