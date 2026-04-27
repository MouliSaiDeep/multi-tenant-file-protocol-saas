import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#0f172a",
        slateCard: "#1e293b",
        slateBorder: "#334155",
        cyanAccent: "#06b6d4",
        emeraldAccent: "#10b981",
        roseAccent: "#f43f5e",
        goldAccent: "#fbbf24",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(6,182,212,0.45), 0 0 28px rgba(6,182,212,0.2)",
        card: "0 20px 45px rgba(2, 6, 23, 0.5)",
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        fadeUp: "fadeUp 0.45s ease-out both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-18px) translateX(8px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
