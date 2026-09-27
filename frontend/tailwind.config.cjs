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
          950: '#0f1e4a',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F7F9FC',
          100: '#EEF2F7',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8',
        },
        gold: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
        ember: { 400: '#FB923C', 500: '#F97316', 600: '#EA580C' },
        mint: { 400: '#34D399', 500: '#10B981', 600: '#059669' },
        violet: { 500: '#8b5cf6', 600: '#7c3aed' },
        indigoAccent: { 500: '#6366f1', 600: '#4f46e5' },
      },
      borderRadius: {
        card: '1rem',
        panel: '1.25rem',
        hero: '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        card: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
        elevated: '0 4px 12px rgba(37,99,235,0.10), 0 1px 3px rgba(15,23,42,0.06)',
        hero: '0 8px 24px rgba(37,99,235,0.18), 0 2px 8px rgba(37,99,235,0.08)',
        glass: '0 8px 24px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
        glow: '0 0 20px rgba(37,99,235,0.25)',
        premium: '0 1px 2px rgba(15,23,42,0.04), 0 6px 16px -4px rgba(15,23,42,0.08), 0 16px 40px -12px rgba(15,23,42,0.06)',
        'premium-lg': '0 1px 3px rgba(15,23,42,0.05), 0 8px 20px -6px rgba(37,99,235,0.12)',
        'inner-hi': 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(15,23,42,0.04)',
      },
      maxWidth: {
        page: '80rem',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '40px',
      },
      backgroundImage: {
        'hero-premium': 'linear-gradient(135deg, #4f46e5 0%, #2563EB 45%, #1e3a8a 100%)',
        'hero-blue': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #1e3a8a 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}