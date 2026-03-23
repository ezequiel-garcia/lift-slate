import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

type ExerciseCategory = Database["public"]["Enums"]["exercise_category"];

export async function getExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("category")
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

export async function createExercise(name: string, category?: ExerciseCategory) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exercises")
    .insert({ name, category, created_by: user.id, is_default: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExercise(
  id: string,
  updates: { name?: string; category?: ExerciseCategory },
) {
  const { data, error } = await supabase
    .from("exercises")
    .update(updates)
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
