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
    data: TestData;
    approvedIDs?: string[];
  };
  

//Specific Lab Type Definitions

export interface Lab_Testosterone {
    year: string;
    month: string;
    institution: string;
    totalTest: Result;
    shbg?: Result;
    freeTest?: Result;
    biovailable?: Result;
}

export interface Lab_CBC {
    year: string;
    month: string;
    institution: string;
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