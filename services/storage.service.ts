import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadGymLogo(
  base64: string,
  fileName: string,
  mimeType: string,
  fileSize?: number
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Only image files are allowed (JPEG, PNG, WebP, GIF).");
  }

  if (fileSize !== undefined && fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from("gym-logos")
    .upload(path, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("gym-logos").getPublicUrl(path);
  return data.publicUrl;
}
