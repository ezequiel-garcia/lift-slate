import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProfile } from "@/hooks/useProfile";
import { FromOneRMForm } from "@/components/calculator/FromOneRMForm";
import { ReverseForm } from "@/components/calculator/ReverseForm";
import { PercentageTable } from "@/components/calculator/PercentageTable";
import { SaveMaxModal } from "@/components/calculator/SaveMaxModal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { fromKg, toKg } from "@/lib/units";
import { colors } from "@/lib/theme";

type Mode = "from1rm" | "reverse";

const MODE_SEGMENTS = [
  { value: "from1rm" as const, label: "From 1RM" },
  { value: "reverse" as const, label: "Estimate 1RM" },
];

export default function QuickCalculatorScreen() {
  const { data: profile } = useProfile();

  const unit = (profile?.unit_preference ?? "kg") as "kg" | "lbs";

  const [mode, setMode] = useState<Mode>("from1rm");
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Mode A
  const [oneRMInput, setOneRMInput] = useState("");

  // Mode B
  const [weightInput, setWeightInput] = useState("");
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [customPctInput, setCustomPctInput] = useState("");

  // Mode A derived
  const oneRMValue = parseFloat(oneRMInput);
  const oneRMValid = !isNaN(oneRMValue) && oneRMValue > 0;
  const oneRMKg = oneRMValid ? toKg(oneRMValue, unit) : null;

  // Mode B derived
  const activePct = customPctInput ? parseFloat(customPctInput) : selectedChip;
  const pctValid =
    activePct != null &&
    !isNaN(activePct) &&
    activePct >= 1 &&
    activePct <= 100;
  const weightValue = parseFloat(weightInput);
  const weightValid = !isNaN(weightValue) && weightValue > 0;
  const weightKg = weightValid ? toKg(weightValue, unit) : null;
  const estimatedOneRMKg =
    weightKg && pctValid ? weightKg / (activePct! / 100) : null;
  const estimatedOneRMRaw = estimatedOneRMKg
    ? fromKg(estimatedOneRMKg, unit)
    : null;

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
            <Text className="text-title text-foreground tracking-tight">
              Calculator
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
                  <PercentageTable oneRMKg={oneRMKg!} unit={unit} />
                ) : (
                  <View className="bg-surface rounded-2xl p-8 items-center">
                    <Ionicons
                      name="barbell-outline"
                      size={36}
                      color={colors.muted}
                      style={{ marginBottom: 12 }}
                    />
                    <Text className="text-base font-semibold text-foreground mb-2 text-center">
                      Enter your 1RM
                    </Text>
                    <Text className="text-sm text-muted text-center">
                      See your training weights at every percentage.
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
                selectedChip={selectedChip}
                onSelectChip={(pct) => {
                  setSelectedChip(pct);
                  setCustomPctInput("");
                }}
                customPctInput={customPctInput}
                onChangeCustomPct={(v) => {
                  setCustomPctInput(v);
                  if (v) setSelectedChip(null);
                }}
                showPctError={customPctInput.length > 0 && !pctValid}
                estimatedOneRMRaw={estimatedOneRMRaw}
                canSave={estimatedOneRMKg != null}
                onSave={() => setSaveModalOpen(true)}
                showPlaceholder={!weightValid || !pctValid}
              />
            )}

            {mode === "reverse" && tableOneRMKg != null && (
              <PercentageTable oneRMKg={tableOneRMKg} unit={unit} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {estimatedOneRMKg != null && (
        <SaveMaxModal
          visible={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          estimatedOneRMKg={estimatedOneRMKg}
        />
      )}
    </SafeAreaView>
  );
}
