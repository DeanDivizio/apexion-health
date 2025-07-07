export type FoodItem = {
apexionid: string;
    fdcid: number | null;
    name: string;
    variationlabels: string[] | null;
    brand: string | null;
    nutrients: {
        calories: number;
        protein: number;
        carbs: number;
        fats: {
            total: number;
            saturated?: number;
            trans?: number;
        }
        sugars: number | null;
        fiber: number | null;
        cholesterol: number | null;
        sodium: number | null;
        calcium: number | null;
        iron: number | null;
        potassium: number | null;
    }
    servinginfo: {
        size: number;
        unit: string;
    }
    ingredients: string | null;
}

export type SearchResults = {
    foundation: FoodItem[];
    branded: FoodItem[];
    restaurant: FoodItem[];
}

export type GymSession = {
    date: string;
    session: {
        startTime: string;
        endTime: string;
        exercises: {
            name: string;
            type: "strength" | "cardio";
            modifications?: {
                grip?: string;
                movementPlane?: string;
            }
            sets: {
                reps: number;
                repsRight?: number;
                weight: number;
                effort: number | 0;
            }[];
        }[];
    };
}

export type FormSchemaType = {
    month: string;
    day: string;
    year: string;
    startHour: string;
    startMinute: string;
    startAmpm: string;
    useCurrentEndTime: boolean;
    endHour?: string;
    endMinute?: string;
    endAmpm?: string;
    exercises: {
        type: "strength" | "cardio";
        name: string;
        sets?: {
            weight: number;
            reps: number;
            effort: number;
        }[];
        modifications?: {
            grip?: "rotatedNeutral" | "pronated" | "supinated" | "normal";
            movementPlane?: "inclined" | "declined" | "prone" | "supine" | "normal";
        };
        duration?: number;
        distance?: number;
        unit?: "km" | "mi";
    }[];
}