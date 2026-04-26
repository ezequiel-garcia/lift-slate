import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type EquipmentType = Database["public"]["Enums"]["equipment_type"];

export async function getExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("equipment_type")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getExercisesByNames(names: string[]) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", names);
  if (error) throw error;
  return data;
}

export async function createExercise(
  name: string,
  equipmentType?: EquipmentType,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name,
      equipment_type: equipmentType,
      created_by: user.id,
      is_default: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExercise(
  id: string,
  updates: { name?: string; equipmentType?: EquipmentType },
) {
  const patch: { name?: string; equipment_type?: EquipmentType } = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.equipmentType !== undefined)
    patch.equipment_type = updates.equipmentType;

  const { data, error } = await supabase
    .from("exercises")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string) {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}
