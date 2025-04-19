"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { auth } from '@clerk/nextjs/server'
import { getDataFromTable } from '@/actions/AWS'
import { setPublicMetadata } from '@/actions/Clerk'
import { genericAddItemToTable } from '@/actions/AWS'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

// Initialize the DynamoDB client
const client = new DynamoDBClient({
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    region,
});
const oldTableName = "ClinicalLabs"
const newTableName = "Apexion-Labs"
const docClient = DynamoDBDocumentClient.from(client);

/*********************************CLINICAL LABS DATA MIGRATION**********************************/
async function migrateData() {
    const transformItem = (item) => {
        return {
            "userID": "user_foobar",  //this was my userId. obfuscated for security
            "labDateType": `${item.LabDate}${item.LabType}`,
            "labType": item.LabType,
            "labDate": item.LabDate,
            "institution": item.institution,
            "results": item.results
        };
    };

    try {
        const scanParams = {
            "TableName": oldTableName,
        };

        try {
            const data = await docClient.send(new ScanCommand(scanParams));
            const items = data.Items;
            if (items.length === 0) {
                console.log("No more items to migrate.");
                return;
            }

            for (const item of items) {
                try {
                    const transformedItem = transformItem(item);
                    await docClient.send(new PutCommand({
                        TableName: newTableName,
                        Item: transformedItem
                    }));
                    console.log(`Migrated item ${transformedItem.labType + " " + transformedItem.labDate}`);
                } catch (error) {
                    console.error(`Error transforming or writing item:`, error);
                    throw error;
                }
            }

        } catch (error) {
            console.error("Error scanning table:", error);
            throw error;
        }
    } catch (error) { console.error("error in main try catch block") };

    console.log("Migration completed successfully.");
}

/************************************INIT PR AND LAST SESSION************ */
async function initPrAndLastSession() {
    const { userId } = await auth();
    let userID;
    if (userId) {
        if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
            userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
        } else {
            userID = userId;
        }
    }
    
    const allGymData = await getDataFromTable(userID, 'Apexion-Gym', '20000101', '30001231');
    console.log('Retrieved gym data:', allGymData);
    
    if (!allGymData || allGymData.length === 0) {
        console.log('No gym data found');
        return {};
    }

    const gymMarkers = new Map();

    allGymData.forEach(workout => {
        console.log('Processing workout:', workout);
        const dateRef = workout.date;
        
        // Access exercises from the nested data array
        const workoutData = workout.data?.[0];
        if (!workoutData?.exercises) {
            console.log('No exercises in workout:', workout);
            return;
        }
        
        workoutData.exercises.forEach(exercise => {
            console.log('Processing exercise:', exercise);
            if (!exercise.exerciseType || !exercise.sets?.length) {
                console.log('Invalid exercise data:', exercise);
                return;
            }

            const existingMarker = gymMarkers.get(exercise.exerciseType);
            
            // Calculate volume for a set
            const calculateVolume = (set) => {
                const reps = set.reps || 0;
                const repRight = set.repRight || 0;
                return set.weight * (reps + repRight);
            };

            if (existingMarker) {
                // Update most recent session if this is newer (comparing string dates)
                if (!existingMarker.mostRecentSession || existingMarker.mostRecentSession.date < dateRef) {
                    existingMarker.mostRecentSession = {
                        date: dateRef,
                        sets: exercise.sets,
                    };
                }

                // Check for new record set
                exercise.sets.forEach(set => {
                    const volume = calculateVolume(set);
                    if (!existingMarker.recordSet || volume > existingMarker.recordSet.totalVolume) {
                        existingMarker.recordSet = {
                            date: dateRef,
                            weight: set.weight,
                            reps: set.reps,
                            repRight: set.repRight,
                            totalVolume: volume,
                        };
                    }
                });
            } else {
                // Initialize new exercise marker
                const firstSet = exercise.sets[0];
                const initialVolume = calculateVolume(firstSet);
                
                const newMarker = {
                    exercise: exercise.exerciseType,
                    mostRecentSession: {
                        date: dateRef,
                        sets: exercise.sets,
                    },
                    recordSet: {
                        date: dateRef,
                        weight: firstSet.weight,
                        reps: firstSet.reps,
                        repRight: firstSet.repRight,
                        totalVolume: initialVolume,
                    },
                    notes: "",
                };

                // Check remaining sets for potential record
                exercise.sets.slice(1).forEach(set => {
                    const volume = calculateVolume(set);
                    if (volume > newMarker.recordSet.totalVolume) {
                        newMarker.recordSet = {
                            date: dateRef,
                            weight: set.weight,
                            reps: set.reps,
                            repRight: set.repRight,
                            totalVolume: volume,
                        };
                    }
                });

                gymMarkers.set(exercise.exerciseType, newMarker);
            }
        });
    });

    const gymMarkersObject = Object.fromEntries(gymMarkers);
    console.log('Attempting to set metadata for user:', userID);
    try {
        await genericAddItemToTable(gymMarkersObject, 'Apexion-Gym_UserMeta');
        return "metadata set";
    } catch (error) {
        return ("error setting metadata", error);
    }
}
