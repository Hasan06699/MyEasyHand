import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#1E88E5',
          'blue-light': '#00AEEF',
          'blue-dark': '#1565C0',
          orange: '#FF8F00',
          'orange-light': '#F9A01B',
          'orange-dark': '#E65100',
          soft: '#F0F7FC',
        },
        myeasyhand: {
          primary: '#1E88E5',
          secondary: '#FF8F00',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(21, 101, 192, 0.08)',
        lift: '0 16px 40px rgba(21, 101, 192, 0.14)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
