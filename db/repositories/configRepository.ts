import type { SQLiteDatabase } from "expo-sqlite";

export async function get(
  db: SQLiteDatabase,
  key: string
): Promise<string | null> {
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM config WHERE key = ?",
    [key]
  );
  return result?.value ?? null;
}

export async function set(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO config (key, value, sync_status, updated_at) VALUES (?, ?, 'pending', ?)",
    [key, value, new Date().toISOString()]
  );
}

export async function setLocal(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO config (key, value, sync_status, updated_at) VALUES (?, ?, 'synced', ?)",
    [key, value, new Date().toISOString()]
  );
}

export async function getMultiple(
  db: SQLiteDatabase,
  keys: string[]
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = await get(db, key);
  }
  return result;
}

// --- Sync helpers ---

export async function getUnsynced(
  db: SQLiteDatabase
): Promise<Array<{ key: string; value: string; updated_at: string }>> {
  return db.getAllAsync<{ key: string; value: string; updated_at: string }>(
    "SELECT key, value, updated_at FROM config WHERE sync_status = 'pending'"
  );
}

export async function markSynced(
  db: SQLiteDatabase,
  keys: string[]
): Promise<void> {
  if (keys.length === 0) return;
  const placeholders = keys.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE config SET sync_status = 'synced' WHERE key IN (${placeholders})`,
    keys
  );
}

export async function upsertFromServer(
  db: SQLiteDatabase,
  record: { key: string; value: string; updated_at: string }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO config (key, value, sync_status, updated_at)
     VALUES (?, ?, 'synced', ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       sync_status = 'synced',
       updated_at = excluded.updated_at
     WHERE config.updated_at < excluded.updated_at`,
    [record.key, record.value, record.updated_at]
  );
}
