import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyGym,
  createGym,
  updateGym,
  leaveGym,
  getGymMembers,
  getGymInviteDetails,
  deleteGym,
  removeMember,
  regenerateInviteToken,
} from "@/services/gym.service";

export function useMyGym() {
  return useQuery({
    queryKey: ["gym", "mine"],
    queryFn: getMyGym,
    staleTime: 5 * 60 * 1000, // 5 min — avoids refetch on every tab switch
    refetchOnMount: "always", // always verify gym membership on screen mount
  });
}

export function useCreateGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      description,
      address,
      logoUrl,
    }: {
      name: string;
      description?: string;
      address?: string;
      logoUrl?: string;
    }) => createGym(name, description, address, logoUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useUpdateGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      gymId,
      updates,
    }: {
      gymId: string;
      updates: Parameters<typeof updateGym>[1];
    }) => updateGym(gymId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useLeaveGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => leaveGym(membershipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useGymMembers(gymId: string | undefined) {
  return useQuery({
    queryKey: ["gym", gymId, "members"],
    queryFn: () => getGymMembers(gymId!),
    enabled: !!gymId,
  });
}

export function useDeleteGym() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => deleteGym(gymId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => removeMember(membershipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}

export function useGymInviteDetails(gymId: string | undefined) {
  return useQuery({
    queryKey: ["gym", gymId, "invite"],
    queryFn: () => getGymInviteDetails(gymId!),
    enabled: !!gymId,
  });
}

export function useRegenerateInviteToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => regenerateInviteToken(gymId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}
