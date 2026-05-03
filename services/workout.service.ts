import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import { PrescriptionMode } from "@/types/exerciseReference";
import { addDays, format } from "date-fns";

export type WorkoutItem = Tables<"workout_items"> & {
  exercises: Pick<Tables<"exercises">, "name" | "equipment_type"> | null;
};
export type WorkoutSection = Tables<"workout_sections"> & {
  items: WorkoutItem[];
};
export type WorkoutWithSections = Tables<"workouts"> & {
  sections: WorkoutSection[];
};

export type WorkoutItemInput = {
  orderIndex: number;
  itemType: "exercise" | "custom_exercise";
  exerciseId?: string;
  sets?: string;
  reps?: string;
  percentage?: number;
  prescriptionMode?: PrescriptionMode;
  weightKg?: number;
  content?: string;
  notes?: string;
};

export type WorkoutSectionInput = {
  title: string;
  orderIndex: number;
  blockType?: string;
  repeatScheme?: string;
  items: WorkoutItemInput[];
};

export type WorkoutInput = {
  title?: string;
  scheduledDate: string;
  notes?: string;
  sections: WorkoutSectionInput[];
};

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

function buildSectionsJson(sectionInputs: WorkoutSectionInput[]) {
  return sectionInputs.map((s) => ({
    title: s.title,
    order_index: s.orderIndex,
    block_type: s.blockType ?? null,
    repeat_scheme: s.repeatScheme ?? null,
    items: s.items.map((item) => ({
      order_index: item.orderIndex,
      item_type: item.itemType,
      exercise_id: item.exerciseId ?? null,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      percentage: item.percentage ?? null,
      prescription_mode: item.prescriptionMode ?? null,
      weight_kg: item.weightKg ?? null,
      content: item.content ?? null,
      notes: item.notes ?? null,
    })),
  }));
}

async function upsertSections(
  workoutId: string,
  sectionInputs: WorkoutSectionInput[],
): Promise<void> {
  const { error } = await supabase.rpc("upsert_workout_sections", {
    p_workout_id: workoutId,
    p_sections: buildSectionsJson(sectionInputs),
  });
  if (error) throw error;
}

export async function createWorkout(
  gymId: string,
  input: WorkoutInput,
): Promise<WorkoutWithSections> {
  const userId = await getCurrentUserId();

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      gym_id: gymId,
      created_by: userId,
      title: input.title ?? null,
      scheduled_date: input.scheduledDate,
      notes: input.notes ?? null,
      published: true,
    })
    .select()
    .single();
  if (workoutError) throw workoutError;

  await upsertSections(workout.id, input.sections);
  return getWorkoutById(workout.id);
}

const WORKOUT_WITH_SECTIONS_QUERY = `
  *,
  sections:workout_sections(*, items:workout_items(*, exercises(name, equipment_type)))
` as const;

function sortWorkout(workout: WorkoutWithSections): WorkoutWithSections {
  return {
    ...workout,
    sections: [...workout.sections]
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => ({
        ...s,
        items: [...s.items].sort((a, b) => a.order_index - b.order_index),
      })),
  };
}

export async function getWorkoutById(
  workoutId: string,
): Promise<WorkoutWithSections> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_QUERY)
    .eq("id", workoutId)
    .single();
  if (error) throw error;
  return sortWorkout(data as WorkoutWithSections);
}

export async function getWorkoutsByDate(
  gymId: string,
  date: string,
): Promise<WorkoutWithSections[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_QUERY)
    .eq("gym_id", gymId)
    .eq("scheduled_date", date)
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as WorkoutWithSections[]).map(sortWorkout);
}

export async function getWorkoutsForWeek(
  gymId: string,
  startDate: string,
): Promise<WorkoutWithSections[]> {
  const endDate = format(addDays(new Date(startDate), 6), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_QUERY)
    .eq("gym_id", gymId)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date")
    .order("created_at");
  if (error) throw error;
  return ((data ?? []) as WorkoutWithSections[]).map(sortWorkout);
}

export async function getTodaysWorkout(
  gymId: string,
): Promise<WorkoutWithSections[]> {
  return getWorkoutsByDate(gymId, format(new Date(), "yyyy-MM-dd"));
}

export async function updateWorkout(
  workoutId: string,
  input: WorkoutInput,
): Promise<WorkoutWithSections> {
  const { error: workoutError } = await supabase
    .from("workouts")
    .update({
      title: input.title ?? null,
      scheduled_date: input.scheduledDate,
      notes: input.notes ?? null,
    })
    .eq("id", workoutId)
    .select()
    .single();
  if (workoutError) throw workoutError;

  await upsertSections(workoutId, input.sections);
  return getWorkoutById(workoutId);
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  if (error) throw error;
}
