import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      beige: "#E4DECF",
      black: "#1A1A1A",
      white: "#FFFFFF",
      primary: "#C8453B",
      primarydark: "#902F2F",
      grey: "#726F68",
      success: "#aaffa8",
      error: "#ffa8a8",

      transparent: "transparent",
    },
    container: {
      padding: "1rem",
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
    fontFamily: {
      bozo: ["__bozoFont_266f07"],
    },
  },
  plugins: [],
};
export default config;
