import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutWithSections, WorkoutItem } from "@/services/workout.service";
import { calculatePercentage, formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { EmptyState } from "@/components/ui/EmptyState";
import { colors } from "@/lib/theme";

type MaxMap = Record<string, number>;

interface Props {
  workouts: WorkoutWithSections[];
  maxMap: MaxMap;
  unit: WeightUnit;
  roundingKg: number;
  gymId?: string;
  canEditWorkout?: boolean;
  onDeleteWorkout?: (workoutId: string) => void;
}

function StructuredItem({
  item,
  maxMap,
  unit,
  roundingKg,
}: {
  item: WorkoutItem;
  maxMap: MaxMap;
  unit: WeightUnit;
  roundingKg: number;
}) {
  const exerciseName = item.exercises?.name ?? "Exercise";
  const setsReps = item.sets && item.reps ? `${item.sets}×${item.reps}` : null;

  let weightLine: React.ReactNode = null;
  let noMax = false;

  if (item.percentage && item.exercise_id) {
    const maxKg = maxMap[item.exercise_id];
    if (maxKg) {
      const { rounded } = calculatePercentage(maxKg, item.percentage, unit, roundingKg);
      weightLine = (
        <Text className="text-accent font-semibold text-sm">
          {item.percentage}% → {formatWeight(rounded, unit)}
        </Text>
      );
    } else {
      noMax = true;
      weightLine = (
        <Text className="text-muted text-sm">{item.percentage}% (no max recorded)</Text>
      );
    }
  } else if (item.weight_kg) {
    const displayWeight = fromKg(item.weight_kg, unit);
    weightLine = (
      <Text className="text-accent font-semibold text-sm">{formatWeight(Math.round(displayWeight), unit)}</Text>
    );
  }

  return (
    <View className="py-3">
      <Text className="text-foreground text-base font-semibold mb-1">{exerciseName}</Text>
      <View className="flex-row items-center gap-2 flex-wrap">
        {setsReps && (
          <Text className="text-muted text-sm">{setsReps}</Text>
        )}
        {setsReps && weightLine && (
          <Text className="text-border text-sm">·</Text>
        )}
        {weightLine}
      </View>
      {noMax && item.exercise_id && (
        <Pressable
          onPress={() => router.push(`/exercise/${item.exercise_id}?addMax=true`)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-accent text-xs mt-1">+ Add your max</Text>
        </Pressable>
      )}
      {!!item.notes && (
        <Text className="text-muted text-sm mt-1">{item.notes}</Text>
      )}
    </View>
  );
}

function FreeTextItem({ item }: { item: WorkoutItem }) {
  return (
    <View className="py-3">
      <Text className="text-foreground text-base">{item.content}</Text>
      {!!item.notes && (
        <Text className="text-muted text-sm mt-1">{item.notes}</Text>
      )}
    </View>
  );
}

export function WorkoutDayView({
  workouts,
  maxMap,
  unit,
  roundingKg,
  gymId,
  canEditWorkout,
  onDeleteWorkout,
}: Props) {
  const visibleWorkouts = workouts;

  if (visibleWorkouts.length === 0) {
    return (
      <EmptyState
        icon="barbell-outline"
        title="No workout posted"
        description="Check back later or browse other days."
      />
    );
  }

  function confirmDelete(workoutId: string, title: string | null) {
    Alert.alert(
      "Delete Workout",
      `Delete "${title || "this workout"}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeleteWorkout?.(workoutId) },
      ]
    );
  }

  return (
    <View className="gap-6">
      {visibleWorkouts.map((workout) => (
        <View key={workout.id}>
          {/* Workout header */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 gap-1">
              {!!workout.title && (
                <Text className="text-foreground text-xl font-bold">{workout.title}</Text>
              )}
              {!!workout.notes && (
                <Text className="text-muted text-sm">{workout.notes}</Text>
              )}
            </View>

            {canEditWorkout && (
              <View className="flex-row items-center gap-1 ml-2 mt-0.5">
                <Pressable
                  onPress={() => router.push(`/gym/${gymId}/workout/new?workoutId=${workout.id}`)}
                  className="w-9 h-9 items-center justify-center rounded-lg bg-surface"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.foreground} />
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(workout.id, workout.title)}
                  className="w-9 h-9 items-center justify-center rounded-lg bg-surface"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            )}
          </View>

          {workout.sections.map((section) => (
            <View key={section.id} className="mb-5">
              <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                {section.title}
              </Text>
              <View className="bg-surface rounded-2xl px-4 divide-y divide-border">
                {section.items.map((item) =>
                  item.item_type === "structured" ? (
                    <StructuredItem
                      key={item.id}
                      item={item}
                      maxMap={maxMap}
                      unit={unit}
                      roundingKg={roundingKg}
                    />
                  ) : (
                    <FreeTextItem key={item.id} item={item} />
                  )
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
