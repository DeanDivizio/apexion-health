import { SourceRegistryPanel } from "@/components/nutrition/admin/SourceRegistryPanel";

export default function AdminNutritionSourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Nutrition Source Registry</h1>
        <p className="text-sm text-neutral-400">
          Configure official source endpoints and trigger ingestion runs.
        </p>
      </div>
      <SourceRegistryPanel />
    </div>
  );
}
