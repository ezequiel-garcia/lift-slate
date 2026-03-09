/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        surface: "#151518",
        surface2: "#1F1F23",
        border: "#2A2A2E",
        foreground: "#FAFAFA",
        muted: "#71717A",
        accent: "#B4FF4A",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};
