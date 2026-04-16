/**********************************FOR SUMMARY ON HOMEPAGE ********************************* */

export interface SubstanceSessionItem {
  substanceName: string;
  doseValue: number | null;
  doseUnit: string | null;
  compoundServings: number | null;
  deliveryMethod: string | null;
}

export interface SubstanceSession {
  sessionId: string;
  loggedAt: string;
  items: SubstanceSessionItem[];
}

export interface ActivitySummaryLog {
  logId: string;
  activityTypeId: string;
  activityName: string;
  activityColor: string | null;
  loggedAt: string;
  summary: string[];
}

export type SummaryData = Array<{
  date: string;
  gym?: GymDataPoints[];
  hormoneData?: HormoneDataObject[];
  macros?: MacrosObject;
  substances?: SubstanceSession[];
  activities?: ActivitySummaryLog[];
}>;

export type GymDataPoints = {
  startTime: String,
  endTime: String,
  exercises: Exercises[]
}

export type Exercises = {
  exerciseType: string,
  sets: Sets[],
}

type Sets = {
  reps: Number,
  weight: Number
}

export type HormoneDataObject = {
  type: string,
  dose: number
  time: string,
  depth: string,
  category: string
}

export type MacrosObject = {
  calories: number,
  protein: number,
  fat: number,
  carbs: number
}

export type MedicationObject = {
    time: string,
    meds: [
      {
        name: string,
        dose: number,
        unit: string,
        method: string
      }
    ]
}

export type SupplementObject = {
  time: string,
    meds: [
      {
        name: string,
        dose: number,
        unit: string,
        method: string
      }
    ]
}



/*********************************FOR CHARTS AND GRAPHS ************************************ */
export type UniversalRingChart = {
  title: string;
  shortTitle: string;
  description: string;
  subtext: string;
  unit: string;
  goal?: number;
  value: number;
  shade: string;
  subtextOrder: "unit first" | "unit last";
  overOkay?: boolean;
}

export type GenericIntAreachart = {
  title: string;
  description: string;
  data: any;
  chartConfig: any;
}



/*********************************FOR THE WORKOUT FORM************************************ */
export type ExerciseGroup = {
  group: string;
  items: string[];
}


/*********************************CLERK USER METADATA************************************* */ 
 export type ClerkUserMetadata = {   
  markers: {
    nutrition?: {
      fatGoal:number
      carbGoal:number
      proteinGoal:number
      calorieLimit:number
    },
    gym?: {
      // exercise: string,
      // mostRecentSession?: {
      //   date: number, 
      //   sets:[{
      //     weight: number,
      //     reps: number,
      //     repsRight?: number
      // }]},
      // recordSet?: {
      //   weight: number,
      //   reps: number,
      //   repsRight? : number,
      //   totalVolume: number,
      //   date: string
      // },
      // notes?:string,
    }
  },
  customExercises: {
    core: string[],
    lowerBody: string[],
    upperBody: string[]
  }
} | undefined


/*********************************FOR THE USDA API ************************************/

export type USDASearchResults = {
  foundation: USDAFoundationFood[],
  branded: USDABrandedFood[]
}

export type USDABrandedFood = {
  brand_owner: string;
  branded_food_category: string;
  created_at: Date;
  data_type: string;
  description: string;
  fdcid: number;
  gtin_upc: string;
  household_serving: string;
  id: number;
  ingredients: string;
  label_nutrients: USDABrandedFoodNutrients;
  food_nutrients: Array<{
    amount: number;
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
  }>;
  serving_size: string;
  serving_size_unit: string;
}

type USDABrandedFoodNutrients = {
    calcium?: {
      value: number;
    };
    calories: {
      value: number;
    };
    carbohydrates: {
      value: number;
    };
    cholesterol?: {
      value: number;
    };
    fat: {
      value: number;
    };
    fiber: {
      value: number;
    };
    iron: {
      value: number;
    };
    protein: {
      value: number;
    };
    saturatedFat: {
      value: number;
    };
    sugars?: {
      value: number;
    };
    potassium?: {
      value: number;
    };
    sodium?: {
      value: number;
    };
    
}

export type USDAFoundationFood = {
  created_at: Date;
  data_type: "Foundation";
  description: string;
  fdcid: number;
  food_category: string;
  food_portions: Array<{
    amount: number;
    gramWeight: number;
    measureUnit: {
      name: string;
      abbreviation: string;
    };
    modifier: string;
    sequenceNumber: number;
    value: number;
  }>;
  id: number;
  macros: {
    carbohydrate_by_difference: {
      unit: string;
      amount: number;
    };
    carbohydrate_by_summation: {
      unit: string;
      amount: number;
    };
    energy: {
      unit: string;
      amount: number;
    };
    protein: {
      unit: string;
      amount: number;
    };
    total_fat: {
      unit: string;
      amount: number;
    };
  };
  nutrient_conversion_factors: [],
  nutrients: Array<{
    amount: number;
    id: number;
    name: string;
    unitName: string;     
  }>,
}