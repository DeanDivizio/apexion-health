export interface LabReportView {
  id: string;
  reportDate: string;
  drawTime: string | null;
  institution: string | null;
  providerName: string | null;
  notes: string | null;
  resultCount: number;
  hasFile: boolean;
  fileEncrypted: boolean;
  createdAt: string;
}

export interface LabResultView {
  id: string;
  markerId: string;
  markerKey: string;
  canonicalName: string;
  value: number;
  unit: string;
  normalizedValue: number | null;
  normalizedUnit: string | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  flag: string | null;
  rawName: string;
  panels: { id: string; key: string; displayName: string }[];
}

export interface LabReportDetailView {
  id: string;
  reportDate: string;
  drawTime: string | null;
  institution: string | null;
  providerName: string | null;
  notes: string | null;
  hasFile: boolean;
  fileEncrypted: boolean;
  originalFileName: string | null;
  createdAt: string;
  results: LabResultView[];
}

export interface MarkerHistoryPoint {
  reportDate: string;
  drawTime: string | null;
  value: number;
  unit: string;
  normalizedValue: number | null;
  normalizedUnit: string | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  flag: string | null;
  institution: string | null;
}

export interface MarkerCatalogView {
  id: string;
  key: string;
  canonicalName: string;
  unit: string;
  defaultRangeLow: number | null;
  defaultRangeHigh: number | null;
  panels: { id: string; key: string; displayName: string }[];
}
