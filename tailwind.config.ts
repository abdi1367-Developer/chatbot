import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        /**
         * پالت برند بر پایه‌ی دو رنگ رسمی:
         *  • سرمه‌ای نفتی  rgb(0, 68, 84)   = #004454
         *  • سبز فیروزه‌ای rgb(70, 178, 152) = #46B298
         */
        brand: {
          50: "#eff8fa",
          100: "#d5edf2",
          200: "#aadbe5",
          300: "#74c1d1",
          400: "#3fa2b7",
          500: "#1a8298",
          600: "#05687e",
          700: "#004454",
          800: "#003843",
          900: "#00292f",
          950: "#001a1e",
        },
        accent: {
          50: "#f0fbf7",
          100: "#d6f5eb",
          200: "#adead7",
          300: "#7bd9be",
          400: "#5cc5a8",
          500: "#46b298",
          600: "#339379",
          700: "#2a7663",
          800: "#265e51",
          900: "#224e44",
          950: "#0f2d27",
        },
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "Tahoma", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 60px -20px rgba(0, 41, 47, 0.4)",
        bubble: "0 2px 10px -4px rgba(0, 68, 84, 0.28)",
        soft: "0 1px 2px rgba(0, 41, 47, 0.06), 0 8px 24px -12px rgba(0, 68, 84, 0.18)",
        lift: "0 12px 36px -14px rgba(0, 68, 84, 0.32)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dot-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.45" },
          "30%": { transform: "translateY(-5px)", opacity: "1" },
        },
        "soft-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "aurora": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.5" },
          "33%": { transform: "translate3d(3%, -3%, 0) scale(1.08)", opacity: "0.75" },
          "66%": { transform: "translate3d(-3%, 2%, 0) scale(1.04)", opacity: "0.6" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "grow-line": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        "pop-in": "pop-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "dot-bounce": "dot-bounce 1.2s infinite ease-in-out",
        "soft-pulse": "soft-pulse 2.6s infinite ease-in-out",
        "float-slow": "float-slow 6s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        shimmer: "shimmer 3.5s linear infinite",
        "grow-line": "grow-line 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
