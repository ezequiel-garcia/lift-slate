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
import { useTranslation } from "react-i18next";

import { colors } from "@/lib/theme";
import { WeightUnit } from "@/lib/units";
import { EQUIPMENT_ORDER, isValidUUID } from "@/lib/constants";
import { useEquipmentLabel } from "@/hooks/useEquipmentLabel";
import { useAthleteReferences } from "@/hooks/useExerciseReferences";
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
  const { t } = useTranslation();
  const getEquipmentLabel = useEquipmentLabel();
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
  } = useAthleteReferences(userId ?? "");
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
      currentWeightKg: number | null;
      currentReps: number | null;
      name: string;
      equipmentType: ExerciseSummary["equipmentType"];
      referenceType: ExerciseSummary["referenceType"];
    };
    const map = new Map<string, Entry>();
    for (const max of maxes) {
      if (!max.exercises) continue;
      if (!map.has(max.exercise_id)) {
        map.set(max.exercise_id, {
          currentWeightKg: max.weight_kg,
          currentReps: max.reps,
          name: max.exercises.name,
          equipmentType: max.exercises.equipment_type,
          referenceType: max.reference_type,
        });
      }
    }
    return Array.from(map.entries()).map(([exerciseId, d]) => ({
      exerciseId,
      name: d.name,
      equipmentType: d.equipmentType,
      referenceType: d.referenceType,
      currentWeightKg: d.currentWeightKg,
      currentReps: d.currentReps,
      trend: "same" as const,
    }));
  })();

  const sections: Section[] = (() => {
    const result: Section[] = [];
    for (const eq of EQUIPMENT_ORDER) {
      const items = exerciseSummaries
        .filter((e) => e.equipmentType === eq)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (items.length)
        result.push({ title: getEquipmentLabel(eq), data: items });
    }
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
            {allowCoachEdit ? t("athlete.tap_to_view") : t("athlete.view_only")}
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
          message={t("athlete.error_load")}
          onRetry={() => refetch()}
        />
      ) : exerciseSummaries.length === 0 ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon="barbell-outline"
            title={t("athlete.empty_title")}
            description={t("athlete.empty_description", { name: athleteName })}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.exerciseId}
          renderItem={({ item }) => (
            <AthleteMaxRow
              name={item.name}
              equipmentType={item.equipmentType}
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
              {member?.role === "coach"
                ? t("athlete.make_athlete")
                : t("athlete.make_coach")}
            </Text>
          </Pressable>
          <View className="h-px bg-border mx-5" />
          <Pressable
            className="px-5 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            onPress={() => setModalType("remove")}
            disabled={updatingRole || removing}
          >
            <Text className="text-error text-[16px]">
              {t("athlete.remove_from_gym")}
            </Text>
          </Pressable>
          <View className="pb-8" />
        </View>
      )}

      <ConfirmModal
        visible={modalType === "role"}
        title={
          member?.role === "coach"
            ? t("athlete.make_athlete_title")
            : t("athlete.make_coach_title")
        }
        message={
          member?.role === "coach"
            ? t("athlete.make_athlete_message", { name: athleteName })
            : t("athlete.make_coach_message", { name: athleteName })
        }
        confirmLabel={
          member?.role === "coach"
            ? t("athlete.make_athlete")
            : t("athlete.make_coach")
        }
        variant="primary"
        onCancel={() => setModalType(null)}
        onConfirm={handleModalConfirm}
        isPending={updatingRole}
      />
      <ConfirmModal
        visible={modalType === "remove"}
        title={t("athlete.remove_title")}
        message={t("athlete.remove_message", { name: athleteName })}
        confirmLabel={t("common.remove")}
        variant="destructive"
        onCancel={() => setModalType(null)}
        onConfirm={handleModalConfirm}
        isPending={removing}
      />
    </SafeAreaView>
  );
}
