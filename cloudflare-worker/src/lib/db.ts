import { neon } from "@neondatabase/serverless";

export type NeonClient = ReturnType<typeof neon>;

export function getNeonClient(databaseUrl: string): NeonClient {
  return neon(databaseUrl);
}

export interface SyncRecord {
  id: string;
  [key: string]: unknown;
}

export interface ConfigRecord {
  key: string;
  value: string;
  updated_at: string;
}

/**
 * Upsert records into a table. Only updates if incoming updated_at > existing updated_at.
 */
export async function upsertRecords(
  sql: NeonClient,
  table: "category" | "day_entry",
  userId: string,
  records: SyncRecord[]
): Promise<void> {
  for (const record of records) {
    if (table === "category") {
      await sql`
        INSERT INTO category (id, user_id, name, color, icon, sort_order, is_deleted, created_at, updated_at)
        VALUES (
          ${record.id},
          ${userId},
          ${record.name as string},
          ${record.color as string},
          ${(record.icon as string | null) ?? null},
          ${record.sort_order as number},
          ${record.is_deleted as boolean},
          ${record.created_at as string},
          ${record.updated_at as string}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          color = EXCLUDED.color,
          icon = EXCLUDED.icon,
          sort_order = EXCLUDED.sort_order,
          is_deleted = EXCLUDED.is_deleted,
          updated_at = EXCLUDED.updated_at
        WHERE category.updated_at < EXCLUDED.updated_at
      `;
    } else {
      await sql`
        INSERT INTO day_entry (id, user_id, date, category_id, title, description, photo_url, is_deleted, created_at, updated_at)
        VALUES (
          ${record.id},
          ${userId},
          ${record.date as string},
          ${record.category_id as string},
          ${record.title as string},
          ${(record.description as string | null) ?? null},
          ${(record.photo_url as string | null) ?? null},
          ${record.is_deleted as boolean},
          ${record.created_at as string},
          ${record.updated_at as string}
        )
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          category_id = EXCLUDED.category_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          photo_url = EXCLUDED.photo_url,
          is_deleted = EXCLUDED.is_deleted,
          updated_at = EXCLUDED.updated_at
        WHERE day_entry.updated_at < EXCLUDED.updated_at
      `;
    }
  }
}

/**
 * Upsert config records. Config uses (user_id, key) as PK.
 */
export async function upsertConfigRecords(
  sql: NeonClient,
  userId: string,
  records: ConfigRecord[]
): Promise<void> {
  for (const record of records) {
    await sql`
      INSERT INTO config (key, user_id, value, updated_at)
      VALUES (${record.key}, ${userId}, ${record.value}, ${record.updated_at})
      ON CONFLICT (user_id, key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
      WHERE config.updated_at < EXCLUDED.updated_at
    `;
  }
}

/**
 * Pull records modified after lastSyncedAt for a given user.
 */
export async function pullRecords(
  sql: NeonClient,
  userId: string,
  lastSyncedAt: string | null
) {
  const since = lastSyncedAt ?? "1970-01-01T00:00:00.000Z";

  const [categories, entries, configs] = await Promise.all([
    sql`SELECT id, name, color, icon, sort_order, is_deleted, created_at, updated_at
        FROM category WHERE user_id = ${userId} AND updated_at > ${since}
        ORDER BY updated_at ASC`,
    sql`SELECT id, date, category_id, title, description, photo_url, is_deleted, created_at, updated_at
        FROM day_entry WHERE user_id = ${userId} AND updated_at > ${since}
        ORDER BY updated_at ASC`,
    sql`SELECT key, value, updated_at
        FROM config WHERE user_id = ${userId} AND updated_at > ${since}
        ORDER BY updated_at ASC`,
  ]);

  return { categories, entries, configs };
}
