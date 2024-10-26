"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { auth } from "@clerk/nextjs/server"

// from here to line 20 is just AWS SDK setup
const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
const region = process.env.AWS_REGION!;
if (!accessKeyId || !secretAccessKey || !region) {
  throw new Error('AWS credentials and region must be set in environment variables.');
}
const client = new DynamoDBClient({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});
const docClient = DynamoDBDocumentClient.from(client);

// grab id of current user for auth. if null, user is not signed in
const { userId } = auth();

// Function to fetch all lab results of a given test type like "TESTOSTERONE" or "COMPLETE BLOOD COUNT"
export async function getAllResultsOneLabType(labType: string) {
   if (userId){
    const params = {
      TableName: "ClinicalLabs",
      KeyConditionExpression: `LabType = :keyValue`,
      ExpressionAttributeValues: {
        ':keyValue': labType,
      },
    };
  
    try {
      const command = new QueryCommand(params);
      const data = await docClient.send(command);
  
      return data.Items; 
    } catch (err) {
      console.error('Error querying DynamoDB:', err);
      throw err;
    }
  } else throw new Error("User is not signed in.")
}

// Function to fetch all lab results of a set of given test types like "TESTOSTERONE" or "COMPLETE BLOOD COUNT"
export async function getItemsByPrimaryKeys(primaryKeyValues: string[], table?:string,){
  if (userId){  
    const tableName = table ? table : 'ClinicalLabs';
    const partitionKeyName = 'LabType';
    const allItems: Array<any> = [];

    for (const keyValue of primaryKeyValues) {
      // Construct the QueryCommand parameters
      const params: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: `${partitionKeyName} = :pk`,
        ExpressionAttributeValues: {
          ':pk': keyValue,
        },
      };
      try {
        const command = new QueryCommand(params);
        const data: QueryCommandOutput = await docClient.send(command);
        allItems.push(...(data.Items || []));
      } catch (err) {
        console.error(`Error querying items for key ${keyValue} from DynamoDB:`, err);
      }
    }
    return allItems;
  } else throw new Error("User is not signed in.")
}

// Gets all items in a given table - defaults to lab data
export async function getAllItems(table?: string) {
  if (userId){  
  const tableName = table || 'ClinicalLabs';
  const allItems: Array<any> = [];

  try {
    let lastEvaluatedKey: Record<string, any> | undefined;
    do {
      // Construct the ScanCommand parameters
      const params: ScanCommandInput = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const command = new ScanCommand(params);
      const data: ScanCommandOutput = await docClient.send(command);
      
      allItems.push(...(data.Items || []));
      lastEvaluatedKey = data.LastEvaluatedKey;

    } while (lastEvaluatedKey);  // Continue scanning if there are more items

  } catch (err) {
    console.error(`Error scanning items from DynamoDB:`, err);
  }

  return allItems;
  } else throw new Error("User is not signed in.")
}

// Add items to table
export async function addItemToTable(formData: { [key: string]: any }, table: string) {

  if (!userId) {
    throw new Error("User is not signed in.");
  }
  

  const tableName = table;
  const date = formData.date || new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Remove userID and date from formData as they'll be used as keys
  const { userID, date: formDate, ...dataToStore } = formData;

  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userId,
        date: date,
      },
      UpdateExpression: "SET #data = list_append(if_not_exists(#data, :empty_list), :newData)",
      ExpressionAttributeNames: {
        "#data": "data",
      },
      ExpressionAttributeValues: {
        ":newData": [dataToStore],
        ":empty_list": [],
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await docClient.send(new UpdateCommand(params));
    console.log("Update successful:", result);
    return result;
  } catch (err) {
    console.error(`Error updating item in DynamoDB:`, err);
    throw err;
  }
}

type DataType = 'workouts' | 'medication'


export async function getSummaryData(userID: string, table: string, startDate: string, endDate: string) {
  if (userID) {
    if (userID == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs"};
    const params: QueryCommandInput = {
      TableName: table,
      KeyConditionExpression: `userID = :user AND #dateAttr BETWEEN :startDate AND :endDate`,
      ExpressionAttributeNames: {
        "#dateAttr": "date"  // Use ExpressionAttributeNames for reserved words
      },
      ExpressionAttributeValues: {
        ':user': userID,
        ':startDate': startDate,
        ':endDate': endDate
      }
    };

    try {
      const command = new QueryCommand(params);
      const data: QueryCommandOutput = await docClient.send(command);
      return data.Items || [];
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error; // rethrow the error
    }
  }
  return []; // Return empty array if no userID
}