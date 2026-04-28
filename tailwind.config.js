/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0C",
        surface: "#161619",
        surface2: "#1F1F23",
        hairline: "#1B1812",
        border: "#2E2E33",
        "border-l": "#3A3528",
        foreground: "#F0F0F0",
        muted: "#71717A",
        muted2: "#766B57",
        muted3: "#52483A",
        accent: "#B4FF4A",
        copper: "#C88B5C",
        "accent-muted": "rgba(180,255,74,0.12)",
        error: "#EF4444",
        success: "#22C55E",
        warning: "#F59E0B",
      },
      fontSize: {
        display: ["40px", { lineHeight: "44px", fontWeight: "800" }],
        title: ["28px", { lineHeight: "32px", fontWeight: "700" }],
        heading: ["20px", { lineHeight: "26px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        subtext: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        label: ["12px", { lineHeight: "12px", fontWeight: "600" }],
        tiny: ["11px", { lineHeight: "11px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
