import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";

export type GymMember = Tables<"gym_memberships"> & {
  users: Pick<
    Tables<"users">,
    | "id"
    | "display_name"
    | "email"
    | "avatar_url"
    | "allow_coach_edit"
    | "unit_preference"
  >;
};

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function createGym(
  name: string,
  description?: string,
  address?: string,
  logoUrl?: string,
) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("gyms").insert({
    name,
    description: description ?? null,
    address: address ?? null,
    logo_url: logoUrl ?? null,
    owner_id: userId,
  });
  if (error) throw error;
}

export async function getMyGym() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("gym_memberships")
    .select("id, role, gyms(id, name, description, address, logo_url)")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!data?.gyms) return null;
  return {
    ...data.gyms,
    myRole: data.role as "athlete" | "coach" | "admin",
    membershipId: data.id,
  };
}

export async function getGymInviteDetails(gymId: string) {
  const { data, error } = await supabase
    .from("gyms")
    .select("invite_token, temp_invite_code, temp_code_expires")
    .eq("id", gymId)
    .single();
  if (error) throw error;
  return data;
}

export async function getGymById(gymId: string) {
  const { data, error } = await supabase
    .from("gyms")
    .select(
      "id, name, description, address, logo_url, owner_id, invite_token, temp_invite_code, temp_code_expires",
    )
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
  updates: Partial<
    Pick<Tables<"gyms">, "name" | "description" | "address" | "logo_url">
  >,
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
    .select(
      "*, users(id, display_name, email, avatar_url, allow_coach_edit, unit_preference)",
    )
    .eq("gym_id", gymId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return data as GymMember[];
}

export async function getGymSubscription(gymId: string) {
  const { data, error } = await supabase
    .from("gym_subscriptions")
    .select(
      "id, gym_id, plan, max_athletes, max_coaches, trial_started_at, trial_ends_at, status",
    )
    .eq("gym_id", gymId)
    .single();
  if (error) throw error;
  return data;
}

export async function leaveGym(membershipId: string) {
  const { error } = await supabase.rpc("leave_gym", {
    p_membership_id: membershipId,
  });
  if (error) throw error;
}

export async function regenerateInviteToken(gymId: string): Promise<string> {
  const { data, error } = await supabase.rpc("regenerate_invite_token", {
    p_gym_id: gymId,
  });
  if (error) throw error;
  return data;
}

export async function generateTempCode(
  gymId: string,
): Promise<{ code: string; expires: string }> {
  const { data: code, error } = await supabase.rpc(
    "generate_temp_invite_code",
    {
      p_gym_id: gymId,
    },
  );
  if (error) throw error;

  const { data: gym, error: gymError } = await supabase
    .from("gyms")
    .select("temp_code_expires")
    .eq("id", gymId)
    .single();
  if (gymError) throw gymError;

  return { code, expires: gym.temp_code_expires! };
}
