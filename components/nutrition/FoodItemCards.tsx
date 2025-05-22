'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui_primitives/card"
import { fromAllCaps } from "@/lib/utils";
import { Skeleton } from "../ui_primitives/skeleton";
import FoodItemDrawer from "./FoodItemDrawer";
import { FoodItem } from "@/utils/newtypes";
import { useState } from "react";

export default function FoodItemCard({ item }: { item: FoodItem }) {
   const [calories] = useState(item.nutrients.calories);
   const [subTitle] = useState(item.brand ? item.brand : "");
   const [sideText] = useState(item.variationlabels && item.variationlabels.length > 0 ? item.variationlabels.join(", ") : "");
   const [title] = useState(fromAllCaps(item.name));

    return (
    <Card className="w-full mb-4 relative rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-medium w-[90%]">
          {title}
          {sideText && <span className="text-neutral-400"> • {sideText}</span>}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-400">{subTitle}</CardDescription>
        <FoodItemDrawer item={item} />
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