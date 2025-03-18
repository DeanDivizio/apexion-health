"use client";
import React, { useState, useEffect } from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { useUser } from "@clerk/nextjs";
import { WeeklyDataDisplayComponent } from "@/components/WeeklySummary";
import PinnedData from "@/components/PinnedData";
import Footer from "@/components/Footer";
import { WeightChart } from "@/components/radialcharts/WeightChart";
import { UniversalRingChart } from "@/components/radialcharts/UniversalRingChart";
import { InteractiveAreaChart } from "@/components/InteractiveAreaChart";
import { ChartConfig } from "@/components/ui/chart";
import { useSubNavContext } from "@/context/SubNavOpenContext";
import Defocuser from "@/components/Defocuser";


const demointareadata = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
]
const demochartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function Home() {
  const { user } = useUser();
  const userMeta: string[] | unknown = user?.publicMetadata.homeLabs;

  const [data, setData] = useState<any>([]); // init with empty
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //@ts-ignore
  const {open} = useSubNavContext();

  useEffect( async () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    
    const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneWeekAgoYear = oneWeekAgo.getFullYear();
    const oneWeekAgoMonth = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
    const oneWeekAgoDay = String(oneWeekAgo.getDate()).padStart(2, '0');
    
    function anotherwrapper() {
      dataFetch();
    }
    async function dataFetch() {
      let endDate:string = todayYear + todayMonth +todayDay;
      let startDate:string = oneWeekAgoYear+oneWeekAgoMonth+oneWeekAgoDay;
      try {
        const response = await homeFetch({startDate, endDate});
        console.log(response)
        setData(response);
        console.log(data)
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    anotherwrapper() 
    // console.log(data)
  }, []);

  return (
    <main className={`flex pb-12 md:pb-0 px-4 pt-24 md:pt-4 h-auto 3xl:h-[100vh] overflow-clip w-full flex-col items-center justify-start bg-transparent`}>
      <Defocuser />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full xl:h-[95vh]">
        <div className="col-span-1 order-2 xl:order-1 flex flex-col items-center lg:items-start p-4 border-2 bg-neutral-800/50 backdrop-blur-xl rounded-xl overflow-y-scroll">
          <h3 className="text-5xl w-full font-regular tracking-normal mt-4 xl:mt-0 mb-8 text-center">Your Week In Review</h3>
          {data ?
          //@ts-ignore
          <WeeklyDataDisplayComponent isLoading={isLoading} data={data} />
            : null}
          </div>
        <div className="col-span-1 xl:col-span-2 order-1 xl:order-2 xl:h-[95vh] overflow-y-scroll xl:p-4 rounded-xl backdrop-blur-xl">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-around mb-0">
            <WeightChart />
            <UniversalRingChart 
              title="Today's Calorie Intake"
              shortTitle="Calories"
              subtext="Your maintenence calorie intake is" 
              subtextOrder="unit last"
              description="Intake compared to maintenence" 
              unit="Calories" 
              value={1750} 
              goal={2200}
              shade="indigo" />
            <UniversalRingChart 
              title="Today's Protein Intake"
              shortTitle="Protein"
              subtext="Your daily protein goal is " 
              subtextOrder="unit last"
              description="Intake compared to goal" 
              unit="grams" 
              value={96} 
              goal={100}
              shade="purple" />
            <UniversalRingChart 
              title="Today's Carb Intake"
              shortTitle="Carbs"
              subtext="Your daily carb goal is " 
              subtextOrder="unit last"
              description="Intake compared to goal" 
              unit="Grams" 
              value={50} 
              goal={80}
              shade="green" />
            </div>
          
          <InteractiveAreaChart 
            title="Nutrition Highlights"
            description="Your macros over time"
            data={demointareadata}
            chartConfig={demochartConfig} />
            <PinnedData title="Gym" color="green" data={data?.pinnedData} isLoading={isLoading}/>
        </div>
      </div>
      <Footer />
    </main>
  );
}