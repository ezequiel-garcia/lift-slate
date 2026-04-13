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
import { CATEGORY_ORDER, CATEGORY_LABELS, isValidUUID } from "@/lib/constants";
import { useAthleteMaxes } from "@/hooks/useMaxes";
import { useGymMembers, useMyGym, useRemoveMember } from "@/hooks/useGym";
import { useUpdateMemberRole } from "@/hooks/useRoles";
import { ExerciseSummary } from "@/types/exercise";
import { AthleteMaxRow } from "@/components/gym/AthleteMaxRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Section = { title: string; data: ExerciseSummary[] };

export default function AthleteProfileScreen() {
  const { id: gymId, userId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();

  const { data: gym } = useMyGym();
  const { data: members } = useGymMembers(gymId ?? "");
  const {
    data: maxes,
    isLoading,
    isError,
    refetch,
  } = useAthleteMaxes(userId ?? "");
  const { mutate: updateRole, isPending: updatingRole } = useUpdateMemberRole();
  const { mutate: removeMember, isPending: removing } = useRemoveMember();

  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<"role" | "remove" | null>(null);

  if (!isValidUUID(gymId) || !isValidUUID(userId)) {
    router.replace("/(tabs)/gym");
    return null;
  }

  const member = members?.find((m) => m.user_id === userId);
  const athleteName = member?.users?.display_name ?? "Athlete";
  const allowCoachEdit = member?.users?.allow_coach_edit ?? false;
  const athleteUnit: WeightUnit = member?.users?.unit_preference ?? "kg";
  const isAdmin = gym?.myRole === "admin";
  const canManage = isAdmin && member?.role !== "admin";

  const exerciseSummaries: ExerciseSummary[] = (() => {
    if (!maxes) return [];
    type Entry = {
      current: number;
      name: string;
      category: ExerciseSummary["category"];
    };
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
      if (items.length)
        result.push({ title: CATEGORY_LABELS[cat], data: items });
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

  function handleModalConfirm() {
    if (!member) return;
    if (modalType === "role") {
      const newRole = member.role === "coach" ? "athlete" : "coach";
      updateRole(
        { membershipId: member.id, newRole },
        { onSettled: () => setModalType(null) },
      );
    } else if (modalType === "remove") {
      removeMember(member.id, {
        onSuccess: () => {
          setModalType(null);
          router.back();
        },
        onError: () => setModalType(null),
      });
    }
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
            {allowCoachEdit ? "Tap a lift to view" : "View only"}
          </Text>
        </View>
        {!allowCoachEdit && (
          <View className="bg-surface2 rounded-full px-2.5 py-1">
            <Ionicons name="lock-closed" size={14} color={colors.muted} />
          </View>
        )}
      </View>

      {isError ? (
        <ErrorState
          message="Failed to load athlete maxes"
          onRetry={() => refetch()}
        />
      ) : exerciseSummaries.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon="barbell-outline"
            title="No lifts recorded"
            description={`${athleteName} hasn't recorded any lifts yet.`}
          />
        </View>
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
              onPress={() =>
                router.push(
                  `/gym/${gymId}/athlete/${userId}/exercise/${item.exerciseId}`,
                )
              }
            />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: canManage ? 200 : 40 }}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-border ml-[72px] mr-5" />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}

      {/* Manage Member section — admin only */}
      {canManage && (
        <View className="absolute bottom-0 left-0 right-0 bg-bg border-t border-border">
          <Pressable
            className="px-5 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            onPress={() => setModalType("role")}
            disabled={updatingRole || removing}
          >
            <Text className="text-foreground text-[16px]">
              {member?.role === "coach" ? "Make Athlete" : "Make Coach"}
            </Text>
          </Pressable>
          <View className="h-px bg-border mx-5" />
          <Pressable
            className="px-5 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            onPress={() => setModalType("remove")}
            disabled={updatingRole || removing}
          >
            <Text className="text-error text-[16px]">Remove from Gym</Text>
          </Pressable>
          <View className="pb-8" />
        </View>
      )}

      <ConfirmModal
        visible={modalType === "role"}
        title={member?.role === "coach" ? "Make Athlete" : "Make Coach"}
        message={`Make ${athleteName} a ${member?.role === "coach" ? "athlete" : "coach"}?`}
        confirmLabel={member?.role === "coach" ? "Make Athlete" : "Make Coach"}
        variant="primary"
        onCancel={() => setModalType(null)}
        onConfirm={handleModalConfirm}
        isPending={updatingRole}
      />
      <ConfirmModal
        visible={modalType === "remove"}
        title="Remove Member"
        message={`Remove ${athleteName} from the gym? They will need to rejoin with an invite link.`}
        confirmLabel="Remove"
        variant="destructive"
        onCancel={() => setModalType(null)}
        onConfirm={handleModalConfirm}
        isPending={removing}
      />
    </SafeAreaView>
  );
}
