import { Text, View } from "react-native";

import { ExerciseNotes } from "@/components/exercises/ExerciseNotes";

type Props = {
  exerciseId: string;
  readonly?: boolean;
};

export function NotesTab({ exerciseId, readonly }: Props) {
  return (
    <View className="flex-1 px-5 pb-6">
      {readonly ? (
        <Text className="text-muted text-base mt-4">
          Notes are available only when editing is enabled.
        </Text>
      ) : (
        <ExerciseNotes exerciseId={exerciseId} />
      )}
    </View>
  );
}
