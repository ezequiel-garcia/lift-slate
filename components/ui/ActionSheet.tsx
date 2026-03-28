import { useEffect } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  cancel?: boolean;
}

interface Props {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

const SPRING = { damping: 28, stiffness: 200, mass: 0.8 };
const SHEET_OFFSET = 600;

export function ActionSheet({ visible, title, options, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_OFFSET);
  const backdropOpacity = useSharedValue(0);

  const actions = options.filter((o) => !o.cancel);
  const cancel = options.find((o) => o.cancel);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, SPRING);
    }
  }, [visible]);

  function handleClose() {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SHEET_OFFSET, SPRING, (finished) => {
      if (finished) runOnJS(onClose)();
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
      {/* Backdrop */}
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

      {/* Sheet */}
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, bottom: 0 },
          sheetStyle,
        ]}
      >
        <View
          style={{
            paddingBottom: Math.max(insets.bottom, 8),
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          {/* Main card */}
          <View className="bg-surface rounded-2xl overflow-hidden">
            {title && (
              <View className="items-center px-4 pt-4 pb-3 border-b border-border">
                <Text
                  className="text-muted text-sm font-medium"
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
            )}
            {actions.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  handleClose();
                  // Slight delay so sheet animates before navigating
                  setTimeout(opt.onPress, 50);
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                className={`px-4 py-[17px] ${i < actions.length - 1 ? "border-b border-border" : ""}`}
              >
                <Text
                  className={`text-base text-center font-medium ${opt.destructive ? "text-error" : "text-foreground"}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cancel */}
          {cancel && (
            <Pressable
              onPress={handleClose}
              className="bg-surface rounded-2xl py-[17px]"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-base text-center font-semibold text-foreground">
                {cancel.label}
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}
