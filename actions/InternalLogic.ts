"use server";
import { addItemToTable, genericAddItemToTable, getDataFromTable, getGymMeta_CACHED, updateCustomExercises, updateExerciseData, getAllDataFromTableByUser, updateCustomSupplements } from "@/actions/AWS";
import { listWorkoutSessions } from "@/lib/gym/server/gymService";
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
        const [hormoneData, gymSessions, macroData, medData, suppData] = await Promise.all([
          getDataFromTable(userID, "Apexion-Hormone", startDate, endDate),
          listWorkoutSessions(userId, { startDate, endDate }),
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
        gymSessions.forEach((session) => {
          const existingItem = summaryData.get(session.date)
          if (existingItem) {
            existingItem.gym = [...(existingItem.gym ?? []), session]
          } else {
            summaryData.set(session.date, {date: session.date, gym: [session]})
          }
        });//@ts-ignore
        macroData.forEach((item: { date: string; data: []; totals?:Macros}) => {
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;
          try {
            item.data.forEach((meal: any) => {
              // this function is needed until we do the Nutrition
              // database migration. It accounts for the new data shape
              const mealMacros = calculateMacrosForMeal(meal);
              totalCalories += mealMacros.calories;
              totalProtein += mealMacros.protein;
              totalCarbs += mealMacros.carbs;
              totalFat += mealMacros.fat;
            });
            item = {...item, totals: {calories:totalCalories, protein:totalProtein, carbs:totalCarbs, fat:totalFat}}
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

const calculateMacrosFromFoodItems = (meal: any) => {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  meal.foodItems.forEach((item: any) => {
    if (item.stats) {
      calories += item.stats.calories * item.numberOfServings;
      protein += item.stats.protein * item.numberOfServings;
      carbs += item.stats.carbs * item.numberOfServings;
      fat += item.stats.fat * item.numberOfServings;
    } else {
      calories += item.nutrients.calories * item.numberOfServings;
      protein += item.nutrients.protein * item.numberOfServings;
      carbs += item.nutrients.carbs * item.numberOfServings;
      fat += item.nutrients.fats.total * item.numberOfServings;
    }
  });

  return { calories, protein, carbs, fat };
};

const calculateMacrosFromMealItems = (meal: any) => {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  meal.mealItems.forEach((item: any) => {
    if (item.stats) {
      calories += item.stats.calories * item.numberOfServings;
      protein += item.stats.protein * item.numberOfServings;
      carbs += item.stats.carbs * item.numberOfServings;
      fat += item.stats.fat * item.numberOfServings;
    } else {
      calories += item.nutrients.calories * item.numberOfServings;
      protein += item.nutrients.protein * item.numberOfServings;
      carbs += item.nutrients.carbs * item.numberOfServings;
      fat += item.nutrients.fats.total * item.numberOfServings;
    }
  });

  return { calories, protein, carbs, fat };
};

const calculateMacrosForMeal = (meal: any) => {
  if (meal.foodItems) {
    return calculateMacrosFromFoodItems(meal);
  } else if (meal.mealItems) {
    return calculateMacrosFromMealItems(meal);
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
};
