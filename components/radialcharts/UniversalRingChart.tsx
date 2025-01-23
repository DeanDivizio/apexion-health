"use client"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useEffect, useState } from "react"
import { GenericRingChart } from "@/utils/types"
import { useIsMobile } from "@/hooks/use-mobile"

export function UniversalRingChart({ title, shortTitle, description, subtext, subtextOrder, unit, goal, value, shade }: GenericRingChart) {
    const [percentage, setPercentage] = useState<number>(100)
    const [ringColor, setRingColor] = useState<string>("hsl(var(--chart-2))")
    let chartData = [
        { metric: "metric", number: value, fill: ringColor },
    ]
    const isMobile = useIsMobile();
    useEffect(() => {
        if (goal && value !== undefined) {
            const newPercentage = (value / goal) * 100;
            setPercentage(newPercentage);
            let newRingColor: string;
            if (newPercentage > 85) {
                newRingColor = "hsl(var(--chart-2))";
            } else if (newPercentage > 50) {
                newRingColor = "hsl(var(--chart-1))";
            } else if (newPercentage > 25) {
                newRingColor = "hsl(var(--chart-3))";
            } else {
                newRingColor = "hsl(var(--destructive))";
            }
            setRingColor(newRingColor);
        }
    }, [goal, value]);

    return (
        <Card className={`flex flex-col align-center w-full mb-4 rounded-xl bg-gradient-to-br from-${shade}-900/10 to-neutral-950`}>
            <CardHeader className="items-center w-full">
                <CardTitle className="mb-1 leading-snug">{isMobile ? shortTitle : title}</CardTitle>
                <CardDescription className="hidden md:relative">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer
                    config={{ metric: { color: ringColor } }}
                    className="mx-0 md:mx-auto aspect-square min-h-[100px] max-h-[250px] mb-4"
                    >
                    <RadialBarChart
                        data={chartData}
                        startAngle={270}
                        endAngle={goal && percentage ? (270 - (Math.abs(percentage * 3.6))) : (270)}
                        innerRadius={isMobile ? 54 : 80}
                        outerRadius={isMobile ? 72 : 110}
                        >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={isMobile ? [58, 50] : [86, 74]}
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
                                                    className="fill-foreground text-3xl md:text-4xl font-bold"
                                                    >
                                                    {value}
                                                    </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                    >
                                                    {unit}
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
            <CardFooter className="hidden md:relative flex-col gap-2 text-sm">
                <div className="leading-none text-neutral-500">
                    {goal && (subtextOrder == "unit first") ? (`${goal - value} ${subtext}`) : (`${subtext} ${goal} ${unit}`)}
                </div>
            </CardFooter>
        </Card>
    )

}
