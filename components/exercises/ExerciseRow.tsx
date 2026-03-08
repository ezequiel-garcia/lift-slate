import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useAnimatedStyle, interpolate } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { fromKg, formatWeight, WeightUnit } from "@/lib/units";

type Trend = "up" | "down" | "same";

function TrendIndicator({ trend }: { trend: Trend }) {
  const map: Record<Trend, { symbol: string; className: string }> = {
    up: { symbol: "↑", className: "text-accent" },
    down: { symbol: "↓", className: "text-error" },
    same: { symbol: "→", className: "text-muted" },
  };
  const { symbol, className } = map[trend];
  return <Text className={`text-base font-semibold ${className}`}>{symbol}</Text>;
}

function DeleteAction({
  progress,
  onDelete,
}: {
  progress: SharedValue<number>;
  onDelete: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <Animated.View style={[style, { width: 80, justifyContent: "center", alignItems: "center" }]}>
      <Pressable
        className="flex-1 w-full bg-error justify-center items-center border-b border-border"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        onPress={onDelete}
      >
        <Text className="text-white font-semibold text-sm">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

type Props = {
  exerciseId: string;
  name: string;
  currentWeightKg: number;
  trend: Trend;
  unit: WeightUnit;
  onDelete?: (exerciseId: string, name: string) => void;
};

export function ExerciseRow({ exerciseId, name, currentWeightKg, trend, unit, onDelete }: Props) {
  const displayWeight = fromKg(currentWeightKg, unit);

  return (
    <Swipeable
      renderRightActions={(progress) =>
        onDelete ? (
          <DeleteAction progress={progress} onDelete={() => onDelete(exerciseId, name)} />
        ) : null
      }
      overshootFriction={8}
      friction={2}
    >
      <Pressable
        className="flex-row items-center justify-between px-4 py-[14px] border-b border-border bg-bg"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={() => router.push(`/exercise/${exerciseId}` as never)}
      >
        <Text className="flex-1 mr-2 text-base text-foreground" numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-foreground">
            {formatWeight(displayWeight, unit)}
          </Text>
          <TrendIndicator trend={trend} />
        </View>
      </Pressable>
    </Swipeable>
  );
}
