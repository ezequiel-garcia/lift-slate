import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseDetail } from "@/hooks/useExerciseDetail";
import { useDeleteExerciseMaxes } from "@/hooks/useMaxes";
import { CalculatorTab } from "@/components/calculator/CalculatorTab";
import { HistoryTab } from "@/components/history/HistoryTab";
import { AddMaxModal } from "@/components/exercises/AddMaxModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { colors } from "@/lib/theme";

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
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-foreground text-center mx-3" numberOfLines={1}>
          {exercise?.name ?? "Exercise"}
        </Text>
        <Pressable onPress={handleDelete} hitSlop={12} className="w-9 h-9 items-center justify-center">
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
        </Pressable>
      </View>

      {isError ? (
        <ErrorState message="Failed to load history" onRetry={() => refetch()} />
      ) : (
        <>
          {/* Tab bar — segmented control style */}
          <View className="mx-5 mt-1 mb-3 flex-row bg-surface rounded-xl p-1">
            {(["calculator", "history"] as Tab[]).map((tab) => (
              <Pressable
                key={tab}
                className={`flex-1 py-2.5 items-center rounded-lg ${
                  activeTab === tab ? "bg-surface2" : ""
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-[14px] font-semibold ${
                    activeTab === tab ? "text-foreground" : "text-muted"
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

      <AddMaxModal
        visible={addModalVisible}
        exerciseId={id}
        unit={unit}
        onClose={() => setAddModalVisible(false)}
      />
    </SafeAreaView>
  );
}
