import { useState } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { colors, animation } from "@/lib/theme";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export function Input({
  label,
  error,
  leftIcon,
  rightElement,
  style,
  ...rest
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        error ? colors.error : colors.border,
        error ? colors.error : colors.accent,
      ],
    ),
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, {
      duration: animation.duration.normal,
    });
    rest.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, {
      duration: animation.duration.normal,
    });
    rest.onBlur?.(e);
  };

  return (
    <View>
      {label && (
        <Text className="text-label uppercase tracking-wider text-muted mb-2">
          {label}
        </Text>
      )}
      <AnimatedView
        className="bg-surface rounded-xl border flex-row items-center px-4"
        style={borderStyle}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}
        <TextInput
          className="flex-1 py-3.5 text-foreground text-[16px]"
          placeholderTextColor={colors.muted}
          selectionColor={colors.accent}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={style}
          {...rest}
        />
        {rightElement && <View className="ml-2.5">{rightElement}</View>}
      </AnimatedView>
      {error && <Text className="text-error text-sm mt-1.5">{error}</Text>}
    </View>
  );
}
