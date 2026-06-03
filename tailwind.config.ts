import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        surface: "#FFFFFF",
        background: "#F8FAFC",
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        status: {
          success: {
            DEFAULT: "#16A34A",
            bg: "#F0FDF4",
            text: "#15803D",
          },
          warning: {
            DEFAULT: "#D97706",
            bg: "#FFFBEB",
            text: "#B45309",
          },
          danger: {
            DEFAULT: "#DC2626",
            bg: "#FEF2F2",
            text: "#B91C1C",
          },
          info: {
            DEFAULT: "#0891B2",
            bg: "#F0F9FF",
            text: "#0E7490",
          },
        },
        role: {
          admin: "#2563EB",
          teacher: "#7C3AED",
          student: "#0891B2",
          parent: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.5px" }],
        sm: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        base: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        md: ["15px", { lineHeight: "22px", fontWeight: "500" }],
        lg: ["18px", { lineHeight: "24px", fontWeight: "600" }],
        xl: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "2xl": ["28px", { lineHeight: "36px", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.12)",
        dropdown: "0 4px 16px rgba(0,0,0,0.08)",
      },
      spacing: {
        "sidebar-expanded": "240px",
        "sidebar-collapsed": "72px",
        "content-pad": "24px",
        "card-pad": "20px",
      },
      maxWidth: {
        content: "1280px",
      }
    },
  },
  plugins: [],
};

export default config;
