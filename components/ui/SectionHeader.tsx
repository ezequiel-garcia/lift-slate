import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

type Props = {
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

export function SectionHeader({ title, icon }: Props) {
  return (
    <View className="px-5 pt-6 pb-2.5 bg-bg flex-row items-center gap-2">
      {icon && <Ionicons name={icon} size={14} color={colors.muted} />}
      <Text className="text-label uppercase tracking-wider text-muted">
        {title}
      </Text>
    </View>
  );
}
