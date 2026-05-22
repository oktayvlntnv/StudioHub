import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { assertServerSecret } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function keyFromSecret() {
  return createHash("sha256")
    .update(assertServerSecret("ENCRYPTION_SECRET"))
    .digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, keyFromSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptSecret(payload: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Encrypted value is malformed.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    keyFromSecret(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function redactSensitiveUrl(url: string) {
  try {
    const parsed = new URL(url);
    for (const key of ["username", "password", "token", "auth", "key"]) {
      if (parsed.searchParams.has(key)) parsed.searchParams.set(key, "REDACTED");
    }
    return parsed.toString();
  } catch {
    return "[redacted-url]";
  }
}
