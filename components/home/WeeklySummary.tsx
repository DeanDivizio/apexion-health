'use client'
import { GymDataPoints, Exercises, SummaryData, SubstanceSession } from "@/utils/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui_primitives/accordion";
import { useState } from "react";
import { Skeleton } from "@/components/ui_primitives/skeleton";


export function WeeklyDataDisplayComponent({ data, isLoading }: { data: SummaryData, isLoading: boolean }) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const getExerciseName = (value: string) => {
    const spacedValue = value.replace(/([A-Z])/g, ' $1');
    return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
  };

  if (isLoading) {
    return (
      <Skeleton className="w-full bg-neutral-800 h-32 mb-4" />
    )
  }

  return (
    <Accordion type="multiple" className="w-full" value={openItems} onValueChange={setOpenItems}>
      {data?.map((item) => (
        <AccordionItem key={String(item.date)} value={String(item.date)} className="mb-4">
          <AccordionTrigger className="justify-center gap-4 text-xl py-4 px-6 bg-neutral-950 rounded-t-xl data-[state=open]:rounded-b-none data-[state=closed]:rounded-b-xl">
            {new Date(parseInt(item.date.slice(0, 4)), parseInt(item.date.slice(4, 6)) - 1, parseInt(item.date.slice(6))).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-4 pb-6 grid grid-cols-1 lg:grid-cols-2 bg-neutral-950/35 backdrop-blur-xl rounded-b-xl">
            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-2 tracking-wide text-base text-neutral-300">Macros</h3>
              {item.macros ? (
                <div className="grid grid-cols-2 gap-y-2 text-base" key={`${item.date}-macros`}>
                  <p className="font-semibold"><span className="font-light mr-2">Calories:</span>{item.macros.calories}</p>
                  <p className="font-semibold"><span className="font-light mr-2">Protein:</span>{item.macros.protein}<span className="font-thin text-sm ml-1">g</span></p>
                  <p className="font-semibold"><span className="font-light mr-2">Carbs:</span>{item.macros.carbs}<span className="font-thin text-sm ml-1">g</span></p>
                  <p className="font-semibold"><span className="font-light mr-2">Fat:</span>{item.macros.fat}<span className="font-thin text-sm ml-1">g</span></p>
                </div>
              ) : (
                <p className="text-xs md:text-sm text-neutral-500">No food recorded</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Gym Data</h3>
              {item.gym && item.gym.length > 0 ? (
                item.gym.map((object: GymDataPoints) => (
                  <div className="flex flex-col gap-2" key={Number(object.startTime)}>
                    <h4 className="font-light text-base">{`${object.startTime} - ${object.endTime}`}</h4>
                    <ul className="pl-2 border-l grid grid-cols-2 xl:grid-cols-3">
                      {object.exercises.map((exercise: Exercises) => (
                        <li key={exercise.exerciseType} className="text-base font-light">{`- ${getExerciseName(exercise.exerciseType)}`}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-xs md:text-sm text-neutral-500">No workout recorded</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-light border-b border-blue-900 w-fit pr-2 mb-1 tracking-wide text-base text-neutral-300">Meds &amp; Supplements</h3>
              {item.substances && item.substances.length > 0 ? (
                <div className="space-y-3">
                  {item.substances.map((session: SubstanceSession) => (
                    <SubstanceSessionRow key={session.sessionId} session={session} />
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-neutral-500">No meds or supplements recorded</p>
              )}
            </div>

          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function SubstanceSessionRow({ session }: { session: SubstanceSession }) {
  const timeStr = formatTime(session.loggedAt);
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1">{timeStr}</p>
      <ul className="space-y-0.5">
        {session.items.map((item, i) => (
          <li key={i} className="text-sm text-neutral-100 flex items-start gap-1.5">
            <span className="text-violet-400 mt-1 flex-shrink-0">·</span>
            <span>
              {item.substanceName}
              {item.compoundServings != null ? (
                <span className="text-neutral-500">
                  {" "}— {item.compoundServings} serving{item.compoundServings !== 1 ? "s" : ""}
                </span>
              ) : item.doseValue != null ? (
                <span className="text-neutral-500">
                  {" "}— {item.doseValue} {item.doseUnit ?? "mg"}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}
