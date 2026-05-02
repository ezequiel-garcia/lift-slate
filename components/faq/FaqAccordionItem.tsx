import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Props = {
  question: string;
  answer: string;
  isLast?: boolean;
};

export function FaqAccordionItem({ question, answer, isLast }: Props) {
  const [open, setOpen] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setOpen((v) => !v);
  }

  return (
    <View>
      <Pressable
        onPress={toggle}
        className="px-4 py-4 flex-row items-center gap-3 active:opacity-60"
      >
        <View className="flex-1">
          <Text className="text-foreground text-[15px] font-medium leading-snug">
            {question}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.muted}
        />
      </Pressable>

      {open && (
        <View className="px-4 pb-4">
          <Text className="text-muted text-[14px] leading-relaxed">
            {answer}
          </Text>
        </View>
      )}

      {!isLast && <View className="h-px bg-border mx-4" />}
    </View>
  );
}
