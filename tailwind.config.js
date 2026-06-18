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
          blue: '#00478D',
          sky: '#009FDA',
          ink: '#101828',
          muted: '#475467',
          cloud: '#F4F7FB',
        },
        mercantil: {
          blue: '#00478D',
          blueDark: '#00376E',
          sky: '#009FDA',
          navy: '#002B55',
          bluePale: '#E6EDF5',
          slate: '#344054',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(0, 43, 85, 0.12)',
      },
    },
  },
  plugins: [],
};
