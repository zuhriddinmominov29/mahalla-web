/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8edf5',
          100: '#c5d0e6',
          200: '#9eb0d5',
          300: '#7690c4',
          400: '#5878b8',
          500: '#1E3A6E',
          600: '#0D2B5C',
          700: '#091D42',
          800: '#061429',
          900: '#030a14',
        },
        gold: {
          400: '#E8BF50',
          500: '#C9A227',
          600: '#A07D1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
