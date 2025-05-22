"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { auth } from '@clerk/nextjs/server'
import { getDataFromTable } from '@/actions/AWS'
import { setPublicMetadata } from '@/actions/Clerk'
import { genericAddItemToTable } from '@/actions/AWS'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

// Initialize the DynamoDB client
//@ts-ignore
const client = new DynamoDBClient({
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    region,
});
const oldTableName = "ClinicalLabs"
const newTableName = "Apexion-Labs"
const docClient = DynamoDBDocumentClient.from(client);

/*********************************CLINICAL LABS DATA MIGRATION**********************************/
async function migrateData() {
    //@ts-ignore
    const transformItem = (item) => {
        return {
            "userID": "user_foobar",  //this was my userId. obfuscated for security
            "labDateType": `${item.LabDate}${item.LabType}`,
            "labType": item.LabType,
            "labDate": item.LabDate,
            "institution": item.institution,
            "results": item.results
        };
    };

    try {
        const scanParams = {
            "TableName": oldTableName,
        };

        try {
            const data = await docClient.send(new ScanCommand(scanParams));
            const items = data.Items;
            if (!items || items.length === 0) {
                console.log("No more items to migrate.");
                return;
            }

            for (const item of items) {
                try {
                    const transformedItem = transformItem(item);
                    await docClient.send(new PutCommand({
                        TableName: newTableName,
                        Item: transformedItem
                    }));
                    console.log(`Migrated item ${transformedItem.labType + " " + transformedItem.labDate}`);
                } catch (error) {
                    console.error(`Error transforming or writing item:`, error);
                    throw error;
                }
            }

        } catch (error) {
            console.error("Error scanning table:", error);
            throw error;
        }
    } catch (error) { console.error("error in main try catch block") };

    console.log("Migration completed successfully.");
}

/************************************INIT PR AND LAST SESSION************ */
async function initPrAndLastSession() {
    const { userId } = await auth();
    let userID;
    if (userId) {
        if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
            userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
        } else {
            userID = userId;
        }
    }
    // @ts-ignore
    const allGymData = await getDataFromTable(userID, 'Apexion-Gym', '20000101', '30001231');
    console.log('Retrieved gym data:', allGymData);

    if (!allGymData || allGymData.length === 0) {
        console.log('No gym data found');
        return {};
    }

    const gymMarkers = new Map();

    allGymData.forEach(workout => {
        console.log('Processing workout:', workout);
        const dateRef = workout.date;

        // Access exercises from the nested data array
        const workoutData = workout.data?.[0];
        if (!workoutData?.exercises) {
            console.log('No exercises in workout:', workout);
            return;
        }
        //@ts-ignore
        workoutData.exercises.forEach(exercise => {
            console.log('Processing exercise:', exercise);
            if (!exercise.exerciseType || !exercise.sets?.length) {
                console.log('Invalid exercise data:', exercise);
                return;
            }

            const existingMarker = gymMarkers.get(exercise.exerciseType);

            // Calculate volume for a set
            //@ts-ignore
            const calculateVolume = (set) => {
                const reps = set.reps || 0;
                const repRight = set.repRight || 0;
                return set.weight * (reps + repRight);
            };

            if (existingMarker) {
                // Update most recent session if this is newer (comparing string dates)
                if (!existingMarker.mostRecentSession || existingMarker.mostRecentSession.date < dateRef) {
                    existingMarker.mostRecentSession = {
                        date: dateRef,
                        sets: exercise.sets,
                    };
                }

                // Check for new record set
                //@ts-ignore
                exercise.sets.forEach(set => {
                    const volume = calculateVolume(set);
                    if (!existingMarker.recordSet || volume > existingMarker.recordSet.totalVolume) {
                        existingMarker.recordSet = {
                            date: dateRef,
                            weight: set.weight,
                            reps: set.reps,
                            repRight: set.repRight,
                            totalVolume: volume,
                        };
                    }
                });
            } else {
                // Initialize new exercise marker
                const firstSet = exercise.sets[0];
                const initialVolume = calculateVolume(firstSet);

                const newMarker = {
                    exercise: exercise.exerciseType,
                    mostRecentSession: {
                        date: dateRef,
                        sets: exercise.sets,
                    },
                    recordSet: {
                        date: dateRef,
                        weight: firstSet.weight,
                        reps: firstSet.reps,
                        repRight: firstSet.repRight,
                        totalVolume: initialVolume,
                    },
                    notes: "",
                };

                // Check remaining sets for potential record
                //@ts-ignore
                exercise.sets.slice(1).forEach(set => {
                    const volume = calculateVolume(set);
                    if (volume > newMarker.recordSet.totalVolume) {
                        newMarker.recordSet = {
                            date: dateRef,
                            weight: set.weight,
                            reps: set.reps,
                            repRight: set.repRight,
                            totalVolume: volume,
                        };
                    }
                });

                gymMarkers.set(exercise.exerciseType, newMarker);
            }
        });
    });

    const gymMarkersObject = Object.fromEntries(gymMarkers);
    console.log('Attempting to set metadata for user:', userID);
    try {
        await genericAddItemToTable(gymMarkersObject, 'Apexion-Gym_UserMeta');
        return "metadata set";
    } catch (error) {
        console.error("error setting metadata", error);
        return (error);
    }
}

