import { getNeonClient } from "../lib/db";

interface Env {
  IMAGES_BUCKET: R2Bucket;
}

export async function handleDeleteAccount(
  env: Env,
  databaseUrl: string,
  userId: string
): Promise<Response> {
  try {
    // 1. Delete all R2 images for this user
    const prefix = `images/${userId}/`;
    let cursor: string | undefined;
    do {
      const listed = await env.IMAGES_BUCKET.list({ prefix, cursor });
      const keys = listed.objects.map((obj) => obj.key);
      if (keys.length > 0) {
        await env.IMAGES_BUCKET.delete(keys);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    // 2. Delete all Neon DB records for this user
    const sql = getNeonClient(databaseUrl);
    await sql`DELETE FROM day_entry WHERE user_id = ${userId}`;
    await sql`DELETE FROM category WHERE user_id = ${userId}`;
    await sql`DELETE FROM config WHERE user_id = ${userId}`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[account/delete] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}
