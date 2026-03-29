import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutWithSections, WorkoutItem } from "@/services/workout.service";
import { BLOCK_TYPE_LABELS } from "@/components/workout/constants";
import {
  calculatePercentage,
  formatWeight,
  fromKg,
  WeightUnit,
} from "@/lib/units";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { colors } from "@/lib/theme";
import { format, parseISO } from "date-fns";

type MaxMap = Record<string, number>;

function workoutHeadingLabel(workout: WorkoutWithSections): string {
  const custom = workout.title?.trim();
  if (custom) return custom;
  return format(parseISO(workout.scheduled_date), "EEE, MMM d");
}

interface Props {
  workouts: WorkoutWithSections[];
  maxMap: MaxMap;
  unit: WeightUnit;
  gymId?: string;
  canEditWorkout?: boolean;
  selectedDate?: string;
  onDeleteWorkout?: (workoutId: string) => void;
}

function StructuredItem({
  item,
  maxMap,
  unit,
}: {
  item: WorkoutItem;
  maxMap: MaxMap;
  unit: WeightUnit;
}) {
  const exerciseName = item.exercises?.name ?? "Exercise";
  const setsReps =
    item.sets && item.reps
      ? `${item.sets}×${item.reps}`
      : item.sets
        ? `${item.sets} sets`
        : item.reps
          ? `${item.reps} reps`
          : null;

  let weightLine: React.ReactNode = null;
  let noMax = false;

  if (item.percentage && item.exercise_id) {
    const maxKg = maxMap[item.exercise_id];
    if (maxKg) {
      const weight = calculatePercentage(maxKg, item.percentage, unit);
      weightLine = (
        <Text className="text-accent font-semibold text-sm">
          {item.percentage}% → {formatWeight(weight, unit)}
        </Text>
      );
    } else {
      noMax = true;
      weightLine = (
        <Text className="text-muted text-sm">
          {item.percentage}% (no max recorded)
        </Text>
      );
    }
  } else if (item.weight_kg) {
    const displayWeight = fromKg(item.weight_kg, unit);
    weightLine = (
      <Text className="text-accent font-semibold text-sm">
        {formatWeight(Math.round(displayWeight), unit)}
      </Text>
    );
  }

  return (
    <View className="py-3">
      <Text className="text-foreground text-base font-semibold mb-1">
        {exerciseName}
      </Text>
      <View className="flex-row items-center gap-2 flex-wrap">
        {setsReps && <Text className="text-muted text-sm">{setsReps}</Text>}
        {setsReps && weightLine && (
          <Text className="text-border text-sm">·</Text>
        )}
        {weightLine}
      </View>
      {noMax && item.exercise_id && (
        <Pressable
          onPress={() =>
            router.push(`/exercise/${item.exercise_id}?addMax=true`)
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-accent text-xs mt-1">
            + Add 1RM to calculate weight
          </Text>
        </Pressable>
      )}
      {!!item.notes && (
        <Text className="text-muted text-sm mt-1">{item.notes}</Text>
      )}
    </View>
  );
}

function CustomExerciseItem({ item }: { item: WorkoutItem }) {
  const setsReps =
    item.sets && item.reps
      ? `${item.sets}×${item.reps}`
      : item.sets
        ? `${item.sets} sets`
        : item.reps
          ? `${item.reps} reps`
          : null;

  return (
    <View className="py-3">
      <Text className="text-foreground text-base font-semibold mb-1">
        {item.content || "Custom Exercise"}
      </Text>
      {setsReps && <Text className="text-muted text-sm">{setsReps}</Text>}
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
  gymId,
  canEditWorkout,
  selectedDate,
  onDeleteWorkout,
}: Props) {
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon="barbell-outline"
        title="No workout posted"
        description={
          canEditWorkout
            ? "No workout scheduled for this day."
            : "Check back later or browse other days."
        }
        action={
          canEditWorkout && gymId ? (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/gym/[id]/workout/new",
                  params: {
                    id: gymId,
                    ...(selectedDate ? { date: selectedDate } : {}),
                  },
                })
              }
              className="bg-accent rounded-2xl py-3 items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-bg font-bold text-base">Add Workout</Text>
            </Pressable>
          ) : undefined
        }
      />
    );
  }

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId) ?? null;

  return (
    <View className="gap-6">
      {workouts.map((workout) => {
        const heading = workoutHeadingLabel(workout);
        return (
          <View key={workout.id}>
            {/* Workout header */}
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 gap-1">
                <Text className="text-foreground text-xl font-bold">
                  {heading}
                </Text>
                {!!workout.notes && (
                  <Text className="text-muted text-sm">{workout.notes}</Text>
                )}
              </View>

              {canEditWorkout && (
                <Pressable
                  onPress={() => setActiveWorkoutId(workout.id)}
                  className="w-9 h-9 items-center justify-center ml-2 mt-0.5"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              )}
            </View>

            {workout.sections.map((section) => (
              <View key={section.id} className="mb-5">
                <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                  {section.title ||
                    (section.block_type
                      ? BLOCK_TYPE_LABELS[section.block_type]
                      : "")}
                </Text>
                <View className="bg-surface rounded-2xl px-4 divide-y divide-border">
                  {section.items.map((item) =>
                    item.item_type === "exercise" ? (
                      <StructuredItem
                        key={item.id}
                        item={item}
                        maxMap={maxMap}
                        unit={unit}
                      />
                    ) : (
                      <CustomExerciseItem key={item.id} item={item} />
                    ),
                  )}
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <ActionSheet
        visible={!!activeWorkoutId}
        title={activeWorkout ? workoutHeadingLabel(activeWorkout) : "Workout"}
        onClose={() => setActiveWorkoutId(null)}
        options={[
          {
            label: "Edit",
            onPress: () =>
              router.push(
                `/gym/${gymId}/workout/new?workoutId=${activeWorkoutId}`,
              ),
          },
          {
            label: "Delete",
            destructive: true,
            onPress: () => onDeleteWorkout?.(activeWorkoutId!),
          },
          { label: "Cancel", cancel: true, onPress: () => {} },
        ]}
      />
    </View>
  );
}
