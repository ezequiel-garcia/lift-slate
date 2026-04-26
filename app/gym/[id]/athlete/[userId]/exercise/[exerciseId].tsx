import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/theme";
import { WeightUnit } from "@/lib/units";
import { isValidUUID } from "@/lib/constants";
import {
  useAthleteReferences,
  useDeleteAthleteReference,
} from "@/hooks/useExerciseReferences";
import { useGymMembers, useMyGym } from "@/hooks/useGym";
import { CalculatorTab } from "@/components/calculator/CalculatorTab";
import { HistoryTab } from "@/components/history/HistoryTab";
import { AddAthleteMaxModal } from "@/components/gym/AddAthleteMaxModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type Tab = "calculator" | "history";

const TAB_SEGMENTS = [
  { value: "calculator" as const, label: "Calculator" },
  { value: "history" as const, label: "History" },
];

export default function AthleteExerciseDetailScreen() {
  const {
    id: gymId,
    userId,
    exerciseId,
  } = useLocalSearchParams<{
    id: string;
    userId: string;
    exerciseId: string;
  }>();

  const { data: gym } = useMyGym();
  const { data: members } = useGymMembers(gymId ?? "");
  const {
    data: allMaxes,
    isLoading,
    isError,
    refetch,
  } = useAthleteReferences(userId ?? "");
  const { mutate: deleteMax } = useDeleteAthleteReference(userId ?? "");

  const [activeTab, setActiveTab] = useState<Tab>("calculator");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isValidUUID(gymId) || !isValidUUID(userId) || !isValidUUID(exerciseId)) {
    router.replace("/(tabs)/gym");
    return null;
  }

  const member = members?.find((m) => m.user_id === userId);
  const allowCoachEdit = member?.users?.allow_coach_edit ?? false;
  const athleteUnit: WeightUnit = member?.users?.unit_preference ?? "kg";
  const isCoachOrAdmin = gym?.myRole === "coach" || gym?.myRole === "admin";
  const canEdit = isCoachOrAdmin && allowCoachEdit;

  const history = allMaxes?.filter((m) => m.exercise_id === exerciseId) ?? [];
  const exerciseName = history[0]?.exercises?.name ?? "Exercise";

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
          className="w-10 h-10 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          className="flex-1 text-lg font-bold text-foreground text-center mx-3"
          numberOfLines={1}
        >
          {exerciseName}
        </Text>
        {/* spacer to balance header */}
        <View className="w-10 h-10" />
      </View>

      {isError ? (
        <ErrorState
          message="Failed to load history"
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* Tab bar */}
          <View className="mx-5 mt-1 mb-3">
            <SegmentedControl
              segments={TAB_SEGMENTS}
              selected={activeTab}
              onChange={setActiveTab}
            />
          </View>

          {(() => {
            const weightHistory = history.filter(
              (m): m is typeof m & { weight_kg: number } =>
                m.weight_kg != null && m.weight_kg > 0,
            );
            const filteredCurrentMax = weightHistory[0] ?? null;
            return activeTab === "calculator" ? (
              <CalculatorTab
                exerciseId={exerciseId}
                currentMax={filteredCurrentMax}
                unit={athleteUnit}
                onAddMax={() => setAddModalVisible(true)}
                readonly={!canEdit}
              />
            ) : (
              <HistoryTab
                history={weightHistory}
                unit={athleteUnit}
                onAddMax={canEdit ? () => setAddModalVisible(true) : undefined}
                onDeleteMax={canEdit ? (id) => deleteMax(id) : undefined}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            );
          })()}
        </>
      )}

      <AddAthleteMaxModal
        visible={addModalVisible}
        userId={userId}
        unit={athleteUnit}
        initialExerciseId={exerciseId}
        initialExerciseName={exerciseName}
        onClose={() => setAddModalVisible(false)}
      />
    </SafeAreaView>
  );
}
