import { getNeonClient, upsertRecords, upsertConfigRecords, pullRecords } from "../lib/db";
import type { SyncRecord, ConfigRecord } from "../lib/db";

interface PushBody {
  categories?: SyncRecord[];
  entries?: SyncRecord[];
  configs?: ConfigRecord[];
}

interface PullBody {
  lastSyncedAt: string | null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

export async function handleSyncPush(
  request: Request,
  databaseUrl: string,
  userId: string
): Promise<Response> {
  try {
    if (!databaseUrl) {
      return errorResponse("NEON_DATABASE_URL is not configured", 500);
    }

    const body = (await request.json()) as PushBody;
    const sql = getNeonClient(databaseUrl);

    const pushed = { categories: 0, entries: 0, configs: 0 };

    if (body.categories?.length) {
      await upsertRecords(sql, "category", userId, body.categories);
      pushed.categories = body.categories.length;
    }

    if (body.entries?.length) {
      await upsertRecords(sql, "day_entry", userId, body.entries);
      pushed.entries = body.entries.length;
    }

    if (body.configs?.length) {
      await upsertConfigRecords(sql, userId, body.configs);
      pushed.configs = body.configs.length;
    }

    return jsonResponse({ ok: true, pushed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync/push] Error:", message);
    return errorResponse(message);
  }
}

export async function handleSyncPull(
  request: Request,
  databaseUrl: string,
  userId: string
): Promise<Response> {
  try {
    if (!databaseUrl) {
      return errorResponse("NEON_DATABASE_URL is not configured", 500);
    }

    const body = (await request.json()) as PullBody;
    const sql = getNeonClient(databaseUrl);

    const data = await pullRecords(sql, userId, body.lastSyncedAt);
    const serverTime = new Date().toISOString();

    return jsonResponse({
      categories: data.categories,
      entries: data.entries,
      configs: data.configs,
      serverTime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync/pull] Error:", message);
    return errorResponse(message);
  }
}
