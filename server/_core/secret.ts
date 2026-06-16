import crypto from "node:crypto";
import { ENV } from "./env";

const VERSION = "v1";

function getKey() {
  return crypto
    .createHash("sha256")
    .update(ENV.cookieSecret || "jobpa-local-development-secret")
    .digest();
}

export function encryptSecret(value: string | undefined | null) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string | undefined | null) {
  if (!value) return null;
  if (!value.startsWith(`${VERSION}:`)) return value;

  const [, ivEncoded, tagEncoded, encryptedEncoded] = value.split(":");
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) return null;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
