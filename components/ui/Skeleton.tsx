import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  useReducedMotion,
} from "react-native-reanimated";
import { useEffect } from "react";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
};

export function Skeleton({ width, height = 16, borderRadius = 8, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true,
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.5 : opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-surface2 ${className}`}
      style={[{ width, height, borderRadius }, animatedStyle]}
    />
  );
}

export function ExerciseRowSkeleton() {
  return (
    <View className="flex-row items-center px-5 py-3.5 gap-3.5">
      <Skeleton width={42} height={42} borderRadius={11} />
      <View className="flex-1 gap-1.5">
        <Skeleton width="60%" height={16} />
      </View>
      <Skeleton width={64} height={18} />
    </View>
  );
}

export function ExerciseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View className="pt-4">
      {/* Section header skeleton */}
      <View className="px-5 pt-6 pb-2.5">
        <Skeleton width={80} height={12} />
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <ExerciseRowSkeleton />
          {i < count - 1 && <View className="h-px bg-border ml-[72px] mr-5" />}
        </View>
      ))}
    </View>
  );
}
