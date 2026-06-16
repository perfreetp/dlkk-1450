/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#E3F2FD",
          100: "#BBDEFB",
          200: "#90CAF9",
          300: "#64B5F6",
          400: "#42A5F5",
          500: "#1E88E5",
          600: "#1976D2",
          700: "#1565C0",
          800: "#0D47A1",
          900: "#0D47A1",
        },
        danger: {
          50: "#FFEBEE",
          100: "#FFCDD2",
          500: "#E53935",
          600: "#D32F2F",
          700: "#C62828",
        },
        warning: {
          50: "#FFF3E0",
          100: "#FFE0B2",
          500: "#FB8C00",
          600: "#F57C00",
        },
        success: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          500: "#43A047",
          600: "#388E3C",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#78909C",
          700: "#607D8B",
          800: "#455A64",
          900: "#263238",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"Roboto Mono"', '"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'breath': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(30, 136, 229, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(30, 136, 229, 0)' },
        },
        'pulse-red': {
          '0%, 100%': { backgroundColor: 'rgba(229, 57, 53, 0.1)' },
          '50%': { backgroundColor: 'rgba(229, 57, 53, 0.25)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'breath': 'breath 2s ease-in-out infinite',
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
