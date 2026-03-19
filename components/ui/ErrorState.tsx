import { View, Text } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = "Something went wrong", onRetry }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      className="flex-1 items-center justify-center gap-4 px-8"
    >
      <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-1">
        <Ionicons name="cloud-offline-outline" size={28} color={colors.muted} />
      </View>
      <Text className="text-muted text-body text-center">{message}</Text>
      <Button label="Retry" variant="secondary" size="md" onPress={onRetry} />
    </Animated.View>
  );
}
