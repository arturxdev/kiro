import type { SQLiteDatabase } from "expo-sqlite";
import type { Category } from "@/types";
import { randomUUID } from "expo-crypto";

export async function getAll(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>(
    "SELECT * FROM category WHERE is_deleted = 0 ORDER BY sort_order ASC"
  );
}

export async function getById(
  db: SQLiteDatabase,
  id: string
): Promise<Category | null> {
  return db.getFirstAsync<Category>("SELECT * FROM category WHERE id = ? AND is_deleted = 0", [
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
    "SELECT MAX(sort_order) as max_order FROM category WHERE is_deleted = 0"
  );
  const sortOrder = (maxResult?.max_order ?? -1) + 1;

  await db.runAsync(
    "INSERT INTO category (id, name, color, icon, sort_order, is_deleted, sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, 'pending', ?, ?)",
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
  fields.push("sync_status = 'pending'");
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
    "SELECT COUNT(*) as count FROM day_entry WHERE category_id = ? AND is_deleted = 0",
    [id]
  );

  if (result && result.count > 0) {
    throw new Error(
      `Cannot delete category: ${result.count} entries still reference it`
    );
  }

  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE category SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?",
    [now, id]
  );
}

export async function reorder(
  db: SQLiteDatabase,
  orderedIds: string[]
): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      "UPDATE category SET sort_order = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?",
      [i, now, orderedIds[i]]
    );
  }
}

// --- Sync helpers ---

export async function getUnsynced(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>(
    "SELECT * FROM category WHERE sync_status = 'pending'"
  );
}

export async function markSynced(
  db: SQLiteDatabase,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE category SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids
  );
}

export async function upsertFromServer(
  db: SQLiteDatabase,
  record: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    sort_order: number;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }
): Promise<void> {
  await db.runAsync(
    `INSERT INTO category (id, name, color, icon, sort_order, is_deleted, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'synced', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       color = excluded.color,
       icon = excluded.icon,
       sort_order = excluded.sort_order,
       is_deleted = excluded.is_deleted,
       sync_status = 'synced',
       updated_at = excluded.updated_at
     WHERE category.updated_at < excluded.updated_at`,
    [
      record.id,
      record.name,
      record.color,
      record.icon,
      record.sort_order,
      record.is_deleted ? 1 : 0,
      record.created_at,
      record.updated_at,
    ]
  );
}
