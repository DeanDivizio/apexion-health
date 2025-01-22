"use client"

import { TrendingUp } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"
const chartData = [
  { metric: "weightlost", number: 20, fill: "var(--color-metric)" },
]

const chartConfig = {
  number: {
    label: "Pounds",
  },
  metric: {
    label: "Weight Lost",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function WeightChart() {
  const isMobile = useIsMobile();
  let percentage = 50;
  return (
    <Card className="flex flex-col align-center w-full mb-4 rounded-xl bg-gradient-to-br from-blue00/10 to-neutral-950">
      <CardHeader className="items-center pb-0">
        <CardTitle className="mb-4 ">Weight Loss Progress</CardTitle>
        <CardDescription className="hidden md:relative">Total lost out of goal</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-0 md:mx-auto aspect-square max-h-[220px] mb-4"
        >
          <RadialBarChart
            data={chartData}
            startAngle={Math.abs(percentage * 3.6 - 270)}
            endAngle={270}
            innerRadius={isMobile ? 64 : 80}
            outerRadius={isMobile ? 90 : 110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={isMobile ? [69, 58] : [86, 74]}
            />
            <RadialBar dataKey="number" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {chartData[0].number.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Pounds
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 text-sm">
        <div className="flex items-center gap-2 font-light text-neutral-500 leading-none">
          Only 25 pounds left to reach your goal
        </div>
      </CardFooter>
    </Card>
  )
}
