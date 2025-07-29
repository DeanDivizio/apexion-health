"use client";
import React, { useState, useEffect, useContext } from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { WeeklyDataDisplayComponent } from "@/components/home/WeeklySummary";
import Footer from "@/components/global/Footer";
import { UniversalRingChart } from "@/components/charts/radialcharts/UniversalRingChart";
import Defocuser from "@/components/global/Defocuser";
import type { SummaryData } from "@/utils/types";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { SideNav } from "@/components/global/SideNav";

export default function Home() {
  const { user, isLoaded } = useUser();
  const { setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading } = useContext(MobileHeaderContext);
  const [data, setData] = useState<SummaryData>();
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [calorieLimit, setCalorieLimit] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);

  useEffect( () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    let endDate:string = todayYear + todayMonth +todayDay;
    const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneWeekAgoYear = oneWeekAgo.getFullYear();
    const oneWeekAgoMonth = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
    const oneWeekAgoDay = String(oneWeekAgo.getDate()).padStart(2, '0');
    let startDate:string = oneWeekAgoYear+oneWeekAgoMonth+oneWeekAgoDay;

    async function dataFetch() {  
      try {
        // @ts-ignore
        const response:SummaryData = await homeFetch({startDate, endDate});
        setData(response);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    dataFetch()
    
  }, []);

  useEffect(()=>{
    if(data && data.length > 0) {
      console.log(data[0])
      if (data[0].macros) {
    setTodayCalories(data[0].macros.calories);
    setTodayProtein(data[0].macros.protein);
    setTodayCarbs(data[0].macros.carbs);
    setTodayFat(data[0].macros.fat);
      }
    }
  }, [data])

  useEffect(()=>{
    if(isLoaded) {
      // @ts-ignore
    setCalorieLimit(user?.publicMetadata.markers.nutrition.calorieLimit);
    // @ts-ignore
    setProteinGoal(user?.publicMetadata.markers.nutrition.proteinGoal);
    // @ts-ignore
    setCarbGoal(user?.publicMetadata.markers.nutrition.carbGoal);
    // @ts-ignore
    setFatGoal(user?.publicMetadata.markers.nutrition.fatGoal);
    }
  },[isLoaded])

  useEffect(()=>{
    setHeaderComponentLeft(<SideNav />)
    setHeaderComponentRight(
      <div className="flex items-center justify-center">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      </div>
      )
      setMobileHeading("generic")
  },[setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading])

  return (
    <main className={`flex pb-12 md:pb-0 px-4 pt-24 md:pt-4 h-auto 3xl:h-[100vh] overflow-clip w-full flex-col items-center justify-start bg-gradient-to-br from-blue-950/20 to-neutral-950`}>
      <Defocuser />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full xl:h-[95vh]">
        <div className="col-span-1 order-2 xl:order-1 flex flex-col items-center lg:items-start p-4 border-2 bg-neutral-800/50 backdrop-blur-xl rounded-xl overflow-y-scroll">
          <h3 className="text-5xl w-full font-regular tracking-normal mt-4 xl:mt-0 mb-8 text-center">Recent Days</h3>
          {data ?
          //@ts-ignore
          <WeeklyDataDisplayComponent isLoading={isLoading} data={data} />
            : null}
          </div>
        <div className="col-span-1 xl:col-span-2 order-1 xl:order-2 xl:h-[95vh] overflow-y-scroll xl:p-4 rounded-xl backdrop-blur-xl">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-around mb-0">
            <UniversalRingChart 
              title="Today's Calorie Intake"
              shortTitle="Calories"
              subtext="Your maintenence calorie intake is" 
              subtextOrder="unit last"
              description="Intake compared to maintenence" 
              unit="Calories" 
              value={Math.round(todayCalories)} 
              goal={calorieLimit}
              shade="indigo" />
            <UniversalRingChart 
              title="Today's Protein Intake"
              shortTitle="Protein"
              subtext="Your daily protein goal is " 
              subtextOrder="unit last"
              description="Intake compared to goal" 
              unit="grams" 
              value={Math.round(todayProtein)} 
              goal={proteinGoal}
              shade="blue"
              overOkay />
            <UniversalRingChart 
              title="Today's Carb Intake"
              shortTitle="Carbs"
              subtext="Your daily carb goal is " 
              subtextOrder="unit last"
              description="Intake compared to goal" 
              unit="Grams" 
              value={Math.round(todayCarbs)} 
              goal={carbGoal}
              shade="green" />
            <UniversalRingChart 
              title="Today's Fat Intake"
              shortTitle="Fat"
              subtext="Your daily fat goal is " 
              subtextOrder="unit last"
              description="Intake compared to goal" 
              unit="Grams" 
              value={Math.round(todayFat)} 
              goal={fatGoal}
              shade="indigo" />
              </div>
              
          {/* {isMobile ? null :
          <><InteractiveAreaChart
              title="Nutrition Highlights"
              description="Your macros over time"
              data={demointareadata}
              chartConfig={demochartConfig} /><PinnedData title="Gym" color="green" data={data?.pinnedData} isLoading={isLoading} /></>
          } */}
        </div>
      </div>
      <Footer />
    </main>
  );
}