"use server";
import { getItemsByPrimaryKeys, getAllItems } from "@/actions/AWS";
import { Result, Test, IndividualResult } from "@/utils/types"

// This takes data from AWS and separates the individual test results for averaging
 function separateResults(data: Test[]): IndividualResult[] { 
    // Helper function to get the month name from a month number
    const getMonthName = (monthNumber: number): string => {
        const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
      ];
      return months[monthNumber - 1];
    };
  
    // Flatten the data into a single array of SeparatedResults
    const separatedResults = data.flatMap(test => test.results.map((result: Result) => ({ 
      LabType: test.LabType,
      institution: test.institution,
      year: test.LabDate.toString().slice(0, 4),
      month: getMonthName(parseInt(test.LabDate.toString().slice(4, 6))),
      id: result.id,
      displayName: result.displayName,
      unit: result.unit,
      value: result.value,
      rangeHigh: result.rangeHigh,
      rangeLow: result.rangeLow  // Ensure proper assignment of range values
  
    })));
    return separatedResults; 
  }

// This takes the separeated results and organizes/averages them based on id + year + month
 function averageResultsByMonth(separatedResults: IndividualResult[]): { count: number, id: string, displayName: string, institution: string }[] {
    const groupedResults: { [key: string]: { count: number, totalValue: number, totalRangeHigh: number, totalRangeLow: number, displayName: string, institution: string, id: string, month: string, unit: string, year: string, LabType:string } } = {};
  
    separatedResults.forEach(({ institution, year, month, value, rangeHigh, rangeLow, id, displayName, unit, LabType }) => { 
      const key = `${id}${year}${month}`; 
      if (groupedResults[key]) {
        groupedResults[key].count++;
        groupedResults[key].totalValue += value;
        groupedResults[key].totalRangeHigh += rangeHigh || 0;
        groupedResults[key].totalRangeLow += rangeLow || 0;
      } else {
        groupedResults[key] = { count: 1, totalValue: value, totalRangeHigh: rangeHigh || 0, totalRangeLow: rangeLow || 0, id: id, displayName: displayName, institution: institution, month: month, unit: unit, year:year, LabType:LabType }; // Include id and displayName here 
      }
    });
  
    const averagedResults = Object.values(groupedResults).map((result) => ({
      count: result.count,
      value: result.totalValue / result.count,
      rangeHigh: result.totalRangeHigh / result.count,
      rangeLow: result.totalRangeLow / result.count,
      id: result.id, 
      displayName: result.displayName,  
      institution: result.institution,
      month: result.month,
      unit: result.unit,
      year: result.year,
      labType: result.LabType
  
    }));
  
    return averagedResults; 
  }

// This takes the separeated results and organizes/averages them based on id + year
 function averageResultsByYear(separatedResults: IndividualResult[]): { count: number, id: string, displayName: string, institution: string }[] {
    const groupedResults: { [key: string]: { count: number, totalValue: number, totalRangeHigh: number, totalRangeLow: number, displayName: string, institution: string, id: string, year: string } } = {};
  
    separatedResults.forEach(({ institution, year, value, rangeHigh, rangeLow, id, displayName }) => { 
      const key = `${id}${year}`; 
      if (groupedResults[key]) {
        groupedResults[key].count++;
        groupedResults[key].totalValue += value;
        groupedResults[key].totalRangeHigh += rangeHigh || 0;
        groupedResults[key].totalRangeLow += rangeLow || 0;
      } else {
        groupedResults[key] = { count: 1, totalValue: value, totalRangeHigh: rangeHigh || 0, totalRangeLow: rangeLow || 0, id: id, displayName: displayName, institution: institution, year: year }; // Include id and displayName here 
      }
    });
  
    const averagedResults = Object.values(groupedResults).map((result) => ({
      count: result.count,
      value: result.totalValue / result.count,
      rangeHigh: result.totalRangeHigh / result.count,
      rangeLow: result.totalRangeLow / result.count,
      id: result.id, 
      displayName: result.displayName,  
      institution: result.institution,
      year: result.year
  
    }));
  
    return averagedResults; 
  }

// Formats averaged data into {id[result{data}]} format
  function formatDataForInividualGraph(data: any[]){
    const transformedData = data.reduce((acc: { [x: string]: any[]; }, item: { [x: string]: any; id: any; }) => {
        const { id, ...rest } = item;
        // If the ID key doesn't exist in the accumulator, create it as an empty array
        if (!acc[id]) {
          acc[id] = [];
        }
        // Push the current object (excluding the `id` key) into the array for this ID
        acc[id].push(rest);
        return acc;
      }, {});

      return(transformedData);
  }

// Runs through needed functions to populate data on homepage. exported to allow calling on home page
  export async function homeFetch(tests: string[]) {
    let data = await getItemsByPrimaryKeys(tests);
    let separatedData = separateResults(data);
    data = averageResultsByMonth(separatedData);
    data = formatDataForInividualGraph(data);
    // console.log(data);
    return(data);
  }

  export async function categoryFetch(table?:string) {
    let data = await getAllItems(table);
    let separatedData = separateResults(data);
    data = averageResultsByMonth(separatedData);
    data = formatDataForInividualGraph(data);
    return(data);
  }