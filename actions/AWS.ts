"use server";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

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


// Function to fetch all lab results of a given test type like "TESTOSTERONE" or "COMPLETE BLOOD COUNT"
export async function getAllResultsOneLabType(labType: string) {
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
  }

// Function to fetch all lab results of a set of given test types like "TESTOSTERONE" or "COMPLETE BLOOD COUNT"
export async function getItemsByPrimaryKeys(primaryKeyValues: string[], table?:string,){
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
  }

// Gets all items in a given table - defaults to lab data
export async function getAllItems(table?: string) {
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
}
