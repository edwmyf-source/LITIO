/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#F2F7FF',
          100: '#A7D8FF',
          200: '#7EB6FF',
          300: '#7EB6FF',
          400: '#2F80ED',
          500: '#2F80ED',
          600: '#2F80ED',
          700: '#0047AB',
        },
        ink: {
          900: '#0047AB',
          500: '#5c6376',
          400: '#7EB6FF',
          300: '#A7D8FF',
          200: '#F2F7FF',
          100: '#F2F7FF',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
        warn:    { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 500: '#ef4444' },
        accent:  { 50: '#FFF6E0', 500: '#FFB703', 600: '#E6A200' },
        sidebar: '#0047AB',
      },
    },
  },
  plugins: [],
}
