"use client"

import { LabelList, RadialBar, RadialBarChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui_primitives/chart"
import { useState, useEffect } from "react"

// TypeScript interfaces for better type safety
interface RadialChartDataItem {
  label: string
  value: number
  color: string
  key: string // unique identifier for each item
}

interface RadialChartConfig {
  title: string
  data: RadialChartDataItem[]
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  maxHeight?: string
}

// Transform the config into the format expected by recharts
const transformDataForRecharts = (config: RadialChartConfig) => {
  return config.data.map(item => ({
    name: item.label,
    value: item.value,
    fill: item.color,
    key: item.key
  }))
}

// Transform the config into the format expected by ChartContainer
const transformConfigForChartContainer = (config: RadialChartConfig): ChartConfig => {
  const chartConfig: ChartConfig = {}
  
  config.data.forEach(item => {
    chartConfig[item.key] = {
      label: item.label,
      color: item.color
    }
  })
  
  return chartConfig
}

export function ConcentricRadialChart({ 
  config,
  className = ""
}: { 
  config: RadialChartConfig
  className?: string 
}) {
  const [chartData, setChartData] = useState(transformDataForRecharts(config))
  const [chartConfig, setChartConfig] = useState(transformConfigForChartContainer(config))
  
  // Update chart when config changes
  useEffect(() => {
    setChartData(transformDataForRecharts(config))
    setChartConfig(transformConfigForChartContainer(config))
  }, [config])

  const {
    innerRadius = 30,
    outerRadius = 110,
    startAngle = -90,
    endAngle = 380,
    maxHeight = "250px"
  } = config

  return (
    <div className={`w-full ${className}`}>
      <ChartContainer
        config={chartConfig}
        className={`mx-auto aspect-square max-h-[${maxHeight}]`}
      >
        <RadialBarChart
          data={chartData}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        >
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="name" />}
          />
          <RadialBar dataKey="value" background>
            <LabelList
              position="insideStart"
              dataKey="name"
              className="fill-white capitalize mix-blend-luminosity"
              fontSize={11}
            />
          </RadialBar>
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}

// Example usage and default export
export default ConcentricRadialChart
