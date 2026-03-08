import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/services/exercises.service";

export function useExercises() {
  return useQuery({ queryKey: ["exercises"], queryFn: getExercises });
}
