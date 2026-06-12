import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, createDecipheriv } from "crypto";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const AWS_REGION = process.env.AWS_REGION;

// Replica da lógica de hashEmailForLookup do projeto
function hashEmailForLookup(email) {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

async function checkEmail(emailToCheck) {
  // Usar credenciais do ambiente (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY ou role)
  const client = new DynamoDBClient({ region: AWS_REGION });
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const normalizedEmail = emailToCheck.toLowerCase().trim();
  const emailHash = hashEmailForLookup(normalizedEmail);
  const PARTITION_KEY = "PK"; // ajusta se necessário

  console.log(`\nVerificando email: ${emailToCheck}`);
  console.log(`Hash gerado: ${emailHash}`);
  console.log(`Tabela: ${TABLE_NAME}\n`);

  // 1. Verificar diretamente pela hash SK
  const queryResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: `${PARTITION_KEY} = :pk AND SK = :sk`,
      ExpressionAttributeValues: {
        ":pk": "ADMIN_EMAILS",
        ":sk": `ADMIN_EMAIL#${emailHash}`,
      },
    })
  );

  if (queryResult.Items && queryResult.Items.length > 0) {
    console.log("RESULTADO: Email ENCONTRADO no banco de dados.");
    console.log("Registro:", JSON.stringify(queryResult.Items[0], null, 2));
    return true;
  }

  // 2. Listar todos os registros ADMIN_EMAILS para diagnóstico
  const allResult = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: `${PARTITION_KEY} = :pk`,
      ExpressionAttributeValues: {
        ":pk": "ADMIN_EMAILS",
      },
    })
  );

  console.log("RESULTADO: Email NAO encontrado pelo hash.");
  console.log(`Total de emails autorizados na tabela: ${allResult.Items?.length ?? 0}`);

  if (allResult.Items && allResult.Items.length > 0) {
    console.log("\nRegistros existentes (SK):");
    allResult.Items.forEach((item, i) => {
      console.log(`  [${i + 1}] SK: ${item.SK} | emailHash: ${item.emailHash} | createdAt: ${item.createdAt}`);
    });
  } else {
    console.log("Nenhum email cadastrado encontrado. Verifique se o PK correto é 'PK' ou outro nome.");
  }

  return false;
}

checkEmail("icaro.queiroz@fitgestao.com").catch(console.error);
