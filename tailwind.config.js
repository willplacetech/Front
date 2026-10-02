import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        line: 'var(--border)',
        placetech: { 50: '#141416', 100: '#1C1C20', 500: '#F5A524', 600: '#FFB93E', 700: '#D98C0E', 900: '#0A0A0B' },
        placciano: { 400: '#FFB93E', 500: '#F5A524', 600: '#D98C0E' }
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [{
      placetech: {
        'primary': '#F5A524', 'primary-content': '#0A0A0B',
        'secondary': '#1C1C20', 'secondary-content': '#F5F5F4',
        'accent': '#F5A524', 'accent-content': '#0A0A0B',
        'neutral': '#1C1C20', 'neutral-content': '#F5F5F4',
        'base-100': '#0A0A0B', 'base-200': '#141416', 'base-300': '#1C1C20', 'base-content': '#F5F5F4',
        'success': '#22C55E', 'warning': '#F5A524', 'error': '#A1A1AA', 'info': '#A1A1AA',
        '--rounded-btn': '999px', '--rounded-box': '1rem'

      }
    }],
  },
}