import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  interpolate,
  FadeIn,
  useReducedMotion,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { fromKg, formatWeight, WeightUnit } from "@/lib/units";
import type { ExerciseCategory } from "@/types/exercise";

const CATEGORY_ICON: Record<
  NonNullable<ExerciseCategory>,
  {
    name: React.ComponentProps<typeof Ionicons>["name"];
    bg: string;
    color: string;
  }
> = {
  squat: { name: "body", bg: "#131C2E", color: "#5B9BFF" },
  press: { name: "arrow-up", bg: "#231810", color: "#FF9A5C" },
  pull: { name: "arrow-down", bg: "#1E1028", color: "#C88AFF" },
  olympic: { name: "trophy", bg: "#231E0A", color: "#FFD84A" },
  accessory: { name: "barbell", bg: "#122210", color: "#B4FF4A" },
  core: { name: "body-outline", bg: "#0E1F1E", color: "#4ECDC4" },
  conditioning: { name: "flame-outline", bg: "#1F0E0E", color: "#FF6B6B" },
};

function CategoryIcon({ category }: { category: ExerciseCategory | null }) {
  const cfg = category ? CATEGORY_ICON[category] : null;
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: cfg?.bg ?? "#1A1A1E",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={cfg?.name ?? "barbell-outline"}
        size={20}
        color={cfg?.color ?? "#555"}
      />
    </View>
  );
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
    <Animated.View
      style={[
        style,
        { width: 88, justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Pressable
        className="flex-1 w-full bg-error justify-center items-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text className="text-white font-medium text-xs mt-1">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

type Props = {
  exerciseId: string;
  name: string;
  category: ExerciseCategory | null;
  currentWeightKg: number;
  unit: WeightUnit;
  onDelete?: (exerciseId: string, name: string) => void;
  index?: number;
};

export function ExerciseRow({
  exerciseId,
  name,
  category,
  currentWeightKg,
  unit,
  onDelete,
  index = 0,
}: Props) {
  const displayWeight = fromKg(currentWeightKg, unit);
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeIn.delay(Math.min(index, 8) * 40).duration(300)
      }
    >
      <Swipeable
        renderRightActions={(progress) =>
          onDelete ? (
            <DeleteAction
              progress={progress}
              onDelete={() => onDelete(exerciseId, name)}
            />
          ) : null
        }
        overshootFriction={8}
        friction={2}
      >
        <Pressable
          className="flex-row items-center px-5 py-3.5 bg-bg"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={() => router.push(`/exercise/${exerciseId}` as never)}
        >
          <CategoryIcon category={category} />
          <View className="flex-1 mx-3.5">
            <Text
              className="text-body font-medium text-foreground"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          <Text className="text-[17px] font-bold text-foreground tabular-nums">
            {formatWeight(displayWeight, unit)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#3F3F46"
            style={{ marginLeft: 6 }}
          />
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}
