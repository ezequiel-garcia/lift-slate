import { useMemo } from "react";
import { useExercises } from "./useExercises";
import { useProfile } from "./useProfile";
import { useMaxHistory } from "./useMaxHistory";

export function useExerciseDetail(exerciseId: string) {
  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const { data: history = [], isLoading: historyLoading, isError, refetch } = useMaxHistory(exerciseId);
  const { data: profile, isLoading: profileLoading } = useProfile();

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId) ?? null,
    [exercises, exerciseId],
  );

  return {
    exercise,
    history,
    profile,
    isLoading: exercisesLoading || historyLoading || profileLoading,
    isError,
    refetch,
  };
}
