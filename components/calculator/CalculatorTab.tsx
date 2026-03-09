import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { calculatePercentage, formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { COMMON_PERCENTAGES } from "@/lib/constants";
import { ExerciseNotes } from "@/components/exercises/ExerciseNotes";
import { colors } from "@/lib/theme";

type Max = {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  exerciseId: string;
  currentMax: Max | null;
  unit: WeightUnit;
  roundingIncrementKg: number;
  onAddMax: () => void;
};

export function CalculatorTab({ exerciseId, currentMax, unit, roundingIncrementKg, onAddMax }: Props) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");

  const activePct = customPct ? parseFloat(customPct) : selectedPct;
  const result =
    currentMax && activePct != null && !isNaN(activePct) && activePct > 0
      ? calculatePercentage(currentMax.weight_kg, activePct, unit, roundingIncrementKg)
      : null;

  const roundIncrementDisplay = formatWeight(fromKg(roundingIncrementKg, unit), unit);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
    >
      {/* Current 1RM */}
      <View className="items-center py-6 mb-2">
        <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-3">
          Current 1RM
        </Text>
        {currentMax ? (
          <Text className="text-[56px] font-bold text-foreground" style={{ letterSpacing: -2 }}>
            {formatWeight(fromKg(currentMax.weight_kg, unit), unit)}
          </Text>
        ) : (
          <Text className="text-muted text-base">No max recorded yet</Text>
        )}
      </View>

      {/* Percentage grid */}
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-3">
        Percentage
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {COMMON_PERCENTAGES.map((pct) => {
          const isActive = selectedPct === pct && !customPct;
          return (
            <Pressable
              key={pct}
              className={`px-4 py-3 rounded-xl ${
                isActive ? "bg-accent/15" : "bg-surface"
              }`}
              style={isActive ? { borderWidth: 1, borderColor: colors.accent } : undefined}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPct(pct);
                setCustomPct("");
              }}
            >
              <Text
                className={`text-[15px] font-semibold ${isActive ? "text-accent" : "text-foreground"}`}
              >
                {pct}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom percentage */}
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
        Custom
      </Text>
      <View className="flex-row items-center gap-3 mb-6">
        <TextInput
          className="flex-1 bg-surface rounded-xl px-4 py-3.5 text-foreground text-[16px]"
          placeholder="e.g. 67.5"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={customPct}
          onChangeText={(v) => {
            setCustomPct(v);
            if (v) setSelectedPct(null);
          }}
        />
        <Text className="text-muted text-lg font-semibold">%</Text>
      </View>

      {/* Result */}
      {result && (
        <View className="bg-surface rounded-2xl p-6 mb-3 items-center">
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
            {activePct}% of 1RM
          </Text>
          <Text
            className="text-[48px] font-bold text-accent"
            style={{ letterSpacing: -2 }}
          >
            {formatWeight(result.rounded, unit)}
          </Text>
          <Text className="text-sm text-muted mt-2">
            exact {formatWeight(result.raw, unit)} · rounded to {roundIncrementDisplay}
          </Text>
        </View>
      )}

      {/* Add new max */}
      <Pressable
        className="mt-2 bg-surface rounded-2xl p-4 items-center flex-row justify-center gap-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={onAddMax}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
        <Text className="text-accent font-semibold text-[15px]">Add New Max</Text>
      </Pressable>

      <ExerciseNotes exerciseId={exerciseId} />
    </ScrollView>
  );
}
