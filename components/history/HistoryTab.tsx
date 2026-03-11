import { FlatList, View, Text, Pressable, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";

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
      <View className="mx-5 mb-2 bg-surface rounded-xl px-4 py-3.5">
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
                hitSlop={8}
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
      </View>
    );
  };

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      ListEmptyComponent={
        <View className="items-center pt-12 gap-3">
          <Ionicons name="time-outline" size={32} color={colors.muted} />
          <Text className="text-muted text-base">No maxes recorded yet</Text>
        </View>
      }
      ListFooterComponent={
        history.length > 0 ? (
          <Pressable
            className="mx-5 mt-2 bg-surface rounded-2xl p-4 items-center flex-row justify-center gap-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={onAddMax}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text className="text-accent font-semibold text-[15px]">Add New Max</Text>
          </Pressable>
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
