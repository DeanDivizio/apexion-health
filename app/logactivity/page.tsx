import { getActivityBootstrapAction } from "@/actions/activity";
import { ActivityLogger } from "@/components/activity/ActivityLogger";

export default async function LogActivityPage() {
  const bootstrap = await getActivityBootstrapAction();
  return (
    <main className="w-full min-h-screen overflow-y-auto pt-16 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <h1 className="text-2xl font-semibold">Log Activity</h1>
        <ActivityLogger
          activityTypes={bootstrap.activityTypes}
          navigateOnSuccess
        />
      </div>
    </main>
  );
}
