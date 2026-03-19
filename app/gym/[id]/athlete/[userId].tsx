import { useState } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/theme";
import { WeightUnit } from "@/lib/units";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";
import { useAthleteMaxes } from "@/hooks/useMaxes";
import { useGymMembers } from "@/hooks/useGym";
import { useMyGym } from "@/hooks/useGym";
import { ExerciseSummary } from "@/types/exercise";
import { AthleteMaxRow } from "@/components/gym/AthleteMaxRow";
import { AddAthleteMaxModal } from "@/components/gym/AddAthleteMaxModal";
import { EditAthleteMaxModal } from "@/components/gym/EditAthleteMaxModal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type Section = { title: string; data: ExerciseSummary[] };

export default function AthleteMaxesScreen() {
  const { id: gymId, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const { data: gym } = useMyGym();
  const { data: members } = useGymMembers(gymId);
  const { data: maxes, isLoading, isError, refetch } = useAthleteMaxes(userId);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingMax, setEditingMax] = useState<{ id: string; exerciseId: string; exerciseName: string; weightKg: number; notes: string | null } | null>(null);

  const member = members?.find((m) => m.user_id === userId);
  const athleteName = member?.users?.display_name ?? "Athlete";
  const allowCoachEdit = member?.users?.allow_coach_edit ?? false;
  const athleteUnit: WeightUnit = member?.users?.unit_preference ?? "kg";
  const isCoachOrAdmin = gym?.myRole === "coach" || gym?.myRole === "admin";
  const canEdit = isCoachOrAdmin && allowCoachEdit;

  const exerciseSummaries: ExerciseSummary[] = (() => {
    if (!maxes) return [];
    type Entry = { current: number; name: string; category: ExerciseSummary["category"] };
    const map = new Map<string, Entry>();
    for (const max of maxes) {
      if (!max.exercises) continue;
      if (!map.has(max.exercise_id)) {
        map.set(max.exercise_id, {
          current: max.weight_kg,
          name: max.exercises.name,
          category: max.exercises.category,
        });
      }
    }
    return Array.from(map.entries()).map(([exerciseId, d]) => ({
      exerciseId,
      name: d.name,
      category: d.category,
      currentWeightKg: d.current,
      trend: "same" as const,
    }));
  })();

  const sections: Section[] = (() => {
    const result: Section[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = exerciseSummaries
        .filter((e) => e.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (items.length) result.push({ title: CATEGORY_LABELS[cat], data: items });
    }
    const others = exerciseSummaries
      .filter((e) => !e.category)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (others.length) result.push({ title: "Other", data: others });
    return result;
  })();

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function handleEditMax(item: ExerciseSummary) {
    if (!canEdit) return;
    const max = maxes?.find((m) => m.exercise_id === item.exerciseId);
    if (!max) return;
    setEditingMax({
      id: max.id,
      exerciseId: max.exercise_id,
      exerciseName: item.name,
      weightKg: max.weight_kg,
      notes: max.notes,
    });
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
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1 ml-1">
          <Text className="text-foreground text-xl font-bold" numberOfLines={1}>
            {athleteName}
          </Text>
          <Text className="text-muted text-caption">
            {canEdit ? "Tap a lift to edit" : allowCoachEdit ? "View only" : "Editing disabled by athlete"}
          </Text>
        </View>
        {!allowCoachEdit && (
          <View className="bg-surface2 rounded-full px-2.5 py-1">
            <Ionicons name="lock-closed" size={14} color={colors.muted} />
          </View>
        )}
      </View>

      {isError ? (
        <ErrorState message="Failed to load athlete maxes" onRetry={() => refetch()} />
      ) : exerciseSummaries.length === 0 ? (
        <EmptyState
          icon={allowCoachEdit ? "barbell-outline" : "lock-closed-outline"}
          title={allowCoachEdit ? "No lifts recorded" : "Editing disabled"}
          description={
            allowCoachEdit
              ? `${athleteName} hasn't recorded any lifts yet.`
              : `${athleteName} has disabled coach access to their lifts.`
          }
          action={
            canEdit ? (
              <Button label="Add First Max" onPress={() => setAddModalVisible(true)} />
            ) : undefined
          }
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.exerciseId}
          renderItem={({ item }) => (
            <AthleteMaxRow
              name={item.name}
              category={item.category}
              currentWeightKg={item.currentWeightKg}
              unit={athleteUnit}
              onPress={canEdit ? () => handleEditMax(item) : undefined}
            />
          )}
          renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View className="h-px bg-border ml-[72px] mr-5" />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
        />
      )}

      {canEdit && exerciseSummaries.length > 0 && (
        <Pressable
          className="absolute bottom-8 right-5 bg-accent rounded-2xl flex-row items-center px-5 py-3.5 gap-2"
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#B4FF4A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          })}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={22} color={colors.bg} />
          <Text className="text-bg font-bold text-[15px]">Add Max</Text>
        </Pressable>
      )}

      <AddAthleteMaxModal
        visible={addModalVisible}
        userId={userId}
        unit={athleteUnit}
        onClose={() => setAddModalVisible(false)}
      />

      {editingMax && (
        <EditAthleteMaxModal
          visible={!!editingMax}
          userId={userId}
          maxId={editingMax.id}
          exerciseName={editingMax.exerciseName}
          currentWeightKg={editingMax.weightKg}
          currentNotes={editingMax.notes}
          unit={athleteUnit}
          onClose={() => setEditingMax(null)}
        />
      )}
    </SafeAreaView>
  );
}
