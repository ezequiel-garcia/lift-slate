import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "@/lib/theme";
import { EquipmentType } from "@/types/exercise";
import { PrescriptionMode } from "@/types/exerciseReference";
import { usePrescriptionLabel } from "@/hooks/usePrescriptionLabel";
import { ALLOWED_PRESCRIPTIONS_BY_EQUIPMENT } from "./types";

type Props = {
  equipmentType: EquipmentType;
  mode?: PrescriptionMode;
  percentage?: string;
  weightKg?: string;
  onChangeMode: (mode: PrescriptionMode | undefined) => void;
  onChangePercentage: (value: string) => void;
  onChangeWeightKg: (value: string) => void;
};

const MODES_WITH_NUMERIC_INPUT: PrescriptionMode[] = ["percentage", "absolute"];

export function PrescriptionPicker({
  equipmentType,
  mode,
  percentage,
  weightKg,
  onChangeMode,
  onChangePercentage,
  onChangeWeightKg,
}: Props) {
  const { t } = useTranslation();
  const getPrescriptionLabel = usePrescriptionLabel();
  const allowed = ALLOWED_PRESCRIPTIONS_BY_EQUIPMENT[equipmentType];
  const showNumericInput = mode && MODES_WITH_NUMERIC_INPUT.includes(mode);

  return (
    <View className="gap-2">
      <Text className="text-muted text-[10px] uppercase tracking-wider ml-1">
        {t("workout.prescription_label")}
      </Text>

      <View className="flex-row flex-wrap gap-1.5">
        {allowed.map((m) => {
          const selected = m === mode;
          return (
            <Pressable
              key={m}
              className={`px-3 py-1.5 rounded-lg ${
                selected ? "bg-accent/15" : "bg-surface"
              }`}
              style={
                selected
                  ? { borderWidth: 1, borderColor: colors.accent }
                  : { borderWidth: 1, borderColor: colors.border }
              }
              onPress={() => onChangeMode(selected ? undefined : m)}
            >
              <Text
                className={`text-xs ${
                  selected ? "text-accent font-semibold" : "text-muted"
                }`}
              >
                {getPrescriptionLabel(m)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {showNumericInput && (
        <View className="flex-row items-center bg-surface rounded-lg border border-border mt-1">
          {mode === "percentage" ? (
            <>
              <TextInput
                className="flex-1 text-foreground px-3 py-2 text-sm text-center"
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={percentage ?? ""}
                onChangeText={onChangePercentage}
                keyboardType="numeric"
              />
              <Text className="text-muted text-xs pr-3">
                {t("prescription.percentage")}
              </Text>
            </>
          ) : (
            <>
              <TextInput
                className="flex-1 text-foreground px-3 py-2 text-sm text-center"
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={weightKg ?? ""}
                onChangeText={onChangeWeightKg}
                keyboardType="decimal-pad"
              />
              <Text className="text-muted text-xs pr-3">kg</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