/************************************FOOD ITEMS MIGRATION************ */

//@ts-ignore
type oldFoodDBItem = {
    userID: string;
    date: string;
    data: {
        time: string;
        foodItems: {
            name: string;
            numberOfServings: number;
            servingSize: number;
            servingSizeUnit: string;
            stats: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                micros: Array<Object>;
            };
        }[]
    }[]
}
//@ts-ignore
type newFoodDBItem = {
    userID: string;
    date: string;
    data: {
        time: string;
        mealItems: {
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
        }[]
    }[]
}

// Map to store food name to predefined values
type FoodNameMapping = {
    name: string;
    brand: string | null;
    variationLabels: string[] | null;
}

// Example template for food name mappings
const FOOD_NAME_MAPPINGS: Record<string, FoodNameMapping> = {
    // Example format:
    // "Chicken Breast (Perdue)": {
    //     name: "Chicken Breast",
    //     brand: "Perdue",
    //     variationLabels: ["Boneless", "Skinless"]
    // }
    "Totinos Cheese Pizza Rolls": {
        name: "Pizza Rolls",
        brand: "Totinos",
        variationLabels: ["Cheese"]
    },
    "Tyson Anytizers Crispy Boneless Chicken Bites": {
        name: "Crispy Boneless Chicken Bites",
        brand: "Tyson",
        variationLabels: ["Anytizers"]
    },
    "Tyson's Crispy Boneless Chicken Bites": {
        name: "Crispy Boneless Chicken Bites",
        brand: "Tyson",
        variationLabels: ["Anytizers"]
    },
    "Tyson Crispy Boneless Chicken Bites": {
        name: "Crispy Boneless Chicken Bites",
        brand: "Tyson",
        variationLabels: ["Anytizers"]
    },
    "Hudsonville Orange Swirl Ice Cream": {
        name: "Ice Cream",
        brand: "Hudsonville",
        variationLabels: ["Orange Swirl"]
    },
    "Gold Standard Whey Protein Powder - Vanilla Ice Cream": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "Taco Bell Double Stacked Taco": {
        name: "Double Stacked Taco",
        brand: "Taco Bell",
        variationLabels: [],
    },
    "Double Stacked Taco": {
        name: "Double Stacked Taco",
        brand: "Taco Bell",
        variationLabels: [],
    },
    "Pure Protein Protein Bar - Chocolate Deluxe": {
        name: "Protein Bar",
        brand: "Pure Protein",
        variationLabels: ["Chocolate Deluxe"]
    },
    "Pure Protein Chocolate Deluxe Protein Bar": {
        name: "Protein Bar",
        brand: "Pure Protein",
        variationLabels: ["Chocolate Deluxe"]
    },
    "Protein Bar": {
        name: "Protein Bar",
        brand: "Pure Protein",
        variationLabels: ["Chocolate Deluxe"]
    },
    "Protein Shake": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "ON GS Protein": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "Optimum Nutrition Gold Standard Whey Vanilla Ice Cream": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "Meijer Protein Powder": {
        name: "Whey Protein Powder",
        brand: "Meijer",
        variationLabels: ["Vanilla"],
    },
    "Meijer Vanilla Protein Powder": {
        name: "Whey Protein Powder",
        brand: "Meijer",
        variationLabels: ["Vanilla"],
    },
    "Parmesan Cheese": {
        name: "Parmesan Cheese",
        brand: "Kraft",
        variationLabels: ["Grated"],
    },
    "Olive Oil": {
        name: "Olive Oil",
        brand: "Kirkland",
        variationLabels: ["Extra Virgin"],
    },
    "Optimum Nutrition God Standard Whey Protein Powder - Vanilla Ice Cream": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "Optimum Nutrition God Standard Whey Protein - Vanilla Ice Cream": {
        name: "Whey Protein Powder",
        brand: "Optimum Nutrition",
        variationLabels: ["Gold Standard", "Vanilla Ice Cream"]
    },
    "Kirkland Frozen Mixed Vegetables": {
        name: "Mixed Vegetables",
        brand: "Kirkland",
        variationLabels: ["Frozen"],
    },
    "Kirkland Extra Virgin Olive Oil": {
        name: "Olive Oil",
        brand: "Kirkland",
        variationLabels: ["Extra Virgin"],
    },
    "Kirkland Chicken Breast": {
        name: "Chicken Breast",
        brand: "Kirkland",
        variationLabels: ["Boneless", "Skinless"],
    },
    "Starbucks Mocha Cookie Crumble Frappuccino": {
        name: "Mocha Cookie Crumble Frappuccino",
        brand: "Starbucks",
        variationLabels: ["Venti"],
    },
    "Panda Express Orange Chicken": {
        name: "Orange Chicken",
        brand: "Panda Express",
        variationLabels: [],
    },
    "Panda Express Rice": {
        name: "Fried Rice",
        brand: "Panda Express",
        variationLabels: [],
    },
    "Panda Express Fried Rice": {
        name: "Fried Rice",
        brand: "Panda Express",
        variationLabels: [],
    },
    "Jacks Supreme Pizza - Thin Crust": {
        name: "Supreme Pizza",
        brand: `Jack's`,
        variationLabels: ["Thin Crust"],
    },
    "Jack's Supreme Pizza - Thin Crust": {
        name: "Supreme Pizza",
        brand: "Jack's",
        variationLabels: ["Thin Crust"],
    },        
};

