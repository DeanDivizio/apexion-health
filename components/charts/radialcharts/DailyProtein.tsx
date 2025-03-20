"use client"

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
} from "@/components/ui_primitives/card"
import { ChartConfig, ChartContainer } from "@/components/ui_primitives/chart"
const chartData = [
  { metric: "todayprotein", number: 85, fill: "var(--color-metric)" },
]

const chartConfig = {
  number: {
    label: "Grams",
  },
  metric: {
    label: "Daily Protein",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function DailyProtein() {
  return (
    <Card className="flex flex-col max-w-fit mb-4 rounded-xl bg-gradient-to-br from-purple-900/10 to-neutral-950">
      <CardHeader className="items-center pb-0">
        <CardTitle>{`Today's Protein Intake`}</CardTitle>
        <CardDescription>Intake compared to goal</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={270}
            endAngle={-50}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
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
                          Grams
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-light text-neutral-500 leading-none">
          Your daily protein goal is 100g
        </div>
      </CardFooter>
    </Card>
  )
}
