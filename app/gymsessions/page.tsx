"use client"

import { useEffect, useMemo, useState, useContext } from "react"
import { listWorkoutSessionsAction } from "@/actions/gym"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui_primitives/accordion"
import { Skeleton } from "@/components/ui_primitives/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui_primitives/scroll-area"
import { capitalize, spellOutDate } from "@/lib/utils"
import { MobileHeaderContext } from "@/context/MobileHeaderContext"
import { SideNav } from "@/components/global/SideNav"
import type { RepCount, WorkoutSession } from "@/lib/gym"

function formatRepCount(reps: RepCount): string {
  if (reps.bilateral !== undefined) return `${reps.bilateral}`
  if (reps.left !== undefined && reps.right !== undefined) return `${reps.left}/${reps.right}`
  return ""
}

export default function GymSessions() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const { setMobileHeading, setHeaderComponentLeft, setHeaderComponentRight } = useContext(MobileHeaderContext)

  useEffect(() => {
    setMobileHeading("Gym Sessions")
    setHeaderComponentLeft(<SideNav />)
    setHeaderComponentRight(<div />)
    return () => {
      setMobileHeading("")
      setHeaderComponentLeft(<div />)
      setHeaderComponentRight(<div />)
    }
  }, [setMobileHeading, setHeaderComponentLeft, setHeaderComponentRight])

  useEffect(() => {
    const load = async () => {
      const data = await listWorkoutSessionsAction()
      setSessions(data)
      setLoading(false)
    }
    load()
  }, [])

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>()
    for (const session of sessions) {
      const group = map.get(session.date) ?? []
      group.push(session)
      map.set(session.date, group)
    }
    return Array.from(map.entries())
  }, [sessions])

  if (loading) {
    return (
      <main className="w-full min-h-screen pt-24 px-4">
        <h1 className="w-full text-center text-3xl font-medium mb-8">Gym Sessions</h1>
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded mb-4" />
        <Skeleton className="w-full h-[75px] rounded" />
      </main>
    )
  }

  if (sessionsByDate.length === 0) {
    return (
      <main className="w-full min-h-screen pt-24 px-4">
        <h1 className="w-full text-center text-3xl font-medium mb-8">Gym Sessions</h1>
        <p className="text-center text-neutral-400">No sessions logged yet.</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen pt-24 pb-16 bg-gradient-to-br from-indigo-950/15 to-neutral-950">
      <div className="w-full flex flex-col items-center justify-center">
        <Accordion type="single" collapsible defaultValue={sessionsByDate[0][0]}>
          {sessionsByDate.map(([date, dateSessions], index) => (
            <AccordionItem
              key={date}
              value={date}
              className={`min-w-[350px] w-96 max-w-[400px] flex flex-col items-start justify-center mb-8 px-4 rounded ${
                index % 2 === 0
                  ? "bg-gradient-to-br from-green-950/20 to-neutral-950"
                  : "bg-gradient-to-br from-blue-950/20 to-neutral-950"
              }`}
            >
              <div className="w-full flex flex-col items-between justify-center">
                <AccordionTrigger className="w-full flex flex-row items-center justify-between">
                  <h2 className="text-lg font-bold ">{spellOutDate(date)}</h2>
                </AccordionTrigger>
                <AccordionContent>
                  {dateSessions.map((session) => (
                    <div key={`${session.startTime}-${session.endTime}`} className="mb-6">
                      <h3 className="text-xs font-thin italic mb-2">
                        {session.startTime} - {session.endTime}
                      </h3>
                      <ScrollArea className="w-full max-h-[400px] pr-4">
                        <div className="grid grid-cols-2 gap-4">
                          {session.exercises.map((exercise) => (
                            <div key={exercise.exerciseType} className="mb-4">
                              <h4 className="text-md font-medium">{capitalize(exercise.exerciseType)}</h4>
                              {exercise.type === "strength" &&
                                exercise.sets?.map((set, setIndex) => (
                                  <div key={setIndex} className="flex flex-row items-center justify-start gap-1 pl-4 py-1 text-sm">
                                    <p className="font-medium">
                                      {formatRepCount(set.reps)} <span className="text-neutral-200 font-thin">reps</span>
                                    </p>
                                    <p className="text-neutral-400 text-xs">@</p>
                                    <p className="font-medium">
                                      {set.weight}
                                      <span className="text-neutral-300 font-thin">lbs</span>
                                    </p>
                                  </div>
                                ))}
                              {exercise.type === "cardio" && (
                                <div className="pl-4 py-1 text-sm text-neutral-300">
                                  {exercise.duration} min
                                  {exercise.distance ? ` · ${exercise.distance} ${exercise.unit ?? ""}` : ""}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <ScrollBar />
                      </ScrollArea>
                    </div>
                  ))}
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  )
}