import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, animation } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "lg" | "md" | "sm";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-accent",
    text: "text-bg font-bold",
  },
  secondary: {
    container: "bg-surface border border-border",
    text: "text-foreground font-semibold",
  },
  destructive: {
    container: "bg-surface border border-border",
    text: "text-error font-semibold",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-muted font-semibold",
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  lg: { container: "py-4 rounded-2xl", text: "text-[16px]" },
  md: { container: "py-3 px-5 rounded-xl", text: "text-[15px]" },
  sm: { container: "py-2 px-4 rounded-lg", text: "text-[14px]" },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: reduceMotion ? [] : [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: animation.duration.fast });
    opacity.value = withTiming(0.85, { duration: animation.duration.fast });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: animation.duration.fast });
    opacity.value = withTiming(1, { duration: animation.duration.fast });
  };

  const handlePress = () => {
    if (variant === "primary") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const v = variantClasses[variant];
  const s = sizeClasses[size];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      className={`items-center justify-center flex-row gap-2 ${v.container} ${s.container} ${isDisabled ? "opacity-50" : ""}`}
      style={[animatedStyle, style]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.bg : colors.foreground}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text className={`${v.text} ${s.text}`}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}
