import { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/stores/appStore";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const hideToast = useAppStore((s) => s.hideToast);
  const [message, setMessage] = useState("");
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    setMessage(toast);
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
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
        position: "absolute",
        top: insets.top + 12,
        alignSelf: "center",
        backgroundColor: "#181818",
        borderWidth: 1,
        borderColor: "#2A2A2A",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: "#F0F0F0", fontSize: 14, fontWeight: "500" }}>{message}</Text>
    </Animated.View>
  );
}
