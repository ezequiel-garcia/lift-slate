import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/login"} />;
}
