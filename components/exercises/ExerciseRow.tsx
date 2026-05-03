import { colors } from "@/lib/theme";
import { formatWeight, fromKg, WeightUnit } from "@/lib/units";
import type { Database } from "@/types/database.types";
import type { EquipmentType } from "@/types/exercise";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";

const EQUIPMENT_ICON: Record<
  EquipmentType,
  {
    library: "ionicons" | "materialCommunity";
    name: string;
    size: number;
    bg: string;
    color: string;
  }
> = {
  barbell: {
    library: "ionicons",
    name: "barbell",
    size: 20,
    bg: "#2A1316",
    color: "#FF7A88",
  },
  dumbbell: {
    library: "materialCommunity",
    name: "dumbbell",
    size: 20,
    bg: "#131C2E",
    color: "#5B9BFF",
  },
  kettlebell: {
    library: "materialCommunity",
    name: "kettlebell",
    size: 24,
    bg: "#1E1028",
    color: "#C88AFF",
  },
  bodyweight: {
    library: "ionicons",
    name: "body",
    size: 20,
    bg: "#0E1F1F",
    color: "#4AFFD4",
  },
  machine: {
    library: "ionicons",
    name: "settings",
    size: 20,
    bg: "#231810",
    color: "#FF9A5C",
  },
  other: {
    library: "ionicons",
    name: "fitness-outline",
    size: 20,
    bg: "#1A1A1E",
    color: "#888",
  },
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
      {cfg.library === "materialCommunity" ? (
        <MaterialCommunityIcons
          name={
            cfg.name as React.ComponentProps<
              typeof MaterialCommunityIcons
            >["name"]
          }
          size={cfg.size}
          color={cfg.color}
        />
      ) : (
        <Ionicons
          name={cfg.name as React.ComponentProps<typeof Ionicons>["name"]}
          size={cfg.size}
          color={cfg.color}
        />
      )}
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
  referenceType: Database["public"]["Enums"]["reference_type"];
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
  referenceType,
  unit,
  onDelete,
  index = 0,
}: Props) {
  const isRepsOnly = referenceType === "max_reps";
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
          className="flex-row items-center px-5 py-3 bg-bg"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
          })}
          onPress={() => router.push(`/exercise/${exerciseId}` as never)}
        >
          <EquipmentIcon equipmentType={equipmentType} />
          <View style={{ flex: 1, marginLeft: 14, marginRight: 10 }}>
            <Text
              style={{
                fontSize: 17,
                lineHeight: 22,
                color: colors.foreground,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {name}
            </Text>
          </View>
          {hasValue ? (
            <View
              style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}
            >
              <Text
                style={{
                  fontFamily: "CormorantGaramond-Regular",
                  fontSize: 36,
                  lineHeight: 42,
                  color: colors.foreground,
                  letterSpacing: -0.8,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {isRepsOnly
                  ? currentReps
                  : formatWeight(displayWeight, unit).replace(` ${unit}`, "")}
              </Text>
              <Text
                style={{
                  fontFamily: "CormorantGaramond-Regular",
                  fontSize: 16,
                  color: colors.foreground,
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {isRepsOnly ? "reps" : unit}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 22,
                color: colors.muted3,
              }}
            >
              —
            </Text>
          )}
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}
