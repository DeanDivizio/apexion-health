"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { auth } from '@clerk/nextjs/server'
import { getDataFromTable } from '../actions' 

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
export async function initPrAndLastSession() {
    const {userID} = await auth();
    const allGymData = await getDataFromTable(userID, 'Apexion-Gym', 20000000, 30000000); 
    let gymMarkers = []; 
    allGymData.forEach(workout => {
        /* gym markers is an array of objects with three keys. the first is the exercise string. the second is mostRecentSession which is the most recent session of that exercise 
        represented as an array of objects containing weight, reps and an optional repsRight key. the third is recordSet, which is an object that tracks the highest set by volume (weight times reps)
        and records the relevant data to weight, reps, totalVolume, and date keys. 
        The rest of this forEach loop should iterate through every workout in allGymData array and use it to populate gymMarkers */   
        
        
    });


}
