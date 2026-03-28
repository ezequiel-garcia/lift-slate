import { useEffect, useState } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/stores/appStore";
import { colors, animation } from "@/lib/theme";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const hideToast = useAppStore((s) => s.hideToast);
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-8);

  useEffect(() => {
    if (!toast) return;
    setMessage(toast);

    const dur = reduceMotion ? 0 : animation.duration.normal;

    opacity.value = withSequence(
      withTiming(1, { duration: dur }),
      withDelay(2000, withTiming(0, { duration: dur + 50 })),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: dur }),
      withDelay(
        2000,
        withTiming(-8, { duration: dur + 50 }, () => {
          runOnJS(hideToast)();
        }),
      ),
    );
  }, [toast]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: insets.top + 8,
          alignSelf: "center",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingHorizontal: 18,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
      <Text
        style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
