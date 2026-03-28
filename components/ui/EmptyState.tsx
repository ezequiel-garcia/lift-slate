import { View, Text } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(400)}
      className="items-center px-8 gap-4 py-8"
    >
      <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-1">
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <Text className="text-xl font-bold text-foreground text-center">
        {title}
      </Text>
      <Text className="text-subtext text-muted text-center leading-relaxed">
        {description}
      </Text>
      {action && <View className="mt-2 w-full">{action}</View>}
    </Animated.View>
  );
}
