import { View, Text } from "react-native";

type Props = { title: string };

export function SectionHeader({ title }: Props) {
  return (
    <View className="px-5 pt-8 pb-2.5 bg-bg">
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest">
        {title}
      </Text>
    </View>
  );
}
