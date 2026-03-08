import { useQuery } from "@tanstack/react-query";
import { getMaxHistory } from "@/services/maxes.service";

export function useMaxHistory(exerciseId: string) {
  return useQuery({
    queryKey: ["maxes", "history", exerciseId],
    queryFn: () => getMaxHistory(exerciseId),
    enabled: !!exerciseId,
  });
}
