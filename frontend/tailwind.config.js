/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "rgb(var(--brand-950) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)"
        },
        accent: {
          600: "rgb(var(--accent-600) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)"
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          strong: "rgb(var(--surface-strong) / <alpha-value>)"
        },
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        status: {
          success: "rgb(var(--status-success) / <alpha-value>)",
          warning: "rgb(var(--status-warning) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
          danger: "rgb(var(--status-danger) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "\"Space Grotesk\"", "\"Segoe UI\"", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 28px -16px rgba(15, 23, 42, 0.35)",
        glow: "0 10px 30px -10px rgba(8, 145, 178, 0.45)"
      }
    }
  },
  plugins: []
};
