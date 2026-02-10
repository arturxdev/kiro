import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Directory, Paths } from "expo-file-system";

const imagesDir = new Directory(Paths.document, "images");

const WORKER_URL = (process.env.EXPO_PUBLIC_CLOUDFLARE_WORKER_URL ?? "").replace(/\/+$/, "");

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.8;

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

async function compressImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });
  return result.uri;
}

export async function uploadImage({
  imageUri,
  entryId,
  userId,
  clerkToken,
}: {
  imageUri: string;
  entryId: string;
  userId: string;
  clerkToken: string;
}): Promise<UploadResult> {
  try {
    // 1. Compress image
    console.log("[uploadImage] Step 1: Compressing image...", { imageUri });
    const compressedUri = await compressImage(imageUri);
    console.log("[uploadImage] Step 1 OK: Compressed →", compressedUri);

    // 2. Get presigned URL from Worker
    const presignUrl = `${WORKER_URL}/upload/presigned-url`;
    console.log("[uploadImage] Step 2: Fetching presigned URL from:", presignUrl);
    const presignRes = await fetch(presignUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({
        entryId,
        fileExtension: "jpg",
        contentType: "image/jpeg",
      }),
    });
    console.log("[uploadImage] Step 2 response:", presignRes.status, presignRes.statusText);

    if (!presignRes.ok) {
      const errText = await presignRes.text();
      console.error("[uploadImage] Step 2 FAILED:", errText);
      try {
        const errJson = JSON.parse(errText) as { error?: string };
        return { success: false, error: errJson.error ?? "Failed to get upload URL" };
      } catch {
        return { success: false, error: `Worker responded ${presignRes.status}: ${errText}` };
      }
    }

    const { uploadUrl, publicUrl } = (await presignRes.json()) as {
      uploadUrl: string;
      publicUrl: string;
    };
    console.log("[uploadImage] Step 2 OK: publicUrl →", publicUrl);

    // 3. Read file and upload to R2
    console.log("[uploadImage] Step 3: Uploading blob to R2...");
    const fileRes = await fetch(compressedUri);
    const blob = await fileRes.blob();
    console.log("[uploadImage] Blob size:", blob.size, "bytes");

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: blob,
    });
    console.log("[uploadImage] Step 3 response:", uploadRes.status, uploadRes.statusText);

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[uploadImage] Step 3 FAILED:", errText);
      return { success: false, error: "Failed to upload image to storage" };
    }

    console.log("[uploadImage] Upload complete:", publicUrl);
    return { success: true, publicUrl };
  } catch (error) {
    console.error("[uploadImage] EXCEPTION:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

export async function persistImageLocally(
  pickerUri: string,
  entryId: string
): Promise<string> {
  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true });
  }

  const compressedUri = await compressImage(pickerUri);
  const compressedFile = new File(compressedUri);
  const destFile = new File(imagesDir, `${entryId}.jpg`);

  if (destFile.exists) {
    destFile.delete();
  }
  compressedFile.copy(destFile);

  console.log("[persistImageLocally] Saved to:", destFile.uri);
  return destFile.uri;
}

export async function deleteLocalImage(entryId: string): Promise<void> {
  try {
    const file = new File(imagesDir, `${entryId}.jpg`);
    if (file.exists) {
      file.delete();
      console.log("[deleteLocalImage] Deleted:", file.uri);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

export async function deleteImage(
  photoUrl: string,
  clerkToken: string
): Promise<boolean> {
  try {
    // Extract key from publicUrl: https://domain.com/images/userId/entryId.jpg → images/userId/entryId.jpg
    const url = new URL(photoUrl);
    const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

    console.log("[deleteImage] Deleting key:", key);
    const res = await fetch(`${WORKER_URL}/upload/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${clerkToken}` },
    });

    return res.ok;
  } catch {
    return false;
  }
}
