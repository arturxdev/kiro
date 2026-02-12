import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handleSyncPush, handleSyncPull } from "./handlers/sync";
import { handleDeleteAccount } from "./handlers/account";

interface Env {
  IMAGES_BUCKET: R2Bucket;
  CLERK_PUBLISHABLE_KEY: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_PUBLIC_URL: string;
  NEON_DATABASE_URL: string;
}

interface JWTPayload {
  sub: string; // userId
  exp: number;
  iss: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

async function verifyClerkToken(token: string, env: Env): Promise<JWTPayload | null> {
  try {
    // Decode JWT payload (Clerk tokens are JWTs)
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as JWTPayload;

    // Check expiration
    if (payload.exp * 1000 < Date.now()) return null;

    // Check issuer matches Clerk
    if (!payload.iss || !payload.sub) return null;

    return payload;
  } catch {
    return null;
  }
}

function getS3Client(env: Env): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function handlePresignedUrl(request: Request, env: Env, userId: string): Promise<Response> {
  const body = await request.json() as { entryId: string; fileExtension: string; contentType: string };

  if (!body.entryId || !body.fileExtension || !body.contentType) {
    return errorResponse("Missing required fields: entryId, fileExtension, contentType", 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(body.contentType)) {
    return errorResponse("Invalid content type. Allowed: jpeg, png, webp", 400);
  }

  const key = `images/${userId}/${body.entryId}.${body.fileExtension}`;
  const s3 = getS3Client(env);

  const command = new PutObjectCommand({
    Bucket: "memento-mori-images",
    Key: key,
    ContentType: body.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return jsonResponse({ uploadUrl, publicUrl, key });
}

async function handleDelete(request: Request, env: Env, userId: string): Promise<Response> {
  const url = new URL(request.url);
  // Extract key from path: /upload/images/userId/entryId.ext
  const key = url.pathname.replace("/upload/", "");

  if (!key || !key.startsWith(`images/${userId}/`)) {
    return errorResponse("Unauthorized: can only delete own images", 403);
  }

  const s3 = getS3Client(env);
  const command = new DeleteObjectCommand({
    Bucket: "memento-mori-images",
    Key: key,
  });

  await s3.send(command);
  return jsonResponse({ success: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Auth middleware
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyClerkToken(token, env);
    if (!payload) {
      return errorResponse("Invalid or expired token", 401);
    }

    const userId = payload.sub;

    // Routes
    if (url.pathname === "/upload/presigned-url" && request.method === "POST") {
      return handlePresignedUrl(request, env, userId);
    }

    if (url.pathname.startsWith("/upload/images/") && request.method === "DELETE") {
      return handleDelete(request, env, userId);
    }

    // Sync routes
    if (url.pathname === "/sync/push" && request.method === "POST") {
      return handleSyncPush(request, env.NEON_DATABASE_URL, userId);
    }

    if (url.pathname === "/sync/pull" && request.method === "POST") {
      return handleSyncPull(request, env.NEON_DATABASE_URL, userId);
    }

    if (url.pathname === "/account" && request.method === "DELETE") {
      return handleDeleteAccount(env, env.NEON_DATABASE_URL, userId);
    }

    return errorResponse("Not found", 404);
  },
};
