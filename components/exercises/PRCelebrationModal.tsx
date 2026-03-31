import { useRef, useEffect, useState } from "react";
import { Modal, View, Text, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { fromKg, formatWeight, WeightUnit } from "@/lib/units";

const { width, height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  exerciseName: string;
  newWeightKg: number;
  previousWeightKg?: number;
  unit: WeightUnit;
  onClose: () => void;
  onViewHistory?: () => void;
};

export function PRCelebrationModal({
  visible,
  exerciseName,
  newWeightKg,
  previousWeightKg,
  unit,
  onClose,
  onViewHistory,
}: Props) {
  const lottieRef = useRef<LottieView>(null);
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const [countValue, setCountValue] = useState(newWeightKg);

  const targetDisplay = fromKg(newWeightKg, unit);
  const prevDisplay =
    previousWeightKg != null
      ? fromKg(previousWeightKg, unit)
      : targetDisplay * 0.9;
  const delta =
    previousWeightKg != null
      ? targetDisplay - fromKg(previousWeightKg, unit)
      : null;
  const deltaDisplay =
    delta != null && delta > 0
      ? `+${formatWeight(delta, unit)} from last PR`
      : null;

  useEffect(() => {
    if (!visible) return;

    // Reset
    scale.value = 0.7;
    opacity.value = 0;
    setCountValue(prevDisplay);

    // Play confetti
    lottieRef.current?.reset();
    lottieRef.current?.play();

    // Haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate content in
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });

    // Count-up the number
    const start = prevDisplay;
    const end = targetDisplay;
    const steps = 40;
    const intervalMs = 500 / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountValue(start + (end - start) * eased);
      if (step >= steps) {
        setCountValue(end);
        clearInterval(interval);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function handleViewHistory() {
    onClose();
    onViewHistory?.();
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{ backgroundColor: "rgba(6, 6, 8, 0.96)" }}
      >
        {/* Confetti — behind everything */}
        <LottieView
          ref={lottieRef}
          source={require("@/assets/confetti.json")}
          loop={false}
          style={{ position: "absolute", width, height, top: 0, left: 0 }}
          resizeMode="cover"
        />

        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          <Animated.View
            className="flex-1 items-center justify-center px-8"
            style={contentStyle}
          >
            {/* Label */}
            <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-3">
              Personal Record
            </Text>

            {/* Exercise name */}
            <Text
              className="text-foreground text-lg font-medium text-center mb-6"
              numberOfLines={2}
            >
              {exerciseName}
            </Text>

            <Text
              className="text-accent font-black text-center"
              style={{ fontSize: 80, lineHeight: 88 }}
            >
              {formatWeight(countValue, unit)}
            </Text>

            {/* Delta */}
            {deltaDisplay && (
              <Text className="text-accent/60 text-sm font-medium mt-3">
                {deltaDisplay}
              </Text>
            )}
          </Animated.View>

          {/* Bottom CTA — pinned */}
          <Animated.View
            className="px-6 pb-4 gap-2"
            style={{ opacity: opacity }}
          >
            <Pressable
              className="bg-accent rounded-2xl py-4 items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              onPress={onClose}
            >
              <Text className="text-bg font-bold text-[16px]">Done</Text>
            </Pressable>

            {onViewHistory && (
              <Pressable
                hitSlop={12}
                onPress={handleViewHistory}
                className="items-center py-2"
              >
                <Text className="text-muted text-sm">View history</Text>
              </Pressable>
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
