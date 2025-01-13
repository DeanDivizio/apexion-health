"use client"
import React, {useState, useEffect, Suspense} from "react";
import { categoryFetch } from "@/actions/InternalLogic";
import { RenderCharts } from "@/utils/ChartRendering";

export default function Labs() {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIDs, setApprovedIDs] = useState() // Used to filter displayed results

  //Grabs Data
  useEffect(() => {
    async function dataFetch() {
      try {
        const data = await categoryFetch("ClinicalLabs");
        setData(data); 
        // console.log(data);
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
    <main className="flex min-h-screen flex-col items-center justify-start pb-12 px-8 xl:px-48">
      <div id="heading" className="mt-8 mb-16">
        <p className="text-center font-thin italic text-4xl">{`Your Labs, by Category`}</p>
      </div>
      <div id="homeCharts">
        <Suspense>
        <RenderCharts data={data} approvedIDs={approvedIDs} categorize={true} categoryOrder={["Hormones - All", "COMPLETE BLOOD COUNT", "COMPREHENSIVE METABOLIC PANEL", "LIPID PANEL w/ CHOLESTEROL"]}/>
        </Suspense>
      </div>
    </main>
  );
}
