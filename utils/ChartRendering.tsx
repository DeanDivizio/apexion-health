import { MyAreaChart } from "@/components/AreaChart";
import { RenderChartsProps } from "./types";

export function RenderCharts({ data, approvedIDs }: RenderChartsProps) {
    return (
      <div className="flex flex-wrap justify-center gap-8">
      {Object.entries(data)
        .filter(([key]) => !approvedIDs || approvedIDs.includes(key))
        .map(([key, value]) => (
          <MyAreaChart 
            key={key}
            data={value} 
            xAxisKey="month" 
            areas={[
              { key: "value", color: "var(--color-blue)", order: 3 },
              { key: "rangeHigh", color: "var(--color-green)", order: 2 }, 
              { key: "rangeLow", color: "var(--color-red)", order: 1 },  
            ]}
          />
        ))}
    </div>
    );
  }