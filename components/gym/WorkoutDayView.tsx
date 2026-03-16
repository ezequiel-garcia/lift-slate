import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutWithSections, WorkoutItem } from "@/services/workout.service";
import { calculatePercentage, formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";

type MaxMap = Record<string, number>; // exercise_id → weight_kg

interface Props {
  workouts: WorkoutWithSections[];
  maxMap: MaxMap;
  unit: WeightUnit;
  roundingKg: number;
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
  const setsReps = item.sets && item.reps ? `${item.sets}x${item.reps}` : null;

  let weightDisplay: React.ReactNode = null;
  let noMax = false;

  if (item.percentage && item.exercise_id) {
    const maxKg = maxMap[item.exercise_id];
    if (maxKg) {
      const { rounded } = calculatePercentage(maxKg, item.percentage, unit, roundingKg);
      weightDisplay = (
        <Text className="text-accent font-semibold">
          {" "}@ {item.percentage}% → {formatWeight(rounded, unit)}
        </Text>
      );
    } else {
      noMax = true;
      weightDisplay = (
        <Text className="text-muted text-sm"> @ {item.percentage}% (no max recorded)</Text>
      );
    }
  } else if (item.weight_kg) {
    const displayWeight = fromKg(item.weight_kg, unit);
    weightDisplay = (
      <Text className="text-accent font-semibold"> — {formatWeight(Math.round(displayWeight), unit)}</Text>
    );
  }

  return (
    <View className="py-2">
      <Text className="text-foreground text-[15px]">
        <Text className="font-semibold">{exerciseName}</Text>
        {setsReps && <Text className="text-muted"> — {setsReps}</Text>}
        {weightDisplay}
      </Text>
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
    <View className="py-2">
      <Text className="text-foreground text-[15px]">{item.content}</Text>
      {!!item.notes && (
        <Text className="text-muted text-sm mt-1">{item.notes}</Text>
      )}
    </View>
  );
}

export function WorkoutDayView({ workouts, maxMap, unit, roundingKg }: Props) {
  if (workouts.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-4">
          <Ionicons name="barbell-outline" size={28} color={colors.muted} />
        </View>
        <Text className="text-foreground text-lg font-semibold text-center">
          No workout posted for today
        </Text>
        <Text className="text-muted text-sm text-center mt-2">
          Check back later or browse other days.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-6">
      {workouts.filter((w) => w.published).map((workout) => (
        <View key={workout.id}>
          {!!workout.title && (
            <Text className="text-foreground text-xl font-bold mb-1">{workout.title}</Text>
          )}
          {!!workout.notes && (
            <Text className="text-muted text-sm mb-4">{workout.notes}</Text>
          )}

          {workout.sections.map((section) => (
            <View key={section.id} className="mb-5">
              <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                {section.title}
              </Text>
              <View className="bg-surface rounded-xl px-4 divide-y divide-border">
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

      {workouts.every((w) => !w.published) && (
        <View className="flex-1 justify-center items-center px-8 py-12">
          <Text className="text-muted text-sm text-center">
            No published workouts for this day yet.
          </Text>
        </View>
      )}
    </View>
  );
}
