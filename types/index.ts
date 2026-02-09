export type SyncStatus = "pending" | "synced";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  sort_order: number;
  is_deleted: number; // 0 or 1
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface DayEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  category_id: string;
  title: string;
  description?: string;
  photo_url?: string;
  is_deleted: number; // 0 or 1
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface GridState {
  year: number;
  today: string; // "YYYY-MM-DD"
  categories: Map<string, Category>;
  entries: Map<string, DayEntry[]>; // key = "YYYY-MM-DD"
}
