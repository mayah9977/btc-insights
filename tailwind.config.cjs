/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(16,185,129,0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(16,185,129,0.8)' },
        },
      },
      animation: {
        glow: 'glow 1.5s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}
