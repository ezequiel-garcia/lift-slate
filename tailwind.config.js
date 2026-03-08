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
        bg: "#0C0C0C",
        surface: "#181818",
        surface2: "#222222",
        border: "#2A2A2A",
        foreground: "#F0F0F0",
        muted: "#5A5A5A",
        accent: "#AAFF45",
        error: "#FF5555",
      },
    },
  },
  plugins: [],
};
