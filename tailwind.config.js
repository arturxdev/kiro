/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat_400Regular"],
      },
      colors: {
        background: "#1A1A1A",
        surface: "#2D2D2D",
        border: "#3A3A3A",
        "text-primary": "#F5F5F5",
        "text-secondary": "#8A8A8A",
      },
    },
  },
  plugins: [],
};
