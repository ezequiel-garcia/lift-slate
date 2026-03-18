import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";

export type GymMember = Tables<"gym_memberships"> & {
  users: Pick<Tables<"users">, "id" | "display_name" | "email" | "avatar_url" | "allow_coach_edit" | "unit_preference">;
};

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createGym(
  name: string,
  description?: string,
  address?: string,
  logoUrl?: string
) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("gyms")
    .insert({
      name,
      description: description ?? null,
      address: address ?? null,
      logo_url: logoUrl ?? null,
      owner_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyGym() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("gym_memberships")
    .select("id, role, gyms(*)")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!data?.gyms) return null;
  return { ...data.gyms, myRole: data.role as "athlete" | "coach" | "admin", membershipId: data.id };
}

export async function getGymById(gymId: string) {
  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", gymId)
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(membershipId: string) {
  const { error } = await supabase
    .from("gym_memberships")
    .delete()
    .eq("id", membershipId);
  if (error) throw error;
}

export async function updateGym(
  gymId: string,
  updates: Partial<Pick<Tables<"gyms">, "name" | "description" | "address" | "logo_url">>
) {
  const { data, error } = await supabase
    .from("gyms")
    .update(updates)
    .eq("id", gymId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGym(gymId: string) {
  const { error } = await supabase.from("gyms").delete().eq("id", gymId);
  if (error) throw error;
}

export async function getGymMembers(gymId: string): Promise<GymMember[]> {
  const { data, error } = await supabase
    .from("gym_memberships")
    .select("*, users(id, display_name, email, avatar_url, allow_coach_edit, unit_preference)")
    .eq("gym_id", gymId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data as GymMember[];
}

export async function getGymSubscription(gymId: string) {
  const { data, error } = await supabase
    .from("gym_subscriptions")
    .select("*")
    .eq("gym_id", gymId)
    .single();
  if (error) throw error;
  return data;
}

export async function leaveGym(membershipId: string) {
  const { data: membership, error: fetchError } = await supabase
    .from("gym_memberships")
    .select("role")
    .eq("id", membershipId)
    .single();
  if (fetchError) throw fetchError;
  if (membership.role === "admin") {
    throw new Error("Admins cannot leave a gym. Transfer ownership or delete the gym first.");
  }

  const { error } = await supabase
    .from("gym_memberships")
    .delete()
    .eq("id", membershipId);
  if (error) throw error;
}

export async function regenerateInviteToken(gymId: string) {
  const newToken = crypto.randomUUID();
  const { data, error } = await supabase
    .from("gyms")
    .update({ invite_token: newToken })
    .eq("id", gymId)
    .select("invite_token")
    .single();
  if (error) throw error;
  return data.invite_token;
}

export async function generateTempCode(gymId: string): Promise<{ code: string; expires: string }> {
  const { data: code, error } = await supabase.rpc("generate_temp_invite_code", {
    p_gym_id: gymId,
  });
  if (error) throw error;

  const { data: gym, error: gymError } = await supabase
    .from("gyms")
    .select("temp_code_expires")
    .eq("id", gymId)
    .single();
  if (gymError) throw gymError;

  return { code, expires: gym.temp_code_expires! };
}
