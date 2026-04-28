import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseDetail } from "@/hooks/useExerciseDetail";
import {
  useDeleteAllReferencesForExercise,
  useDeleteExerciseReference,
} from "@/hooks/useExerciseReferences";
import { CalculatorTab } from "@/components/calculator/CalculatorTab";
import { NotesTab } from "@/components/exercises/NotesTab";
import { HistoryTab } from "@/components/history/HistoryTab";
import { AddMaxModal } from "@/components/exercises/AddMaxModal";
import { PRCelebrationModal } from "@/components/exercises/PRCelebrationModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { colors } from "@/lib/theme";
import { isValidUUID } from "@/lib/constants";

type Tab = "calculator" | "history" | "notes";

export default function ExerciseDetailScreen() {
  const { id, addMax } = useLocalSearchParams<{
    id: string;
    addMax?: string;
  }>();

  const validId = isValidUUID(id) ? id : null;

  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [prVisible, setPrVisible] = useState(false);
  const [prWeightKg, setPrWeightKg] = useState(0);
  const [prPreviousWeightKg, setPrPreviousWeightKg] = useState<
    number | undefined
  >(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (addMax === "true") setAddModalVisible(true);
  }, [addMax]);

  const {
    exercise,
    history,
    profile,
    isLoading,
    historyLoading,
    isError,
    refetch,
  } = useExerciseDetail(validId ?? "");
  const { mutate: deleteExerciseMaxes } = useDeleteAllReferencesForExercise();
  const { mutate: deleteMax } = useDeleteExerciseReference(validId ?? "");

  const unit = profile?.unit_preference ?? "kg";
  const equipmentType = exercise?.equipment_type;
  const exerciseName = exercise?.name ?? "Exercise";

  const headerTitleStyle = useMemo(() => {
    const nameLength = exerciseName.length;

    if (nameLength > 24) {
      return { fontSize: 26, lineHeight: 30 };
    }

    if (nameLength > 18) {
      return { fontSize: 30, lineHeight: 34 };
    }

    return { fontSize: 36, lineHeight: 40 };
  }, [exerciseName]);

  const isBodyweight = equipmentType === "bodyweight";
  const isOneRM = !equipmentType || equipmentType === "barbell";
  const isWorkingWeight =
    equipmentType === "dumbbell" ||
    equipmentType === "kettlebell" ||
    equipmentType === "machine" ||
    equipmentType === "other";

  const displayHistory = useMemo(
    () =>
      history.filter((m) =>
        isBodyweight ? (m.reps ?? 0) > 0 : (m.weight_kg ?? 0) > 0,
      ),
    [history, isBodyweight],
  );

  const currentMax = useMemo(() => {
    const first = displayHistory[0];
    if (!first) return null;
    if (isBodyweight) return null;
    return first.weight_kg != null
      ? {
          id: first.id,
          weight_kg: first.weight_kg,
          recorded_at: first.recorded_at,
          notes: first.notes,
        }
      : null;
  }, [displayHistory, isBodyweight]);

  if (!validId) {
    router.replace("/");
    return null;
  }

  // Tab config: bodyweight has no calculator tab
  const tabSegments = isBodyweight
    ? [
        { value: "history" as const, label: "History" },
        { value: "notes" as const, label: "Notes" },
      ]
    : [
        {
          value: "calculator" as const,
          label: isOneRM ? "Calculator" : "Working Weight",
        },
        { value: "history" as const, label: "History" },
        { value: "notes" as const, label: "Notes" },
      ];

  function handleDelete() {
    setDeleteModalVisible(true);
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
          className="w-10 h-10 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          className="flex-1 text-center mx-3"
          style={{
            fontFamily: "CormorantGaramond-Regular",
            fontSize: headerTitleStyle.fontSize,
            lineHeight: headerTitleStyle.lineHeight,
            color: colors.foreground,
            letterSpacing: -0.4,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {exerciseName}
        </Text>
        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="trash-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>

      {isError ? (
        <ErrorState
          message="Failed to load history"
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {tabSegments.length > 1 && (
            <View className="mx-5 mt-1 mb-3">
              <SegmentedControl
                segments={tabSegments}
                selected={activeTab}
                onChange={setActiveTab}
                variant="underline"
              />
            </View>
          )}

          {activeTab === "calculator" && !isBodyweight ? (
            <CalculatorTab
              equipmentType={equipmentType}
              currentMax={currentMax}
              unit={unit}
              onAddMax={() => setAddModalVisible(true)}
              isLoading={historyLoading}
            />
          ) : activeTab === "notes" ? (
            <NotesTab exerciseId={validId} />
          ) : (
            <HistoryTab
              history={displayHistory}
              unit={unit}
              onAddMax={() => setAddModalVisible(true)}
              onDeleteMax={(maxId) => deleteMax(maxId)}
              addButtonLabel={
                isWorkingWeight ? "Update Working Weight" : undefined
              }
              refreshing={refreshing}
              onRefresh={handleRefresh}
              isLoading={historyLoading}
            />
          )}
        </>
      )}

      <AddMaxModal
        visible={addModalVisible}
        exerciseId={validId}
        equipmentType={equipmentType}
        unit={unit}
        currentMaxKg={currentMax?.weight_kg ?? undefined}
        onClose={() => setAddModalVisible(false)}
        showNotRelevant={displayHistory.length === 0}
        onPR={(kg) => {
          setPrPreviousWeightKg(currentMax?.weight_kg ?? undefined);
          setPrWeightKg(kg);
          setPrVisible(true);
        }}
      />
      <PRCelebrationModal
        visible={prVisible}
        exerciseName={exercise?.name ?? ""}
        newWeightKg={prWeightKg}
        previousWeightKg={prPreviousWeightKg}
        unit={unit}
        onClose={() => setPrVisible(false)}
        onViewHistory={() => setActiveTab("history")}
      />
      <ConfirmModal
        visible={deleteModalVisible}
        title="Remove Exercise"
        message={`Remove ${exercise?.name ?? "this exercise"} from your lifts? All recorded history will be deleted.`}
        confirmLabel="Remove"
        variant="destructive"
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => {
          setDeleteModalVisible(false);
          router.back();
          deleteExerciseMaxes(validId);
        }}
      />
    </SafeAreaView>
  );
}
