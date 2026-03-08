import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentMaxes, deleteExerciseMaxes } from "@/services/maxes.service";

export function useMaxes() {
  return useQuery({ queryKey: ["maxes"], queryFn: getCurrentMaxes });
}

export function useDeleteExerciseMaxes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => deleteExerciseMaxes(exerciseId),
    onMutate: (exerciseId) => {
      queryClient.setQueryData(["maxes"], (old: any[] | undefined) =>
        old ? old.filter((m) => m.exercise_id !== exerciseId) : []
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maxes"] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ["maxes"] }),
  });
}
