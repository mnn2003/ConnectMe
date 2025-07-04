/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        connectme: {
          primary: '#25D366',
          secondary: '#128C7E',
          tertiary: '#075E54',
          light: '#DCF8C6',
          dark: '#343A40'
        }
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': {
            transform: 'scale(0.33)',
          },
          '40%, 50%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(1.03)',
          },
        },
      },
    },
  },
  plugins: [],
};