import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "My Lifts" }} />
    </Tabs>
  );
}
