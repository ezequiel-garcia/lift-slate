import { useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useMaxes } from "./useMaxes";
import { useExercises } from "./useExercises";
import { useProfile } from "./useProfile";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";
import { ExerciseSummary } from "@/types/exercise";
import { WeightUnit } from "@/lib/units";

export type MyLiftsSection = { title: string; data: ExerciseSummary[] };

export function useMyLifts(search: string) {
  const { data: maxes = [], isLoading: maxesLoading, isError: maxesError, refetch: refetchMaxes } = useMaxes();

  useFocusEffect(useCallback(() => { refetchMaxes(); }, []));
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const { data: profile } = useProfile();

  const unit: WeightUnit = profile?.unit_preference ?? "kg";

  const exerciseSummaries = useMemo((): ExerciseSummary[] => {
    type Entry = { current: number; previous?: number; name: string; category: ExerciseSummary["category"] };
    const map = new Map<string, Entry>();

    for (const max of maxes) {
      if (!max.exercises) continue;
      const existing = map.get(max.exercise_id);
      if (!existing) {
        map.set(max.exercise_id, {
          current: max.weight_kg,
          name: max.exercises.name,
          category: max.exercises.category,
        });
      } else if (existing.previous === undefined) {
        existing.previous = max.weight_kg;
      }
    }

    return Array.from(map.entries()).map(([exerciseId, d]) => ({
      exerciseId,
      name: d.name,
      category: d.category,
      currentWeightKg: d.current,
      trend:
        d.previous === undefined ? "same"
        : d.current > d.previous ? "up"
        : d.current < d.previous ? "down"
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

    for (const cat of CATEGORY_ORDER) {
      const items = filtered
        .filter((e) => e.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (items.length) result.push({ title: CATEGORY_LABELS[cat], data: items });
    }

    const others = filtered
      .filter((e) => !e.category)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (others.length) result.push({ title: "Other", data: others });

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
