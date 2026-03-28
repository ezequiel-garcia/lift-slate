import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { useCallback, useEffect } from "react";
import {
  getTodaysWorkout,
  getWorkoutsByDate,
  getWorkoutsForWeek,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  WorkoutInput,
} from "@/services/workout.service";

export function useTodaysWorkout(gymId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["workouts", gymId, "today", today],
    queryFn: () => getTodaysWorkout(gymId!),
    enabled: !!gymId,
  });
}

export function useWorkoutsByDate(gymId: string | undefined, date: string) {
  const queryClient = useQueryClient();

  // Prefetch adjacent dates so back/forward navigation is instant
  const prefetchAdjacent = useCallback(
    (currentDate: string) => {
      if (!gymId) return;
      for (const offset of [-1, 1]) {
        const adjDate = format(
          addDays(new Date(currentDate), offset),
          "yyyy-MM-dd",
        );
        queryClient.prefetchQuery({
          queryKey: ["workouts", gymId, "date", adjDate],
          queryFn: () => getWorkoutsByDate(gymId, adjDate),
        });
      }
    },
    [gymId, queryClient],
  );

  const query = useQuery({
    queryKey: ["workouts", gymId, "date", date],
    queryFn: () => getWorkoutsByDate(gymId!, date),
    enabled: !!gymId,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.data) prefetchAdjacent(date);
  }, [query.data, date, prefetchAdjacent]);

  return query;
}

export function useWeekWorkouts(
  gymId: string | undefined,
  startDate: string | undefined,
) {
  return useQuery({
    queryKey: ["workouts", gymId, "week", startDate],
    queryFn: () => getWorkoutsForWeek(gymId!, startDate!),
    enabled: !!gymId && !!startDate,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gymId, input }: { gymId: string; input: WorkoutInput }) =>
      createWorkout(gymId, input),
    onSuccess: (_data, { gymId }) =>
      queryClient.invalidateQueries({ queryKey: ["workouts", gymId] }),
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      input,
    }: {
      workoutId: string;
      input: WorkoutInput;
    }) => updateWorkout(workoutId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => deleteWorkout(workoutId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });
}
