import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

export type GymMembershipRole = Database["public"]["Enums"]["gym_membership_role"];

export async function getMemberRole(gymId: string): Promise<GymMembershipRole | null> {
  // RLS scopes gym_memberships to own rows
  const { data, error } = await supabase
    .from("gym_memberships")
    .select("role")
    .eq("gym_id", gymId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data.role;
}

export async function updateMemberRole(
  membershipId: string,
  newRole: GymMembershipRole
): Promise<void> {
  const { error } = await supabase.rpc("update_member_role", {
    p_membership_id: membershipId,
    p_new_role: newRole,
  });
  if (error) throw new Error(error.message);
}
