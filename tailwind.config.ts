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
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surfaceRaised: "rgb(var(--color-surface-raised) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        gold: "#C7AE7B",
        rose: "#D46A6A",
        success: "#6EA17D"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
        float: "0 32px 120px rgba(0, 0, 0, 0.45)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-montserrat)", "sans-serif"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 15% 18%, rgba(192,192,192,0.18), transparent 0 26%), radial-gradient(circle at 82% 0%, rgba(112,128,144,0.22), transparent 0 25%), linear-gradient(180deg, #1a1a1a 0%, #131517 48%, #0d0f11 100%)",
        "steel-noise":
          "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), linear-gradient(180deg, rgba(112,128,144,0.16), rgba(0,0,0,0))"
      }
    }
  },
  plugins: []
};

export default config;
