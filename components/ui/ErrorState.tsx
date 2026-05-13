import { View, Text } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const displayMessage = message ?? t("error_state.message");

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      className="flex-1 items-center justify-center gap-4 px-8"
    >
      <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-1">
        <Ionicons name="cloud-offline-outline" size={28} color={colors.muted} />
      </View>
      <Text className="text-muted text-body text-center">{displayMessage}</Text>
      <Button
        label={t("error_state.retry")}
        variant="secondary"
        size="md"
        onPress={onRetry}
      />
    </Animated.View>
  );
}
