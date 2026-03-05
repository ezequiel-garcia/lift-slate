import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.text}>My Lifts</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  text: { fontSize: 24, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.muted },
});
