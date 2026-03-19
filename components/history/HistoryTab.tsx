import { FlatList, View, Text, Pressable, RefreshControl, Alert } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type Max = {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  history: Max[];
  unit: WeightUnit;
  onAddMax: () => void;
  onDeleteMax?: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function HistoryTab({ history, unit, onAddMax, onDeleteMax, refreshing, onRefresh }: Props) {
  const prWeightKg = history.reduce((best, m) => Math.max(best, m.weight_kg), 0);
  const reduceMotion = useReducedMotion();

  const renderItem = ({ item, index }: { item: Max; index: number }) => {
    const isPR = item.weight_kg === prWeightKg && prWeightKg > 0;
    const prev = history[index + 1];
    const delta =
      index === 0 && prev
        ? fromKg(item.weight_kg, unit) - fromKg(prev.weight_kg, unit)
        : null;

    const dateStr = format(new Date(item.recorded_at), "MMM d, yyyy");
    const displayWeight = formatWeight(fromKg(item.weight_kg, unit), unit);

    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.delay(Math.min(index, 8) * 40).duration(300)}
        className="mx-5 mb-2 bg-surface rounded-xl px-4 py-3.5"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-3">
            {isPR && <Ionicons name="star" size={16} color={colors.accent} />}
            <Text className="text-[18px] font-bold text-foreground tabular-nums">{displayWeight}</Text>
            {delta !== null && (
              <Text
                className={`text-sm font-semibold ${
                  delta > 0 ? "text-accent" : delta < 0 ? "text-error" : "text-muted"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} {unit}
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-muted shrink-0">{dateStr}</Text>
            {onDeleteMax && (
              <Pressable
                hitSlop={12}
                className="w-8 h-8 items-center justify-center"
                onPress={() =>
                  Alert.alert("Delete Entry", "Remove this max entry?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDeleteMax(item.id) },
                  ])
                }
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
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 100, flexGrow: 1 }}
      ListEmptyComponent={
        <EmptyState
          icon="time-outline"
          title="No history yet"
          description="Start tracking to see your progress here"
          action={<Button label="Log your first max" onPress={onAddMax} />}
        />
      }
      ListFooterComponent={
        history.length > 0 ? (
          <View className="mx-5 mt-2">
            <Button
              label="Add New Max"
              variant="secondary"
              onPress={onAddMax}
              icon={<Ionicons name="add-circle-outline" size={20} color={colors.accent} />}
            />
          </View>
        ) : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    />
  );
}
