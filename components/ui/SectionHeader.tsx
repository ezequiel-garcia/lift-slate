import { View, Text } from "react-native";

type Props = { title: string };

export function SectionHeader({ title }: Props) {
  return (
    <View className="px-4 pt-4 pb-1 bg-bg">
      <Text className="text-[11px] font-bold text-muted uppercase tracking-widest">
        {title}
      </Text>
    </View>
  );
}
