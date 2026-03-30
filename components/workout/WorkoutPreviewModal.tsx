import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { SectionFormData } from "./types";

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
              Athlete Preview
            </Text>
            <Text className="text-foreground text-lg font-semibold mt-0.5">
              {scheduledDate}
            </Text>
          </View>
          <Pressable onPress={onClose}>
            <Text className="text-accent font-medium">Done</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {!!notes && <Text className="text-muted text-sm mb-4">{notes}</Text>}

          {sections.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-muted text-sm">No blocks yet.</Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.localId} className="mb-5">
                {/* Block header */}
                <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                  {section.title?.trim() || "Block"}
                </Text>

                <View className="bg-surface rounded-xl px-4 divide-y divide-border">
                  {section.items.length === 0 ? (
                    <View className="py-3">
                      <Text className="text-muted text-sm italic">
                        No exercises
                      </Text>
                    </View>
                  ) : (
                    section.items.map((item) => {
                      const name =
                        item.itemType === "exercise"
                          ? item.exerciseName || "Exercise"
                          : item.content || "Custom Exercise";

                      const setsReps =
                        item.sets && item.reps
                          ? `${item.sets}x${item.reps}`
                          : item.sets
                            ? `${item.sets} sets`
                            : null;

                      const weightText =
                        item.weightMode === "percentage" && item.percentage
                          ? ` @ ${item.percentage}%`
                          : "";

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
