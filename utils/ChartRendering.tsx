import { MyAreaChart } from "@/components/AreaChart";
import { RenderChartsProps, TestResult } from "./types";
import { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter, } from "@/components/ui/drawer";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RenderCharts({ data, approvedIDs, categorize = false, categoryOrder = [] }: RenderChartsProps) {
  const categorizedData = Object.entries(data)
    .filter(([key]) => !approvedIDs || approvedIDs.includes(key))
    .reduce((acc, [key, value]) => {
      let labType = value[0].labType;

      // Group specific lab types under "Hormones" if categorization is enabled
      const hormoneTypes = [
        "TESTOSTERONE",
        "ESTROGEN",
        "FOLLICLE STIMULATING HORMONE",
        "THYROID STIMULATING HORMONE",
        "LUTEINIZING HORMONE",
      ];

      if (categorize && hormoneTypes.includes(labType)) {
        labType = "Hormones - All";
      }

      if (categorize) {
        if (!acc[labType]) {
          acc[labType] = [];
        }
        acc[labType].push([key, value]);
      } else {
        acc[key] = [[key, value]];
      }

      return acc;
    }, {} as Record<string, [string, TestResult[]][]>);

  // Sort categories based on the provided categoryOrder and then alphabetically
  const sortedCategories = Object.keys(categorizedData).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB; // Both categories are in the categoryOrder
    } else if (indexA !== -1) {
      return -1; // a is in the categoryOrder, b is not
    } else if (indexB !== -1) {
      return 1; // b is in the categoryOrder, a is not
    } else {
      return a.localeCompare(b); // Neither is in categoryOrder, sort alphabetically
    }
  });

  return (
    <div className={`flex ${categorize ? "flex-col" : "flex-row flex-wrap justify-center"}`} style={{ gap: "4rem" }}>
      {sortedCategories.map((labType) => (
        <div key={labType} className="lab">
          {categorize && <h2 className="text-2xl font-bold mb-4">{labType}</h2>}
          {categorize && <hr className="my-4 mb-8 border-neutral-700" />}
          <div className="flex flex-wrap justify-center gap-8">
            {categorizedData[labType].map(([key, value]) => (
              <Drawer key={key}>
                <DrawerTrigger>
                  <MyAreaChart
                    data={value}
                    xAxisKey="month"
                    areas={[
                      { key: "value", color: "url(#fillValue)", order: 3 },
                      { key: "rangeHigh", color: "url(#fillHigh)", order: 2 },
                      { key: "rangeLow", color: "url(#fillLow)", order: 1 },
                    ]}
                  />
                </DrawerTrigger>
                <DrawerContent className="flex gap-4 flex-wrap px-8 py-8">
                  <DrawerHeader>
                    <DrawerTitle>{value[0].displayName}</DrawerTitle>
                    <DrawerDescription>Individual Lab Results - Averaged by Month</DrawerDescription>
                  </DrawerHeader>
                  <div className="flex gap-8 justify-center pb-12">
                  {value.map((element, i) => (
                    <Card key={i} className="rounded-xl">
                      <CardHeader>
                        <CardTitle>
                          {`${element.month} ${element.year}`}
                        </CardTitle>
                        <CardDescription>
                          <div className="mb-4">{`${element.institution}`}</div>
                        </CardDescription>
                        <div className="flex gap-2"><span className="font-medium">Your Value:</span><p className="mb-4 font-normal">{` ${element.value}${element.unit}`}</p></div>
                        <div className="flex gap-2"><span className="font-light">Upper Normal:</span><p className="mb-2 font-extralight">{` ${element.rangeHigh}${element.unit}`}</p></div>
                        <div className="flex gap-2"><span className="font-light">Lower Normal:</span><p className="mb-2 font-extralight">{` ${element.rangeLow}${element.unit}`}</p></div>
                      </CardHeader>
                    </Card>
                  ))}</div>
                </DrawerContent>
              </Drawer>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  
}