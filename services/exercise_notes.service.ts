import { supabase } from "@/lib/supabase";

export async function getExerciseNote(exerciseId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exercise_notes")
    .select("content")
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (error) throw error;
  return data?.content ?? "";
}

export async function upsertExerciseNote(exerciseId: string, content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("exercise_notes")
    .upsert(
      { user_id: user.id, exercise_id: exerciseId, content, updated_at: new Date().toISOString() },
      { onConflict: "user_id,exercise_id" },
    );

  if (error) throw error;
}
