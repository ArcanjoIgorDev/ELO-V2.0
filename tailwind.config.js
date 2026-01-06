/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  extend: {
    fontFamily: {
      "display": ["Manrope", "sans-serif"],
      "sans": ["Manrope", "sans-serif"],
    },
    colors: {
      "primary": "#0da2e7",
      "primary-glow": "#0da2e7",
      "background-light": "#f5f7f8",
      "background-dark": "#020617",
      "glass-surface": "rgba(30, 41, 59, 0.4)",
      "glass-border": "rgba(255, 255, 255, 0.1)",
      "ocean-depth": "#0f172a",
      "midnight": {
        950: "#020617",
        900: "#0f172a",
        800: "#1e293b"
      },
      "ocean": {
        DEFAULT: "#0da2e7",
        500: "#0da2e7",
        600: "#0284c7"
      }
    },
    borderRadius: {
      "lg": "1rem",
      "xl": "1.5rem",
      "2xl": "2rem",
    },
    backgroundImage: {
      'ocean-gradient': 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0) 50%), radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0) 50%)',
    },
    animation: {
      'glow': 'glow 3s infinite ease-in-out',
      'fade-in': 'fadeIn 0.5s ease-out',
      'slide-up': 'slideUp 0.5s ease-out'
    },
    keyframes: {
      glow: {
        '0%, 100%': { boxShadow: '0 0 5px rgba(13, 162, 231, 0.1)' },
        '50%': { boxShadow: '0 0 15px rgba(13, 162, 231, 0.3)' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      }
    },
    spacing: {
      'safe': 'env(safe-area-inset-bottom)',
      'top-safe': 'env(safe-area-inset-top)',
    }
  },
},
plugins: [],
}
