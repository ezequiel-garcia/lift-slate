import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadGymLogo(
  base64: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Only image files are allowed (JPEG, PNG, WebP, GIF).");
  }

  const path = `${Date.now()}_${fileName}`;
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
