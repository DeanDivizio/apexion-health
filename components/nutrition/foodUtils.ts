import { roundToNearestWhole } from "@/lib/utils";
import { USDABrandedFood, USDAFoundationFood } from "@/utils/types";

export function formatUnit(unit: string): string {
    const unitMap: { [key: string]: string } = {
        'GRM': 'g',
        'ML': 'ml',
        'OZ': 'oz',
        'CUP': 'cup',
        'TSP': 'tsp',
        'TBS': 'tbsp',
        'PKG': 'package',
        'PC': 'piece',
        'SL': 'slice',
        'CN': 'can',
        'kcal': '',
    };
    return unitMap[unit] || unit.toLowerCase();
}

export const findFoundationCalories = (item: USDAFoundationFood) => {
    return roundToNearestWhole(item.nutrients.find((nutrient) => nutrient.id === 1008)?.amount || 
           item.nutrients.find((nutrient) => nutrient.id === 2047)?.amount ||
           item.nutrients.find((nutrient) => nutrient.id === 2048)?.amount || 0)
}

export const findBrandCalories = (item: USDABrandedFood) => {
    if (item.label_nutrients?.calories?.value) {
        return roundToNearestWhole(item.label_nutrients.calories.value)
    } else {
        return roundToNearestWhole(item.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1008)?.amount || 
           item.food_nutrients.find((nutrient) => nutrient.nutrient.id === 2047)?.amount ||
           item.food_nutrients.find((nutrient) => nutrient.nutrient.id === 2048)?.amount || 0)
    }
}

export const findFoundationMacros = (item: USDAFoundationFood) => {
    return {
        calories: roundToNearestWhole(
            item.nutrients.find((nutrient) => nutrient.id === 1008)?.amount || 
            item.nutrients.find((nutrient) => nutrient.id === 2047)?.amount ||
            item.nutrients.find((nutrient) => nutrient.id === 2048)?.amount || 0),
        protein: roundToNearestWhole(
            item.nutrients.find((nutrient) => nutrient.id === 1003)?.amount || 0),
        carbs: roundToNearestWhole(
            item.nutrients.find((nutrient) => nutrient.id === 1050)?.amount || 
            item.nutrients.find((nutrient) => nutrient.id === 1005)?.amount || 0),
        fat: roundToNearestWhole(
            item.nutrients.find((nutrient) => nutrient.id === 1004)?.amount || 0),
    }
}

export const findMicros = (item: USDAFoundationFood | USDABrandedFood, type: string) => {
    if (type === "branded") {
        const food = item as USDABrandedFood;
        return {
            totalSugars: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1063)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1063)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1063)?.nutrient.id || 0,
            },
            potassium: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1092)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1092)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1092)?.nutrient.id,
            },
            calcium: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1087)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1087)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1087)?.nutrient.id,
            },
            iron: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1089)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1089)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1089)?.nutrient.id,
            },
            sodium: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1093)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1093)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1093)?.nutrient.id,
            },
            fiber: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1079)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1079)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1079)?.nutrient.id,
            },
            vitaminA: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1006)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1006)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1006)?.nutrient.id,
                note: "This is bioavailable vitamin A",
            },
            vitaminC: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1007)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1007)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1007)?.nutrient.id,
            },
            vitaminD: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1110)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1110)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1110)?.nutrient.id,
                note: "This is total vitamin D. D2 and D3",
            },
            cholesterol: {
                amount: roundToNearestWhole(
                    food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1253)?.amount || 0),
                unit: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1253)?.nutrient.unitName || '',
                id: food.food_nutrients.find((nutrient) => nutrient.nutrient.id === 1253)?.nutrient.id,
            }
        }
    } else {
        const food = item as USDAFoundationFood;
        return {
            totalSugars: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1063)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1063)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1063)?.id,
            },
            potassium: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1092)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1092)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1092)?.id,
            },
            calcium: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1087)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1087)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1087)?.id,
            },
            iron: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1089)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1089)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1089)?.id,
            },
            sodium: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1093)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1093)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1093)?.id,
            },
            fiber: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1079)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1079)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1079)?.id,
            },
            vitaminA: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1006)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1006)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1006)?.id,
                note: "This is bioavailable vitamin A",
            },
            vitaminC: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1007)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1007)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1007)?.id,
            },
            vitaminD: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1110)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1110)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1110)?.id,
                note: "This is total vitamin D. D2 and D3",
            },
            cholesterol: {
                amount: roundToNearestWhole(
                    food.nutrients.find((nutrient) => nutrient.id === 1253)?.amount || 0),
                unit: food.nutrients.find((nutrient) => nutrient.id === 1253)?.unitName || '',
                id: food.nutrients.find((nutrient) => nutrient.id === 1253)?.id,
            }
        }
    }
}