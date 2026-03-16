import "../global.css";
import { View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";
import { Toast } from "@/components/ui/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — prevents background refetch on every navigation
      gcTime: 1000 * 60 * 60 * 24, // 24h — must be >= persister maxAge
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "LIFTSLATE_QUERY_CACHE",
  throttleTime: 1000,
  serialize: (client) => {
    // Filter out queries with null/undefined data before persisting
    const filtered = {
      ...client,
      clientState: {
        ...client.clientState,
        queries: client.clientState.queries.filter((q) => q.state.data != null),
      },
    };
    return JSON.stringify(filtered);
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: "v1" }}>
          <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
            <Toast />
          </View>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
