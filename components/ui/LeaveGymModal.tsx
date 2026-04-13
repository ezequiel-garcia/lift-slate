import { colors } from "@/lib/theme";
import { useEffect } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  gymName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLeaving: boolean;
}

const SPRING = { damping: 28, stiffness: 200, mass: 0.8 };
const SHEET_OFFSET = 400;

export function LeaveGymModal({
  visible,
  gymName,
  onCancel,
  onConfirm,
  isLeaving,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, SPRING);
    }
  }, [visible, backdropOpacity, translateY]);

  function handleClose() {
    if (isLeaving) return;
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SHEET_OFFSET, SPRING, (finished) => {
      if (finished) runOnJS(onCancel)();
    });
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 20 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
            }}
          />
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Leave {gymName}?
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 14,
              lineHeight: 20,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {
              "You'll lose access to gym workouts and coach edits. You can rejoin later with an invite."
            }
          </Text>

          <Pressable
            onPress={onConfirm}
            disabled={isLeaving}
            className="h-[52px] rounded-2xl items-center justify-center bg-error active:opacity-85 mb-[10px]"
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Leave Gym
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleClose}
            disabled={isLeaving}
            className={`h-[52px] rounded-2xl items-center justify-center bg-surface2 border border-border active:opacity-50 ${isLeaving ? "opacity-50" : ""}`}
            style={{ marginBottom: Math.max(insets.bottom, 24) }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
