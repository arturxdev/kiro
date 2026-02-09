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

  // Run migrations based on user_version
  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateV1(db);
  }
}

async function migrateV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE category ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE category ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';

    ALTER TABLE day_entry ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE day_entry ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';

    ALTER TABLE config ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';

    PRAGMA user_version = 1;
  `);
}
