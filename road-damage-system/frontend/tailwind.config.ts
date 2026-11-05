import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kerala Road System brand palette
        brand: {
          red: "#ef4444",       // Active damage
          yellow: "#f59e0b",    // Under maintenance
          green: "#10b981",     // Recently resolved (emerald)
          dark: "#0f172a",      // Background (slate-900)
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

export default config;

