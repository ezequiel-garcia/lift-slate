import { Button } from "@/components/ui/Button";
import { WorkoutPreviewModal } from "@/components/workout/WorkoutPreviewModal";
import { WorkoutSectionCard } from "@/components/workout/WorkoutSectionCard";
import { ItemFormData, SectionFormData } from "@/components/workout/types";
import { useMyGym } from "@/hooks/useGym";
import { useCreateWorkout, useUpdateWorkout } from "@/hooks/useWorkouts";
import { isValidUUID } from "@/lib/constants";
import { colors } from "@/lib/theme";
import { getWorkoutById } from "@/services/workout.service";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { addDays, format, parseISO } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function newBlock(): SectionFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    title: "",
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

  const { data: gym } = useMyGym();

  useEffect(() => {
    if (
      gym !== undefined &&
      gym?.myRole !== "coach" &&
      gym?.myRole !== "admin"
    ) {
      router.replace("/(tabs)/gym");
    }
  }, [gym?.myRole]);

  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const setPendingGymDate = useAppStore((s) => s.setPendingGymDate);

  const [loading, setLoading] = useState(isEditMode);
  const [scheduledDate, setScheduledDate] = useState(() =>
    date ? parseISO(date) : addDays(new Date(), 1),
  );
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
        setScheduledDate(parseISO(workout.scheduled_date));

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
                sets: item.sets?.toString() ?? undefined,
                reps: item.reps?.toString() ?? undefined,
                weightMode: item.percentage ? "percentage" : "none",
                percentage: item.percentage?.toString() ?? undefined,
                maxTypeReference: item.max_type_reference ?? undefined,
                weightKg: item.weight_kg?.toString() ?? undefined,
                content: item.content ?? undefined,
                notes: item.notes ?? undefined,
              }),
            ),
          })),
        );
      })
      .catch(() => Alert.alert("Error", "Failed to load workout."))
      .finally(() => setLoading(false));
  }, [workoutId, isEditMode]);

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
              sets: item.sets ? parseInt(item.sets, 10) : undefined,
              reps: item.reps ? parseInt(item.reps, 10) : undefined,
            };
          }
          return {
            ...base,
            exerciseId: item.exerciseId,
            sets: item.sets ? parseInt(item.sets, 10) : undefined,
            reps: item.reps ? parseInt(item.reps, 10) : undefined,
            percentage:
              item.weightMode === "percentage" && item.percentage
                ? parseFloat(item.percentage)
                : undefined,
            maxTypeReference:
              item.weightMode === "percentage" ? "1RM" : undefined,
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
      Alert.alert("Error", "Failed to save workout. Please try again.");
    }
  }

  if (!isValidUUID(gymId) || (workoutId && !isValidUUID(workoutId))) {
    router.replace("/(tabs)/gym");
    return null;
  }

  const isSaving = createWorkout.isPending || updateWorkout.isPending;
  const formattedDate = format(scheduledDate, "EEE, MMM d");

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
          {isEditMode ? "Edit Workout" : "New Workout"}
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
              placeholder="General notes (optional)"
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

          {/* Add Block */}
          <Pressable
            className="border border-dashed border-border rounded-2xl py-4 items-center flex-row justify-center gap-2"
            onPress={() => {
              const nb = newBlock();
              setSections((prev) => [...prev, nb]);
              setOpenBlockId(nb.localId);
            }}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text className="text-accent text-sm font-semibold">Add Block</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-4 bg-bg border-t border-border">
        <Button
          label={
            isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Workout"
                : "Save Workout"
          }
          onPress={handleSave}
          disabled={isSaving}
        />
      </View>

      {/* Date picker */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              className="bg-surface rounded-t-3xl pb-10"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
                <Text className="text-foreground font-semibold">
                  Select Date
                </Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text className="text-accent font-semibold">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="inline"
                onChange={(_e: DateTimePickerEvent, date?: Date) => {
                  if (date) setScheduledDate(date);
                }}
                themeVariant="dark"
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display="default"
            onChange={(_e: DateTimePickerEvent, date?: Date) => {
              setShowDatePicker(false);
              if (date) setScheduledDate(date);
            }}
          />
        )
      )}

      <WorkoutPreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        notes={notes}
        scheduledDate={formattedDate}
        sections={sections}
      />
    </SafeAreaView>
  );
}
