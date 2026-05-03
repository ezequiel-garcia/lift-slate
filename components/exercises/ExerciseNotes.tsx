import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Platform,
  InputAccessoryView,
} from "react-native";
import { useExerciseNote } from "@/hooks/useExerciseNote";
import { colors } from "@/lib/theme";

type Props = {
  exerciseId: string;
};

const accessoryNativeId = (exerciseId: string) =>
  `exercise-note-accessory-${exerciseId.replace(/-/g, "")}`;

export function ExerciseNotes({ exerciseId }: Props) {
  const { draft, setDraft, handleSave, isSaving, isDirty } =
    useExerciseNote(exerciseId);
  const [focused, setFocused] = useState(false);
  const accessoryId = accessoryNativeId(exerciseId);

  function onSavePress() {
    if (!isDirty || isSaving) return;
    Keyboard.dismiss();
    handleSave();
  }

  return (
    <View className="flex-1 pt-1">
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryId}>
          <View className="flex-row items-center justify-end border-t border-border bg-surface2 px-4 py-2.5">
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard"
            >
              <Text className="text-[17px] font-semibold text-accent">
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      <Text className="text-sm text-muted leading-5 mb-3">
        Form cues, coach notes, or goals — private to you and tied to this lift.
      </Text>

      {Platform.OS === "android" && focused ? (
        <View className="flex-row justify-end mb-2">
          <Pressable
            onPress={() => Keyboard.dismiss()}
            hitSlop={12}
            className="py-1.5 px-1"
            accessibilityRole="button"
            accessibilityLabel="Dismiss keyboard"
          >
            <Text className="text-[15px] font-semibold text-accent">
              Hide keyboard
            </Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        className="flex-1 bg-surface rounded-xl px-4 py-4 text-foreground text-[16px] leading-[22px] border border-border"
        placeholder="Tap to write…"
        placeholderTextColor={colors.muted}
        value={draft}
        onChangeText={setDraft}
        multiline
        scrollEnabled
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
        accessibilityLabel="Exercise notes"
      />

      <Pressable
        className={`mt-3 rounded-xl py-3.5 min-h-[52px] items-center justify-center border ${
          isDirty || isSaving
            ? "bg-accent border-accent"
            : "bg-surface2 border-border opacity-50"
        }`}
        style={({ pressed }) =>
          isDirty && !isSaving && pressed ? { opacity: 0.85 } : undefined
        }
        onPress={onSavePress}
        disabled={!isDirty || isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save notes"
        accessibilityState={{ disabled: !isDirty || isSaving }}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text
            className={`font-bold text-[16px] ${
              isDirty ? "text-bg" : "text-muted"
            }`}
          >
            Save
          </Text>
        )}
      </Pressable>
    </View>
  );
}
