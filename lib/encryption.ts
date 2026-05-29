import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getKey(): Buffer {
  const key = process.env.ADMIN_EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ADMIN_EMAIL_ENCRYPTION_KEY não está configurada");
  }
  // Deriva uma chave de 32 bytes usando scrypt
  const salt = Buffer.from("admin-emails-salt", "utf-8");
  return scryptSync(key, salt, 32);
}

export function encryptEmail(email: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(email.toLowerCase().trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Formato: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptEmail(encryptedData: string): string {
  const key = getKey();
  
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Formato de dados criptografados inválido");
  }
  
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

// Hash determinístico para busca - usa HMAC para permitir busca sem descriptografar todos
export function hashEmailForLookup(email: string): string {
  const key = getKey();
  const { createHmac } = require("crypto");
  return createHmac("sha256", key)
    .update(email.toLowerCase().trim())
    .digest("hex");
}
