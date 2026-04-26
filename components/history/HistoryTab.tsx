import {
  FlatList,
  View,
  Text,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useState } from "react";
import { formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type HistoryEntry = {
  id: string;
  weight_kg: number | null;
  reps: number | null;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  history: HistoryEntry[];
  unit: WeightUnit;
  onAddMax?: () => void;
  onDeleteMax?: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
};

export function HistoryTab({
  history,
  unit,
  onAddMax,
  onDeleteMax,
  refreshing,
  onRefresh,
  isLoading,
}: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const isRepsMode = history.length > 0 && history[0].weight_kg == null;

  const prWeightKg = isRepsMode
    ? 0
    : history.reduce((best, m) => Math.max(best, m.weight_kg ?? 0), 0);
  const prReps = isRepsMode
    ? history.reduce((best, m) => Math.max(best, m.reps ?? 0), 0)
    : 0;

  const addLabel = isRepsMode ? "Log Max Reps" : "Add New Max";

  const renderItem = ({
    item,
    index,
  }: {
    item: HistoryEntry;
    index: number;
  }) => {
    const isPR = isRepsMode
      ? item.reps === prReps && prReps > 0
      : item.weight_kg === prWeightKg && prWeightKg > 0;

    const prev = history[index + 1];
    const delta =
      !isRepsMode &&
      index === 0 &&
      prev &&
      item.weight_kg != null &&
      prev.weight_kg != null
        ? fromKg(item.weight_kg, unit) - fromKg(prev.weight_kg, unit)
        : null;
    const repsDelta =
      isRepsMode &&
      index === 0 &&
      prev &&
      item.reps != null &&
      prev.reps != null
        ? item.reps - prev.reps
        : null;

    const dateStr = format(new Date(item.recorded_at), "MMM d, yyyy");
    const primaryDisplay = isRepsMode
      ? item.reps != null && item.reps > 0
        ? `${item.reps} reps`
        : "—"
      : item.weight_kg != null && item.weight_kg > 0
        ? formatWeight(fromKg(item.weight_kg, unit), unit)
        : "—";

    return (
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeIn.delay(Math.min(index, 8) * 40).duration(300)
        }
        className="mx-5 mb-2 bg-surface rounded-xl px-4 py-3.5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-3">
            {isPR && <Ionicons name="star" size={16} color={colors.accent} />}
            <Text className="text-[18px] font-bold text-foreground tabular-nums">
              {primaryDisplay}
            </Text>
            {delta !== null && (
              <Text
                className={`text-sm font-semibold ${
                  delta > 0
                    ? "text-accent"
                    : delta < 0
                      ? "text-error"
                      : "text-muted"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} {unit}
              </Text>
            )}
            {repsDelta !== null && (
              <Text
                className={`text-sm font-semibold ${
                  repsDelta > 0
                    ? "text-accent"
                    : repsDelta < 0
                      ? "text-error"
                      : "text-muted"
                }`}
              >
                {repsDelta > 0 ? "+" : ""}
                {repsDelta} reps
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-muted shrink-0">{dateStr}</Text>
            {onDeleteMax && (
              <Pressable
                hitSlop={12}
                className="w-8 h-8 items-center justify-center"
                onPress={() => setPendingDeleteId(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>
        {item.notes ? (
          <Text className="text-sm text-muted mt-1.5">{item.notes}</Text>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View className="flex-1 justify-center">
              <EmptyState
                icon="time-outline"
                title="No history yet"
                description="Start tracking to see your progress here"
                action={
                  onAddMax ? (
                    <Button label={addLabel} onPress={onAddMax} />
                  ) : undefined
                }
              />
            </View>
          )
        }
        ListFooterComponent={
          history.length > 0 && onAddMax ? (
            <View className="mx-5 mt-2">
              <Button
                label={addLabel}
                variant="secondary"
                onPress={onAddMax}
                icon={
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.accent}
                  />
                }
              />
            </View>
          ) : null
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      />
      <ConfirmModal
        visible={pendingDeleteId !== null}
        title="Delete Entry"
        message="Remove this entry from your history?"
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onDeleteMax?.(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}
