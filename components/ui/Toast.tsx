import { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const hideToast = useAppStore((s) => s.hideToast);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    setMessage(toast);
    opacity.setValue(0);
    translateY.setValue(-8);
    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) hideToast();
    });
    return () => anim.stop();
  }, [toast]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        opacity,
        transform: [{ translateY }],
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
      }}
    >
      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>{message}</Text>
    </Animated.View>
  );
}
