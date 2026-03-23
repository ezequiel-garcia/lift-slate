import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExerciseNote, upsertExerciseNote } from "@/services/exercise_notes.service";

export function useExerciseNote(exerciseId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["exercise_note", exerciseId];

  const { data: savedContent = "" } = useQuery({
    queryKey,
    queryFn: () => getExerciseNote(exerciseId),
    enabled: !!exerciseId,
  });

  const [draft, setDraft] = useState(savedContent);

  // Sync draft when remote data loads
  useEffect(() => {
    setDraft(savedContent);
  }, [savedContent]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (content: string) => upsertExerciseNote(exerciseId, content),
    onSuccess: (_, content) => {
      queryClient.setQueryData(queryKey, content);
    },
  });

  function handleSave() {
    if (draft !== savedContent) save(draft);
  }

  const isDirty = draft !== savedContent;

  return { draft, setDraft, handleSave, isSaving, isDirty };
}
