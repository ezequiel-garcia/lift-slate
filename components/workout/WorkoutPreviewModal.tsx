import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { SectionFormData } from "./types";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  notes?: string;
  scheduledDate: string;
  sections: SectionFormData[];
  unit: "kg" | "lbs";
};

export function WorkoutPreviewModal({
  visible,
  onClose,
  title,
  notes,
  scheduledDate,
  sections,
  unit,
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
          {!!title && (
            <Text className="text-foreground text-xl font-bold mb-1">
              {title}
            </Text>
          )}
          {!!notes && <Text className="text-muted text-sm mb-4">{notes}</Text>}

          {sections.length === 0 ? (
            <View className="py-16 items-center">
              <Text className="text-muted text-sm">No sections yet.</Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.localId} className="mb-5">
                <Text className="text-accent text-xs font-bold uppercase tracking-wider mb-2">
                  {section.title || "Untitled Section"}
                </Text>
                <View className="bg-surface rounded-xl px-4 divide-y divide-border">
                  {section.items.length === 0 ? (
                    <View className="py-3">
                      <Text className="text-muted text-sm italic">
                        No items
                      </Text>
                    </View>
                  ) : (
                    section.items.map((item) => {
                      if (item.itemType === "free_text") {
                        return (
                          <View key={item.localId} className="py-3">
                            <Text className="text-foreground text-[15px]">
                              {item.content || "(empty)"}
                            </Text>
                            {!!item.notes && (
                              <Text className="text-muted text-sm mt-1">
                                {item.notes}
                              </Text>
                            )}
                          </View>
                        );
                      }

                      const setsReps =
                        item.sets && item.reps
                          ? `${item.sets}×${item.reps}`
                          : item.sets
                            ? `${item.sets} sets`
                            : null;

                      let weightText = "";
                      if (item.weightMode === "percentage" && item.percentage) {
                        weightText = ` @ ${item.percentage}% of 1RM`;
                      }

                      return (
                        <View key={item.localId} className="py-3">
                          <Text className="text-foreground text-[15px]">
                            <Text className="font-semibold">
                              {item.exerciseName || "Exercise"}
                            </Text>
                            {setsReps && (
                              <Text className="text-muted"> — {setsReps}</Text>
                            )}
                            {!!weightText && (
                              <Text className="text-accent">{weightText}</Text>
                            )}
                          </Text>
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
