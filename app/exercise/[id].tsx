import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useExerciseDetail } from "@/hooks/useExerciseDetail";
import { CalculatorTab } from "@/components/calculator/CalculatorTab";
import { HistoryTab } from "@/components/history/HistoryTab";
import { AddMaxModal } from "@/components/exercises/AddMaxModal";

type Tab = "calculator" | "history";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("calculator");
  const [addModalVisible, setAddModalVisible] = useState(false);

  const { exercise, history, profile, isLoading } = useExerciseDetail(id);

  const unit = profile?.unit_preference ?? "kg";
  const roundingIncrementKg = profile?.rounding_increment_kg ?? 2.5;
  const currentMax = history[0] ?? null;

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
        />
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
