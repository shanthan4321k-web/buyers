/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f2f9f3',
          100: '#e1f2e5',
          200: '#c5e4cd',
          300: '#99cfab',
          400: '#67b382',
          500: '#419660',
          600: '#307a4b',
          700: '#27613d',
          800: '#224e33',
          900: '#1d402b',
          950: '#0e2417',
        },
      },
    },
  },
  plugins: [],
}
