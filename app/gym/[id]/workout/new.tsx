import { Button } from "@/components/ui/Button";
import { WorkoutPreviewModal } from "@/components/workout/WorkoutPreviewModal";
import { WorkoutSectionCard } from "@/components/workout/WorkoutSectionCard";
import { QUICK_START_TEMPLATES } from "@/components/workout/constants";
import { ItemFormData, SectionFormData } from "@/components/workout/types";
import { useMyGym } from "@/hooks/useGym";
import { useCreateWorkout, useUpdateWorkout } from "@/hooks/useWorkouts";
import { isValidUUID } from "@/lib/constants";
import { colors } from "@/lib/theme";
import { getWorkoutById } from "@/services/workout.service";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { CalendarPickerModal } from "@/components/workout/CalendarPickerModal";
import { addDays, format, isValid, parseISO } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FNS_LOCALES, formatDate } from "@/lib/i18n";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function newBlock(title = ""): SectionFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    title,
    items: [],
  };
}

export default function NewWorkoutScreen() {
  const {
    id: gymId,
    workoutId,
    date,
  } = useLocalSearchParams<{ id: string; workoutId?: string; date?: string }>();
  const isEditMode = !!workoutId;

  const { t, i18n } = useTranslation();
  const locale =
    DATE_FNS_LOCALES[i18n.language as keyof typeof DATE_FNS_LOCALES];
  const { data: gym } = useMyGym();

  useEffect(() => {
    if (
      gym !== undefined &&
      gym?.myRole !== "coach" &&
      gym?.myRole !== "admin"
    ) {
      router.replace("/(tabs)/gym");
    }
  }, [gym]);

  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const setPendingGymDate = useAppStore((s) => s.setPendingGymDate);
  const showToast = useAppStore((s) => s.showToast);

  const [loading, setLoading] = useState(isEditMode);
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (date) {
      const parsed = parseISO(date);
      if (isValid(parsed)) return parsed;
    }
    return addDays(new Date(), 1);
  });
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<SectionFormData[]>([]);
  /** When set, only this block stays expanded; others collapse. null = each block manages its own collapse. */
  const [openBlockId, setOpenBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!isEditMode || !workoutId) return;

    getWorkoutById(workoutId)
      .then((workout) => {
        setNotes(workout.notes ?? "");
        const parsed = parseISO(workout.scheduled_date);
        setScheduledDate(isValid(parsed) ? parsed : addDays(new Date(), 1));

        setSections(
          workout.sections.map((section) => ({
            localId: section.id,
            title: section.title,
            items: section.items.map(
              (item): ItemFormData => ({
                localId: item.id,
                itemType: item.item_type,
                exerciseId: item.exercise_id ?? undefined,
                exerciseName: item.exercises?.name ?? undefined,
                exerciseEquipment: item.exercises?.equipment_type ?? undefined,
                sets: item.sets ?? undefined,
                reps: item.reps ?? undefined,
                prescriptionMode: item.prescription_mode ?? undefined,
                percentage: item.percentage?.toString() ?? undefined,
                weightKg: item.weight_kg?.toString() ?? undefined,
                content: item.content ?? undefined,
                notes: item.notes ?? undefined,
              }),
            ),
          })),
        );
      })
      .catch(() => showToast(t("workout.error_load"), "error"))
      .finally(() => setLoading(false));
  }, [workoutId, isEditMode, showToast]);

  useEffect(() => {
    if (openBlockId === null) return;
    if (!sections.some((s) => s.localId === openBlockId)) {
      setOpenBlockId(null);
    }
  }, [sections, openBlockId]);

  function updateSection(index: number, updated: SectionFormData) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function deleteSection(index: number) {
    const removedId = sections[index]?.localId;
    setSections((prev) => prev.filter((_, i) => i !== index));
    setOpenBlockId((prev) => (prev === removedId ? null : prev));
  }

  function buildWorkoutInput() {
    return {
      scheduledDate: format(scheduledDate, "yyyy-MM-dd"),
      notes: notes.trim() || undefined,
      sections: sections.map((s, si) => ({
        title: s.title,
        orderIndex: si,
        items: s.items.map((item, ii) => {
          const base = {
            orderIndex: ii,
            itemType: item.itemType,
            notes: item.notes?.trim() || undefined,
          };
          if (item.itemType === "custom_exercise") {
            return {
              ...base,
              content: item.content,
              sets: item.sets || undefined,
              reps: item.reps || undefined,
              weightKg: item.weightKg ? parseFloat(item.weightKg) : undefined,
            };
          }
          return {
            ...base,
            exerciseId: item.exerciseId,
            sets: item.sets || undefined,
            reps: item.reps || undefined,
            prescriptionMode: item.prescriptionMode,
            percentage:
              item.prescriptionMode === "percentage" && item.percentage
                ? parseFloat(item.percentage)
                : undefined,
            weightKg:
              item.prescriptionMode === "absolute" && item.weightKg
                ? parseFloat(item.weightKg)
                : undefined,
          };
        }),
      })),
    };
  }

  async function handleSave() {
    if (!gymId) return;
    try {
      if (isEditMode && workoutId) {
        await updateWorkout.mutateAsync({
          workoutId,
          input: buildWorkoutInput(),
        });
      } else {
        await createWorkout.mutateAsync({ gymId, input: buildWorkoutInput() });
      }
      setPendingGymDate(scheduledDate);
      router.back();
    } catch {
      showToast(t("workout.error_save"), "error");
    }
  }

  if (!isValidUUID(gymId) || (workoutId && !isValidUUID(workoutId))) {
    router.replace("/(tabs)/gym");
    return null;
  }

  const isSaving = createWorkout.isPending || updateWorkout.isPending;
  const formattedDate = formatDate(
    scheduledDate,
    locale ? "EEE, d MMM" : "EEE, MMM d",
    locale,
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-bg justify-center items-center"
        edges={["top"]}
      >
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-base font-semibold">
            {isEditMode ? t("workout.edit_title") : t("workout.new_title")}
          </Text>
          <Pressable
            onPress={() => setShowPreview(true)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="eye-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date + notes */}
          <View className="bg-surface rounded-2xl border border-border mb-4 overflow-hidden">
            {/* Date row */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Pressable
                className="w-9 h-9 bg-surface2 rounded-lg items-center justify-center"
                onPress={() => setScheduledDate((d) => addDays(d, -1))}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.foreground}
                />
              </Pressable>
              <Pressable
                className="flex-row items-center gap-2"
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.accent}
                />
                <Text className="text-foreground text-base font-semibold">
                  {formattedDate}
                </Text>
              </Pressable>
              <Pressable
                className="w-9 h-9 bg-surface2 rounded-lg items-center justify-center"
                onPress={() => setScheduledDate((d) => addDays(d, 1))}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.foreground}
                />
              </Pressable>
            </View>

            <View className="px-4 py-3 gap-2">
              <TextInput
                className="text-muted text-sm"
                placeholder={t("workout.notes_placeholder")}
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Blocks */}
          <View className="gap-3">
            {sections.map((section, i) => (
              <WorkoutSectionCard
                key={section.localId}
                section={section}
                onUpdate={(updated) => updateSection(i, updated)}
                onDelete={() => deleteSection(i)}
                openBlockId={openBlockId}
                onOpenBlockChange={setOpenBlockId}
              />
            ))}

            {sections.length === 0 ? (
              /* Empty state with quick-start templates */
              <View className="items-center pt-4 pb-2 gap-6">
                <View className="items-center gap-1">
                  <Ionicons
                    name="layers-outline"
                    size={36}
                    color={colors.muted}
                  />
                  <Text className="text-foreground text-base font-semibold mt-2">
                    {t("workout.empty_title")}
                  </Text>
                  <Text className="text-muted text-sm text-center">
                    {t("workout.empty_description")}
                  </Text>
                </View>

                <View className="w-full gap-3">
                  <View className="flex-row gap-3">
                    {QUICK_START_TEMPLATES.slice(0, 2).map((tpl) => (
                      <Pressable
                        key={tpl.key}
                        className="flex-1 bg-surface border border-border rounded-2xl py-4 items-center gap-2"
                        onPress={() => {
                          const nb = newBlock(t(`workout.block_${tpl.key}`));
                          setSections((prev) => [...prev, nb]);
                          setOpenBlockId(nb.localId);
                        }}
                      >
                        <Ionicons
                          name={tpl.icon}
                          size={24}
                          color={colors.accent}
                        />
                        <Text className="text-foreground text-sm font-semibold">
                          {t(`workout.block_${tpl.key}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View className="flex-row gap-3">
                    {QUICK_START_TEMPLATES.slice(2).map((tpl) => (
                      <Pressable
                        key={tpl.key}
                        className="flex-1 bg-surface border border-border rounded-2xl py-4 items-center gap-2"
                        onPress={() => {
                          const nb = newBlock(t(`workout.block_${tpl.key}`));
                          setSections((prev) => [...prev, nb]);
                          setOpenBlockId(nb.localId);
                        }}
                      >
                        <Ionicons
                          name={tpl.icon}
                          size={24}
                          color={colors.accent}
                        />
                        <Text className="text-foreground text-sm font-semibold">
                          {t(`workout.block_${tpl.key}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  className="flex-row items-center gap-1.5"
                  onPress={() => {
                    const nb = newBlock();
                    setSections((prev) => [...prev, nb]);
                    setOpenBlockId(nb.localId);
                  }}
                >
                  <Ionicons name="add" size={16} color={colors.muted} />
                  <Text className="text-muted text-sm">
                    {t("workout.add_empty_block")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Add Block button (shown once blocks exist) */
              <Pressable
                className="border border-dashed border-border rounded-2xl py-4 items-center flex-row justify-center gap-2"
                onPress={() => {
                  const nb = newBlock();
                  setSections((prev) => [...prev, nb]);
                  setOpenBlockId(nb.localId);
                }}
              >
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text className="text-accent text-sm font-semibold">
                  {t("workout.add_block")}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-4 bg-bg border-t border-border">
          <Button
            label={
              isSaving
                ? t("workout.saving")
                : isEditMode
                  ? t("workout.update")
                  : t("workout.publish")
            }
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

        <CalendarPickerModal
          visible={showDatePicker}
          value={scheduledDate}
          onClose={() => setShowDatePicker(false)}
          onChange={setScheduledDate}
        />

        <WorkoutPreviewModal
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          notes={notes}
          scheduledDate={formattedDate}
          sections={sections}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
