import { useQuery } from "@tanstack/react-query";
import { getExerciseReferenceHistory } from "@/services/exerciseReferences.service";

export function useExerciseReferenceHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["exercise_references", "history", exerciseId],
    queryFn: () => getExerciseReferenceHistory(exerciseId),
    enabled: !!exerciseId,
  });
}
