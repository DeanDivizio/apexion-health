export type ActivityDimensionKind =
  | "text"
  | "number"
  | "number_with_unit"
  | "date"
  | "time"
  | "datetime"
  | "scale_1_5";

export interface ActivityDimensionConfig {
  allowedUnits?: string[];
  defaultUnit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  [key: string]: unknown;
}

export interface ActivityDimensionView {
  id: string;
  key: string;
  label: string;
  kind: ActivityDimensionKind;
  required: boolean;
  sortOrder: number;
  config: ActivityDimensionConfig | null;
}

export interface ActivityTypeView {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  dimensions: ActivityDimensionView[];
}

export interface ActivityLogValueView {
  key: string;
  label: string;
  kind: ActivityDimensionKind;
  textValue: string | null;
  numberValue: number | null;
  unitValue: string | null;
  dateValue: string | null;
  timeValue: string | null;
  dateTimeValueIso: string | null;
  intValue: number | null;
  jsonValue: unknown;
}

export interface ActivityLogView {
  id: string;
  activityTypeId: string;
  activityName: string;
  activityColor: string | null;
  loggedAtIso: string;
  dateStr: string;
  values: ActivityLogValueView[];
}

export interface ActivityBootstrap {
  activityTypes: ActivityTypeView[];
}

export interface ActivityDaySummaryLog {
  logId: string;
  activityTypeId: string;
  activityName: string;
  activityColor: string | null;
  loggedAt: string;
  summary: string[];
}

export interface ActivityDateRangeSummary {
  date: string;
  logs: ActivityDaySummaryLog[];
}

export interface ActivityContributionDay {
  dateStr: string;
  count: number;
}
