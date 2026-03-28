import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useExerciseNote } from "@/hooks/useExerciseNote";
import { colors } from "@/lib/theme";

type Props = {
  exerciseId: string;
};

export function ExerciseNotes({ exerciseId }: Props) {
  const { draft, setDraft, handleSave, isSaving, isDirty } =
    useExerciseNote(exerciseId);

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest">
          Notes
        </Text>
        {isSaving && <ActivityIndicator size="small" color={colors.muted} />}
      </View>
      <TextInput
        className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[16px]"
        placeholder="Form cues, coach feedback, goals…"
        placeholderTextColor={colors.muted}
        value={draft}
        onChangeText={setDraft}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 96 }}
      />
      {isDirty && (
        <Pressable
          className="mt-3 bg-accent rounded-xl py-3 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text className="text-bg font-bold text-[15px]">Save Notes</Text>
        </Pressable>
      )}
    </View>
  );
}
