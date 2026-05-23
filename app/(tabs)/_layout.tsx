import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMyGym } from "@/services/gym.service";
import { useTranslation } from "react-i18next";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IoniconName, focused: boolean) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={22}
      color={focused ? colors.accent : colors.muted}
    />
  );
}

const TAB_BAR_TOP_PAD = 10;
const TAB_BAR_CONTENT_HEIGHT = 48;

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(bottomInset, 8);
  const tabBarHeight =
    TAB_BAR_TOP_PAD + TAB_BAR_CONTENT_HEIGHT + tabBarPaddingBottom;

  useEffect(() => {
    if (!session) return;
    queryClient.prefetchQuery({ queryKey: ["gym", "mine"], queryFn: getMyGym });
  }, [session, queryClient]);

  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: TAB_BAR_TOP_PAD,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.my_lifts"),
          tabBarIcon: ({ focused }) => tabIcon("barbell", focused),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: t("tabs.calculator"),
          tabBarIcon: ({ focused }) => tabIcon("calculator", focused),
        }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: t("tabs.gym"),
          tabBarIcon: ({ focused }) => tabIcon("fitness", focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused }) => tabIcon("person", focused),
        }}
      />
    </Tabs>
  );
}
