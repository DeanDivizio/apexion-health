export function formatDateStr(dateStr: string): string {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const date = new Date(y, m, d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMilliToHoursMinutes(milli: number): string {
  const totalMinutes = Math.round(milli / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatMilliToMinutes(milli: number): string {
  return `${Math.round(milli / 60000)}m`;
}

export function recoveryColor(score: number): string {
  if (score >= 67) return "text-green-400";
  if (score >= 34) return "text-yellow-400";
  return "text-red-400";
}

export function recoveryBgColor(score: number): string {
  if (score >= 67) return "bg-green-500/20 border-green-500/30";
  if (score >= 34) return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-red-500/20 border-red-500/30";
}
