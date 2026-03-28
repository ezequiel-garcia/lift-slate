import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database.types";
import { addDays, format } from "date-fns";

export type WorkoutItem = Tables<"workout_items"> & {
  exercises: Pick<Tables<"exercises">, "name" | "category"> | null;
};
export type WorkoutSection = Tables<"workout_sections"> & {
  items: WorkoutItem[];
};
export type WorkoutWithSections = Tables<"workouts"> & {
  sections: WorkoutSection[];
};

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

async function insertSectionsAndItems(
  workoutId: string,
  sectionInputs: WorkoutSectionInput[],
): Promise<WorkoutSection[]> {
  if (sectionInputs.length === 0) return [];

  // Batch insert all sections in one request
  const sectionsToInsert = sectionInputs.map((s) => ({
    workout_id: workoutId,
    title: s.title,
    order_index: s.orderIndex,
  }));

  const { data: sections, error: sectionsError } = await supabase
    .from("workout_sections")
    .insert(sectionsToInsert)
    .select()
    .order("order_index");
  if (sectionsError) throw sectionsError;

  // Batch insert all items across all sections in one request
  const allItems = sections.flatMap((section, i) =>
    sectionInputs[i].items.map((item) => ({
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
    })),
  );

  if (allItems.length === 0) {
    return sections.map((s) => ({ ...s, items: [] as WorkoutItem[] }));
  }

  const { data: items, error: itemsError } = await supabase
    .from("workout_items")
    .insert(allItems)
    .select();
  if (itemsError) throw itemsError;

  // Group items by section_id
  const itemsBySection = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const existing = itemsBySection.get(item.section_id) ?? [];
    existing.push(item);
    itemsBySection.set(item.section_id, existing);
  }

  return sections.map((section) => ({
    ...section,
    items: (itemsBySection.get(section.id) ?? []) as WorkoutItem[],
  }));
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

  const sections = await insertSectionsAndItems(workout.id, input.sections);
  return { ...workout, sections };
}

const WORKOUT_WITH_SECTIONS_QUERY = `
  *,
  sections:workout_sections(*, items:workout_items(*, exercises(name, category)))
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

  const sections = await insertSectionsAndItems(workoutId, input.sections);
  return { ...workout, sections };
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  if (error) throw error;
}
