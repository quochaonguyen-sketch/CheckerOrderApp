import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warehouse: {
          ink: "#152017",
          paper: "#f6f3ea",
          line: "#d8d1c2",
          green: "#16803c",
          red: "#b3261e",
          yellow: "#f6c343",
        },
      },
      boxShadow: {
        card: "0 24px 70px rgba(21, 32, 23, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
