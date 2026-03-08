import { FlatList, View, Text, Pressable, RefreshControl } from "react-native";
import { format } from "date-fns";
import { formatWeight, fromKg, WeightUnit } from "@/lib/units";

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
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function HistoryTab({ history, unit, onAddMax, refreshing, onRefresh }: Props) {
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
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            {isPR && <Text className="text-base text-accent">★</Text>}
            <Text className="text-[15px] font-semibold text-foreground">{displayWeight}</Text>
            {delta !== null && (
              <Text
                className={`text-xs font-semibold ${
                  delta > 0 ? "text-accent" : delta < 0 ? "text-error" : "text-muted"
                }`}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} {unit}
              </Text>
            )}
          </View>
          <Text className="text-xs text-muted shrink-0">{dateStr}</Text>
        </View>
        {item.notes ? (
          <Text className="text-xs text-muted mt-1 ml-5">{item.notes}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={
        <View className="items-center pt-12">
          <Text className="text-muted text-sm">No maxes recorded yet</Text>
        </View>
      }
      ListFooterComponent={
        history.length > 0 ? (
          <Pressable
            className="mx-4 my-4 border border-border rounded-xl p-4 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={onAddMax}
          >
            <Text className="text-accent font-semibold text-[15px]">+ Add New Max</Text>
          </Pressable>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#AAFF45" />
        ) : undefined
      }
    />
  );
}
