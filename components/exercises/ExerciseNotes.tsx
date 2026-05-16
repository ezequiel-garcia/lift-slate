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
import { useTranslation } from "react-i18next";
import { useExerciseNote } from "@/hooks/useExerciseNote";
import { colors } from "@/lib/theme";

type Props = {
  exerciseId: string;
};

const accessoryNativeId = (exerciseId: string) =>
  `exercise-note-accessory-${exerciseId.replace(/-/g, "")}`;

export function ExerciseNotes({ exerciseId }: Props) {
  const { t } = useTranslation();
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
              accessibilityLabel={t("exercise_notes.a11y_dismiss")}
            >
              <Text className="text-[17px] font-semibold text-accent">
                {t("exercise_notes.done")}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      <Text className="text-sm text-muted leading-5 mb-3">
        {t("exercise_notes.description")}
      </Text>

      {Platform.OS === "android" && focused ? (
        <View className="flex-row justify-end mb-2">
          <Pressable
            onPress={() => Keyboard.dismiss()}
            hitSlop={12}
            className="py-1.5 px-1"
            accessibilityRole="button"
            accessibilityLabel={t("exercise_notes.a11y_dismiss")}
          >
            <Text className="text-[15px] font-semibold text-accent">
              {t("exercise_notes.hide_keyboard")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        className="flex-1 bg-surface rounded-xl px-4 py-4 text-foreground text-[16px] leading-[22px] border border-border"
        placeholder={t("exercise_notes.placeholder")}
        placeholderTextColor={colors.muted}
        value={draft}
        onChangeText={setDraft}
        multiline
        scrollEnabled
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputAccessoryViewID={Platform.OS === "ios" ? accessoryId : undefined}
        accessibilityLabel={t("exercise_notes.a11y_notes")}
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
        accessibilityLabel={t("exercise_notes.a11y_save")}
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
            {t("exercise_notes.save")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
