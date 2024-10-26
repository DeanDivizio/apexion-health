'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { SummaryData, GymDataPoints, Exercises, HormoneAdministration } from "@/utils/types";


const refDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

export function WeeklyDataDisplayComponent({ data }: { data: SummaryData[] }) {

  const getExerciseName = (value: string) => {
    const spacedValue = value.replace(/([A-Z])/g, ' $1');
    return spacedValue.charAt(0).toUpperCase() + spacedValue.slice(1);
  };

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-[96vw] h-[400px]"
    >
      <CarouselContent className="-ml-2 md:-ml-4 h-full">
        {data.map((item) => (
          <CarouselItem key={Number(item.date)} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6 min-w-[300px] h-[100%]">
            <div className="p-1 h-full">
              <Card className={`w-full h-full rounded-xl p-4 ${item.date === refDate ? "border-primary border-2" : ""}`}>
                <CardHeader className="p-3">
                  <CardTitle className="text-xl">
                    {new Date(parseInt(item.date.slice(0, 4)), parseInt(item.date.slice(4, 6)) - 1, parseInt(item.date.slice(6))).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-base underline text-neutral-300">Hormones</h3>
                  {item.hormoneData && item.hormoneData.data.length > 0 ? (
                    item.hormoneData.data.map((object: any) => (
                      <div className="flex gap-2 text-lg" key={object.type}>
                        <p className="font-medium">{object.dose}<span className="font-light"> mg:</span></p>
                        {['cypionate', 'enanthate', 'propionate', 'cream'].includes(object.type) ?
                          <p>Testosterone</p> :
                          <p>{(object.type || '').charAt(0).toUpperCase() + (object.type || '').slice(1)}</p>
                        }
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm">No Hormone data recorded</p>
                  )}
                  <h3 className="font-semibold mb-2 mt-4 text-base underline text-neutral-300">Gym Data</h3>
                  {item.gymData && item.gymData.data.length > 0 ? (
                    item.gymData.data.map((object: GymDataPoints) => (
                      <div className="flex flex-col gap-2 text-lg" key={Number(object.startTime)}>
                        <h4 className="font-light text-base">{`${object.startTime} - ${object.endTime}`}</h4>
                        <div className="pl-2 border-l">
                        {
                          object.exercises.map((exercise: Exercises) => (
                            <p className="text-base font-light">{getExerciseName(exercise.exerciseType)}</p>
                          ))
                          }
                          </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm">No Workout recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}