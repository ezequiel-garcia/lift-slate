import { supabase } from "@/lib/supabase";

export type GymPreview = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
};

export async function getGymByToken(token: string): Promise<GymPreview> {
  const { data, error } = await supabase.rpc("preview_gym_by_token", {
    p_token: token,
  });

  if (error || !data || data.length === 0)
    throw new Error("Invalid invite link");
  return data[0] as GymPreview;
}

export async function getGymByTempCode(code: string): Promise<GymPreview> {
  const { data, error } = await supabase.rpc("preview_gym_by_temp_code", {
    p_code: code,
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Invalid or expired code");
  return data[0] as GymPreview;
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
