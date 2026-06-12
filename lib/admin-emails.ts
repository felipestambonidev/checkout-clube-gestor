import { docClient, TABLE_NAME, PARTITION_KEY } from "./dynamodb";
import { PutCommand, GetCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { encryptEmail, decryptEmail, hashEmailForLookup } from "./encryption";

// Tabela dedicada para emails autorizados no login Google.
// Se GOOGLE_ADMIN_EMAILS_TABLE estiver definida, usa ela; caso contrário,
// cai de volta para a tabela principal (compatibilidade retroativa).
const GOOGLE_EMAILS_TABLE =
  process.env.GOOGLE_ADMIN_EMAILS_TABLE || TABLE_NAME;

const ADMIN_EMAIL_PREFIX = "ADMIN_EMAIL#";

interface AdminEmailRecord {
  [key: string]: string;
  emailHash: string;
  encryptedEmail: string;
  createdAt: string;
}

function buildPartitionKeyValue(emailHash: string): string {
  return `${ADMIN_EMAIL_PREFIX}${emailHash}`;
}

export async function addAuthorizedEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);
  const encryptedEmail = encryptEmail(normalizedEmail);

  const command = new PutCommand({
    TableName: GOOGLE_EMAILS_TABLE,
    Item: {
      [PARTITION_KEY]: buildPartitionKeyValue(emailHash),
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
    TableName: GOOGLE_EMAILS_TABLE,
    Key: {
      [PARTITION_KEY]: buildPartitionKeyValue(emailHash),
    },
    ReturnValues: "ALL_OLD",
  });

  const result = await docClient.send(command);
  return !!result.Attributes;
}

export async function isEmailAuthorized(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);

  const command = new GetCommand({
    TableName: GOOGLE_EMAILS_TABLE,
    Key: {
      [PARTITION_KEY]: buildPartitionKeyValue(emailHash),
    },
  });

  const result = await docClient.send(command);
  return !!result.Item;
}

export async function listAuthorizedEmails(): Promise<string[]> {
  const command = new ScanCommand({
    TableName: GOOGLE_EMAILS_TABLE,
    FilterExpression: `begins_with(#pk, :pkPrefix)`,
    ExpressionAttributeNames: {
      "#pk": PARTITION_KEY,
    },
    ExpressionAttributeValues: {
      ":pkPrefix": ADMIN_EMAIL_PREFIX,
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
