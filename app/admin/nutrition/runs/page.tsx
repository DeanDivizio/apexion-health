import { IngestionRunsPanel } from "@/components/nutrition/admin/IngestionRunsPanel";

export default function AdminNutritionRunsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Nutrition Ingestion Runs</h1>
        <p className="text-sm text-neutral-400">
          Monitor queue priority, run status, and staging quality before publish.
        </p>
      </div>
      <IngestionRunsPanel />
    </div>
  );
}
