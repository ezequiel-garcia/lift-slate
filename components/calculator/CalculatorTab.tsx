import { COMMON_PERCENTAGES } from "@/lib/constants";
import { easyRange, heavyRange } from "@/lib/kettlebells";
import { colors } from "@/lib/theme";
import {
  calculatePercentage,
  formatWeight,
  fromKg,
  WeightUnit,
} from "@/lib/units";
import { EquipmentType } from "@/types/exercise";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Max = {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  equipmentType?: EquipmentType;
  currentMax: Max | null;
  unit: WeightUnit;
  onAddMax: () => void;
  isLoading?: boolean;
  readonly?: boolean;
};

function RangeCard({
  label,
  range,
  unit,
}: {
  label: string;
  range: number[];
  unit: WeightUnit;
}) {
  const display = range.map((v) => Math.round(fromKg(v, unit)));
  const text =
    display.length === 0
      ? "—"
      : display.length === 1
        ? formatWeight(display[0], unit)
        : `${display[0]}–${formatWeight(display[display.length - 1], unit)}`;

  return (
    <View className="flex-1 bg-surface rounded-2xl p-4 items-center">
      <Text className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "CormorantGaramond-Regular",
          fontSize: 30,
          lineHeight: 32,
          color: colors.foreground,
          letterSpacing: -0.4,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export function CalculatorTab({
  equipmentType,
  currentMax,
  unit,
  onAddMax,
  isLoading,
  readonly,
}: Props) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");

  const isWorkingWeight =
    equipmentType === "dumbbell" ||
    equipmentType === "kettlebell" ||
    equipmentType === "machine" ||
    equipmentType === "other";

  const activePct = customPct ? parseFloat(customPct) : selectedPct;
  const result =
    !isWorkingWeight &&
    currentMax &&
    activePct != null &&
    !isNaN(activePct) &&
    activePct > 0
      ? calculatePercentage(currentMax.weight_kg, activePct, unit)
      : null;

  const heavy =
    isWorkingWeight && currentMax ? heavyRange(currentMax.weight_kg) : [];
  const easy =
    isWorkingWeight && currentMax ? easyRange(currentMax.weight_kg) : [];
  const currentWeightFormatted =
    currentMax && currentMax.weight_kg > 0
      ? formatWeight(fromKg(currentMax.weight_kg, unit), unit)
      : null;
  const [currentValue, currentUnit] = currentWeightFormatted
    ? currentWeightFormatted.split(" ")
    : ["", unit];
  const resultFormatted = result ? formatWeight(result, unit) : null;
  const [resultValue, resultUnit] = resultFormatted
    ? resultFormatted.split(" ")
    : ["", unit];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
    >
      {/* Current reference value */}
      <View className="items-center py-7 mb-4">
        <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-3">
          {isWorkingWeight
            ? "Current Working Weight"
            : "Current One-Rep Maximum"}
        </Text>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : currentMax && currentMax.weight_kg > 0 ? (
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}
          >
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 84,
                lineHeight: 84,
                color: colors.foreground,
                letterSpacing: -1.6,
                fontVariant: ["tabular-nums"],
              }}
            >
              {currentValue}
            </Text>
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 38,
                lineHeight: 40,
                color: colors.accent,
                marginTop: 14,
              }}
            >
              {currentUnit}
            </Text>
          </View>
        ) : (
          <Text className="text-muted text-base">
            {currentMax ? "Not relevant" : "No weight recorded yet"}
          </Text>
        )}
      </View>

      {/* Kettlebell / machine: heavy + easy range chips */}
      {isWorkingWeight && currentMax && currentMax.weight_kg > 0 && (
        <View className="flex-row gap-3 mb-6">
          <RangeCard label="Easy" range={easy} unit={unit} />
          <RangeCard label="Heavy" range={heavy} unit={unit} />
        </View>
      )}

      {/* Barbell / dumbbell: percentage calculator */}
      {!isWorkingWeight && currentMax && currentMax.weight_kg > 0 && (
        <>
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-3">
            Selected Intensity
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            {COMMON_PERCENTAGES.map((pct) => {
              const isActive = selectedPct === pct && !customPct;
              return (
                <Pressable
                  key={pct}
                  className="items-center justify-center"
                  style={{
                    width: "31.5%",
                    height: 52,
                    borderRadius: 4,
                    backgroundColor: isActive ? colors.accentMuted : colors.bg,
                    borderWidth: 1,
                    borderColor: isActive ? colors.accent : colors.border,
                    marginBottom: 10,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPct(pct);
                    setCustomPct("");
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "CormorantGaramond-Regular",
                      fontSize: 28,
                      lineHeight: 30,
                      color: isActive ? colors.accent : colors.foreground,
                      letterSpacing: -0.4,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {pct}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

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

          {result && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                marginBottom: 12,
              }}
            >
              <Text className="text-[12px] font-semibold text-muted uppercase tracking-widest mb-3">
                Prescribed Load • {activePct}%
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}
              >
                <Text
                  style={{
                    fontFamily: "CormorantGaramond-Regular",
                    fontSize: 70,
                    lineHeight: 72,
                    color: colors.foreground,
                    letterSpacing: -1.2,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {resultValue}
                </Text>
                <Text
                  style={{
                    fontFamily: "CormorantGaramond-Regular",
                    fontSize: 34,
                    lineHeight: 36,
                    color: colors.foreground,
                    marginBottom: 8,
                  }}
                >
                  {resultUnit}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.hairline,
                  marginTop: 12,
                }}
              />
            </View>
          )}
        </>
      )}

      {!readonly && (
        <Pressable
          className="mt-2 bg-surface rounded-2xl p-4 items-center flex-row justify-center gap-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          onPress={onAddMax}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text className="text-accent font-semibold text-[15px]">
            {isWorkingWeight ? "Update Working Weight" : "Add New Max"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
