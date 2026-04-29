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
import { heavyRange, easyRange } from "@/lib/kettlebells";
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

function formatRangeKg(values: number[], unit: WeightUnit): string {
  if (values.length === 0) return "";
  const display = values.map((v) => Math.round(fromKg(v, unit)));
  if (display.length === 1) return formatWeight(display[0], unit);
  return `${display[0]}–${formatWeight(display[display.length - 1], unit)}`;
}

type ResolvedPrescription = {
  text: React.ReactNode;
  /** True when the athlete needs to add a reference for this prescription to resolve. */
  needsReference: boolean;
  /** Kind of reference to suggest adding ("1RM" or "working weight"). */
  referenceLabel?: string;
};

function resolvePrescription(
  item: WorkoutItem,
  maxMap: MaxMap,
  unit: WeightUnit,
): ResolvedPrescription | null {
  const mode = item.prescription_mode;
  const refKg = item.exercise_id ? maxMap[item.exercise_id] : undefined;

  // Legacy / unset: fall back to old behavior (percentage of 1RM, or absolute kg)
  if (!mode) {
    if (item.percentage && item.exercise_id) {
      if (refKg) {
        const w = calculatePercentage(refKg, item.percentage, unit);
        return {
          text: (
            <Text className="text-accent font-semibold text-sm">
              {item.percentage}% → {formatWeight(w, unit)}
            </Text>
          ),
          needsReference: false,
        };
      }
      return {
        text: (
          <Text className="text-muted text-sm">
            {item.percentage}% (no max recorded)
          </Text>
        ),
        needsReference: true,
        referenceLabel: "1RM",
      };
    }
    if (item.weight_kg) {
      const w = fromKg(item.weight_kg, unit);
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">
            {formatWeight(Math.round(w), unit)}
          </Text>
        ),
        needsReference: false,
      };
    }
    return null;
  }

  switch (mode) {
    case "percentage": {
      if (!item.percentage || !item.exercise_id) return null;
      if (!refKg)
        return {
          text: (
            <Text className="text-muted text-sm">
              {item.percentage}% (no 1RM recorded)
            </Text>
          ),
          needsReference: true,
          referenceLabel: "1RM",
        };
      const w = calculatePercentage(refKg, item.percentage, unit);
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">
            {item.percentage}% → {formatWeight(w, unit)}
          </Text>
        ),
        needsReference: false,
      };
    }

    case "working_weight": {
      if (!refKg)
        return {
          text: (
            <Text className="text-muted text-sm">Working weight (not set)</Text>
          ),
          needsReference: true,
          referenceLabel: "working weight",
        };
      const w = fromKg(refKg, unit);
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">
            Working Weight: {formatWeight(Math.round(w), unit)}
          </Text>
        ),
        needsReference: false,
      };
    }

    case "heavy":
    case "easy": {
      if (!refKg)
        return {
          text: (
            <Text className="text-muted text-sm">
              {mode === "heavy" ? "Heavy" : "Easy"} (no working weight)
            </Text>
          ),
          needsReference: true,
          referenceLabel: "working weight",
        };
      const range = mode === "heavy" ? heavyRange(refKg) : easyRange(refKg);
      const label = mode === "heavy" ? "Heavy" : "Easy";
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">
            {label}: ~{formatRangeKg(range, unit)}
          </Text>
        ),
        needsReference: false,
      };
    }

    case "absolute": {
      if (!item.weight_kg) return null;
      const w = fromKg(item.weight_kg, unit);
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">
            {formatWeight(Math.round(w), unit)}
          </Text>
        ),
        needsReference: false,
      };
    }

    case "bodyweight": {
      const extra = item.weight_kg
        ? ` + ${Math.round(fromKg(item.weight_kg, unit))} ${unit}`
        : "";
      return {
        text: (
          <Text className="text-accent font-semibold text-sm">BW{extra}</Text>
        ),
        needsReference: false,
      };
    }

    case "reps_only":
      return null;

    default:
      return null;
  }
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

  const resolved = resolvePrescription(item, maxMap, unit);

  return (
    <View className="py-3">
      <View className="flex-row items-baseline flex-wrap">
        <Text className="text-foreground text-base font-semibold">
          {exerciseName}
        </Text>
        {setsReps && (
          <Text className="text-muted text-sm">
            {" · "}
            {setsReps}
          </Text>
        )}
        {resolved && <Text className="text-muted text-sm">{" · "}</Text>}
        {resolved?.text}
      </View>
      {resolved?.needsReference && item.exercise_id && (
        <Pressable
          onPress={() =>
            router.push(`/exercise/${item.exercise_id}?addMax=true`)
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-accent text-xs mt-1">
            + Add {resolved.referenceLabel} to calculate weight
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
      <View className="flex-row items-baseline flex-wrap">
        <Text className="text-foreground text-base font-semibold">
          {item.content || "Custom Exercise"}
        </Text>
        {setsReps && (
          <Text className="text-muted text-sm">
            {" · "}
            {setsReps}
          </Text>
        )}
      </View>
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
