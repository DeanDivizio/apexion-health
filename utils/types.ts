export interface Result {
    id: string;
    displayName: string;
    unit: string;
    value: number;
    rangeHigh?: number;
    rangeLow?: number;
}
export interface Test {
    LabType: string;
    LabDate: number;
    institution: string;
    results: Array<Result>;
}
export interface IndividualResult {
    LabType: string;
    year: string;
    month: string;
    institution: string;
    id: string;
    displayName: string;
    unit: string;
    value: number;
    rangeHigh?: number;
    rangeLow?: number;
}

export interface ClinicalLabArray {
    testosterone?: Array<Lab_Testosterone>;
    completeBloodCount?: Lab_CBC;
}

export type TestResult = {
    count: number;
    value: number;
    rangeHigh: number;
    rangeLow: number;
    displayName: string;
    institution: string;
    month: string;
    unit: string;
    year: string;
    labType: string;
  };
  
export type TestData = {
    [key: string]: TestResult[];
  };
  
export type MyAreaChartProps = {
    data: TestResult[];
    xAxisKey: string;
    areas: { key: string; color: string; order: number }[];
  };
  
export type RenderChartsProps = {
    data: TestData | object;
    approvedIDs?: string[];
    categorize?: boolean;
    categoryOrder?: string[];
  };
  

//Specific Lab Type Definitions

export interface Lab_Testosterone {
    totalTest: Result;
    shbg?: Result;
    freeTest?: Result;
    biovailable?: Result;
}

export interface Lab_CBC {
    hematocrit: Result;
    hemoglobin: Result;
    rbc: Result;
    basophils?: Result;
    basophilsAbs?: Result;
    eosinophils?: Result;
    eosinophilsAbs?: Result;
    immatureGranulocytes?: Result;
    lymphocytes?: Result;
    lymphocytesAbs?: Result;
    monocytes?: Result;
    monocytesAbs?: Result;
    neutrophils?: Result;
    neutrophilsAbs?: Result;
    nrbc?: Result;
    nrbcAbs?: Result;
    mch?: Result;
    mchc?: Result;
    mcv?: Result;
    mpv?: Result;
    plt?: Result;
    rdw?: Result;
}

// HRT Types

export interface Testosterone_Form {
  date: number;
  time: number;
  method: "Injection" | "Cream";
  injectionDepth?: "Sub-Q" | "Intermuscular";
  injectionEster?: "Cypionate" | "Enanthate" | "Propionate";
  creamLocation?: string;
  brand?: string;
  dose: number;
}

export interface AromataseInhibitor_Form {
  date: number;
  time: number;
  brand?: string;
  brandPlaceholder: "i.e. Anastrozole, Aromasin";
  dose: number;
}

export interface PDE5Inhibitor_Form {
  date: number;
  time: number;
  brand?: string;
  brandPlaceholder: "i.e. Cialis, Viagra";
  dose: number;
}

export interface HCG_Form {
  date: number;
  time: number;
  method: "Injection";
  injectionDepth?: "Sub-Q" | "Intermuscular";
  brand?: string;
  dose: number;
}

export interface Estrogen_Form { //This will be updated later
  date: number;
  time: number;
  brand?: string;
  brandPlaceholder: "i.e. Cialis";
  dose: number;
}


/**********************************FOR SUMMARY ON HOMEPAGE ********************************* */

export type SummaryData = [{
  date: string,
  gym?: GymDataPoints[],
  hormoneData?: HormoneDataObject[],
  macros?: MacrosObject,
  meds?: MedicationObject[],
  supps?: SupplementObject[]
}]

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
  homeLabs: string[],
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
    potassium?: {
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