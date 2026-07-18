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
          50:  '#F7F8FA',
          100: '#B8BABD',
          200: '#8B8E92',
          300: '#8B8E92',
          400: '#2563C7',
          500: '#0047AB',
          600: '#0047AB',
          700: '#0047AB',
        },
        ink: {
          900: '#0047AB',
          800: '#003D91',
          700: '#1B5FA8',
          600: '#3E5C58',
          500: '#4A5C5A',
          400: '#6E7276',
          300: '#AAAFB4',
          200: '#D5D7DA',
          100: '#EEF0F2',
          50:  '#F7F8FA',
          0:   '#ffffff',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e', 700: '#15803d' },
        warn:    { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
        danger:  { 50: '#fef2f2', 500: '#ef4444' },
        accent:  { 50: '#EDEEF0', 500: '#26282B', 600: '#1A1C1E' },
        sidebar: '#0047AB',
      },
    },
  },
  plugins: [],
}
