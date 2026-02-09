/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0F0F0F",
        surface: "#1A1A1A",
        border: "#2A2A2A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A0A0A0",
      },
    },
  },
  plugins: [],
};
