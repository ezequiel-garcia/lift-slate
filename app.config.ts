import type { ExpoConfig } from "expo/config";

const variant = (process.env.APP_VARIANT ?? "development") as
  | "development"
  | "production";
const isProd = variant === "production";

const name = isProd ? "LiftSlate" : "LiftSlate Dev";
const bundleId = isProd ? "com.iekekel.LiftSlate" : "com.iekekel.LiftSlate.dev";
const scheme = isProd ? "liftslate" : "liftslate.dev";

const config: ExpoConfig = {
  name,
  slug: "liftslate",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
  },
  android: {
    package: bundleId,
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    softwareKeyboardLayoutMode: "pan",
    predictiveBackGestureEnabled: false,
    permissions: [],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#000000",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow LiftSlate to access your photos to set a gym logo.",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        organization: "ezequiel-wa",
        project: "liftslate",
        url: "https://sentry.io/",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "01067df9-46df-43f2-83a1-694e44f71793",
    },
    variant,
  },
  owner: "iekekel",
};

export default config;
