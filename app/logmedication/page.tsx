import { Suspense } from "react";
import { getMedicationBootstrapAction } from "@/actions/medication";
import { MedicationFlow } from "@/components/meds/MedicationFlow";

async function MedicationFlowLoader() {
  const bootstrap = await getMedicationBootstrapAction();
  return <MedicationFlow bootstrap={bootstrap} />;
}

function MedicationSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      <p className="text-sm text-muted-foreground">Loading medication data...</p>
    </div>
  );
}

export default async function LogMedicationPage() {
  return (
    <main className="w-full min-h-screen overflow-y-auto pt-16 pb-20">
      <Suspense fallback={<MedicationSkeleton />}>
        <MedicationFlowLoader />
      </Suspense>
    </main>
  );
}