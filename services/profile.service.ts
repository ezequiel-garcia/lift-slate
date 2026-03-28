import { supabase } from "@/lib/supabase";
import { WeightUnit } from "@/lib/units";

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("users")
    .select("id, email, display_name, unit_preference, rounding_increment_kg, allow_coach_edit, avatar_url")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  display_name?: string;
  unit_preference?: WeightUnit;
  allow_coach_edit?: boolean;
  avatar_url?: string;
}) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
