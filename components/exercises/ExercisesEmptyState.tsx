import { View, Text, Pressable } from "react-native";

type Props = { onAdd: () => void };

export function ExercisesEmptyState({ onAdd }: Props) {
  return (
    <View className="flex-1 justify-center items-center px-8 gap-4">
      <Text className="text-6xl">🏋️</Text>
      <Text className="text-[22px] font-bold text-foreground">No lifts yet</Text>
      <Text className="text-sm text-muted text-center">
        Track your 1RMs to see training weights
      </Text>
      <Pressable
        className="bg-accent rounded-full px-6 py-[10px] mt-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        onPress={onAdd}
      >
        <Text className="text-bg font-bold text-[15px]">Add your first exercise</Text>
      </Pressable>
    </View>
  );
}
