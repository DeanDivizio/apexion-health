"use client";
import React, { useState, useEffect } from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { useUser } from "@clerk/nextjs";
import HRTDrawer from "@/components/HRTDrawer";
import Link from "next/link";
import { WeeklyDataDisplayComponent } from "@/components/WeeklySummary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RenderCharts } from "@/utils/ChartRendering";
import PinnedData from "@/components/PinnedData";
import Footer from "@/components/Footer";

type DataItemPoint = {
  dose: number,
  type: string
}
type summaryDataFormat = {
  date: string
  userID: string
}
type homeData = {
  pinnedData: object;
  summaryData: [summaryDataFormat];
}

export default function Home() {
  const { user } = useUser();
  const userMeta: string[] | unknown = user?.publicMetadata.homeLabs;

  const [data, setData] = useState<homeData>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function dataFetch() {
      try {
        const fetchedData:any = await homeFetch(["TESTOSTERONE", "COMPLETE BLOOD COUNT", "THYROID STIMULATING HORMONE"]);
        setData(fetchedData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    dataFetch();
    
  }, []);

  return (
    <main className="flex px-4 pt-24 md:pt-[3vh] h-auto md:h-[100vh] overflow-clip w-full flex-col items-center justify-start bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full md:h-[95vh]">
        <div className="col-span-1 flex flex-col items-center lg:items-start h-[92vh] p-4 border-2 bg-neutral-800/50 backdrop-blur-xl rounded-xl overflow-y-scroll">
          <h3 className="text-5xl w-full font-regular tracking-normal mt-4 md:mt-0 mb-8 text-center">Your Week In Review</h3>
          {data ?
          <WeeklyDataDisplayComponent isLoading={isLoading} data={data.summaryData} />
            : null}
          </div>
        <div className="col-span-1 md:col-span-2 md:h-[92vh] overflow-y-scroll md:bg-neutral-800/50 md:p-4 rounded-xl backdrop-blur-xl">
          <PinnedData title="Lab" color="blue" data={data?.pinnedData} isLoading={isLoading}/>
          <PinnedData title="Gym" color="green" data={data?.pinnedData} isLoading={isLoading}/>
          <PinnedData title="Body" color="blue" data={data?.pinnedData} isLoading={isLoading}/>
          </div>
      </div>
      <Footer />
    </main>
  );
}