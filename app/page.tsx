"use client";
import React, {useState, useEffect} from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { RenderCharts } from "@/utils/ChartRendering";
import { useUser } from "@clerk/nextjs";
import GradientButton from "@/components/GradientButton";
import HRTDrawer from "@/components/HRTDrawer";
import Link from "next/link";

export default function Home() {

  const { user } = useUser()
  const userMeta: string[] | unknown = user?.publicMetadata.homeLabs;

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedIDs, setApprovedIDs] = useState<string[]>(Array.isArray(userMeta) ? userMeta : []);

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
      <div id="homeButtons" className="pb-24 flex gap-8">
       <HRTDrawer />
       <Link href={'/logworkout'} className="rounded bg-gradient-to-r from-blue-500 to-green-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300"><span className="bg-black px-8 sm:px-12 py-2 rounded text-2xl">Log Workout</span></Link>
      </div>
      <div className="w-full px-16 mb-6">
        <h3 className="text-5xl font-regular tracking-normal mb-4 ">Pinned Data</h3>
        <hr className="border-neutral-400"></hr>
      </div>
      <div id="homeCharts">
        <RenderCharts data={data} approvedIDs={approvedIDs} />
      </div>
    </main>
  );
}
