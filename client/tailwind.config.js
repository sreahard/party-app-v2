/** @type {import('tailwindcss').Config} */
/** Brand colors = CSS variables from `src/styles/theme.css` (:root). */

const withAlpha = (token) => `hsl(var(${token}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          ocean: withAlpha('--color-brand-ocean'),
          'ocean-soft': withAlpha('--color-brand-ocean-soft'),
          sea: withAlpha('--color-brand-sea'),
          'sea-mist': withAlpha('--color-brand-sea-mist'),
          mist: withAlpha('--color-brand-mist'),
          sand: withAlpha('--color-brand-sand'),
          shell: withAlpha('--color-brand-shell'),
          ink: withAlpha('--color-brand-ink'),
          subtle: withAlpha('--color-brand-subtle'),
          muted: withAlpha('--color-brand-muted'),
          coral: withAlpha('--color-brand-coral'),
          'coral-deep': withAlpha('--color-brand-coral-deep'),
          'coral-wash': withAlpha('--color-brand-coral-wash'),
          gold: withAlpha('--color-brand-gold'),
          'gold-light': withAlpha('--color-brand-gold-light'),
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
