import type { SQLiteDatabase } from "expo-sqlite";
import * as entryRepository from "@/db/repositories/entryRepository";
import * as categoryRepository from "@/db/repositories/categoryRepository";
import * as configRepository from "@/db/repositories/configRepository";

const WORKER_URL = (process.env.EXPO_PUBLIC_CLOUDFLARE_WORKER_URL ?? "").replace(/\/+$/, "");
const LAST_SYNCED_KEY = "_lastSyncedAt";

interface PullResponse {
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    sort_order: number;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }>;
  entries: Array<{
    id: string;
    date: string;
    category_id: string;
    title: string;
    description: string | null;
    photo_url: string | null;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }>;
  configs: Array<{
    key: string;
    value: string;
    updated_at: string;
  }>;
  serverTime: string;
}

async function authFetch(
  url: string,
  token: string,
  body: unknown
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function sync(
  db: SQLiteDatabase,
  getToken: () => Promise<string | null>
): Promise<{ pushed: number; pulled: number }> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  // 1. Gather unsynced records
  const [unsyncedCategories, unsyncedEntries, unsyncedConfigs] = await Promise.all([
    categoryRepository.getUnsynced(db),
    entryRepository.getUnsynced(db),
    configRepository.getUnsynced(db),
  ]);

  let pushed = 0;

  // 2. Push local changes to server
  if (unsyncedCategories.length || unsyncedEntries.length || unsyncedConfigs.length) {
    const pushRes = await authFetch(`${WORKER_URL}/sync/push`, token, {
      categories: unsyncedCategories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon ?? null,
        sort_order: c.sort_order,
        is_deleted: c.is_deleted === 1,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
      entries: unsyncedEntries.map((e) => ({
        id: e.id,
        date: e.date,
        category_id: e.category_id,
        title: e.title,
        description: e.description ?? null,
        photo_url: e.photo_url ?? null,
        is_deleted: e.is_deleted === 1,
        created_at: e.created_at,
        updated_at: e.updated_at,
      })),
      configs: unsyncedConfigs.map((c) => ({
        key: c.key,
        value: c.value,
        updated_at: c.updated_at,
      })),
    });

    if (!pushRes.ok) {
      const text = await pushRes.text();
      throw new Error(`Push failed (${pushRes.status}): ${text}`);
    }

    // 3. Mark pushed records as synced
    await Promise.all([
      categoryRepository.markSynced(db, unsyncedCategories.map((c) => c.id)),
      entryRepository.markSynced(db, unsyncedEntries.map((e) => e.id)),
      configRepository.markSynced(db, unsyncedConfigs.map((c) => c.key)),
    ]);

    pushed = unsyncedCategories.length + unsyncedEntries.length + unsyncedConfigs.length;
  }

  // 4. Pull remote changes
  const lastSyncedAt = await configRepository.get(db, LAST_SYNCED_KEY);

  const pullRes = await authFetch(`${WORKER_URL}/sync/pull`, token, {
    lastSyncedAt,
  });

  if (!pullRes.ok) {
    const text = await pullRes.text();
    throw new Error(`Pull failed (${pullRes.status}): ${text}`);
  }

  const pullData = (await pullRes.json()) as PullResponse;
  let pulled = 0;

  // 5. Upsert pulled records into local DB
  for (const cat of pullData.categories) {
    await categoryRepository.upsertFromServer(db, cat);
    pulled++;
  }

  for (const entry of pullData.entries) {
    await entryRepository.upsertFromServer(db, entry);
    pulled++;
  }

  for (const config of pullData.configs) {
    await configRepository.upsertFromServer(db, config);
    pulled++;
  }

  // 6. Save lastSyncedAt (local-only, not synced to server)
  await configRepository.setLocal(db, LAST_SYNCED_KEY, pullData.serverTime);

  return { pushed, pulled };
}
