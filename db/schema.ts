import type { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS day_entry (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES category(id)
    );

    CREATE INDEX IF NOT EXISTS idx_day_entry_date ON day_entry(date);
    CREATE INDEX IF NOT EXISTS idx_day_entry_category_id ON day_entry(category_id);
    CREATE INDEX IF NOT EXISTS idx_day_entry_date_category ON day_entry(date, category_id);

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
