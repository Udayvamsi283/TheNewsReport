/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: {
          light: '#F8F8F6', // Warm off-white editorial page background
        },
        navy: {
          950: '#070D17', // Dark mode background
          900: '#0B1F3A', // Primary Deep Navy
          850: '#0D1726', // Dark mode surface
          800: '#132B4F', // Secondary Navy
          750: '#111E31', // Dark mode card
          700: '#1E293B', // Dark mode border
        },
        editorial: {
          red: '#C2413B',       // Warm Red Accent
          'red-hover': '#A93631', // Warm Red Hover
          'red-dark': '#E0524A',  // Dark Mode Warm Red
          'red-subtle': '#FDF2F2',
        },
        primary: {
          50: '#FDF2F2',
          100: '#FCE7E7',
          200: '#F8C8C6',
          300: '#F29F9C',
          400: '#E0524A',
          500: '#D3443E',
          600: '#C2413B', // Primary brand warm red
          700: '#A93631',
          800: '#8E2C28',
          900: '#0B1F3A', // Deep navy
          950: '#070D17',
        },
        slate: {
          50: '#F8F8F6',  // Warm off-white Light Mode Background
          100: '#F1F3F5',
          200: '#E2E8F0', // Light Mode Border
          300: '#CBD5E1',
          400: '#94A3B8', // Dark Secondary Text
          500: '#64748B', // Light Secondary Text
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0B1F3A', // Light Primary Text (Deep Navy)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      screens: {
        'xs': '360px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
}
