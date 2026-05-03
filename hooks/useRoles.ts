import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMemberRole,
  updateMemberRole,
  GymMembershipRole,
} from "@/services/roles.service";

export function useMyGymRole(gymId: string | undefined) {
  return useQuery({
    queryKey: ["gym", gymId, "role"],
    queryFn: () => getMemberRole(gymId!),
    enabled: !!gymId,
    staleTime: 0,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      membershipId,
      newRole,
    }: {
      membershipId: string;
      newRole: GymMembershipRole;
    }) => updateMemberRole(membershipId, newRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gym"] }),
  });
}
