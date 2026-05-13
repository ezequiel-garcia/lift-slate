import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { usePrescriptionLabel } from "@/hooks/usePrescriptionLabel";
import { ItemFormData, SectionFormData } from "./types";

function prescriptionText(
  item: ItemFormData,
  getPrescriptionLabel: ReturnType<typeof usePrescriptionLabel>,
): string {
  const mode = item.prescriptionMode;
  if (!mode) return "";
  if (mode === "percentage" && item.percentage) return ` @ ${item.percentage}%`;
  if (mode === "absolute" && item.weightKg) return ` @ ${item.weightKg}kg`;
  if (mode === "reps_only") return "";
  return ` (${getPrescriptionLabel(mode)})`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  notes?: string;
  scheduledDate: string;
  sections: SectionFormData[];
};

export function WorkoutPreviewModal({
  visible,
  onClose,
  notes,
  scheduledDate,
  sections,
}: Props) {
  const { t } = useTranslation();
  const getPrescriptionLabel = usePrescriptionLabel();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pt-6 pb-4 border-b border-border">
          <View>
            <Text className="text-muted text-xs uppercase tracking-wider">
              {t("workout_preview.title")}
            </Text>
            <Text className="text-foreground text-lg font-semibold mt-0.5">
              {scheduledDate}
            </Text>
          </View>
          <Pressable onPress={onClose}>
            <Text className="text-accent font-medium">
              {t("workout_preview.done")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {!!notes && <Text className="text-muted text-sm mb-4">{notes}</Text>}

          {sections.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-muted text-sm">
                {t("workout_preview.no_blocks")}
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.localId} className="mb-5">
                <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                  {section.title?.trim() || t("workout_preview.block_fallback")}
                </Text>

                <View className="bg-surface rounded-xl px-4 divide-y divide-border">
                  {section.items.length === 0 ? (
                    <View className="py-3">
                      <Text className="text-muted text-sm italic">
                        {t("workout_preview.no_exercises")}
                      </Text>
                    </View>
                  ) : (
                    section.items.map((item) => {
                      const name =
                        item.itemType === "exercise"
                          ? item.exerciseName ||
                            t("workout_preview.exercise_fallback")
                          : item.content ||
                            t("workout_preview.custom_exercise_fallback");

                      const setsReps =
                        item.sets && item.reps
                          ? `${item.sets}x${item.reps}`
                          : item.sets
                            ? `${item.sets} ${t("workout_preview.sets_suffix")}`
                            : null;

                      const weightText = prescriptionText(
                        item,
                        getPrescriptionLabel,
                      );

                      return (
                        <View key={item.localId} className="py-3">
                          <View className="flex-row items-center">
                            <Text className="text-foreground text-[15px] flex-1">
                              <Text className="font-semibold">{name}</Text>
                              {setsReps && (
                                <Text className="text-muted"> {setsReps}</Text>
                              )}
                              {!!weightText && (
                                <Text className="text-accent">
                                  {weightText}
                                </Text>
                              )}
                            </Text>
                          </View>
                          {!!item.notes && (
                            <Text className="text-muted text-sm mt-1">
                              {item.notes}
                            </Text>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
