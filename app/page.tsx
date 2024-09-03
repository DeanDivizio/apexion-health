"use client";
import React, {useState, useEffect} from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { RenderCharts } from "@/utils/ChartRendering";
import { useUser } from "@clerk/nextjs";

export default function Home() {

  const { user } = useUser()


  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIDs, setApprovedIDs] = useState(["TESTOSTERONE", "rbc", "plt", "rdw"])

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
  return (
    <main className="flex min-h-screen flex-col items-center justify-start pb-12 px-8 xl:px-48">
      <div id="heading" className="my-16">
        <p className="text-center font-thin italic text-4xl">{`Welcome back, ${user?.firstName}`}</p> {/*Name should be variable*/}
      </div>
      <div id="homeCharts">
        <RenderCharts data={data} approvedIDs={approvedIDs} />
      </div>
    </main>
  );
}
