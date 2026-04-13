import {
  listActivityLogsAction,
  listActivityTypesAction,
} from "@/actions/activity";
import { ActivityCollection } from "@/components/activity/ActivityCollection";

export default async function ActivitiesPage() {
  const [types, logs] = await Promise.all([
    listActivityTypesAction(),
    listActivityLogsAction(),
  ]);
  return <ActivityCollection initialTypes={types} initialLogs={logs} />;
}
