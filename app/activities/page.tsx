import {
  getActivityContributionAction,
  listActivityLogsAction,
  listActivityTypesAction,
} from "@/actions/activity";
import { ActivityCollection } from "@/components/activity/ActivityCollection";

function getMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(first), endDate: fmt(last) };
}

export default async function ActivitiesPage() {
  const { startDate, endDate } = getMonthRange();
  const [types, logs, contributions] = await Promise.all([
    listActivityTypesAction(),
    listActivityLogsAction(),
    getActivityContributionAction(startDate, endDate),
  ]);
  return (
    <ActivityCollection
      initialTypes={types}
      initialLogs={logs}
      initialContributions={contributions}
    />
  );
}
