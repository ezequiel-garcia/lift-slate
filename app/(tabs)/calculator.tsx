import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProfile } from "@/hooks/useProfile";
import { FromOneRMForm } from "@/components/calculator/FromOneRMForm";
import { ReverseForm } from "@/components/calculator/ReverseForm";
import { PercentageTable } from "@/components/calculator/PercentageTable";
import { SaveMaxModal } from "@/components/calculator/SaveMaxModal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { toKg, calculatePercentage, formatWeight } from "@/lib/units";
import { estimate1RM } from "@/lib/estimate";
import { colors } from "@/lib/theme";

type Mode = "from1rm" | "reverse";

function CustomPercentageSection({
  oneRMKg,
  unit,
  customPct,
  onChangePct,
}: {
  oneRMKg: number;
  unit: "kg" | "lbs";
  customPct: string;
  onChangePct: (v: string) => void;
}) {
  const { t } = useTranslation();
  const parsed = parseFloat(customPct);
  const valid = !isNaN(parsed) && parsed > 0;
  const result = valid ? calculatePercentage(oneRMKg, parsed, unit) : null;
  const formatted = result != null ? formatWeight(result, unit) : null;
  const [resultValue, resultUnit] = formatted
    ? formatted.split(" ")
    : ["", unit];

  return (
    <View className="bg-surface rounded-2xl overflow-hidden mb-2">
      <Text className="text-label uppercase tracking-wider text-muted px-4 pt-4 pb-3">
        {t("calculator.custom_percentage")}
      </Text>
      <View className="flex-row items-center px-4 pb-4 gap-3">
        <TextInput
          className="flex-1 bg-surface2 rounded-xl px-4 py-3 text-foreground text-[16px]"
          placeholder={t("calculator.custom_placeholder")}
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={customPct}
          onChangeText={onChangePct}
        />
        <Text className="text-muted text-lg font-semibold">%</Text>
      </View>
      {valid && formatted && (
        <View className="flex-row items-center px-4 pb-4 gap-2">
          <Text
            style={{
              fontFamily: "CormorantGaramond-Regular",
              fontSize: 48,
              lineHeight: 50,
              color: colors.foreground,
              letterSpacing: -0.8,
              fontVariant: ["tabular-nums"],
            }}
          >
            {resultValue}
          </Text>
          <Text
            style={{
              fontFamily: "CormorantGaramond-Regular",
              fontSize: 24,
              lineHeight: 26,
              color: colors.accent,
              marginTop: 8,
            }}
          >
            {resultUnit}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function QuickCalculatorScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const unit = (profile?.unit_preference ?? "kg") as "kg" | "lbs";

  const MODE_SEGMENTS = [
    { value: "from1rm" as const, label: t("calculator.from_1rm") },
    { value: "reverse" as const, label: t("calculator.estimate_1rm") },
  ];

  const [mode, setMode] = useState<Mode>("from1rm");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [customPct, setCustomPct] = useState("");

  // Mode A — From 1RM
  const [oneRMInput, setOneRMInput] = useState("");

  // Mode B — Estimate from reps
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");

  // Mode A derived
  const oneRMValue = parseFloat(oneRMInput);
  const oneRMValid = !isNaN(oneRMValue) && oneRMValue > 0;
  const oneRMKg = oneRMValid ? toKg(oneRMValue, unit) : null;

  // Mode B derived
  const weightValue = parseFloat(weightInput);
  const weightValid = !isNaN(weightValue) && weightValue > 0;
  const repsNum = parseInt(repsInput, 10);
  const repsValid = !isNaN(repsNum) && repsNum >= 1;

  const estimatedOneRM =
    weightValid && repsValid ? estimate1RM(weightValue, repsNum) : null;
  const estimatedOneRMKg =
    estimatedOneRM != null ? toKg(estimatedOneRM, unit) : null;

  const tableOneRMKg = mode === "from1rm" ? oneRMKg : estimatedOneRMKg;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View className="px-5 pt-5 pb-4">
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 56,
                lineHeight: 58,
                color: colors.foreground,
                letterSpacing: -1,
              }}
            >
              {t("calculator.title")}
            </Text>
          </View>

          {/* Mode Toggle */}
          <View className="mx-5 mb-5">
            <SegmentedControl
              segments={MODE_SEGMENTS}
              selected={mode}
              onChange={setMode}
            />
          </View>

          <View className="px-5">
            {mode === "from1rm" ? (
              <>
                <FromOneRMForm
                  unit={unit}
                  input={oneRMInput}
                  onChangeInput={setOneRMInput}
                  showError={oneRMInput.length > 0 && !oneRMValid}
                />
                {oneRMValid ? (
                  <>
                    <PercentageTable oneRMKg={oneRMKg!} unit={unit} />
                    <CustomPercentageSection
                      oneRMKg={oneRMKg!}
                      unit={unit}
                      customPct={customPct}
                      onChangePct={setCustomPct}
                    />
                  </>
                ) : (
                  <View className="bg-surface rounded-2xl p-8 items-center">
                    <Ionicons
                      name="barbell-outline"
                      size={36}
                      color={colors.muted}
                      style={{ marginBottom: 12 }}
                    />
                    <Text className="text-base font-semibold text-foreground mb-2 text-center">
                      {t("calculator.enter_1rm_title")}
                    </Text>
                    <Text className="text-sm text-muted text-center">
                      {t("calculator.enter_1rm_description")}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <ReverseForm
                unit={unit}
                weightInput={weightInput}
                onChangeWeight={setWeightInput}
                showWeightError={weightInput.length > 0 && !weightValid}
                repsInput={repsInput}
                onChangeReps={setRepsInput}
                showRepsError={repsInput.length > 0 && !repsValid}
                estimatedOneRM={estimatedOneRM}
                repsNum={repsNum}
                canSave={estimatedOneRM != null}
                onSave={() => setSaveModalOpen(true)}
                showPlaceholder={!weightValid || !repsValid}
              />
            )}

            {mode === "reverse" && tableOneRMKg != null && (
              <>
                <PercentageTable oneRMKg={tableOneRMKg} unit={unit} />
                <CustomPercentageSection
                  oneRMKg={tableOneRMKg}
                  unit={unit}
                  customPct={customPct}
                  onChangePct={setCustomPct}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {estimatedOneRM != null && (
        <SaveMaxModal
          visible={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          estimatedOneRM={estimatedOneRM}
          unit={unit}
          sourceDescription={`${weightInput} ${unit} x ${repsNum} reps`}
        />
      )}
    </SafeAreaView>
  );
}
