/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        dana: {
          orange: '#6D28E0',
          blue: '#4B16B6',
          purple: '#A779FF',
          ink: '#0F0F1F',
          muted: '#3B4255',
          cloud: '#F3EDFF',
        },
        example: {
          violet: '#4B16B6',
          purple: '#6D28E0',
          lilac: '#A779FF',
          navy: '#0F0F1F',
          lavender: '#F3EDFF',
          slate: '#3B4255',
        },
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 15, 31, 0.14)',
      },
    },
  },
  plugins: [],
};
