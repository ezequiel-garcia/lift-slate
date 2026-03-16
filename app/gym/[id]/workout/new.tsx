import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { addDays, format } from "date-fns";
import { useCreateWorkout, usePublishWorkout } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { WorkoutSectionCard } from "@/components/workout/WorkoutSectionCard";
import { WorkoutPreviewModal } from "@/components/workout/WorkoutPreviewModal";
import { SectionFormData } from "@/components/workout/types";

function newSection(): SectionFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    title: "",
    items: [],
  };
}

export default function NewWorkoutScreen() {
  const { id: gymId } = useLocalSearchParams<{ id: string }>();
  const { data: profile } = useProfile();
  const unit = (profile?.unit_preference ?? "kg") as "kg" | "lbs";

  const createWorkout = useCreateWorkout();
  const publishWorkout = usePublishWorkout();
  const setPendingGymDate = useAppStore((s) => s.setPendingGymDate);

  const [scheduledDate, setScheduledDate] = useState(() => addDays(new Date(), 1));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<SectionFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  function updateSection(index: number, updated: SectionFormData) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function deleteSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSection(from: number, to: number) {
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function buildWorkoutInput() {
    return {
      title: title.trim() || undefined,
      scheduledDate: format(scheduledDate, "yyyy-MM-dd"),
      notes: notes.trim() || undefined,
      sections: sections.map((s, si) => ({
        title: s.title,
        orderIndex: si,
        items: s.items.map((item, ii) => {
          const base = {
            orderIndex: ii,
            itemType: item.itemType as "structured" | "free_text",
            notes: item.notes?.trim() || undefined,
          };
          if (item.itemType === "free_text") {
            return { ...base, content: item.content };
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

  async function handleSaveDraft() {
    if (!gymId) return;
    try {
      await createWorkout.mutateAsync({ gymId, input: buildWorkoutInput() });
      setPendingGymDate(scheduledDate);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save workout. Please try again.");
    }
  }

  async function handlePublish() {
    if (!gymId) return;
    try {
      const workout = await createWorkout.mutateAsync({ gymId, input: buildWorkoutInput() });
      await publishWorkout.mutateAsync(workout.id);
      setPendingGymDate(scheduledDate);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to publish workout. Please try again.");
    }
  }

  const isSaving = createWorkout.isPending || publishWorkout.isPending;
  const formattedDate = format(scheduledDate, "EEE, MMM d");

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">New Workout</Text>
        <Pressable onPress={() => setShowPreview(true)} className="p-1">
          <Ionicons name="eye-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date picker */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Scheduled Date
          </Text>
          <View className="flex-row items-center justify-between">
            <Pressable
              className="w-10 h-10 bg-surface2 rounded-xl items-center justify-center"
              onPress={() => setScheduledDate((d) => addDays(d, -1))}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Text className="text-foreground text-base font-semibold">{formattedDate}</Text>
            <Pressable
              className="w-10 h-10 bg-surface2 rounded-xl items-center justify-center"
              onPress={() => setScheduledDate((d) => addDays(d, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Title & Notes */}
        <View className="bg-surface rounded-2xl px-4 py-4 border border-border gap-3 mb-4">
          <TextInput
            className="text-foreground text-lg font-semibold"
            placeholder="Workout title (optional)"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <View className="h-px bg-border" />
          <TextInput
            className="text-foreground text-sm"
            placeholder="General notes (optional)"
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Sections */}
        <View className="gap-4">
          {sections.map((section, i) => (
            <WorkoutSectionCard
              key={section.localId}
              section={section}
              onUpdate={(updated) => updateSection(i, updated)}
              onDelete={() => deleteSection(i)}
              onMoveUp={() => moveSection(i, i - 1)}
              onMoveDown={() => moveSection(i, i + 1)}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
              unit={unit}
            />
          ))}

          {/* Add Section */}
          <Pressable
            className="border-2 border-dashed border-border rounded-2xl py-5 items-center gap-1"
            onPress={() => setSections((prev) => [...prev, newSection()])}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            <Text className="text-accent text-sm font-medium">Add Section</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-4 bg-bg border-t border-border flex-row gap-3"
      >
        <Pressable
          className="flex-1 bg-surface rounded-2xl py-4 items-center border border-border"
          onPress={handleSaveDraft}
          disabled={isSaving}
          style={{ opacity: isSaving ? 0.6 : 1 }}
        >
          <Text className="text-foreground text-base font-semibold">
            {createWorkout.isPending && !publishWorkout.isPending ? "Saving..." : "Save Draft"}
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 bg-accent rounded-2xl py-4 items-center"
          onPress={handlePublish}
          disabled={isSaving}
          style={{ opacity: isSaving ? 0.6 : 1 }}
        >
          <Text className="text-bg text-base font-semibold">
            {isSaving ? "Publishing..." : "Publish"}
          </Text>
        </Pressable>
      </View>

      <WorkoutPreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        notes={notes}
        scheduledDate={formattedDate}
        sections={sections}
        unit={unit}
      />
    </SafeAreaView>
  );
}
