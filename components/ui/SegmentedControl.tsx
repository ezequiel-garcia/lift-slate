import { animation } from "@/lib/theme";
import { useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Segment<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  selected: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
}: Props<T>) {
  const reduceMotion = useReducedMotion();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const activeIndex = segments.findIndex((s) => s.value === selected);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    const singleWidth = (width - 8) / segments.length; // subtract p-1 (4px each side)
    setSegmentWidth(singleWidth);
    translateX.value = activeIndex * singleWidth;
  };

  const handleSelect = (value: T, index: number) => {
    const duration = reduceMotion ? 0 : animation.duration.fast;
    translateX.value = withTiming(index * segmentWidth, { duration });
    onChange(value);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth,
  }));

  return (
    <View
      className="flex-row bg-surface rounded-xl p-1 relative"
      onLayout={handleLayout}
    >
      {/* Sliding indicator */}
      {segmentWidth > 0 && (
        <Animated.View
          className="absolute top-1 bottom-1 left-1 bg-accent-muted rounded-lg"
          style={indicatorStyle}
        />
      )}

      {segments.map((segment, index) => (
        <Pressable
          key={segment.value}
          className="flex-1 py-2.5 items-center z-10"
          onPress={() => handleSelect(segment.value, index)}
        >
          <Text
            className={`text-[14px] font-semibold ${
              selected === segment.value ? "text-foreground" : "text-muted"
            }`}
          >
            {segment.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
