"use server";
import { toCamelCase } from '@/lib/utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateCommand, UpdateCommandInput, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { auth } from "@clerk/nextjs/server"
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';

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
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});


export async function addItemToTable(formData: { [key: string]: any }, table: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }


  const tableName = table;
  const date = formData.date || new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Remove userID and date from formData as they'll be used as keys
  let { userID, date: formDate, ...dataToStore } = formData;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }
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

export async function genericAddItemToTable(data: any, table: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  const tableName = table;

  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }

  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userID
      },
      UpdateExpression: "SET #data = :newData",
      ExpressionAttributeNames: {
        "#data": "data"
      },
      ExpressionAttributeValues: {
        ":newData": data
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await docClient.send(new UpdateCommand(params));
    console.log("Operation successful:", result);
    return result;
  } catch (err) {
    console.error(`Error in DynamoDB operation:`, err);
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
    }
  }
  return [];
}

export async function getAllDataFromTableByUser(table: string) {
  const { userId } = await auth();
  let userID;
  if (userId) {
    if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
      userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
    } else {
      userID = userId;
    }
    const params: QueryCommandInput = {
      TableName: table,
      KeyConditionExpression: `userID = :user`,
      ExpressionAttributeValues: {
        ':user': userID,
      }
    };

    try {
      const command = new QueryCommand(params);
      const data: QueryCommandOutput = await docClient.send(command);
      return data.Items || [];
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }
  return [];
}

export async function getGymMeta_CACHED(userID: string) {
  "use cache"
  cacheTag('gymMeta')
  const params: QueryCommandInput = {
    TableName: 'Apexion-Gym_UserMeta',
    KeyConditionExpression: `userID = :user`,
    ExpressionAttributeValues: {
      ':user': userID,
    }
  };

  try {
    const command = new QueryCommand(params);
    const data: QueryCommandOutput = await docClient.send(command);
    return data.Items || [];
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

export async function updateCustomExercises(customExercises: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }
  const tableName = "Apexion-Gym_UserMeta";
  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }
  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userID
      },
      UpdateExpression: "SET customExercises = :customExercises",
      ExpressionAttributeValues: {
        ":customExercises": customExercises,
      },
      ReturnValues: "ALL_NEW"
    };
    const result = await docClient.send(new UpdateCommand(params));
    console.log("Operation successful:", result);
    return result;
  } catch (err) {
    console.error(`Error in DynamoDB operation:`, err);
    throw err;
  }
}

export async function updateExerciseData(exerciseData: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }
  const tableName = "Apexion-Gym_UserMeta";
  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }
  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userID
      },
      UpdateExpression: "SET exerciseData = :exerciseData",
      ExpressionAttributeValues: {
        ":exerciseData": exerciseData
      },
      ReturnValues: "ALL_NEW"
    };
    const result = await docClient.send(new UpdateCommand(params));
    console.log("Operation successful:", result);
    return result;
  } catch (err) {
    console.error(`Error in DynamoDB operation:`, err);
    throw err;
  }
}

export async function updateGymSession(date: string, data: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }

  try {
    const params: UpdateCommandInput = {
      TableName: "Apexion-Gym",
      Key: {
        userID: userID,
        date: date
      },
      UpdateExpression: "SET #data = :newData",
      ExpressionAttributeNames: {
        "#data": "data"
      },
      ExpressionAttributeValues: {
        ":newData": data
      },
      ReturnValues: "ALL_NEW"
    };

    const result = await docClient.send(new UpdateCommand(params));
    console.log("Update successful:", result);
    return result;
  } catch (err) {
    console.error(`Error updating gym session in DynamoDB:`, err);
    throw err;
  }
}

export async function updateCustomSupplements(customSupplements: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }
  const tableName = "Apexion-Gym_UserMeta";
  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }
  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userID
      },
      UpdateExpression: "SET customSupplements = :customSupplements",
      ExpressionAttributeValues: {
        ":customSupplements": customSupplements,
      },
      ReturnValues: "ALL_NEW"
    };
    const result = await docClient.send(new UpdateCommand(params));
    console.log("Operation successful:", result);
    return result;
  } catch (err) {
    console.error(`Error in DynamoDB operation:`, err);
    throw err;
  }
}

export async function updateFavoriteFoodItems(favoriteFoodItem: any) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }
  const tableName = "Apexion-Nutrition_UserMeta";
  let userID;
  if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
    userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
  } else {
    userID = userId;
  }
  try {
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userID: userID
      },
      UpdateExpression: "SET favoriteFoodItems = list_append(if_not_exists(favoriteFoodItems, :empty_list), :newItem)",
      ExpressionAttributeValues: {
        ":newItem": [favoriteFoodItem],
        ":empty_list": []
      },
      ReturnValues: "ALL_NEW"
    };
    const result = await docClient.send(new UpdateCommand(params));
    console.log("Operation successful:", result);
    return result;
  } catch (err) {
    console.error(`Error in DynamoDB operation:`, err);
    throw err;
  }
}