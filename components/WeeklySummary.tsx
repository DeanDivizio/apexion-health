'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

type DataItemPoint = {
  dose: number,
  type: string
}
type DataItem = {
  data: DataItemPoint[]
  date: string
  userID: string
}
const refDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

export function WeeklyDataDisplayComponent({ data }: { data: DataItem[] }) {
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
          <CarouselItem key={item.date} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6 min-w-[300px] h-[100%]">
            <div className="p-1 h-full">
              <Card className={`w-full h-full rounded-xl p-4 ${item.date === refDate ? "border-primary border-2" : ""}`}>
                <CardHeader className="p-3">
                  <CardTitle className="text-xl">
                    {new Date(parseInt(item.date.slice(0, 4)), parseInt(item.date.slice(4, 6)) - 1, parseInt(item.date.slice(6))).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-base underline text-neutral-300">Hormones</h3>
                  {item.data && item.data.length > 0 ? (
                    item.data.map(object => (
                      <div className="flex gap-2 text-lg" key={object.type}>
                        <p className="font-medium">{object.dose}<span className="font-light"> mg:</span></p>
                        {['cypionate', 'enanthate', 'propionate', 'cream'].includes(object.type) ?
                          <p>Testosterone</p> :
                          <p>{(object.type || '').charAt(0).toUpperCase() + (object.type || '').slice(1)}</p>
                        }
                      </div>
                    ))
                  ) : (
                    <p className="text-xs md:text-sm">No data recorded</p>
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