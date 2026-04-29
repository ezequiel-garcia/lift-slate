import { useQuery } from "@tanstack/react-query";
import { getExerciseReferenceHistory } from "@/services/exerciseReferences.service";

export function useExerciseReferenceHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise_references", "history", exerciseId],
    queryFn: () => getExerciseReferenceHistory(exerciseId),
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 30, // 30m
    gcTime: 1000 * 60 * 60 * 24, // 24h
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
