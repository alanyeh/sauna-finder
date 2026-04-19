/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Koriboshi Neutrals */
        cream: '#FAFAF8',
        charcoal: '#1A1A18',
        'charcoal-800': '#2E2E2B',
        'charcoal-700': '#4A4A47',
        'warm-gray': '#6B6B67',
        'warm-gray-400': '#A8A89E',
        'stone-50': '#F5F5F0',
        'stone-100': '#EBEBЕ4',
        'stone-300': '#C8C8BE',
        'light-border': '#E8E8E2',
        'hover-bg': '#F5F5F0',
        white: '#FFFFFF',

        /* Koriboshi Product Colorways */
        'terracotta': '#C47050',
        'terracotta-light': '#D9906E',
        'terracotta-dark': '#A35A3A',
        'slate-gray': '#7A8490',
        'slate-gray-light': '#A3ADB5',
        'slate-gray-dark': '#5A666E',
        'forest-green': '#6B8C5A',
        'forest-green-light': '#8AAD70',
        'forest-green-dark': '#4E6A40',
        'sandstone': '#D4C4A0',
        'sandstone-light': '#E4D8BC',
        'sandstone-dark': '#B8A880',
        'espresso': '#7B4F2E',
        'espresso-light': '#9C6A42',
        'espresso-dark': '#5A3820',

        /* Semantic Colors */
        'accent-red': '#C47050',
        'success': '#4A7A5A',
        'error': '#A84040',
      },
      fontFamily: {
        serif: ['Libre Baskerville', 'serif'],
        sans: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
        'space-12': '48px',
        'space-16': '64px',
        'space-20': '80px',
        'space-24': '96px',
        'space-32': '128px',
        'space-section': '100px',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      boxShadow: {
        'none': 'none',
        'subtle': '0 1px 3px rgba(26,26,24,0.06)',
        'menu': '0 4px 16px rgba(26,26,24,0.10)',
      },
      maxWidth: {
        'content': '740px',
        'product': '1200px',
        'full': '1440px',
      },
    },
  },
  plugins: [],
}
