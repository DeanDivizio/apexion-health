export interface NormalizedDateInput {
  compactDateStr: string;
  isoDate: string;
  sessionDateCandidates: string[];
}

export interface UtcDateBounds {
  startUtc: Date;
  endUtcExclusive: Date;
}

function compactToIso(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

export function toCompactDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function isoDateToCompactDateStr(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1]}${match[2]}${match[3]}`;
  return isoDate.replace(/\D/g, "").slice(0, 8);
}

export function normalizeDateInput(dateInput: string): NormalizedDateInput {
  const compactPattern = /^\d{8}$/;
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (compactPattern.test(dateInput)) {
    const isoDate = compactToIso(dateInput);
    return {
      compactDateStr: dateInput,
      isoDate,
      sessionDateCandidates: [dateInput, isoDate],
    };
  }

  if (isoPattern.test(dateInput)) {
    const compactDateStr = isoDateToCompactDateStr(dateInput);
    return {
      compactDateStr,
      isoDate: dateInput,
      sessionDateCandidates: [compactDateStr, dateInput],
    };
  }

  const digitsOnly = dateInput.replace(/\D/g, "");
  if (digitsOnly.length >= 8) {
    const compactDateStr = digitsOnly.slice(0, 8);
    const isoDate = compactToIso(compactDateStr);
    return {
      compactDateStr,
      isoDate,
      sessionDateCandidates: [compactDateStr, isoDate],
    };
  }

  return {
    compactDateStr: dateInput,
    isoDate: dateInput,
    sessionDateCandidates: [dateInput],
  };
}

/**
 * Build UTC bounds for a user's local calendar day.
 * `timezoneOffsetMinutes` must come from Date#getTimezoneOffset().
 */
export function getUtcBoundsForLocalDate(
  dateInput: string,
  timezoneOffsetMinutes: number,
): UtcDateBounds {
  const { isoDate } = normalizeDateInput(dateInput);
  const [yearStr, monthStr, dayStr] = isoDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    const startUtc = new Date(`${isoDate}T00:00:00.000Z`);
    return {
      startUtc,
      endUtcExclusive: new Date(startUtc.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  const localMidnightUtcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) + timezoneOffsetMinutes * 60 * 1000;
  return {
    startUtc: new Date(localMidnightUtcMs),
    endUtcExclusive: new Date(localMidnightUtcMs + 24 * 60 * 60 * 1000),
  };
}
