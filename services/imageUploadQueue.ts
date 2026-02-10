import type { SQLiteDatabase } from "expo-sqlite";
import * as entryRepository from "@/db/repositories/entryRepository";
import { uploadImage, deleteLocalImage } from "@/utils/imageService";

export async function processPendingImageUploads(
  db: SQLiteDatabase,
  getToken: () => Promise<string | null>,
  userId: string
): Promise<number> {
  const pending = await entryRepository.getPendingImageUploads(db);
  if (pending.length === 0) return 0;

  console.log(`[imageUploadQueue] Found ${pending.length} pending image upload(s)`);

  let uploaded = 0;

  for (const entry of pending) {
    const token = await getToken();
    if (!token) break;

    const result = await uploadImage({
      imageUri: entry.local_photo_uri!,
      entryId: entry.id,
      userId,
      clerkToken: token,
    });

    if (result.success && result.publicUrl) {
      await entryRepository.update(db, entry.id, {
        photo_url: result.publicUrl,
        local_photo_uri: null,
      });
      await deleteLocalImage(entry.id);
      uploaded++;
      console.log(`[imageUploadQueue] Uploaded image for entry ${entry.id}`);
    } else {
      console.warn(`[imageUploadQueue] Failed for entry ${entry.id}:`, result.error);
    }
  }

  return uploaded;
}
