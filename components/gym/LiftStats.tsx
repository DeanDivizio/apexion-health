"use client"

import { Card, CardTitle, CardHeader, CardContent } from "../ui_primitives/card"
import {ConcentricRadialChart} from "../charts/radialcharts/ConcentricRadialChart"

export default function LiftStats() {
    const config = {
        title: "stats",
        data: [
            { label: "Today", value: 50, color: "var(--chart-1)", key: "today-calories" },
            { label: "Previous", value: 120, color: "var(--chart-2)", key: "previous-calories" },
            { label: "Best", value: 100, color: "var(--chart-3)", key: "best-calories" },
            
        ],
    }
    return (
        <div className="w-full px-4">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Lift Name</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="pb-4">
                        <p className="w-full pb-2">This session</p>
                        <div className="flex justify-between">
                            {/* <p>Intra-set Volume</p>
                            <p>{`Interset Volume (max)`}</p>
                            <p>{`Interset Volume (avg)`}</p>
                            <p>Overall Effort</p> */}
                            <ConcentricRadialChart config={config} />
                        </div>
                    </div>
                    <div className="pb-4">
                        <p className="w-full pb-2">Last session</p>
                        <div className="flex justify-between">
                            <p>Intra-set Volume</p>
                            <p>{`Interset Volume (max)`}</p>
                            <p>{`Interset Volume (avg)`}</p>
                            <p>Overall Effort</p>
                        </div>
                    </div>
                    <div className="pb-4">
                        <p className="w-full pb-2">Best session</p>
                        <div className="flex justify-between">
                            <p>Intra-set Volume</p>
                            <p>{`Interset Volume (max)`}</p>
                            <p>{`Interset Volume (avg)`}</p>
                            <p>Overall Effort</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}