// Map to store generated UUIDs for food items
const foodUUIDMap = new Map<string, string>();

// Helper function to clear UUID cache
function clearUUIDCache() {
    foodUUIDMap.clear();
}

// Helper function to generate UUID
function generateUUID(): string {
    return crypto.randomUUID();
}

// Helper function to get or create UUID for a food item
function getFoodUUID(foodName: string): string {
    if (!foodUUIDMap.has(foodName)) {
        foodUUIDMap.set(foodName, generateUUID());
    }
    return foodUUIDMap.get(foodName)!;
}

// Helper function to parse food name and get predefined values
function parseFoodName(foodName: string): FoodNameMapping {
    const mapping = FOOD_NAME_MAPPINGS[foodName];
    if (mapping) {
        return mapping;
    }
    
    // Default case: use the full name and set other fields to null
    return {
        name: foodName,
        brand: null,
        variationLabels: null
    };
}

// Helper function to map micros to new nutrient structure
function mapMicros(micros: any): {
    sugars: number | null;
    fiber: number | null;
    cholesterol: number | null;
    sodium: number | null;
    calcium: number | null;
    iron: number | null;
    potassium: number | null;
} {
    if (!micros) {
        return {
            sugars: null,
            fiber: null,
            cholesterol: null,
            sodium: null,
            calcium: null,
            iron: null,
            potassium: null
        };
    }
    
    return {
        sugars: micros.totalSugars?.amount ?? null,
        fiber: micros.fiber?.amount ?? null,
        cholesterol: micros.cholesterol?.amount ?? null,
        sodium: micros.sodium?.amount ?? null,
        calcium: micros.calcium?.amount ?? null,
        iron: micros.iron?.amount ?? null,
        potassium: micros.potassium?.amount ?? null
    };
}

 async function migrateNutritionData() {
    try {
        // Clear UUID cache at the start of migration
        clearUUIDCache();
        
        const scanParams = {
            TableName: "Apexion-Nutrition",
        };

        const data = await docClient.send(new ScanCommand(scanParams));
        const items = data.Items;

        if (!items || items.length === 0) {
            console.log("No nutrition items to migrate.");
            return;
        }

        // Check if first item is already in new format
        const firstItem = items[0];
        const isNewFormat = firstItem.data?.[0]?.mealItems !== undefined;
        
        if (isNewFormat) {
            console.log("First item is already in new format, skipping...");
            items.shift(); // Remove the first item
        }

        // Only process first 3 items for testing
        const testItems = items.slice(0, 3);
        // console.log(`Testing transformation on ${testItems.length} items...`);

        for (const oldItem of items) {
            try {
                console.log("\nProcessing item for date:", oldItem.date);
                // console.log("Original item structure:", JSON.stringify(oldItem.data?.[0], null, 2));

                // Transform the item to new format
                const newItem: newFoodDBItem = {
                    userID: oldItem.userID,
                    date: oldItem.date,
                    data: oldItem.data.map((meal: any) => {
                        // Check if this is already in new format
                        if (meal.mealItems) {
                            console.log(`Item for date ${oldItem.date} is already in new format, skipping transformation`);
                            return meal;
                        }

                        // Transform from old format
                        return {
                            time: meal.time,
                            mealItems: meal.foodItems.map((food: {
                                name: string;
                                numberOfServings: number;
                                servingSize: number;
                                servingSizeUnit: string;
                                stats: {
                                    calories: number;
                                    protein: number;
                                    carbs: number;
                                    fat: number;
                                    micros: Array<Object>;
                                };
                            }) => {
                                const foodInfo = parseFoodName(food.name);
                                const transformedFood = {
                                    apexionid: getFoodUUID(food.name),
                                    fdcid: null,
                                    name: foodInfo.name,
                                    variationlabels: foodInfo.variationLabels || null,
                                    brand: foodInfo.brand || null,
                                    nutrients: {
                                        calories: food.stats.calories || 0,
                                        protein: food.stats.protein || 0,
                                        carbs: food.stats.carbs || 0,
                                        fats: {
                                            total: food.stats.fat || 0,
                                            saturated: null,
                                            trans: null
                                        },
                                        ...mapMicros(food.stats.micros)
                                    },
                                    servinginfo: {
                                        size: food.servingSize || 1,
                                        unit: food.servingSizeUnit || "serving"
                                    },
                                    ingredients: null,
                                    numberOfServings: food.numberOfServings || 1
                                };
                                return transformedFood;
                            })
                        };
                    })
                };

                // console.log("\nFinal transformed item:", JSON.stringify(newItem, null, 2));
                
                // Comment out the database write for testing
                await docClient.send(new PutCommand({
                    TableName: "Apexion-Nutrition",
                    Item: {
                        userID: newItem.userID,
                        date: newItem.date,
                        data: newItem.data
                    }
                }));

                console.log(`Successfully transformed item for date: ${newItem.date}`);
            } catch (error) {
                console.error(`Error transforming item:`, error);
                throw error;
            }
        }

        // console.log("\nTest transformation completed. Review the logs above to verify the transformation.");
    } catch (error) {
        console.error("Error in nutrition migration:", error);
        throw error;
    }
}
