import { supabase } from "@/lib/supabase";
import { WeightUnit } from "@/lib/units";

export async function getProfile() {
  // RLS scopes users to own row — no getSession() needed
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  display_name?: string;
  unit_preference?: WeightUnit;
  rounding_increment_kg?: number;
  allow_coach_edit?: boolean;
  avatar_url?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
