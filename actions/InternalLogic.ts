"use server";
import { addItemToTable, genericAddItemToTable, getDataFromTable, getGymMeta_CACHED, updateCustomExercises, updateExerciseData } from "@/actions/AWS";
import { ExerciseGroup } from "@/utils/types";
import { auth } from '@clerk/nextjs/server';
import { unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache'

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
        const [hormoneData, gymData, macroData, medData, suppData] = await Promise.all([
          getDataFromTable(userID, "Apexion-Hormone", startDate, endDate),
          getDataFromTable(userID, "Apexion-Gym", startDate, endDate),
          getDataFromTable(userID, "Apexion-Nutrition", startDate, endDate),
          getDataFromTable(userID, "Apexion-Medication", startDate, endDate),
          getDataFromTable(userID, "Apexion-Supplements", startDate, endDate),
        ]);
        let summaryData = new Map()
        //@ts-ignore
        hormoneData.forEach((item: { date: string; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.hormone = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, hormoneData: item.data})
          }
        }); //@ts-ignore
        gymData.forEach((item: { date: string; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.gym = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, gym: item.data})
          }
        });//@ts-ignore
        macroData.forEach((item: { date: string; data: []; totals?:Macros}) => {
          let calories = 0;
          let protein = 0;
          let carbs = 0;
          let fat = 0;
          try {
          item.data.forEach((meal:[]) => { //@ts-ignore
              meal.foodItems.forEach((item:any) => {
                calories = calories + item.stats.calories * item.numberOfServings;
                protein = protein + item.stats.protein * item.numberOfServings;
                carbs = carbs + item.stats.carbs * item.numberOfServings;
                fat = fat + item.stats.fat * item.numberOfServings;
              });
            }
          )
          item = {...item, totals: {calories:calories, protein:protein, carbs:carbs, fat:fat}}
        } catch (err){
            console.log(err)
          }
          
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.macros = item.totals;
          } else {
            summaryData.set(item.date, {date: item.date, macros: item.totals})
          }
        }); //@ts-ignore
        medData.forEach((item: { date: string; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.meds = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, meds: item.data})
          }
        });//@ts-ignore
        suppData.forEach((item: { date: string; data: []}) => {
          const existingItem = summaryData.get(item.date)
          if (existingItem) {
            existingItem.supps = item.data;
          } else {
            summaryData.set(item.date, {date: item.date, supps: item.data})
          }
        });
        let summary = Array.from(summaryData.values())

        function OrderData(data: any[]) {
          let orderedData: any[] = [];
          data.forEach((item) => {
              if (orderedData.length === 0) {
                  orderedData.push(item);
              } else {
                  let left = 0;
                  let right = orderedData.length - 1;
                  while (left <= right) {
                      const mid = Math.floor((left + right) / 2);
                      if (orderedData[mid].date < item.date) {
                          left = mid + 1;
                      } else {
                          right = mid - 1;
                      }
                  }
                  orderedData.splice(left, 0, item);
              }
          });
          orderedData = orderedData.reverse()
          return orderedData;
        }

        summary = OrderData(summary);
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

export async function fetchGymMeta(userID: any){
  "use cache"
  cacheTag('gymMeta')
  const gymMetaResponse = await getGymMeta_CACHED(userID);
  return gymMetaResponse[0];
};

export async function addCustomExercise(customExercises: {group: string, items:string[]}[], exercise: string, category: string) {
  // Find the index of the group that matches the category
  let index = customExercises.findIndex((groupObj) => groupObj.group === category);
  
  if (index === -1) {
    // If category doesn't exist, create a new group
    customExercises.push({
      group: category,
      items: [exercise]
    });
  } else {
    // If category exists, append the exercise to its items array
    customExercises[index].items.push(exercise);
  }

  const response = await updateCustomExercises(customExercises);
  if (response.$metadata.httpStatusCode === 200) {
    revalidateTag('gymMeta')
  }
  return response;
}

function mutateGymMetaPostWorkout(workout: any, gymMeta: any) {
  workout.exercises.forEach((exercise: any) => {
    let exerciseType = exercise.exerciseType;
    if (exercise.modifications) {
      if (exercise.modifications.grip && exercise.modifications.grip != "normal") {
        exerciseType = exerciseType + "_" + exercise.modifications.grip;
      }
      if (exercise.modifications.movementPlane && exercise.modifications.movementPlane != "normal") {
        exerciseType = exerciseType + "_" + exercise.modifications.movementPlane;
      }
    }
    if (!gymMeta.exerciseData[exerciseType]) {
      gymMeta.exerciseData[exerciseType] = {
        exercise: exerciseType,
        mostRecentSession: null,
        recordSet: null,
        notes: null
      };
    }

    gymMeta.exerciseData[exerciseType].mostRecentSession = {
      date: workout.date,
      sets: exercise.sets
    };

    exercise.sets.forEach((set: any) => {
      let setVolume;
      if (set.repsRight) {
        setVolume = set.weight * (set.reps + set.repsRight) / 2
      } else {
        setVolume = set.weight * set.reps
      }
      
      if (!gymMeta.exerciseData[exerciseType].recordSet || 
          setVolume > gymMeta.exerciseData[exerciseType].recordSet.totalVolume) {
            const recordSet:any = {
            date: workout.date,
            weight: set.weight,
            reps: set.reps,
            totalVolume: setVolume
          };
        if (set.repsRight) {
          recordSet.repsRight = set.repsRight;
        }
        gymMeta.exerciseData[exerciseType].recordSet = recordSet;
      }
    });
  });
  return gymMeta;
}

export async function logWorkout(workout: any, gymMeta: any) {
  gymMeta = mutateGymMetaPostWorkout(workout, gymMeta);
  try {
    const [gymMetaResponse, workoutResponse] = await Promise.all([
      updateExerciseData(gymMeta.exerciseData),
      addItemToTable(workout, "Apexion-Gym")
    ]);
    if (gymMetaResponse.$metadata.httpStatusCode === 200) {
      revalidateTag('gymMeta')
    }
    console.log(workoutResponse, gymMetaResponse)
    return workoutResponse;
  } catch (error) {
    console.error(error)
    throw new Error('Error logging workout')
  }
}

