'use client'
import { GymDataPoints, Exercises, HormoneAdministration } from "@/utils/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui_primitives/accordion";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";


export function WeeklyDataDisplayComponent({ data, isLoading }: { data: any[], isLoading: any }) {
  const [orderedData, setOrderedData] = useState<any[]>(data);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const isMobile = useIsMobile();
  

  const getExerciseName = (value: string) => {
    const spacedValue = value.replace(/([A-Z])/g, ' $1');
    return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
  };

  useEffect(() => {
    setOrderedData(data)
    if (orderedData.length > 0) {
      let items: string[] = [];
      if (isMobile) {
        setOpenItems([String(orderedData[6].date), String(orderedData[5].date)])
      } else {
        orderedData.forEach(item => items.push(String(item.date)));
        setOpenItems(items);
      }
    }

  }, [data])

  if (isLoading) {
    return (
      <Skeleton className="w-full bg-neutral-800 h-32 mb-4" />
    )
  } else return (
    <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
      {orderedData?.map((item) => (
        <AccordionItem key={String(item.date)} value={String(item.date)} className="mb-4 ">
          <AccordionTrigger className="justify-center gap-4 text-xl py-4 px-6 bg-neutral-950 rounded-t-xl data-[state=open]:rounded-b-none data-[state=closed]:rounded-b-xl">
            {new Date(parseInt(item.date.slice(0, 4)), parseInt(item.date.slice(4, 6)) - 1, parseInt(item.date.slice(6))).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-4 pb-6 grid grid-cols-1 lg:grid-cols-2 bg-neutral-950/35 backdrop-blur-xl rounded-b-xl">
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-2 tracking-wide text-base text-neutral-300">Macros</h3>
              {item.macros ? (
                <div className="flex flex-col gap-2 text-base" key={`${item.date}-macros`}>
                  <div className="grid grid-cols-2 gap-y-2">
                    <p className="font-semibold" ><span className="font-light mr-2">Calories:</span>{item.macros.calories}</p>
                    <p className="font-semibold"><span className="font-light mr-2">Protein:</span>{item.macros.protein}<span className="font-thin text-sm ml-1">g</span></p>
                    <p className="font-semibold"><span className="font-light mr-2">Carbs:</span>{item.macros.carbs}<span className="font-thin text-sm ml-1">g</span></p>
                    <p className="font-semibold"><span className="font-light mr-2">Fat:</span>{item.macros.fat}<span className="font-thin text-sm ml-1">g</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-xs md:text-sm">No food recorded</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Gym Data</h3>
              {item.gym && item.gym.length > 0 ? (
                item.gym.map((object: GymDataPoints) => (
                  <div className="flex flex-col gap-2 text-lg" key={Number(object.startTime)}>
                    <h4 className="font-light text-base">{`${object.startTime} - ${object.endTime}`}</h4>
                    <ul className="pl-2 border-l grid grid-cols-2 xl:grid-cols-3">
                      {
                        object.exercises.map((exercise: Exercises) => (
                          <li key={exercise.exerciseType} className="text-base font-light">{`- ${getExerciseName(exercise.exerciseType)}`}</li>
                        ))
                      }
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm">No workout recorded</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Medications</h3>
              {item.meds && item.meds.length > 0 ? (
                item.meds.map((object: any) => (
                  <div className="flex flex-col gap-2 text-lg" key={Number(object.time)}>
                    <div className="pl-2 border-l">
                      {
                        object.meds.map((med: any) => (
                          <p key={med.name} className="text-base font-light">{`${med.name}:`}<span className="font-semibold pl-2 pr-1">{med.dose}</span>{med.unit == "milligrams" ? "mg" : med.unit == "grams" ? "g" : "pg"}</p>
                        ))
                      }
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm">No medication recorded</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Supplements</h3>
              {item.supps && item.supps.length > 0 ? (
                item.supps.map((object: any) => (
                  <div className="flex flex-col gap-2 text-lg" key={object.time}>
                    <h4 className="font-light text-base">{`${object.time}`}</h4>
                    <div className="pl-2 border-l">
                      {
                        object.supplements.map((supp: any) => (
                          <p key={supp.name} className="text-base font-light">{`${supp.name}:`}<span className="font-semibold pl-2 pr-1">{supp.dose}</span>{supp.unit == "milligrams" ? "mg" : supp.unit == "grams" ? "g" : "pg"}</p>
                        ))
                      }
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm">No supplements recorded</p>
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 b w-fit pr-2 mb-1 tracking-wide text-base text-neutra3-300">Hormones</h3>
              {item.hormoneData && item.hormoneData.length > 0 ? (
                item.hormoneData.map((object: any) => (
                  <div className="flex gap-2 text-lg" key={object.type}>
                    <p className="font-medium">{object.dose}<span className="font-extralight text-sm"> mg: </span></p>
                    {['cypionate', 'enanthate', 'propionate', 'cream'].includes(object.type) ?
                      <p>Testosterone</p> :
                      <p>{(object.type || '').charAt(0).toUpperCase() + (object.type || '').slice(1)}</p>
                    }
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm">No hormone data recorded</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}