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
          50:  '#F3F6F5',
          100: '#8FC4BE',
          200: '#5FA39D',
          300: '#5FA39D',
          400: '#1F6E68',
          500: '#134E4A',
          600: '#134E4A',
          700: '#134E4A',
        },
        ink: {
          900: '#134E4A',
          800: '#0F3D3A',
          700: '#1A5C57',
          600: '#3E5C58',
          500: '#4A5C5A',
          400: '#3D7570',
          300: '#A8C4BF',
          200: '#D6E6E3',
          100: '#E8F1EF',
          50:  '#F3F6F5',
          0:   '#ffffff',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
        warn:    { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 500: '#ef4444' },
        accent:  { 50: '#F7E9EA', 500: '#C97B84', 600: '#B26670' },
        sidebar: '#134E4A',
      },
    },
  },
  plugins: [],
}
