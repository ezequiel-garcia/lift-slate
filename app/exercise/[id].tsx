import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useExerciseDetail } from "@/hooks/useExerciseDetail";
import { useDeleteExerciseMaxes } from "@/hooks/useMaxes";
import { CalculatorTab } from "@/components/calculator/CalculatorTab";
import { HistoryTab } from "@/components/history/HistoryTab";
import { AddMaxModal } from "@/components/exercises/AddMaxModal";
import { ErrorState } from "@/components/ui/ErrorState";

type Tab = "calculator" | "history";

export default function ExerciseDetailScreen() {
  const { id, addMax } = useLocalSearchParams<{ id: string; addMax?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("calculator");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (addMax === "true") setAddModalVisible(true);
  }, []);

  const { exercise, history, profile, isLoading, isError, refetch } = useExerciseDetail(id);
  const { mutate: deleteExerciseMaxes } = useDeleteExerciseMaxes();

  const unit = profile?.unit_preference ?? "kg";
  const roundingIncrementKg = profile?.rounding_increment_kg ?? 2.5;
  const currentMax = history[0] ?? null;

  function handleDelete() {
    Alert.alert(
      "Remove Exercise",
      `Remove ${exercise?.name ?? "this exercise"} from your lifts? All recorded maxes will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => { router.back(); deleteExerciseMaxes(id); },
        },
      ]
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center">
        <ActivityIndicator color="#AAFF45" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={12} className="w-8">
          <Text className="text-accent text-[20px]">‹</Text>
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-foreground text-center" numberOfLines={1}>
          {exercise?.name ?? "Exercise"}
        </Text>
        <View className="w-8" />
      </View>

      {isError ? (
        <ErrorState message="Failed to load history" onRetry={() => refetch()} />
      ) : (
        <>
          {/* Tab bar */}
          <View className="flex-row border-b border-border">
            {(["calculator", "history"] as Tab[]).map((tab) => (
              <Pressable
                key={tab}
                className={`flex-1 py-3 items-center border-b-2 ${
                  activeTab === tab ? "border-accent" : "border-transparent"
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === tab ? "text-accent" : "text-muted"
                  }`}
                >
                  {tab === "calculator" ? "Calculator" : "History"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {activeTab === "calculator" ? (
            <CalculatorTab
              exerciseId={id}
              currentMax={currentMax}
              unit={unit}
              roundingIncrementKg={roundingIncrementKg}
              onAddMax={() => setAddModalVisible(true)}
            />
          ) : (
            <HistoryTab
              history={history}
              unit={unit}
              onAddMax={() => setAddModalVisible(true)}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}

      <View className="px-4 pb-8 pt-3 border-t border-border">
        <Pressable
          onPress={handleDelete}
          className="py-3 rounded-xl items-center border border-error"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-error font-semibold text-[15px]">Remove Exercise</Text>
        </Pressable>
      </View>

      <AddMaxModal
        visible={addModalVisible}
        exerciseId={id}
        unit={unit}
        onClose={() => setAddModalVisible(false)}
      />
    </SafeAreaView>
  );
}
