import type { SQLiteDatabase } from "expo-sqlite";
import { randomUUID } from "expo-crypto";

const DEFAULT_CATEGORIES = [
  { name: "Work", color: "#4A9EFF", icon: "briefcase" },
  { name: "Health", color: "#4ADE80", icon: "heart" },
  { name: "Social", color: "#F472B6", icon: "people" },
  { name: "Creative", color: "#C084FC", icon: "color-palette" },
] as const;

export async function seedCategories(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM category"
  );

  if (result && result.count > 0) return;

  const now = new Date().toISOString();

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    await db.runAsync(
      "INSERT INTO category (id, name, color, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), cat.name, cat.color, cat.icon, i, now, now]
    );
  }
}
