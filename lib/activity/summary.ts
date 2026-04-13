import type { ActivityLogValueView } from "@/lib/activity";

export function summarizeActivityValue(value: ActivityLogValueView): string | null {
  if (value.kind === "text") {
    return value.textValue ? `${value.label}: ${value.textValue}` : null;
  }
  if (value.kind === "number_with_unit") {
    if (value.numberValue == null) return null;
    return `${value.label}: ${value.numberValue}${value.unitValue ? ` ${value.unitValue}` : ""}`;
  }
  if (value.kind === "number") {
    return value.numberValue == null ? null : `${value.label}: ${value.numberValue}`;
  }
  if (value.kind === "date") {
    return value.dateValue ? `${value.label}: ${value.dateValue}` : null;
  }
  if (value.kind === "time") {
    return value.timeValue ? `${value.label}: ${value.timeValue}` : null;
  }
  if (value.kind === "datetime") {
    return value.dateTimeValueIso ? `${value.label}: ${value.dateTimeValueIso}` : null;
  }
  if (value.kind === "scale_1_5") {
    return value.intValue == null ? null : `${value.label}: ${value.intValue}/5`;
  }
  return null;
}

export function summarizeActivityLogLine(values: ActivityLogValueView[]): string[] {
  return values
    .map(summarizeActivityValue)
    .filter((line): line is string => Boolean(line));
}
