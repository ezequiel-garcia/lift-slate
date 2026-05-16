import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { exerciseNameKey } from "@/lib/i18n";

export function useExerciseName() {
  const { t } = useTranslation();
  return (name: string) =>
    t(`exercise_names.${exerciseNameKey(name)}`, { defaultValue: name });
}

/** Matches query against both the DB name (English) and the localized display name. */
export function useExerciseSearchMatch() {
  const { t } = useTranslation();
  return useCallback(
    (name: string, query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      if (name.toLowerCase().includes(q)) return true;
      const translated = t(`exercise_names.${exerciseNameKey(name)}`, {
        defaultValue: name,
      });
      return translated.toLowerCase().includes(q);
    },
    [t],
  );
}
