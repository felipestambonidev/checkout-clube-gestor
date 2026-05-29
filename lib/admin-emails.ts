import { docClient, TABLE_NAME, PARTITION_KEY } from "./dynamodb";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { encryptEmail, decryptEmail, hashEmailForLookup } from "./encryption";

const ADMIN_EMAIL_SK_PREFIX = "ADMIN_EMAIL#";

interface AdminEmailRecord {
  [key: string]: string;
  SK: string;
  emailHash: string;
  encryptedEmail: string;
  createdAt: string;
}

export async function addAuthorizedEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);
  const encryptedEmail = encryptEmail(normalizedEmail);
  
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      [PARTITION_KEY]: "ADMIN_EMAILS",
      SK: `${ADMIN_EMAIL_SK_PREFIX}${emailHash}`,
      emailHash,
      encryptedEmail,
      createdAt: new Date().toISOString(),
    },
  });
  
  await docClient.send(command);
}

export async function removeAuthorizedEmail(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);
  
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      [PARTITION_KEY]: "ADMIN_EMAILS",
      SK: `${ADMIN_EMAIL_SK_PREFIX}${emailHash}`,
    },
    ReturnValues: "ALL_OLD",
  });
  
  const result = await docClient.send(command);
  return !!result.Attributes;
}

export async function isEmailAuthorized(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);
  
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: `${PARTITION_KEY} = :pk AND SK = :sk`,
    ExpressionAttributeValues: {
      ":pk": "ADMIN_EMAILS",
      ":sk": `${ADMIN_EMAIL_SK_PREFIX}${emailHash}`,
    },
    Limit: 1,
  });
  
  const result = await docClient.send(command);
  return (result.Items?.length ?? 0) > 0;
}

export async function listAuthorizedEmails(): Promise<string[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: `${PARTITION_KEY} = :pk AND begins_with(SK, :skPrefix)`,
    ExpressionAttributeValues: {
      ":pk": "ADMIN_EMAILS",
      ":skPrefix": ADMIN_EMAIL_SK_PREFIX,
    },
  });
  
  const result = await docClient.send(command);
  
  if (!result.Items) {
    return [];
  }
  
  return result.Items.map((item) => {
    try {
      return decryptEmail((item as AdminEmailRecord).encryptedEmail);
    } catch {
      return "[erro ao descriptografar]";
    }
  });
}
