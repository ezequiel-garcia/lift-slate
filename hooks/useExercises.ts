import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/services/exercises.service";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: getExercises,
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24, // 24h
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
