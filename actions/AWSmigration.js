"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';


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

// this was exported when used. not exported now for security
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
// the issue is you can only have one instance of a primary + secondary key. userID + labType has multiple instances becuase
// the same user can have multiples of the same test done just on different dates... thats kinda the whole point
// sort key needs to be different. maybe concat type and date? date plus type would let me slice at location 8 to split the string
// into date and type.
// i need more coffee