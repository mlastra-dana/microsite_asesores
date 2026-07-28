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
          orange: '#F78E1E',
          blue: '#7C3AED',
          sky: '#009FDA',
          ink: '#101828',
          muted: '#475467',
          cloud: '#F4F7FB',
        },
        demo: {
          blue: '#7C3AED',
          blueDark: '#5B21B6',
          sky: '#A78BFA',
          navy: '#2E1065',
          bluePale: '#F1ECFF',
          slate: '#344054',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(91, 33, 182, 0.12)',
      },
    },
  },
  plugins: [],
};
