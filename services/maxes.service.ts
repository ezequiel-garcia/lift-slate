import { supabase } from "@/lib/supabase";
import { toKg, WeightUnit } from "@/lib/units";

export interface CreateMaxInput {
  exerciseId: string;
  weight: number;
  unit: WeightUnit;
  recordedAt?: string;
  notes?: string;
}

export interface UpdateMaxInput {
  weight?: number;
  unit?: WeightUnit;
  recordedAt?: string;
  notes?: string;
}

export async function getCurrentMaxes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("maxes")
    .select("*, exercises(name, category)")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMaxHistory(exerciseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("maxes")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createMax(input: CreateMaxInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("maxes")
    .insert({
      user_id: user.id,
      exercise_id: input.exerciseId,
      weight_kg: toKg(input.weight, input.unit),
      recorded_at: input.recordedAt ?? new Date().toISOString(),
      notes: input.notes ?? null,
      source: "manual",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMax(id: string, input: UpdateMaxInput) {
  const updates: Record<string, unknown> = {};

  if (input.weight !== undefined && input.unit !== undefined) {
    updates.weight_kg = toKg(input.weight, input.unit);
  }
  if (input.recordedAt !== undefined) updates.recorded_at = input.recordedAt;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await supabase
    .from("maxes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMax(id: string) {
  const { error } = await supabase.from("maxes").delete().eq("id", id);
  if (error) throw error;
}
