export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function groupEventsByDay<T extends { occurredAt: Date }>(
  events: T[]
): { label: string; events: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const event of events) {
    const dateKey = event.occurredAt.toISOString().slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(event);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, events]) => ({
      label: formatDate(new Date(dateKey + "T12:00:00")),
      events,
    }));
}
