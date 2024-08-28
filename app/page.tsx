import Image from "next/image";
import { type ChartConfig } from "@/components/ui/chart"
import {MyAreaChart} from "@/components/AreaChart"

const data = {
  testData: [
  {date: "January", totalTest: 232.2, sHBG: 150.6},
  {date: "May", totalTest: 236, sHBG: 158.4},
  {date: "June", totalTest: 305, sHBG: 162.9},
  {date: "July", totalTest: 321, sHBG: 180.3}
],
weightData: [
  {date: "January", totalTest: 232.2, sHBG: 150.6},
  {date: "Feb", totalTest: 245, sHBG: 150.6},
  {date: "March", totalTest: 230, sHBG: 150.6},
  {date: "April", totalTest: 225, sHBG: 150.6},
  {date: "May", totalTest: 220, sHBG: 158.4},
  {date: "June", totalTest: 200, sHBG: 162.9},
  {date: "July", totalTest: 205, sHBG: 180.3}
],
}



export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-12">
      <div id="heading" className="mb-16">
        <h1 className="text-6xl font-medium mb-6">Apexion</h1>
        <p className="text-center font-thin italic text-lg">{`Welcome back, Dean`}</p> {/*Name should be variable*/}
      </div>
      <div id="homeCharts" className="flex gap-8 max-w-[80%]">
        <MyAreaChart 
          heading="Total Testosterone" 
          data={data.testData} 
          xAxisKey="date" 
          areas={[
            {key: "totalTest", color: "var(--color-blue)", order: 1}, 
            {key:"sHBG", color: "var(--color-green)", order: 2}
          ]}
          footerHeading={`All Time`}
          footerText={`Measured in ng/dL`}
        />
        <MyAreaChart 
          heading="Body Weight" 
          data={data.weightData} 
          xAxisKey="date" 
          areas={[
            {key: "totalTest", color: "var(--color-green)", order: 1}, 
          ]}
          footerHeading={`${data.weightData[0].date} - ${data.weightData[data.weightData.length-1].date}`}
          footerText={`Measured in pounds`}
        />
        <MyAreaChart 
          heading="Body Fat Percentage" 
          data={data.weightData} 
          xAxisKey="date" 
          areas={[
            {key: "totalTest", color: "var(--color-blue)", order: 1}, 
            {key:"sHBG", color: "var(--color-green)", order: 2}
          ]}
          footerHeading={`${data.weightData[0].date} - ${data.weightData[data.weightData.length-1].date}`}
          footerText={`Measured in ng/dL`}
        />
        <MyAreaChart 
          heading="Red Blood Cells" 
          data={data.testData} 
          xAxisKey="date" 
          areas={[
            {key: "totalTest", color: "var(--color-red)", order: 1}, 
          ]}
          footerHeading={`All Time`}
          footerText={`Measured in ng/dL`}
        />
      </div>
    </main>
  );
}
