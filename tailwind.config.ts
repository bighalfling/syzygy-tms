import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F3D2E",
          hover: "#0B2E22",
          active: "#082118",
        },
      },
    },
  },
  plugins: [],
};

export default config;
