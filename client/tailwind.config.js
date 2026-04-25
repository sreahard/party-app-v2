/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink:        '#e91e8c',
          'pink-dark': '#c01575',
          'pink-light':'#fce4f3',
          purple:      '#7b2d8b',
          gold:        '#f5a623',
        },
      },
      animation: {
        float:      'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
