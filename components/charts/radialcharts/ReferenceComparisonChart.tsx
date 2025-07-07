"use client"

import { LabelList, RadialBar, RadialBarChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui_primitives/chart"
import { useState, useEffect } from "react"

// TypeScript interfaces for reference comparison
interface ComparisonData {
  reference: {
    label: string
    value: number
  }
  values: {
    label: string
    value: number
    key: string
  }[]
}

interface ReferenceComparisonConfig {
  title: string
  data: ComparisonData
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  maxHeight?: string
  showReference?: boolean // whether to show reference as a separate segment
  showPercentages?: boolean // whether to show percentage of reference
}

// Color assignment based on percentage of reference value
const getColorByPercentage = (percentage: number): string => {
  if (percentage >= 100) {
    return "#10b981" // green - meets or exceeds reference
  } else if (percentage >= 80) {
    return "#3b82f6" // blue - close to reference
  } else if (percentage >= 60) {
    return "#f97316" // orange - moderate
  } else {
    return "#ef4444" // red - low
  }
}

// Transform the config for recharts
const transformDataForRecharts = (config: ReferenceComparisonConfig) => {
  const { data, showReference = true } = config
  
  const chartData = []
  
  // Add reference if enabled
  if (showReference) {
    chartData.push({
      name: data.reference.label,
      value: data.reference.value,
      fill: "#6b7280", // gray for reference
      key: 'reference',
      type: 'reference'
    })
  }
  
  // Add comparison values with auto-assigned colors
  data.values.forEach(item => {
    const percentage = (item.value / data.reference.value) * 100
    const color = getColorByPercentage(percentage)
    
    chartData.push({
      name: item.label,
      value: item.value,
      fill: color,
      key: item.key,
      type: 'comparison',
      referenceValue: data.reference.value,
      percentage: Math.round(percentage)
    })
  })
  
  return chartData
}

// Transform config for ChartContainer
const transformConfigForChartContainer = (config: ReferenceComparisonConfig): ChartConfig => {
  const chartConfig: ChartConfig = {}
  
  if (config.data.reference) {
    chartConfig['reference'] = {
      label: config.data.reference.label,
      color: "#6b7280" // gray for reference
    }
  }
  
  config.data.values.forEach(item => {
    const percentage = (item.value / config.data.reference.value) * 100
    const color = getColorByPercentage(percentage)
    
    chartConfig[item.key] = {
      label: item.label,
      color: color
    }
  })
  
  return chartConfig
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm text-gray-600">
          Value: {data.value}
          {data.type === 'comparison' && (
            <span className="ml-2">
              ({data.percentage}% of reference)
            </span>
          )}
        </p>
        {data.type === 'comparison' && (
          <p className="text-xs text-gray-500">
            Reference: {data.referenceValue}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function ReferenceComparisonChart({ 
  config,
  className = ""
}: { 
  config: ReferenceComparisonConfig
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
    endAngle = 270,
    maxHeight = "250px",
    showPercentages = true
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
            content={<CustomTooltip />}
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
      
      {/* Legend with percentages */}
      {showPercentages && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Reference: {config.data.reference.label} = {config.data.reference.value}
          </div>
          <div className="space-y-1">
            {config.data.values.map(item => {
              const percentage = Math.round((item.value / config.data.reference.value) * 100)
              const status = percentage >= 100 ? 'text-green-600' : 
                           percentage >= 80 ? 'text-blue-600' : 
                           percentage >= 60 ? 'text-orange-600' : 'text-red-600'
              
              return (
                <div key={item.key} className="flex justify-between text-sm">
                  <span>{item.label}:</span>
                  <span className={status}>
                    {item.value} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferenceComparisonChart 