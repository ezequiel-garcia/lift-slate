import { useMemo } from "react";
import { useExercises } from "./useExercises";
import { useProfile } from "./useProfile";
import { useExerciseReferenceHistory } from "./useExerciseReferenceHistory";

export function useExerciseDetail(exerciseId: string) {
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const {
    data: history = [],
    isLoading: historyLoading,
    isError,
    refetch,
  } = useExerciseReferenceHistory(exerciseId);
  const { data: profile, isLoading: profileLoading } = useProfile();

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId) ?? null,
    [exercises, exerciseId],
  );

  return {
    exercise,
    history,
    profile,
    isLoading: exercisesLoading || profileLoading,
    historyLoading,
    isError,
    refetch,
  };
}
