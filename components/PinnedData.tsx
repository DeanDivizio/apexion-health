"use client";
import { RenderCharts } from "@/utils/ChartRendering";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PinnedData({data, isLoading, title, color}: {data:any, isLoading:any, title:string, color:string}) {

    const { user } = useUser();
    const userMeta: string[] | unknown = user?.publicMetadata.homeLabs;
    const [localData, setLocalData] = useState<any>();
    const [approvedIDs, setApprovedIDs] = useState<string[]>([]);
    
    useEffect(() => {
        if (Array.isArray(userMeta)) {
          setApprovedIDs(userMeta);
        }
        // console.log(localData)
      }, [userMeta]);
    useEffect(() => {
        setLocalData(data)
      }, [data]);

    return(
        <div className={`col-span-2 flex flex-col items-center h-fit md:px-4 py-8 bg-gradient-to-br ${color == "blue" ? "from-slate-950/50" : "from-green-950/15" } to-black border rounded-xl mb-4`}>
              <div className="w-full">
                <h3 className="text-5xl text-center font-regular tracking-wide mb-8">{title}</h3>
              </div>
              <div className="w-[90%]">
                {isLoading ? (
                  <Skeleton className="w-full h-80 pb-4 rounded-lg"/>
                ) : localData ? (
                  <RenderCharts data={localData} approvedIDs={approvedIDs} />
                ): null}
              </div>
      </div>
    )
}