import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        trail: {
          bg: "#182420",
          surface: "#20302A",
          surface2: "#283C34",
          border: "#3A4C43",
          borderStrong: "#4A5F55",
          text: "#EFEAD9",
          muted: "#93A89D",
          faint: "#6C8078",
          amber: "#E3A542",
          amberDark: "#B87F27",
          amberText: "#3A2607",
          teal: "#4FB6A0",
          tealDark: "#2E8272",
          tealText: "#08211C",
          locked: "#5B6B63",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
