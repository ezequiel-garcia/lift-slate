import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentMaxes,
  deleteExerciseMaxes,
  deleteMax,
  createMax,
  CreateMaxInput,
  getAthleteMaxes,
  createAthleteMax,
  updateAthleteMax,
  UpdateMaxInput,
} from "@/services/maxes.service";

export function useMaxes() {
  return useQuery({ queryKey: ["maxes"], queryFn: getCurrentMaxes });
}

export function useCreateMax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMaxInput) => createMax(input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["maxes"] });
      queryClient.invalidateQueries({
        queryKey: ["maxes", "history", vars.exerciseId],
      });
    },
  });
}

export function useDeleteMax(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes"] });
      queryClient.invalidateQueries({
        queryKey: ["maxes", "history", exerciseId],
      });
    },
  });
}

// --- Coach/Admin athlete access ---

export function useAthleteMaxes(userId: string | undefined) {
  return useQuery({
    queryKey: ["maxes", "athlete", userId],
    queryFn: () => getAthleteMaxes(userId!),
    enabled: !!userId,
  });
}

export function useCreateAthleteMax(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMaxInput) => createAthleteMax(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes", "athlete", userId] });
    },
  });
}

export function useUpdateAthleteMax(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMaxInput }) =>
      updateAthleteMax(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes", "athlete", userId] });
    },
  });
}

export function useDeleteAthleteMax(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes", "athlete", userId] });
    },
  });
}

export function useDeleteExerciseMaxes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => deleteExerciseMaxes(exerciseId),
    onMutate: (exerciseId) => {
      queryClient.setQueryData(["maxes"], (old: any[] | undefined) =>
        old ? old.filter((m) => m.exercise_id !== exerciseId) : [],
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maxes"] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ["maxes"] }),
  });
}
