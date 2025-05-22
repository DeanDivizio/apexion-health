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
    numberOfServings?: number;
}

export type SearchResults = {
    foundation: FoodItem[];
    branded: FoodItem[];
    restaurant: FoodItem[];
}