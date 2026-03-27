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

// Query keys that contain sensitive user data — excluded from AsyncStorage persistence.
// AsyncStorage is unencrypted; auth tokens are in SecureStore instead.
const SENSITIVE_KEY_PREFIXES = ["maxes", "profile", "exercise_note"];
const SENSITIVE_KEY_SEGMENTS = ["members", "subscription"];

function isSensitiveQuery(queryKey: readonly unknown[]): boolean {
  const first = queryKey[0];
  if (typeof first === "string" && SENSITIVE_KEY_PREFIXES.includes(first)) return true;
  return queryKey.some(
    (segment) => typeof segment === "string" && SENSITIVE_KEY_SEGMENTS.includes(segment)
  );
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "LIFTSLATE_QUERY_CACHE",
  throttleTime: 1000,
  serialize: (client) => {
    const filtered = {
      ...client,
      clientState: {
        ...client.clientState,
        queries: client.clientState.queries.filter(
          (q) => q.state.data != null && !isSensitiveQuery(q.queryKey)
        ),
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
