"use server";
import { addItemToTable, genericAddItemToTable, getDataFromTable, getGymMeta_CACHED, updateCustomExercises, updateExerciseData, getAllDataFromTableByUser, updateCustomSupplements } from "@/actions/AWS";
import { listWorkoutSessions } from "@/lib/gym/server/gymService";
import { getMacroSummaryByDateRange } from "@/lib/nutrition/server/nutritionService";
import { getMedsDateRangeSummary } from "@/lib/medication/server/medicationService";
import { ExerciseGroup } from "@/utils/types";
import { auth } from '@clerk/nextjs/server';
import { unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache'

// Runs through needed functions to populate data on homepage.
export async function homeFetch({startDate, endDate, timezoneOffsetMinutes = 0}:{startDate:string, endDate:string, timezoneOffsetMinutes?: number}) {
  const { userId } = await auth();
  if (userId) {
    let userID;
    if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
      userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
    } else {
      userID = userId;
    }
    try {
        const [hormoneData, gymSessions, macroData, substanceData] = await Promise.all([
          getDataFromTable(userID, "Apexion-Hormone", startDate, endDate),
          listWorkoutSessions(userId, { startDate, endDate }),
          getMacroSummaryByDateRange(userId, startDate, endDate),
          getMedsDateRangeSummary(userId, startDate, endDate, timezoneOffsetMinutes),
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
        gymSessions.forEach((session) => {
          const existingItem = summaryData.get(session.date)
          if (existingItem) {
            existingItem.gym = [...(existingItem.gym ?? []), session]
          } else {
            summaryData.set(session.date, {date: session.date, gym: [session]})
          }
        });

        macroData.forEach((daySummary) => {
          const existingItem = summaryData.get(daySummary.dateStr);
          const macros = {
            calories: daySummary.calories,
            protein: daySummary.protein,
            carbs: daySummary.carbs,
            fat: daySummary.fat,
          };
          if (existingItem) {
            existingItem.macros = macros;
          } else {
            summaryData.set(daySummary.dateStr, { date: daySummary.dateStr, macros });
          }
        });

        substanceData.forEach(({ date, sessions }) => {
          const existingItem = summaryData.get(date);
          if (existingItem) {
            existingItem.substances = sessions;
          } else {
            summaryData.set(date, { date, substances: sessions });
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

// Legacy gym meta fetch (DynamoDB). Replaced by actions/gym.getGymMetaAction.
export async function fetchGymMeta(userID: any){
  // "use cache"
  // cacheTag('gymMeta')
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
    revalidateTag('gymMeta', 'max')
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

// Legacy gym workout logger (DynamoDB). Replaced by actions/gym.createWorkoutSessionAction.
export async function logWorkout(workout: any, gymMeta: any) {
  gymMeta = mutateGymMetaPostWorkout(workout, gymMeta);
  try {
    const [gymMetaResponse, workoutResponse] = await Promise.all([
      updateExerciseData(gymMeta.exerciseData),
      addItemToTable(workout, "Apexion-Gym")
    ]);
    if (gymMetaResponse.$metadata.httpStatusCode === 200) {
      revalidateTag('gymMeta', 'default')
    }
    console.log(workoutResponse, gymMetaResponse)
    return workoutResponse;
  } catch (error) {
    console.error(error)
    throw new Error('Error logging workout')
  }
}

export async function fetchCustomSupplements() {
  const customSupplements = await getAllDataFromTableByUser("Apexion-Supplements_UserMeta");
  return customSupplements;
}

export async function updateCustomSupplementsWrapper(customSupplements: any) {
  const response = await updateCustomSupplements(customSupplements);
  return response;
}

