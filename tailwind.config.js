/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Tremor module
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pjs)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
        cal: ['"Cal Sans"', 'sans-serif'],
        gnomon: ['var(--font-gnomon)', 'sans-serif'],
      },
      colors: {
        aegis: {
          DEFAULT: '#07906C',
          50: '#e6f7f2',
          100: '#b3e6d5',
          200: '#80d5b8',
          300: '#4dc49b',
          400: '#1ab37e',
          500: '#07906C',
          600: '#067a5c',
          700: '#05644b',
          800: '#044e3b',
          900: '#03382a',
        },
      },
    },
  },
  plugins: [],
};