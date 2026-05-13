import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format as dateFnsFormat } from "date-fns";
import type { Locale } from "date-fns";
import { es as esLocale } from "date-fns/locale/es";

import en from "@/locales/en.json";
import es from "@/locales/es.json";

export const SUPPORTED_LANGUAGES = ["en", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DATE_FNS_LOCALES: Partial<Record<SupportedLanguage, Locale>> = {
  es: esLocale,
};

export function exerciseNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function formatDate(
  date: Date,
  formatStr: string,
  locale?: Locale,
): string {
  const result = dateFnsFormat(date, formatStr, { locale });
  return result.charAt(0).toUpperCase() + result.slice(1);
}
const LANGUAGE_KEY = "LIFTSLATE_LANGUAGE";

function resolveInitialLanguage(): SupportedLanguage {
  const device = getLocales()[0]?.languageCode ?? "en";
  return SUPPORTED_LANGUAGES.includes(device as SupportedLanguage)
    ? (device as SupportedLanguage)
    : "en";
}

export async function loadSavedLanguage(): Promise<SupportedLanguage> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
    return saved as SupportedLanguage;
  }
  const device = getLocales()[0]?.languageCode ?? "en";
  return SUPPORTED_LANGUAGES.includes(device as SupportedLanguage)
    ? (device as SupportedLanguage)
    : "en";
}

export async function saveLanguage(lang: SupportedLanguage) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
