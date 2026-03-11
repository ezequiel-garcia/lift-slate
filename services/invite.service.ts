import { supabase } from "@/lib/supabase";

export type GymPreview = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
};

export async function getGymByToken(token: string): Promise<GymPreview> {
  const { data: gym, error } = await supabase
    .from("gyms")
    .select("id, name, description")
    .eq("invite_token", token)
    .single();

  if (error || !gym) throw new Error("Invalid invite link");

  const { count, error: countError } = await supabase
    .from("gym_memberships")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gym.id);

  if (countError) throw countError;

  return { ...gym, member_count: count ?? 0 };
}

export async function getGymByTempCode(code: string): Promise<GymPreview> {
  const { data: gym, error } = await supabase
    .from("gyms")
    .select("id, name, description, temp_code_expires")
    .eq("temp_invite_code", code.toUpperCase())
    .single();

  if (error || !gym) throw new Error("Invalid code");
  if (!gym.temp_code_expires || new Date(gym.temp_code_expires) < new Date()) {
    throw new Error("Code expired");
  }

  const { count, error: countError } = await supabase
    .from("gym_memberships")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gym.id);

  if (countError) throw countError;

  return { id: gym.id, name: gym.name, description: gym.description, member_count: count ?? 0 };
}

export async function joinGymByToken(token: string): Promise<string> {
  const { data: gymId, error } = await supabase.rpc("join_gym_by_token", {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  return gymId;
}

export async function joinGymByTempCode(code: string): Promise<string> {
  const { data: gymId, error } = await supabase.rpc("join_gym_by_temp_code", {
    p_code: code.toUpperCase(),
  });
  if (error) throw new Error(error.message);
  return gymId;
}
