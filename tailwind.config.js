/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        cols: "900px",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-in",
      },
      colors: {
        surface: "#fef2d7",
        panel: "#fffdf8",
        header: "#580b46",
        accent: "#fe9c00",
        ink: "#2a1a24",
        mid: "#7a6a5c",
        hairline: "#e8dcc0",
        verdict: {
          pass: "#1F7A50",
          low: "#B03028",
          blurry: "#A66A00",
          flag: "#6B3FA0",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
