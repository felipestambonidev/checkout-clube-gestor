/**
 * Script para popular a tabela "emails-google-admin" no DynamoDB
 * com os emails autorizados a fazer login via Google.
 *
 * Uso:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-google-admin-emails.mjs
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { createCipheriv, randomBytes, scryptSync, createHmac } from "crypto";

// ─── Configuração ─────────────────────────────────────────────────────────────

const TABLE_NAME = "emails-google-admin";
const AWS_REGION = process.env.AWS_REGION;
const ROLE_ARN = process.env.AWS_ROLE_ARN;
const ENCRYPTION_KEY = process.env.ADMIN_EMAIL_ENCRYPTION_KEY;
const PARTITION_KEY = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK";

const EMAILS_TO_SEED = [
  "icaro.queiroz@fitgestao.com",
  "taynan.queiroz@fitgestao.com",
  "michelle.campos@fitgestao.com",
  "paulo.rodrigues@fitgestao.com",
  "felipe.stamboni@fitgestao.com.br",
  "twane.alves@fitgestao.com",
];

// ─── Helpers de criptografia (mesma lógica de lib/encryption.ts) ──────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error("ADMIN_EMAIL_ENCRYPTION_KEY não está configurada");
  }
  const salt = Buffer.from("admin-emails-salt", "utf-8");
  return scryptSync(ENCRYPTION_KEY, salt, 32);
}

function encryptEmail(email) {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(email.toLowerCase().trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function hashEmailForLookup(email) {
  const key = getKey();
  return createHmac("sha256", key)
    .update(email.toLowerCase().trim())
    .digest("hex");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!AWS_REGION) {
    console.error("[Seed] AWS_REGION não configurado");
    process.exit(1);
  }
  if (!ENCRYPTION_KEY) {
    console.error("[Seed] ADMIN_EMAIL_ENCRYPTION_KEY não configurado");
    process.exit(1);
  }

  console.log(`[Seed] Conectando ao DynamoDB — região: ${AWS_REGION}`);
  console.log(`[Seed] Tabela: ${TABLE_NAME}`);
  console.log(`[Seed] Partition Key: ${PARTITION_KEY}\n`);

  // Usar credenciais OIDC se disponível, senão usa as credenciais do ambiente
  let credentials;
  if (ROLE_ARN) {
    try {
      const { awsCredentialsProvider } = await import("@vercel/functions/oidc");
      credentials = awsCredentialsProvider({ roleArn: ROLE_ARN });
      console.log("[Seed] Usando credenciais OIDC (awsCredentialsProvider)\n");
    } catch {
      console.log("[Seed] @vercel/functions/oidc não disponível, usando credenciais do ambiente\n");
    }
  }

  const client = new DynamoDBClient({
    region: AWS_REGION,
    ...(credentials ? { credentials } : {}),
  });

  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  let successCount = 0;
  let errorCount = 0;

  for (const email of EMAILS_TO_SEED) {
    const normalizedEmail = email.toLowerCase().trim();
    const emailHash = hashEmailForLookup(normalizedEmail);
    const encryptedEmail = encryptEmail(normalizedEmail);

    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            [PARTITION_KEY]: "ADMIN_EMAILS",
            SK: `ADMIN_EMAIL#${emailHash}`,
            emailHash,
            encryptedEmail,
            createdAt: new Date().toISOString(),
          },
        })
      );
      console.log(`[Seed] OK  — ${email}`);
      successCount++;
    } catch (err) {
      console.error(`[Seed] ERRO — ${email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n[Seed] Concluído: ${successCount} inseridos, ${errorCount} erros`);

  if (errorCount > 0) {
    console.error(
      "\n[Seed] ATENÇÃO: Alguns emails falharam. Verifique se:\n" +
      "  1. A tabela 'emails-google-admin' existe no DynamoDB com PK string (ex: 'PK') e SK string\n" +
      "  2. As permissões IAM permitem PutItem na tabela\n" +
      "  3. As variáveis de ambiente estão corretas"
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[Seed] Erro fatal:", err);
  process.exit(1);
});
