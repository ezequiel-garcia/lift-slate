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
import type { EquipmentType } from "@/types/exercise";

const EQUIPMENT_ICON: Record<
  EquipmentType,
  {
    name: React.ComponentProps<typeof Ionicons>["name"];
    bg: string;
    color: string;
  }
> = {
  barbell: { name: "barbell", bg: "#122210", color: "#B4FF4A" },
  dumbbell: { name: "barbell-outline", bg: "#131C2E", color: "#5B9BFF" },
  kettlebell: { name: "fitness", bg: "#1E1028", color: "#C88AFF" },
  bodyweight: { name: "body", bg: "#0E1F1F", color: "#4AFFD4" },
  machine: { name: "settings", bg: "#231810", color: "#FF9A5C" },
  other: { name: "ellipsis-horizontal", bg: "#1A1A1E", color: "#888" },
};

function EquipmentIcon({ equipmentType }: { equipmentType: EquipmentType }) {
  const cfg = EQUIPMENT_ICON[equipmentType];
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: cfg.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name={cfg.name} size={20} color={cfg.color} />
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
  equipmentType: EquipmentType;
  currentWeightKg: number | null;
  currentReps?: number | null;
  unit: WeightUnit;
  onDelete?: (exerciseId: string, name: string) => void;
  index?: number;
};

export function ExerciseRow({
  exerciseId,
  name,
  equipmentType,
  currentWeightKg,
  currentReps,
  unit,
  onDelete,
  index = 0,
}: Props) {
  const isRepsOnly = equipmentType === "bodyweight";
  const hasValue = isRepsOnly
    ? currentReps != null && currentReps > 0
    : currentWeightKg != null && currentWeightKg > 0;
  const displayWeight =
    currentWeightKg != null ? fromKg(currentWeightKg, unit) : 0;
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
          <EquipmentIcon equipmentType={equipmentType} />
          <View className="flex-1 mx-3.5">
            <Text
              className="text-body font-medium text-foreground"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          <Text
            className={`text-[17px] font-bold tabular-nums ${hasValue ? "text-foreground" : "text-muted"}`}
          >
            {isRepsOnly
              ? hasValue
                ? `${currentReps} reps`
                : "—"
              : hasValue
                ? formatWeight(displayWeight, unit)
                : "—"}
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
