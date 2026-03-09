import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = { onAdd: () => void };

export function ExercisesEmptyState({ onAdd }: Props) {
  return (
    <View className="flex-1 justify-center items-center px-8 gap-4">
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          backgroundColor: colors.surface,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Ionicons name="barbell-outline" size={36} color={colors.muted} />
      </View>
      <Text className="text-2xl font-bold text-foreground">No lifts yet</Text>
      <Text className="text-base text-muted text-center leading-6">
        Track your 1RMs to auto-calculate{"\n"}training weights
      </Text>
      <Pressable
        className="bg-accent rounded-2xl px-8 py-4 mt-3"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#B4FF4A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        })}
        onPress={onAdd}
      >
        <Text className="text-bg font-bold text-[16px]">Add your first exercise</Text>
      </Pressable>
    </View>
  );
}
