/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F3',
        charcoal: '#2A2A2A',
        'warm-gray': '#6B6B6B',
        'accent-red': '#C84545',
        'light-border': '#E8E4DC',
        'hover-bg': '#F5F2EB',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
