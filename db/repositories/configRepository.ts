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
    "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, ?)",
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
