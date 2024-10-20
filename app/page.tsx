"use client";
import React, { useState, useEffect } from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { RenderCharts } from "@/utils/ChartRendering";
import { useUser } from "@clerk/nextjs";
import HRTDrawer from "@/components/HRTDrawer";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WeeklyDataDisplayComponent } from "@/components/WeeklySummary";

type DataItemPoint = {
  dose: number,
  type: string
}
type summaryDataFormat = {
  data: DataItemPoint[]
  date: string
  userID: string
}
type homeData = {
  pinnedData: object;
  summaryData: summaryDataFormat[];
}

export default function Home() {
  const { user } = useUser();
  const userMeta: string[] | unknown = user?.publicMetadata.homeLabs;

  const [data, setData] = useState<homeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIDs, setApprovedIDs] = useState<string[]>([]);

  useEffect(() => {
    if (Array.isArray(userMeta)) {
      setApprovedIDs(userMeta);
    }
  }, [userMeta]);

  useEffect(() => {
    async function dataFetch() {
      try {
        const fetchedData:any = await homeFetch(["TESTOSTERONE", "COMPLETE BLOOD COUNT", "THYROID STIMULATING HORMONE"]);
        setData(fetchedData);
        console.log(fetchedData)
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
    <main className="flex min-h-screen flex-col items-center justify-start pb-12">
      <div id="topSection" className="backdrop-blur-xl w-full mb-8">
        <div id="heading" className="pt-12 mb-12">
          <p className="text-center font-thin italic text-4xl">{`Welcome back, ${user?.firstName}`}</p>
        </div>
        <div id="homeButtons" className="pb-24 px-4 flex flex-col md:flex-row justify-center gap-8">
          <HRTDrawer />
          <Link href={'/logworkout'} className="rounded bg-gradient-to-r from-blue-500 to-green-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300">
            <span className="bg-black w-full text-center px-8 sm:px-12 py-2 rounded text-2xl">Log Workout</span>
          </Link>
          <Link href={'/logworkout'} className="rounded bg-gradient-to-l from-blue-500 to-green-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300">
            <span className="bg-black w-full text-center px-8 sm:px-12 py-2 rounded text-2xl">Meal Placeholder</span>
          </Link>
          <Link href={'/logworkout'} className="rounded bg-gradient-to-l from-blue-500 to-blue-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300">
            <span className="bg-black w-full text-center px-8 sm:px-12 py-2 rounded text-2xl">Body Measure PH</span>
          </Link>
        </div>
      </div>
      <div>
        <h3 className="text-5xl font-regular tracking-normal mb-8">Your Week In Review</h3>
        {data ?
        <WeeklyDataDisplayComponent data={data.summaryData} />
          : null}
        </div>
      <div className="pt-12 px-4 md:px-8 xl:px-48">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger style={{ minWidth: "400px", alignItems: "center" }}>
              <div className="w-full px-16">
                <h3 className="text-5xl font-regular tracking-normal">Pinned Data</h3>
                {/* <hr className="border-neutral-400"></hr> */}
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-neutral-950 bg-opacity-25 md:bg-opacity-0 py-4 w-full">
              <div id="homeCharts">
                {isLoading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p>{error}</p>
                ) : data ? (
                  <RenderCharts data={data.pinnedData} approvedIDs={approvedIDs} />
                ): null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  );
}