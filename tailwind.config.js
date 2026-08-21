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
        placetech: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a8a',
        },
        placciano: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        }
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [{
      placetech: {
        "primary": "#2563eb",
        "primary-content": "#ffffff",
        "secondary": "#06b6d4",
        "accent": "#7c3aed",
        "neutral": "#0f172a",
        "base-100": "#f8fafc",
        "success": "#10b981",
        "warning": "#f59e0b",
        "error": "#ef4444",
      }
    }],
  },
}