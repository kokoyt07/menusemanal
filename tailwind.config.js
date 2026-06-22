/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Brand: warm dark brown from logo text/outlines
        brand: {
          DEFAULT: '#2F1D1B',
          50:  '#FBF6F5',
          100: '#F3E7E4',
          200: '#E5CECA',
          300: '#CEA9A3',
          400: '#B38179',
          500: '#8E5D57',
          600: '#6B4440',
          700: '#4E302D',
          800: '#3D2421',
          900: '#2F1D1B',
        },
        // Cream: warm neutrals for backgrounds and surfaces
        cream: {
          50:  '#F8F6F3',
          100: '#EDE9E3',
          200: '#DDD7CF',
          300: '#C8C0B5',
          400: '#AFA59A',
          500: '#928880',
          600: '#726860',
          700: '#564C44',
          800: '#3A3229',
          900: '#1E1914',
        },
      },
      boxShadow: {
        'warm-xs': '0 1px 2px rgba(47,29,27,0.06)',
        'warm-sm': '0 2px 6px rgba(47,29,27,0.08), 0 1px 2px rgba(47,29,27,0.04)',
        'warm':    '0 4px 12px rgba(47,29,27,0.10), 0 2px 4px rgba(47,29,27,0.05)',
        'warm-lg': '0 12px 28px rgba(47,29,27,0.12), 0 4px 8px rgba(47,29,27,0.06)',
      },
    },
  },
  plugins: [],
}
