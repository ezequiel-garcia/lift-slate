import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/services/profile.service";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: getProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["profile"] });
      const previous = queryClient.getQueryData(["profile"]);
      queryClient.setQueryData(["profile"], (old: Record<string, unknown>) => ({ ...old, ...updates }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["profile"], context?.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });
}
