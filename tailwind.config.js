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
          50:  '#FFFFFF',
          100: '#C4C4C4',
          200: '#8A8A8A',
          300: '#8A8A8A',
          400: '#2A2A2A',
          500: '#111111',
          600: '#111111',
          700: '#111111',
        },
        ink: {
          900: '#111111',
          800: '#000000',
          700: '#2A2A2A',
          600: '#3E5C58',
          500: '#4A5C5A',
          400: '#5A5A5A',
          300: '#C4C4C4',
          200: '#EBEBEB',
          100: '#F3F3F3',
          50:  '#FFFFFF',
          0:   '#ffffff',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
        warn:    { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 500: '#ef4444' },
        accent:  { 50: '#FBE5E5', 500: '#2A2A2A', 600: '#24421F' },
        sidebar: '#111111',
      },
    },
  },
  plugins: [],
}
