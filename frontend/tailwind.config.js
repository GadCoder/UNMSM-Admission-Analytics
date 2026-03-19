/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8f5658',
        primaryDark: '#6f4043',
        primaryLight: '#b97b7d',
        background: '#faf8f7',
        surface: '#ffffff',
        textPrimary: '#2d2223',
        textSecondary: '#6e5e5f',
        success: '#2e8b57',
        warning: '#c58a2b',
        danger: '#c54b4b',
      },
      borderRadius: {
        DEFAULT: '12px',
        card: '12px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
