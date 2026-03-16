import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import { addDays, format } from "date-fns";

export type WorkoutItem = Tables<"workout_items"> & {
  exercises: Pick<Tables<"exercises">, "name" | "category"> | null;
};
export type WorkoutSection = Tables<"workout_sections"> & { items: WorkoutItem[] };
export type WorkoutWithSections = Tables<"workouts"> & { sections: WorkoutSection[] };

export type WorkoutItemInput = {
  orderIndex: number;
  itemType: "structured" | "free_text";
  exerciseId?: string;
  sets?: number;
  reps?: number;
  percentage?: number;
  maxTypeReference?: string;
  weightKg?: number;
  content?: string;
  notes?: string;
};

export type WorkoutSectionInput = {
  title: string;
  orderIndex: number;
  items: WorkoutItemInput[];
};

export type WorkoutInput = {
  title?: string;
  scheduledDate: string;
  notes?: string;
  sections: WorkoutSectionInput[];
};

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createWorkout(gymId: string, input: WorkoutInput): Promise<WorkoutWithSections> {
  const userId = await getCurrentUserId();

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      gym_id: gymId,
      created_by: userId,
      title: input.title ?? null,
      scheduled_date: input.scheduledDate,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (workoutError) throw workoutError;

  const sections: WorkoutSection[] = [];

  for (const sectionInput of input.sections) {
    const { data: section, error: sectionError } = await supabase
      .from("workout_sections")
      .insert({ workout_id: workout.id, title: sectionInput.title, order_index: sectionInput.orderIndex })
      .select()
      .single();
    if (sectionError) throw sectionError;

    const itemsToInsert = sectionInput.items.map((item) => ({
      section_id: section.id,
      order_index: item.orderIndex,
      item_type: item.itemType,
      exercise_id: item.exerciseId ?? null,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      percentage: item.percentage ?? null,
      max_type_reference: item.maxTypeReference ?? null,
      weight_kg: item.weightKg ?? null,
      content: item.content ?? null,
      notes: item.notes ?? null,
    }));

    const { data: items, error: itemsError } = await supabase
      .from("workout_items")
      .insert(itemsToInsert)
      .select();
    if (itemsError) throw itemsError;

    sections.push({ ...section, items: items ?? [] });
  }

  return { ...workout, sections };
}

const WORKOUT_WITH_SECTIONS_QUERY = `
  *,
  sections:workout_sections(
    *,
    items:workout_items(*, exercises(name, category) order by order_index)
    order by order_index
  )
` as const;

export async function getWorkoutsByDate(gymId: string, date: string): Promise<WorkoutWithSections[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_QUERY)
    .eq("gym_id", gymId)
    .eq("scheduled_date", date)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as WorkoutWithSections[];
}

export async function getWorkoutsForWeek(gymId: string, startDate: string): Promise<WorkoutWithSections[]> {
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
  return (data ?? []) as WorkoutWithSections[];
}

export async function getTodaysWorkout(gymId: string): Promise<WorkoutWithSections[]> {
  return getWorkoutsByDate(gymId, format(new Date(), "yyyy-MM-dd"));
}

export async function updateWorkout(workoutId: string, input: WorkoutInput): Promise<WorkoutWithSections> {
  const { data: workout, error: workoutError } = await supabase
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

  const { error: deleteError } = await supabase
    .from("workout_sections")
    .delete()
    .eq("workout_id", workoutId);
  if (deleteError) throw deleteError;

  const sections: WorkoutSection[] = [];

  for (const sectionInput of input.sections) {
    const { data: section, error: sectionError } = await supabase
      .from("workout_sections")
      .insert({ workout_id: workoutId, title: sectionInput.title, order_index: sectionInput.orderIndex })
      .select()
      .single();
    if (sectionError) throw sectionError;

    const itemsToInsert = sectionInput.items.map((item) => ({
      section_id: section.id,
      order_index: item.orderIndex,
      item_type: item.itemType,
      exercise_id: item.exerciseId ?? null,
      sets: item.sets ?? null,
      reps: item.reps ?? null,
      percentage: item.percentage ?? null,
      max_type_reference: item.maxTypeReference ?? null,
      weight_kg: item.weightKg ?? null,
      content: item.content ?? null,
      notes: item.notes ?? null,
    }));

    const { data: items, error: itemsError } = await supabase
      .from("workout_items")
      .insert(itemsToInsert)
      .select();
    if (itemsError) throw itemsError;

    sections.push({ ...section, items: items ?? [] });
  }

  return { ...workout, sections };
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
  if (error) throw error;
}

export async function publishWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .update({ published: true })
    .eq("id", workoutId);
  if (error) throw error;
}

export async function unpublishWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .update({ published: false })
    .eq("id", workoutId);
  if (error) throw error;
}
