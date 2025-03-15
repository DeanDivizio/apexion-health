"use server";
import { getDataFromTable } from "@/actions/AWS";
import { Result, Test, IndividualResult } from "@/utils/types";
import { auth } from '@clerk/nextjs/server';
import { table } from "console";

// I'm rewriting all the logic on this page. any comments without a function need writing.


// Runs through needed functions to populate data on homepage. exported to allow calling on home page
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
      let hormoneData:any = {};
      let gymData:any = {};

      Promise.all([
        await getDataFromTable(userID, "Apexion-Hormone", startDate, endDate),
        await getDataFromTable(userID, "Apexion-Gym", startDate, endDate)
      ]).then((responses) => {
        hormoneData = responses[0];
        gymData = responses [1];
      })
  
      return({hormoneData, gymData})
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

