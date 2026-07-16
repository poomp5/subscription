import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type R2Env = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  prefix: string; // folder ภายใน bucket (เช่น "dsgen3/") — ลงท้ายด้วย / เสมอถ้าไม่ว่าง
};

function pick(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.length > 0) return v;
  }
  return undefined;
}

function normalizePrefix(raw: string | undefined): string {
  if (!raw) return "";
  let p = raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!p) return "";
  p = p + "/";
  return p;
}

function readR2Env(): R2Env | null {
  const accountId = pick("R2_ACCOUNT_ID", "CLOUDFLARE_R2_ACCOUNT_ID");
  const bucket = pick("R2_BUCKET", "CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET");
  const accessKeyId = pick("R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = pick("R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const publicBaseUrl = pick("R2_PUBLIC_BASE_URL", "CLOUDFLARE_R2_PUBLIC_BASE_URL");

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return null;
  }
  return {
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
    prefix: normalizePrefix(pick("R2_PREFIX", "CLOUDFLARE_R2_PREFIX")),
  };
}

let client: S3Client | null = null;

function getClient(env: R2Env): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.endpoint,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    });
  }
  return client;
}

export type UploadSlipResult = {
  url: string;
  key: string;
};

async function uploadToR2({
  base64,
  mime,
  key,
}: {
  base64: string;
  mime: string;
  key: string;
}): Promise<UploadSlipResult | null> {
  const env = readR2Env();
  if (!env) {
    console.warn("[storage] R2 env not configured — skipping upload");
    return null;
  }

  const fullKey = `${env.prefix}${key}`;
  const body = Buffer.from(base64, "base64");

  const cmd = new PutObjectCommand({
    Bucket: env.bucket,
    Key: fullKey,
    Body: body,
    ContentType: mime,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const c = getClient(env);
  await c.send(cmd);

  return {
    key: fullKey,
    url: `${env.publicBaseUrl}/${fullKey}`,
  };
}

function extensionFromMime(mime: string) {
  const ext = (mime.split("/")[1] || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext === "jpeg" ? "jpg" : ext;
}

export async function uploadSlip({
  base64,
  mime,
  ref,
}: {
  base64: string;
  mime: string;
  ref: string;
}): Promise<UploadSlipResult | null> {
  const ext = extensionFromMime(mime);
  const safeRef = ref.replace(/[^A-Za-z0-9_-]/g, "_");
  return uploadToR2({ base64, mime, key: `slips/${safeRef}.${ext}` });
}

export async function uploadTcasfolioImage({
  base64,
  mime,
  ref,
}: {
  base64: string;
  mime: string;
  ref: string;
}): Promise<UploadSlipResult | null> {
  const ext = extensionFromMime(mime);
  const safeRef = ref.replace(/[^A-Za-z0-9_-]/g, "_");
  return uploadToR2({ base64, mime, key: `tcasfolio/${safeRef}.${ext}` });
}
