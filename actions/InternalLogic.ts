"use server";
import { getDataFromTable } from "@/actions/AWS";
import { auth } from '@clerk/nextjs/server';

// I'm rewriting all the logic on this page. any comments without a function need writing.


// Runs through needed functions to populate data on homepage.
export async function homeFetch({startDate, endDate}:{startDate:string, endDate:string}) {
  const { userId } = await auth();
  if (userId) {
    let userID;
    if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
      userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
    } else {
      userID = userId;
    }
    try {
      // Fetch macro goals, daily macro stats, workout data, body measurements
        const [hormoneData, gymData] = await Promise.all([
          getDataFromTable(userID, "Apexion-Hormone", startDate, endDate),
          getDataFromTable(userID, "Apexion-Gym", startDate, endDate)
        ]);
        
        let summaryData = new Map()
        //@ts-ignore
        hormoneData.forEach((item: { date: any; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.hormone = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, hormoneData: item.data})
          }
        }); //@ts-ignore
        gymData.forEach((item: { date: any; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.gym = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, gymData: item.data})
          }
        });
        const summary = Array.from(summaryData.values())
        console.log(summary)
        return(summary)
      
      
    } catch (error) {
      const errorMessage = 'error occured in homeFetch';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } else {
    const errorMessage = 'You need to be signed in to view data.';
    console.error(errorMessage);
    throw new Error(errorMessage, { cause: 'Missing user ID' });
  }

}

