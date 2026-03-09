import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = "Something went wrong", onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
      <Text className="text-muted text-base text-center">{message}</Text>
      <Pressable
        className="bg-surface2 rounded-xl px-6 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={onRetry}
      >
        <Text className="text-foreground font-semibold text-[15px]">Retry</Text>
      </Pressable>
    </View>
  );
}
