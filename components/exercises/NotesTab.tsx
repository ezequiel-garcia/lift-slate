import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExerciseNotes } from "@/components/exercises/ExerciseNotes";

type Props = {
  exerciseId: string;
  readonly?: boolean;
};

export function NotesTab({ exerciseId, readonly }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  if (readonly) {
    return (
      <View className="flex-1 px-5 pb-6">
        <Text className="text-muted text-base mt-4">
          Notes are available only when editing is enabled.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : Platform.OS === "android"
            ? "height"
            : undefined
      }
      enabled
    >
      <View className="flex-1 px-5" style={{ paddingBottom: bottomPad }}>
        <ExerciseNotes exerciseId={exerciseId} />
      </View>
    </KeyboardAvoidingView>
  );
}
