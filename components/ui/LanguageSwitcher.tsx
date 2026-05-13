import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/lib/theme";
import { saveLanguage, type SupportedLanguage } from "@/lib/i18n";
import { ActionSheet } from "@/components/ui/ActionSheet";

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [sheetVisible, setSheetVisible] = useState(false);
  const currentLang = i18n.language as SupportedLanguage;

  async function handleSelect(code: SupportedLanguage) {
    await i18n.changeLanguage(code);
    await saveLanguage(code);
  }

  const options = LANGUAGES.map((lang) => ({
    label: `${lang.code === currentLang ? "✓  " : "    "}${lang.label}`,
    onPress: () => handleSelect(lang.code),
  }));

  return (
    <>
      <Pressable
        onPress={() => setSheetVisible(true)}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-border"
      >
        <Ionicons name="earth-outline" size={13} color={colors.muted} />
        <Text
          className="text-muted font-medium"
          style={{ fontSize: 11, letterSpacing: 0.5 }}
        >
          {currentLang.toUpperCase()}
        </Text>
      </Pressable>

      <ActionSheet
        visible={sheetVisible}
        title={t("language.select")}
        options={[
          ...options,
          { label: t("language.cancel"), onPress: () => {}, cancel: true },
        ]}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}
