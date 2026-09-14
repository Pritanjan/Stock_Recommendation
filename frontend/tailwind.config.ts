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
        background: "#0b0f19",
        card: "#111827",
        cardBorder: "#1f293d",
        bullish: "#10b981",
        bearish: "#ef4444",
        neutral: "#f59e0b",
      },
    },
  },
  plugins: [],
};
export default config;
