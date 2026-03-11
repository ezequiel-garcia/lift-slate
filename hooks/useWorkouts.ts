import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  getTodaysWorkout,
  getWorkoutsForWeek,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  publishWorkout,
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

export function useWeekWorkouts(gymId: string | undefined, startDate: string | undefined) {
  return useQuery({
    queryKey: ["workouts", gymId, "week", startDate],
    queryFn: () => getWorkoutsForWeek(gymId!, startDate!),
    enabled: !!gymId && !!startDate,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gymId, input }: { gymId: string; input: WorkoutInput }) => createWorkout(gymId, input),
    onSuccess: (_data, { gymId }) => queryClient.invalidateQueries({ queryKey: ["workouts", gymId] }),
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, input }: { workoutId: string; input: WorkoutInput }) =>
      updateWorkout(workoutId, input),
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

export function usePublishWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => publishWorkout(workoutId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });
}
