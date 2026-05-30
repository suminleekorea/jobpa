/**
 * 파일 저장소 — S3 호환 또는 로컬 디스크 폴백
 * S3_BUCKET + S3_ACCESS_KEY_ID 가 설정되면 S3 사용, 아니면 ./uploads 폴더 사용.
 */
import { ENV } from "./_core/env";
import fs from "node:fs";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3: S3Client | null = null;
function getS3(): S3Client | null {
  if (!ENV.s3Bucket || !ENV.s3AccessKeyId) return null;
  if (!_s3) {
    _s3 = new S3Client({
      region: ENV.s3Region || "auto",
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
      ...(ENV.s3Endpoint ? { endpoint: ENV.s3Endpoint } : {}),
    });
  }
  return _s3;
}

const LOCAL_DIR = path.resolve(process.cwd(), "uploads");
function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const s3 = getS3();
  if (s3) {
    await s3.send(new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: key, Body: data, ContentType: contentType }));
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: 604800 });
    return { key, url };
  }
  ensureLocalDir();
  const filePath = path.join(LOCAL_DIR, key.replace(/\//g, "_"));
  fs.writeFileSync(filePath, data as Buffer);
  return { key, url: `/uploads/${path.basename(filePath)}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const s3 = getS3();
  if (s3) {
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: 3600 });
    return { key, url };
  }
  const filePath = path.join(LOCAL_DIR, key.replace(/\//g, "_"));
  return { key, url: `/uploads/${path.basename(filePath)}` };
}
