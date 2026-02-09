import type { SQLiteDatabase } from "expo-sqlite";
import type { Category } from "@/types";
import { randomUUID } from "expo-crypto";

export async function getAll(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>(
    "SELECT * FROM category ORDER BY sort_order ASC"
  );
}

export async function getById(
  db: SQLiteDatabase,
  id: string
): Promise<Category | null> {
  return db.getFirstAsync<Category>("SELECT * FROM category WHERE id = ?", [
    id,
  ]);
}

export async function create(
  db: SQLiteDatabase,
  data: Pick<Category, "name" | "color"> & Partial<Pick<Category, "icon">>
): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const maxResult = await db.getFirstAsync<{ max_order: number | null }>(
    "SELECT MAX(sort_order) as max_order FROM category"
  );
  const sortOrder = (maxResult?.max_order ?? -1) + 1;

  await db.runAsync(
    "INSERT INTO category (id, name, color, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, data.name, data.color, data.icon ?? null, sortOrder, now, now]
  );

  return id;
}

export async function update(
  db: SQLiteDatabase,
  id: string,
  data: Partial<Pick<Category, "name" | "color" | "icon">>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.color !== undefined) {
    fields.push("color = ?");
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    fields.push("icon = ?");
    values.push(data.icon ?? null);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE category SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function remove(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM day_entry WHERE category_id = ?",
    [id]
  );

  if (result && result.count > 0) {
    throw new Error(
      `Cannot delete category: ${result.count} entries still reference it`
    );
  }

  await db.runAsync("DELETE FROM category WHERE id = ?", [id]);
}

export async function reorder(
  db: SQLiteDatabase,
  orderedIds: string[]
): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      "UPDATE category SET sort_order = ?, updated_at = ? WHERE id = ?",
      [i, now, orderedIds[i]]
    );
  }
}
