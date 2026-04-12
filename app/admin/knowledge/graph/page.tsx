import { GraphExplorer } from "./GraphExplorer";

export default function GraphPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">
          Knowledge Graph
        </h1>
        <p className="text-sm text-neutral-400">
          Explore entities and relationships extracted from sources.
        </p>
      </div>

      <GraphExplorer />
    </div>
  );
}
