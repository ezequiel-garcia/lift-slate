import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGymByToken,
  getGymByTempCode,
  joinGymByToken,
  joinGymByTempCode,
} from "@/services/invite.service";
import { generateTempCode } from "@/services/gym.service";

export function useGymPreviewByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["gym", "preview", "token", token],
    queryFn: () => getGymByToken(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useGymPreviewByTempCode(code: string | undefined) {
  return useQuery({
    queryKey: ["gym", "preview", "code", code],
    queryFn: () => getGymByTempCode(code!),
    enabled: !!code && code.length === 8,
    retry: false,
  });
}

export function useJoinGymByToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => joinGymByToken(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useJoinGymByTempCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGymByTempCode(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useGenerateTempCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => generateTempCode(gymId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}
