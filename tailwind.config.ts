import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MotoSafe brand colors
        primary: {
          50:  '#e8f0fe',
          100: '#c5d8fc',
          200: '#9dbefa',
          300: '#74a4f7',
          400: '#5490f5',
          500: '#1a56db', // main blue
          600: '#1546c2',
          700: '#0f35a3',
          800: '#0a2585',
          900: '#05185e',
          950: '#020e3d',
        },
        dark: {
          50:  '#f2f2f2',
          100: '#d9d9d9',
          200: '#b3b3b3',
          300: '#8c8c8c',
          400: '#666666',
          500: '#404040',
          600: '#333333',
          700: '#262626',
          800: '#1a1a1a', // main dark
          900: '#0d0d0d',
          950: '#050505',
        },
        accent: {
          50:  '#e6faf0',
          100: '#bbf3d6',
          200: '#86e9b6',
          300: '#4ddd93',
          400: '#1fd375',
          500: '#16a34a', // main green
          600: '#128a3e',
          700: '#0d7033',
          800: '#085727',
          900: '#043d1b',
          950: '#022410',
        },
        emergency: {
          red: '#dc2626',
          orange: '#ea580c',
          yellow: '#ca8a04',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #020e3d 0%, #0f35a3 50%, #05185e 100%)',
        'card-gradient': 'linear-gradient(145deg, #1a1a1a 0%, #262626 100%)',
        'emergency-gradient': 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
        'green-gradient': 'linear-gradient(135deg, #043d1b 0%, #16a34a 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(26, 86, 219, 0.4)',
        'glow-green': '0 0 20px rgba(22, 163, 74, 0.4)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config
