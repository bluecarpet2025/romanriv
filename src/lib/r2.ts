import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IMAGE_EXTENSIONS, UploadError, type UploadInput } from "@/lib/uploads";

const PUT_EXPIRY_SECONDS = 120;
const COMPLETION_EXPIRY_MS = 15 * 60 * 1000;

type UploadTicket = {
  version: 1;
  userId: string;
  key: string;
  input: UploadInput;
  previousCoverUrl: string | null;
  expiresAt: number;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new UploadError("R2 uploads are not configured on this server.", 503);
  return value;
}

function r2Config() {
  return {
    accountId: requiredEnv("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requiredEnv("R2_BUCKET_NAME"),
  };
}

let client: S3Client | undefined;
function r2Client() {
  if (!client) {
    const config = r2Config();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      requestChecksumCalculation: "WHEN_REQUIRED",
      maxAttempts: 2,
    });
  }
  return client;
}

export function r2PublicUrl(key: string) {
  const base = requiredEnv("NEXT_PUBLIC_R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
  if (new URL(base).protocol !== "https:") throw new UploadError("R2 public URL must use HTTPS.", 503);
  return `${base}/${key}`;
}

export async function deletePhotoObject(key: unknown) {
  // Use the DB key verbatim, never a URL or a path outside the photo folders.
  if (typeof key !== "string" || Buffer.byteLength(key, "utf8") > 1024 ||
      !/^(food|car)\/.+/.test(key) || /[\\%?#\x00-\x1f\x7f]/.test(key) ||
      key.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw new UploadError("This photo has an unsupported image path. Only relative food/ and car/ paths can be deleted.");
  }
  const command = new DeleteObjectCommand({ Bucket: r2Config().bucket, Key: key });
  try {
    // Deleting an absent key normally succeeds. It must not block row cleanup.
    await r2Client().send(command);
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") return;
    throw new UploadError("R2 deletion failed. The photo record was not deleted. Please retry.", 502);
  }
}

function ticketSignature(payload: string) {
  return createHmac("sha256", requiredEnv("R2_SECRET_ACCESS_KEY"))
    .update(`romanriv-upload-v1.${payload}`).digest();
}

export function readUploadTicket(token: unknown, userId: string): UploadTicket {
  if (typeof token !== "string" || token.length > 8192) throw new UploadError("Invalid upload receipt.");
  const parts = token.split(".");
  if (parts.length !== 2) throw new UploadError("Invalid upload receipt.");
  const [payload, signature] = parts;
  const expected = ticketSignature(payload);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new UploadError("Invalid upload receipt.");
  }
  const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as UploadTicket;
  if (ticket.version !== 1 || ticket.userId !== userId) throw new UploadError("Invalid upload receipt.", 403);
  if (!Number.isFinite(ticket.expiresAt) || ticket.expiresAt <= Date.now()) {
    throw new UploadError("Upload receipt expired. Please upload again.");
  }
  return ticket;
}

export async function presignImageUpload(input: UploadInput, userId: string, previousCoverUrl: string | null) {
  const extension = IMAGE_EXTENSIONS[input.contentType];
  const basename = input.fileName.replace(/\.[^/.]+$/, "").toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 100) || "image";
  const key = input.folder === "anime-covers"
    ? `anime-covers/${input.animeId}/${randomUUID()}.${extension}`
    : `${input.folder}/${Date.now()}-${basename}-${randomUUID()}.${extension}`;
  // Validate public configuration before accepting any bytes.
  r2PublicUrl(key);
  const uploadUrl = await getSignedUrl(r2Client(), new PutObjectCommand({
    Bucket: r2Config().bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
    // A reused URL cannot overwrite an already-verified object.
    IfNoneMatch: "*",
  }), {
    expiresIn: PUT_EXPIRY_SECONDS,
    signableHeaders: new Set(["content-type", "content-length", "if-none-match"]),
  });
  const ticket: UploadTicket = {
    version: 1, userId, key, input, previousCoverUrl,
    expiresAt: Date.now() + COMPLETION_EXPIRY_MS,
  };
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return {
    uploadUrl,
    key,
    token: `${payload}.${ticketSignature(payload).toString("base64url")}`,
    headers: { "Content-Type": input.contentType, "If-None-Match": "*" },
  };
}

function matchesImageHeader(bytes: Uint8Array, contentType: string) {
  const data = Buffer.from(bytes);
  switch (contentType) {
    case "image/jpeg": return data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case "image/png": return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/gif": return ["GIF87a", "GIF89a"].includes(data.toString("ascii", 0, 6));
    case "image/webp": return data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
    case "image/avif": {
      if (data.toString("ascii", 4, 8) !== "ftyp") return false;
      const boxEnd = Math.min(data.readUInt32BE(0), data.length);
      for (let offset = 8; offset + 4 <= boxEnd; offset += 4) {
        if (offset !== 12 && ["avif", "avis"].includes(data.toString("ascii", offset, offset + 4))) return true;
      }
      return false;
    }
    default: return false;
  }
}

export async function verifyUploadedImage(ticket: UploadTicket) {
  const object = { Bucket: r2Config().bucket, Key: ticket.key };
  let head;
  try {
    head = await r2Client().send(new HeadObjectCommand(object));
  } catch {
    throw new UploadError("The uploaded image could not be found in R2. Please try again.", 409);
  }
  if (head.ContentLength !== ticket.input.size || head.ContentType !== ticket.input.contentType) {
    throw new UploadError("Uploaded image size or type does not match the authorized upload.");
  }
  const sample = await r2Client().send(new GetObjectCommand({ ...object, Range: "bytes=0-63" }));
  const bytes = await sample.Body?.transformToByteArray();
  if (!bytes || !matchesImageHeader(bytes, ticket.input.contentType)) {
    throw new UploadError("The uploaded file does not match its image type.");
  }
  const publicUrl = r2PublicUrl(ticket.key);
  const response = await fetch(publicUrl, {
    method: "HEAD", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 200) {
    throw new UploadError("The image is not publicly readable yet. The database has not been changed.", 409);
  }
  return publicUrl;
}
