import type { SQLiteDatabase } from "expo-sqlite";
import type { DayEntry } from "@/types";
import { randomUUID } from "expo-crypto";

export async function getByDate(
  db: SQLiteDatabase,
  date: string
): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE date = ? ORDER BY created_at ASC",
    [date]
  );
}

export async function getByYear(
  db: SQLiteDatabase,
  year: number
): Promise<DayEntry[]> {
  return db.getAllAsync<DayEntry>(
    "SELECT * FROM day_entry WHERE date BETWEEN ? AND ? ORDER BY date, created_at",
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
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.categoryId) {
    conditions.push("category_id = ?");
    params.push(options.categoryId);
  }

  if (options?.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${options.search}%`, `%${options.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
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
    Partial<Pick<DayEntry, "description" | "photo_url">>
): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO day_entry (id, date, category_id, title, description, photo_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      data.date,
      data.category_id,
      data.title,
      data.description ?? null,
      data.photo_url ?? null,
      now,
      now,
    ]
  );

  return id;
}

export async function update(
  db: SQLiteDatabase,
  id: string,
  data: Partial<Pick<DayEntry, "category_id" | "title" | "description" | "photo_url">>
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

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
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
  await db.runAsync("DELETE FROM day_entry WHERE id = ?", [id]);
}

export async function getCountByDate(
  db: SQLiteDatabase,
  date: string
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM day_entry WHERE date = ?",
    [date]
  );
  return result?.count ?? 0;
}
