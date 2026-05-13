import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FaqAccordionItem } from "@/components/faq/FaqAccordionItem";
import { colors } from "@/lib/theme";

type FaqCategoryKey =
  | "getting_started"
  | "calculator"
  | "gym_coaches"
  | "account";

const FAQ_CATEGORIES: {
  key: FaqCategoryKey;
  icon: string;
  items: string[];
}[] = [
  {
    key: "getting_started",
    icon: "rocket-outline",
    items: ["q1", "q2", "q3"],
  },
  {
    key: "calculator",
    icon: "calculator-outline",
    items: ["q1", "q2"],
  },
  {
    key: "gym_coaches",
    icon: "fitness-outline",
    items: ["q1", "q2", "q3", "q4", "q5"],
  },
  {
    key: "account",
    icon: "shield-checkmark-outline",
    items: ["q1", "q2", "q3"],
  },
];

export default function FaqScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "",
          headerShown: true,
          headerTransparent: true,
          headerBackTitle: t("faq.back_title"),
          headerTintColor: colors.accent,
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-14 pb-1">
          <Text
            style={{
              fontFamily: "CormorantGaramond-Regular",
              fontSize: 56,
              lineHeight: 58,
              color: colors.foreground,
              letterSpacing: -1,
            }}
          >
            {t("faq.title")}
          </Text>
          <Text className="text-muted text-[14px] mt-1">
            {t("faq.subtitle")}
          </Text>
        </View>

        {FAQ_CATEGORIES.map((category) => (
          <View key={category.key}>
            <SectionHeader
              title={t(`faq.${category.key}.title`)}
              icon={category.icon as any}
            />
            <Card className="mx-5">
              {category.items.map((itemKey, index) => (
                <FaqAccordionItem
                  key={itemKey}
                  question={t(`faq.${category.key}.${itemKey}_q`)}
                  answer={t(`faq.${category.key}.${itemKey}_a`)}
                  isLast={index === category.items.length - 1}
                />
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
