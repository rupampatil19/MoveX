/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        movex: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        card: '1rem',
        hero: '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        elevated: '0 4px 12px rgba(37,99,235,0.08)',
        hero: '0 8px 24px rgba(37,99,235,0.15)',
      },
      maxWidth: {
        page: '80rem',
      },
    },
  },
  plugins: [],
}