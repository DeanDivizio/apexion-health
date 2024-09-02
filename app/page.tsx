"use client";
import React, {useState, useEffect} from "react";
import {MyAreaChart} from "@/components/AreaChart"
import { homeFetch } from "@/actions/InternalLogic";
import { RenderChartsProps } from "@/utils/types";

interface DataChunk{
  count: number;
  displayName: string;
  institution: string;
  month: string;
  rangeHigh: number;
  rangeLow: number;
  value: number;
}
interface DataSet {

}

export default function Home() {

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIDs, setApprovedIDs] = useState(["TESTOSTERONE", "rbc", "plt"])

  //Grabs Data
  useEffect(() => {
    async function dataFetch() {
      try {
        const data = await homeFetch(["TESTOSTERONE", "COMPLETE BLOOD COUNT", "THYROID STIMULATING HORMONE"]);
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

  //This filters the data based on individual requested tests (if provided) and then maps over it to render a chart for each test
  function RenderCharts({ data, approvedIDs }: RenderChartsProps) {
    return (
      <div className="flex flex-wrap justify-center gap-8">
      {Object.entries(data)
        .filter(([key]) => !approvedIDs || approvedIDs.includes(key))
        .map(([key, value]) => (
          <MyAreaChart 
            key={key}
            data={value} 
            xAxisKey="month" 
            areas={[
              { key: "value", color: "var(--color-blue)", order: 3 },
              { key: "rangeHigh", color: "var(--color-green)", order: 2 }, 
              { key: "rangeLow", color: "var(--color-red)", order: 1 },  
            ]}
          />
        ))}
    </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start py-12 px-48">
      <div id="heading" className="mb-16">
        <h1 className="text-6xl font-medium mb-6">Apexion</h1>
        <p className="text-center font-thin italic text-lg">{`Welcome back, Dean`}</p> {/*Name should be variable*/}
      </div>
      <div id="homeCharts">
      <RenderCharts data={data} approvedIDs={approvedIDs} />
      </div>
    </main>
  );
}
