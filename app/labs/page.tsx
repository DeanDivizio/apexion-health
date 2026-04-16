import { listLabReportsAction } from "@/actions/labs";
import { LabsDashboard } from "@/components/labs/LabsDashboard";

export default async function LabsPage() {
  const reports = await listLabReportsAction();

  return (
    <main className="flex flex-col items-start pb-12 md:pb-0 px-4 md:px-8 xl:px-16 md:h-full md:overflow-hidden">
      <header className="mb-6 mt-8 w-full shrink-0">
        <h1 className="text-3xl font-thin italic text-white/90">
          Lab Results
        </h1>
      </header>
      <div className="w-full md:flex-1 md:overflow-y-auto md:min-h-0">
        <LabsDashboard reports={reports} />
      </div>
    </main>
  );
}
