import { View, Text } from "react-native";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "react-i18next";

type Props = {
  unit: string;
  input: string;
  onChangeInput: (v: string) => void;
  showError: boolean;
};

function UnitPill({ unit }: { unit: string }) {
  return (
    <View className="bg-surface2 rounded-md px-2 py-0.5">
      <Text className="text-xs font-semibold text-muted uppercase">{unit}</Text>
    </View>
  );
}

export { UnitPill };

export function FromOneRMForm({
  unit,
  input,
  onChangeInput,
  showError,
}: Props) {
  const { t } = useTranslation();
  return (
    <View className="mb-5">
      <Input
        label={t("calculator.1rm_label")}
        placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
        keyboardType="decimal-pad"
        value={input}
        onChangeText={onChangeInput}
        error={showError ? t("calculator.weight_error") : undefined}
        rightElement={<UnitPill unit={unit} />}
      />
    </View>
  );
}
