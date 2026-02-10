import type { SQLiteDatabase } from "expo-sqlite";
import type { DayEntry } from "@/types";
import { randomUUID } from "expo-crypto";

export async function getByDate(
  db: SQLiteDatabase,
  date: string
): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE date = ? AND is_deleted = 0 ORDER BY created_at DESC",
    [date]
  );
}

export async function getByYear(
  db: SQLiteDatabase,
  year: number
): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE date BETWEEN ? AND ? AND is_deleted = 0 ORDER BY date, created_at",
    [`${year}-01-01`, `${year}-12-31`]
  );
}

export async function getByYearGrouped(
  db: SQLiteDatabase,
  year: number
): Promise<Map<string, DayEntry[]>> {
  const entries = await getByYear(db, year);
  const map = new Map<string, DayEntry[]>();

  for (const entry of entries) {
    const existing = map.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(entry.date, [entry]);
    }
  }

  return map;
}

export async function getAll(
  db: SQLiteDatabase,
  options?: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    search?: string;
  }
): Promise<DayEntry[]> {
  const conditions: string[] = ["is_deleted = 0"];
  const params: (string | number)[] = [];

  if (options?.categoryId) {
    conditions.push("category_id = ?");
    params.push(options.categoryId);
  }

  if (options?.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  let query = `SELECT * FROM day_entry ${where} ORDER BY date DESC`;

  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  if (options?.offset) {
    query += " OFFSET ?";
    params.push(options.offset);
  }

  return db.getAllAsync<DayEntry>(query, params);
}

export async function create(
  db: SQLiteDatabase,
  data: Pick<DayEntry, "date" | "category_id" | "title"> &
    Partial<Pick<DayEntry, "description" | "photo_url" | "local_photo_uri">>
): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO day_entry (id, date, category_id, title, description, photo_url, local_photo_uri, is_deleted, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)",
    [
      id,
      data.date,
      data.category_id,
      data.title,
      data.description ?? null,
      data.photo_url ?? null,
      data.local_photo_uri ?? null,
      now,
      now,
    ]
  );

  return id;
}

export async function update(
  db: SQLiteDatabase,
  id: string,
  data: Partial<Record<"category_id" | "title" | "description" | "photo_url" | "local_photo_uri", string | null>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.category_id !== undefined) {
    fields.push("category_id = ?");
    values.push(data.category_id);
  }
  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description ?? null);
  }
  if (data.photo_url !== undefined) {
    fields.push("photo_url = ?");
    values.push(data.photo_url ?? null);
  }
  if (data.local_photo_uri !== undefined) {
    fields.push("local_photo_uri = ?");
    values.push(data.local_photo_uri ?? null);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  fields.push("sync_status = 'pending'");
  values.push(id);

  await db.runAsync(
    `UPDATE day_entry SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function remove(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE day_entry SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?",
    [now, id]
  );
}

export async function getCountByDate(
  db: SQLiteDatabase,
  date: string
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM day_entry WHERE date = ? AND is_deleted = 0",
    [date]
  );
  return result?.count ?? 0;
}

// --- Image upload queue ---

export async function getPendingImageUploads(
  db: SQLiteDatabase
): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE local_photo_uri IS NOT NULL AND photo_url IS NULL AND is_deleted = 0"
  );
}

// --- Sync helpers ---

export async function getUnsynced(db: SQLiteDatabase): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE sync_status = 'pending'"
  );
}

export async function markSynced(
  db: SQLiteDatabase,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE day_entry SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids
  );
}

export async function upsertFromServer(
  db: SQLiteDatabase,
  record: {
    id: string;
    date: string;
    category_id: string;
    title: string;
    description: string | null;
    photo_url: string | null;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO day_entry (id, date, category_id, title, description, photo_url, is_deleted, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       date = excluded.date,
       category_id = excluded.category_id,
       title = excluded.title,
       description = excluded.description,
       photo_url = excluded.photo_url,
       is_deleted = excluded.is_deleted,
       sync_status = 'synced',
       updated_at = excluded.updated_at
     WHERE day_entry.updated_at < excluded.updated_at`,
    [
      record.id,
      record.date,
      record.category_id,
      record.title,
      record.description,
      record.photo_url,
      record.is_deleted ? 1 : 0,
      record.created_at,
      record.updated_at,
    ]
  );
}
