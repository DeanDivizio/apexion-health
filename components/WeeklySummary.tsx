'use client'
import { SummaryData, GymDataPoints, Exercises, HormoneAdministration } from "@/utils/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";


const refDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

export function WeeklyDataDisplayComponent({ data, isLoading }: { data: SummaryData[], isLoading:any }) {
  const [orderedData, setOrderedData] = useState<SummaryData[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const getExerciseName = (value: string) => {
    const spacedValue = value.replace(/([A-Z])/g, ' $1');
    return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
  };
  
  // today on top. opens all by default
  useEffect(() => {
    setOrderedData(data.reverse());
  }, [data]);
  useEffect(()=>{
    if (orderedData.length > 0) {
      let items:string[] = [];
      if (isMobile) {
        setOpenItems([String(orderedData[6].date), String(orderedData[5].date) ])
        setOrderedData(data.reverse());
      } else {
      orderedData.forEach(item => items.push(String(item.date)));
      setOpenItems(items);}
      // setOrderedData(data.reverse());
    }
  },[orderedData])

  if (isLoading) {
    return (
      <Skeleton className="w-full bg-neutral-800 h-32 mb-4"/>
    )
  } else return (
     <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
      {orderedData?.map((item) => (
          <AccordionItem key={String(item.date)} value={String(item.date)} className="mb-4 ">
                  <AccordionTrigger className="justify-center gap-4 text-xl py-4 px-6 bg-neutral-950 rounded-t-xl data-[state=open]:rounded-b-none data-[state=closed]:rounded-b-xl">
                    {new Date(parseInt(item.date.slice(0, 4)), parseInt(item.date.slice(4, 6)) - 1, parseInt(item.date.slice(6))).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </AccordionTrigger>
                <AccordionContent className="px-3 pt-4 pb-6 bg-neutral-950/35 backdrop-blur-xl rounded-b-xl">
                  <h3 className="font-light border-b w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Hormones</h3>
                  {item.hormoneData && item.hormoneData.data.length > 0 ? (
                    item.hormoneData.data.map((object: any) => (
                      <div className="flex gap-2 text-lg" key={object.type}>
                        <p className="font-medium">{object.dose}<span className="font-extralight text-sm"> mg: </span></p>
                        {['cypionate', 'enanthate', 'propionate', 'cream'].includes(object.type) ?
                          <p>Testosterone</p> :
                          <p>{(object.type || '').charAt(0).toUpperCase() + (object.type || '').slice(1)}</p>
                        }
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm">No Hormone data recorded</p>
                  )}
                  <h3 className="font-light border-b w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300 mt-3">Gym Data</h3>
                  {item.gymData && item.gymData.data.length > 0 ? (
                    item.gymData.data.map((object: GymDataPoints) => (
                      <div className="flex flex-col gap-2 text-lg" key={Number(object.startTime)}>
                        <h4 className="font-light text-base">{`${object.startTime} - ${object.endTime}`}</h4>
                        <div className="pl-2 border-l">
                        {
                          object.exercises.map((exercise: Exercises) => (
                            <p key={exercise.exerciseType} className="text-base font-light">{getExerciseName(exercise.exerciseType)}</p>
                          ))
                          }
                          </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm">No Workout recorded</p>
                  )}
                </AccordionContent>
              </AccordionItem>
      ))}
    </Accordion>
  )
}