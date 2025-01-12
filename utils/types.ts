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


// For summary

export type SummaryData = {
  date: string,
  userID: String,
  gymData?: {
    date: String,
    userID: String,
    data: GymDataPoints[]
  }
  hormoneData?: HormoneDataType
}

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

export type HormoneDataType = {
  data: HormoneAdministration[],
  date: String,
  userID: String
}

export type HormoneAdministration = {
  category: String,
  depth?: String,
  dose: Number,
  time: String,
  type: String,
}