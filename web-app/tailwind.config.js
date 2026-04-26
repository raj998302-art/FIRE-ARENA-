/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        neon: {
          blue: '#00f3ff',
          purple: '#bf00ff',
          pink: '#ff00ff',
          cyan: '#00ffff',
          green: '#00ff00'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'neon-blue': '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #1d4ed8, 0 0 40px #1e40af',
        'neon-purple': '0 0 5px #8b5cf6, 0 0 10px #8b5cf6, 0 0 20px #8b5cf6, 0 0 30px #7c3aed, 0 0 40px #6d28d9',
        'neon-pink': '0 0 5px #ec4899, 0 0 10px #ec4899, 0 0 20px #ec4899, 0 0 30px #db2777, 0 0 40px #be185d',
      }
    },
    animation: {
      'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      'neon-blink': 'neon-blink 1s step-end infinite',
    },
    keyframes: {
      'neon-pulse': {
        '0%, 100%': {
          boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #1d4ed8, 0 0 40px #1e40af'
        },
        '50%': {
          boxShadow: '0 0 8px #3b82f6, 0 0 15px #3b82f6, 0 0 25px #3b82f6, 0 0 35px #1d4ed8, 0 0 45px #1e40af'
        }
      },
      'neon-blink': {
        '0%, 50%': {
          opacity: '1'
        },
        '51%, 100%': {
          opacity: '0'
        }
      }
    }
  },
  plugins: [],
}
