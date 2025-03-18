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


export async function addItemToTable(formData: { [key: string]: any }, table: string) {
  const { userId } = await auth();
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

export async function getDataFromTable(userID: string, table: string, startDate: string, endDate: string) {
    if (userID) {
      const params: QueryCommandInput = {
        TableName: table,
        KeyConditionExpression: `userID = :user AND #dateAttr BETWEEN :startDate AND :endDate`,
        ExpressionAttributeNames: {
          "#dateAttr": "date"  // date is a reserved word
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