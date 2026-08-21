/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#EEF1FB',
          100: '#D8DEF3',
          200: '#B1BDE7',
          300: '#8A9BDB',
          400: '#5D6FC0',
          500: '#33409A',
          600: '#232F78',
          700: '#182459',
          800: '#111A45',
          900: '#0B1330',
          950: '#070C1E',
        },
        teal: {
          50: '#ECFDFB',
          100: '#CFFAF4',
          200: '#9FF3E8',
          300: '#63E4D5',
          400: '#2FCBBC',
          500: '#14B0A2',
          600: '#0E8E83',
          700: '#0C716A',
          800: '#0C5B56',
          900: '#0B4B48',
        },
        gold: {
          400: '#F2C572',
          500: '#E5AC3D',
          600: '#C98B24',
        },
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(11, 19, 48, 0.08), 0 8px 24px -8px rgba(11, 19, 48, 0.10)',
        card: '0 1px 2px rgba(11,19,48,0.04), 0 12px 32px -12px rgba(11,19,48,0.14)',
        glow: '0 0 0 1px rgba(20,176,162,0.15), 0 8px 30px -8px rgba(20,176,162,0.35)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0B1330 0%, #111A45 55%, #182459 100%)',
        'brand-gradient': 'linear-gradient(135deg, #14B0A2 0%, #33409A 100%)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
