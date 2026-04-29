import { useMemo } from "react";
import { useExerciseReferences } from "./useExerciseReferences";
import { useExercises } from "./useExercises";
import { useProfile } from "./useProfile";
import { EQUIPMENT_ORDER, EQUIPMENT_LABELS } from "@/lib/constants";
import { ExerciseSummary } from "@/types/exercise";
import { WeightUnit } from "@/lib/units";

export type MyLiftsSection = { title: string; data: ExerciseSummary[] };

export function useMyLifts(search: string) {
  const {
    data: maxes = [],
    isLoading: maxesLoading,
    isError: maxesError,
    refetch: refetchMaxes,
  } = useExerciseReferences();
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const { data: profile } = useProfile();

  const unit: WeightUnit = profile?.unit_preference ?? "kg";

  const exerciseSummaries = useMemo((): ExerciseSummary[] => {
    type Entry = {
      currentWeightKg: number | null;
      currentReps: number | null;
      previousWeightKg: number | null;
      name: string;
      equipmentType: ExerciseSummary["equipmentType"];
      referenceType: ExerciseSummary["referenceType"];
    };
    const map = new Map<string, Entry>();

    for (const max of maxes) {
      if (!max.exercises) continue;
      const existing = map.get(max.exercise_id);
      if (!existing) {
        map.set(max.exercise_id, {
          currentWeightKg: max.weight_kg,
          currentReps: max.reps,
          previousWeightKg: null,
          name: max.exercises.name,
          equipmentType: max.exercises.equipment_type,
          referenceType: max.reference_type,
        });
      } else if (existing.previousWeightKg === null && max.weight_kg != null) {
        existing.previousWeightKg = max.weight_kg;
      }
    }

    return Array.from(map.entries()).map(([exerciseId, d]) => ({
      exerciseId,
      name: d.name,
      equipmentType: d.equipmentType,
      referenceType: d.referenceType,
      currentWeightKg: d.currentWeightKg,
      currentReps: d.currentReps,
      trend:
        d.currentWeightKg == null || d.previousWeightKg == null
          ? "same"
          : d.currentWeightKg > d.previousWeightKg
            ? "up"
            : d.currentWeightKg < d.previousWeightKg
              ? "down"
              : "same",
    }));
  }, [maxes]);

  const filtered = useMemo(() => {
    if (!search) return exerciseSummaries;
    const q = search.toLowerCase();
    return exerciseSummaries.filter((e) => e.name.toLowerCase().includes(q));
  }, [exerciseSummaries, search]);

  const sections = useMemo((): MyLiftsSection[] => {
    const result: MyLiftsSection[] = [];

    for (const eq of EQUIPMENT_ORDER) {
      const items = filtered
        .filter((e) => e.equipmentType === eq)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (items.length)
        result.push({ title: EQUIPMENT_LABELS[eq], data: items });
    }

    return result;
  }, [filtered]);

  const usedIds = useMemo(
    () => new Set(exerciseSummaries.map((e) => e.exerciseId)),
    [exerciseSummaries],
  );

  const availableExercises = useMemo(
    () => exercises.filter((e) => !usedIds.has(e.id)),
    [exercises, usedIds],
  );

  return {
    unit,
    exerciseSummaries,
    sections,
    filtered,
    availableExercises,
    isLoading: maxesLoading,
    isLoadingExercises: exercisesLoading,
    isError: maxesError,
    refetch: refetchMaxes,
  };
}
