import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { UnitPill } from "@/components/calculator/FromOneRMForm";
import { formatWeight } from "@/lib/units";
import { MAX_RELIABLE_REPS } from "@/lib/estimate";
import { colors } from "@/lib/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  unit: "kg" | "lbs";
  weightInput: string;
  onChangeWeight: (v: string) => void;
  showWeightError: boolean;
  repsInput: string;
  onChangeReps: (v: string) => void;
  showRepsError: boolean;
  estimatedOneRM: number | null;
  repsNum: number;
  canSave: boolean;
  onSave: () => void;
  showPlaceholder: boolean;
};

export function ReverseForm({
  unit,
  weightInput,
  onChangeWeight,
  showWeightError,
  repsInput,
  onChangeReps,
  showRepsError,
  estimatedOneRM,
  repsNum,
  canSave,
  onSave,
  showPlaceholder,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <View className="mb-5">
        <Input
          label={t("calculator.weight_lifted")}
          placeholder={unit === "kg" ? "e.g. 100" : "e.g. 225"}
          keyboardType="decimal-pad"
          value={weightInput}
          onChangeText={onChangeWeight}
          error={showWeightError ? t("calculator.weight_error") : undefined}
          rightElement={<UnitPill unit={unit} />}
        />
      </View>

      <View className="mb-5">
        <Input
          label={t("calculator.reps_performed")}
          placeholder={t("calculator.reps_placeholder")}
          keyboardType="number-pad"
          value={repsInput}
          onChangeText={onChangeReps}
          error={showRepsError ? t("calculator.reps_error") : undefined}
        />
      </View>

      {repsNum > MAX_RELIABLE_REPS && (
        <View className="flex-row items-center gap-2 mb-4 px-1">
          <Ionicons name="warning-outline" size={16} color={colors.error} />
          <Text className="text-error text-sm flex-1">
            {t("calculator.unreliable_warning", { max: MAX_RELIABLE_REPS })}
          </Text>
        </View>
      )}

      {showPlaceholder ? (
        <View className="bg-surface rounded-2xl p-8 mb-6 items-center">
          <Ionicons
            name="analytics-outline"
            size={36}
            color={colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text className="text-base font-semibold text-foreground mb-2 text-center">
            {t("calculator.estimate_title")}
          </Text>
          <Text className="text-sm text-muted text-center">
            {t("calculator.estimate_description")}
          </Text>
        </View>
      ) : (
        <>
          {estimatedOneRM != null && (
            <View className="bg-surface rounded-2xl p-5 mb-6">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                {t("calculator.estimated_1rm")}
              </Text>
              <Text
                className="text-display text-accent"
                style={{ letterSpacing: -2 }}
              >
                {formatWeight(parseFloat(estimatedOneRM.toFixed(1)), unit)}
              </Text>
              {weightInput && repsNum >= 1 && (
                <Text className="text-xs text-muted mt-1">
                  {t("calculator.based_on", {
                    weight: weightInput,
                    unit,
                    reps: repsNum,
                  })}
                </Text>
              )}
            </View>
          )}
          {canSave && (
            <View className="mb-6">
              <Button label={t("calculator.save_as_1rm")} onPress={onSave} />
            </View>
          )}
        </>
      )}
    </>
  );
}
