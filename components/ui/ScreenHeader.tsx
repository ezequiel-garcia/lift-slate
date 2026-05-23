import { type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = {
  title: string;
  onBack: () => void;
  backAccessibilityLabel?: string;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  title,
  onBack,
  backAccessibilityLabel = "Go back",
  rightAction,
}: Props) {
  return (
    <View className="flex-row items-center justify-center px-4 py-3 min-h-11">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
        className="absolute left-4 z-10 w-10 h-10 rounded-full bg-surface items-center justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="chevron-back" size={20} color={colors.foreground} />
      </Pressable>
      {rightAction ? (
        <View className="absolute right-4 z-10">{rightAction}</View>
      ) : null}
      <Text
        className="text-foreground text-lg font-bold text-center px-14"
        numberOfLines={1}
        pointerEvents="none"
      >
        {title}
      </Text>
    </View>
  );
}
