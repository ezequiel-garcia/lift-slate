import { supabase } from "@/lib/supabase";
import { toKg, WeightUnit } from "@/lib/units";
import { ReferenceType } from "@/types/exerciseReference";

export interface CreateExerciseReferenceInput {
  exerciseId: string;
  referenceType?: ReferenceType;
  weight?: number;
  unit?: WeightUnit;
  reps?: number;
  recordedAt?: string;
  notes?: string;
}

export interface UpdateExerciseReferenceInput {
  weight?: number;
  unit?: WeightUnit;
  reps?: number;
  recordedAt?: string;
  notes?: string;
}

type InsertRow = {
  user_id: string;
  exercise_id: string;
  reference_type: ReferenceType;
  recorded_at: string;
  notes: string | null;
  source: "manual" | "coach";
  weight_kg: number | null;
  reps: number | null;
};

function buildInsertRow(
  userId: string,
  input: CreateExerciseReferenceInput,
  source: "manual" | "coach",
): InsertRow {
  const referenceType: ReferenceType = input.referenceType ?? "one_rep_max";

  let weight_kg: number | null = null;
  let reps: number | null = null;

  if (referenceType === "max_reps") {
    if (input.reps == null) {
      throw new Error("reps is required for max_reps reference");
    }
    reps = input.reps;
  } else {
    if (input.weight == null || input.unit == null) {
      throw new Error(
        "weight and unit are required for weight-based reference",
      );
    }
    weight_kg = toKg(input.weight, input.unit);
  }

  return {
    user_id: userId,
    exercise_id: input.exerciseId,
    reference_type: referenceType,
    recorded_at: input.recordedAt ?? new Date().toISOString(),
    notes: input.notes ?? null,
    source,
    weight_kg,
    reps,
  };
}

function buildUpdatePatch(input: UpdateExerciseReferenceInput) {
  const updates: Record<string, unknown> = {};
  if (input.weight !== undefined && input.unit !== undefined) {
    updates.weight_kg = toKg(input.weight, input.unit);
  }
  if (input.reps !== undefined) updates.reps = input.reps;
  if (input.recordedAt !== undefined) updates.recorded_at = input.recordedAt;
  if (input.notes !== undefined) updates.notes = input.notes;
  return updates;
}

export async function getCurrentExerciseReferences() {
  const { data, error } = await supabase
    .from("exercise_references")
    .select("*, exercises(name, equipment_type)")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getExerciseReferenceHistory(exerciseId: string) {
  const { data, error } = await supabase
    .from("exercise_references")
    .select(
      "id, user_id, exercise_id, reference_type, weight_kg, reps, recorded_at, notes, source",
    )
    .eq("exercise_id", exerciseId)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExerciseReference(
  input: CreateExerciseReferenceInput,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const row = buildInsertRow(user.id, input, "manual");
  const { data, error } = await supabase
    .from("exercise_references")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExerciseReference(
  id: string,
  input: UpdateExerciseReferenceInput,
) {
  const updates = buildUpdatePatch(input);
  const { data, error } = await supabase
    .from("exercise_references")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExerciseReference(id: string) {
  const { error } = await supabase
    .from("exercise_references")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAllReferencesForExercise(exerciseId: string) {
  // RLS scopes deletion to own rows
  const { error } = await supabase
    .from("exercise_references")
    .delete()
    .eq("exercise_id", exerciseId);
  if (error) throw error;
}

// --- Coach/Admin athlete access ---

export async function getAthleteReferences(userId: string) {
  const { data, error } = await supabase
    .from("exercise_references")
    .select("*, exercises(name, equipment_type)")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAthleteReference(
  userId: string,
  input: CreateExerciseReferenceInput,
) {
  const row = buildInsertRow(userId, input, "coach");
  const { data, error } = await supabase
    .from("exercise_references")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAthleteReference(
  id: string,
  input: UpdateExerciseReferenceInput,
) {
  const updates = buildUpdatePatch(input);
  const { data, error } = await supabase
    .from("exercise_references")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
