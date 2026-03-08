import { useQuery } from "@tanstack/react-query";
import { getCurrentMaxes } from "@/services/maxes.service";

export function useMaxes() {
  return useQuery({ queryKey: ["maxes"], queryFn: getCurrentMaxes });
}
