"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  totalTest: {
    label: "Total",
    // color: "hsl(var(--chart-1))",
  },
  bmi: {
    label: "BMI",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig
interface DataAreas {
    key: string;
    color: string;
    order: number;
}

interface Props {
    subheading?: string;
    data: Array<{displayName: string; month: string; year: string; unit: string; value: number;}>;
    xAxisKey: string;
    areas: Array<DataAreas>;
    footerHeading?: string;
    footerText?: string;
    mega?: boolean;
}

export function MyAreaChart(props: Props) {
  return (
    <Card className={`rounded-xl min-w-72 ${props.mega? 'w-[50vw]' : null}`}>
      <CardHeader>
        <CardTitle className="text-center">{props.data ? props.data[0].displayName : null}</CardTitle>
        <CardDescription>
          {props.subheading}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={props.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={props.xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {props.areas.map((area) => (
                <Area
                dataKey={area.key}
                type="natural"
                fill={area.color}
                fillOpacity={0.2}
                stroke={area.color}
                stackId={area.order}
              />
            ))};
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
            {props.data ? `${props.data[0].month} ${props.data[0].year} - ${props.data[props.data.length - 1].month} ${props.data[props.data.length - 1].year}` : null}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
            {props.data ? `Measured in ${props.data[0].unit}` : null}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
