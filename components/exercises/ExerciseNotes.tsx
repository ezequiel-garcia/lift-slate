import { View, Text, TextInput } from "react-native";
import { useExerciseNote } from "@/hooks/useExerciseNote";
import { colors } from "@/lib/theme";

type Props = {
  exerciseId: string;
};

export function ExerciseNotes({ exerciseId }: Props) {
  const { draft, setDraft, handleBlur, isSaving } = useExerciseNote(exerciseId);

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest">Notes</Text>
        {isSaving && <Text className="text-sm text-muted">Saving…</Text>}
      </View>
      <TextInput
        className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[16px]"
        placeholder="Form cues, coach feedback, goals…"
        placeholderTextColor={colors.muted}
        value={draft}
        onChangeText={setDraft}
        onBlur={handleBlur}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 96 }}
      />
    </View>
  );
}
