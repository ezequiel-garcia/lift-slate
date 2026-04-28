import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentExerciseReferences,
  deleteAllReferencesForExercise,
  deleteExerciseReference,
  createExerciseReference,
  CreateExerciseReferenceInput,
  getAthleteReferences,
  createAthleteReference,
  updateAthleteReference,
  UpdateExerciseReferenceInput,
} from "@/services/exerciseReferences.service";

const KEY = "exercise_references";

export function useExerciseReferences() {
  return useQuery({
    queryKey: [KEY],
    queryFn: getCurrentExerciseReferences,
    staleTime: 1000 * 60 * 30, // 30m
    gcTime: 1000 * 60 * 60 * 24, // 24h
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateExerciseReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExerciseReferenceInput) =>
      createExerciseReference(input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({
        queryKey: [KEY, "history", vars.exerciseId],
      });
    },
  });
}

export function useDeleteExerciseReference(exerciseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExerciseReference(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({
        queryKey: [KEY, "history", exerciseId],
      });
      const previousHistory = queryClient.getQueryData<
        { id: string; exercise_id?: string }[]
      >([KEY, "history", exerciseId]);
      queryClient.setQueriesData(
        { queryKey: [KEY, "history", exerciseId], exact: true },
        (old: { id: string }[] | undefined) =>
          old ? old.filter((entry) => entry.id !== id) : [],
      );
      return { previousHistory };
    },
    onError: (_error, _id, context) => {
      if (context?.previousHistory) {
        queryClient.setQueriesData(
          { queryKey: [KEY, "history", exerciseId], exact: true },
          context.previousHistory,
        );
      }
      queryClient.invalidateQueries({ queryKey: [KEY] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({
        queryKey: [KEY, "history", exerciseId],
      });
    },
  });
}

export function useDeleteAllReferencesForExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) =>
      deleteAllReferencesForExercise(exerciseId),
    onMutate: (exerciseId) => {
      queryClient.setQueryData(
        [KEY],
        (old: { exercise_id: string }[] | undefined) =>
          old ? old.filter((m) => m.exercise_id !== exerciseId) : [],
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

// --- Coach/Admin athlete access ---

export function useAthleteReferences(userId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "athlete", userId],
    queryFn: () => getAthleteReferences(userId!),
    enabled: !!userId,
  });
}

export function useCreateAthleteReference(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExerciseReferenceInput) =>
      createAthleteReference(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "athlete", userId] });
    },
  });
}

export function useUpdateAthleteReference(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExerciseReferenceInput;
    }) => updateAthleteReference(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "athlete", userId] });
    },
  });
}

export function useDeleteAthleteReference(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExerciseReference(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "athlete", userId] });
    },
  });
}
