import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        slate: "#475467",
        mist: "#F2F4F7",
        canvas: "#FCFCFD",
        accent: "#0F766E",
        accentSoft: "#CCFBF1",
        gold: "#F59E0B",
        rose: "#E11D48"
      },
      boxShadow: {
        panel: "0 20px 45px rgba(16, 24, 40, 0.08)",
        float: "0 18px 40px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "ui-sans-serif", "system-ui"],
        display: ["Trebuchet MS", "Avenir Next", "ui-sans-serif", "system-ui"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 40%), radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 35%), linear-gradient(180deg, rgba(255,255,255,1), rgba(242,244,247,1))"
      }
    }
  },
  plugins: []
};

export default config;
