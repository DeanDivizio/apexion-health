'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="flex gap-4 overflow-x-scroll">
      {data.map((item) => (
        <Card key={item.date} className={`w-full min-w-[300px] rounded-xl ${item.date == refDate ? "border-white border-2" : null}`}>
          <CardHeader>
            <CardTitle>{new Date(item.date.slice(0, 4), item.date.slice(4, 6) - 1, item.date.slice(6)).toLocaleString('en-us', { weekday: 'long', month: 'short', day: 'numeric' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2 underline">Hormones</h3>
            {(item.data).map(object => (
              <div className="flex gap-2" key={object.type}>
                <p>{object.dose}<span className="font-light">mg:</span></p>
                {['cypionate', 'enanthate', 'propionate', 'cream'].includes(object.type) ?
                  <p>Testosterone</p> :
                  <p>{(object.type || '').charAt(0).toUpperCase() + (object.type || '').slice(1)}</p>
                }     
              </div>
            )) || <p>No data recorded</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}