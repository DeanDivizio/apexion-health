import { IngestionRunDetailPanel } from "@/components/nutrition/admin/IngestionRunDetailPanel";

export default async function AdminNutritionRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <IngestionRunDetailPanel runId={runId} />;
}
