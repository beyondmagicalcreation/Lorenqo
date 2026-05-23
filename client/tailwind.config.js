/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D1117',
        surface: '#161B22',
        surface2: '#1C2128',
        accent: '#a855f7',
        'msg-own': '#a855f7',
        'msg-other': '#1F3A5F',
        foreground: '#E6EDF3',
        muted: 'rgba(230,237,243,0.4)',
        online: '#3FB950',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
