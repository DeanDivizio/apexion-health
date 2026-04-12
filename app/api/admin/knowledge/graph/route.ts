import { NextResponse } from "next/server";
import { getConceptNeighbors, searchConcepts } from "@/lib/knowledge/graph/neo4jReader";
import { requireAdminApi } from "../_auth";

export async function GET(request: Request) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const { searchParams } = new URL(request.url);
  const concept = searchParams.get("concept");

  if (!concept) {
    return NextResponse.json(
      { error: "concept query param required" },
      { status: 400 },
    );
  }

  try {
    const result = await getConceptNeighbors(concept);

    if (result.nodes.length === 0) {
      const searchResults = await searchConcepts(concept, 20);
      return NextResponse.json({
        nodes: searchResults,
        relationships: [],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
