import LiftStats from "@/components/gym/LiftStats"
import { ReferenceComparisonChart } from "@/components/charts/radialcharts/ReferenceComparisonChart"

export default function ComponentTest() {
    const config = {
        title: "Calories",
        data: {
        reference: { label: "Best", value: 1200, key: "best" },
        values: [
            { label: "Previous", value: 900, key: "previous" },
            { label: "Today", value: 500, key: "today" },
            ]
        },
        showPercentages: false,
    }
    return (
        <div className="pt-16">
            {/* <LiftStats /> */}
            <ReferenceComparisonChart config={config} />
        </div>
    )
}