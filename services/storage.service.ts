import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";

export async function uploadGymLogo(
  base64: string,
  fileName: string,
  mimeType: string
): Promise<string> {
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
