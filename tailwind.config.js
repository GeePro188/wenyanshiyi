/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        ink: '#1A1A1A',
        'ink-light': '#595959',
        'ink-fade': '#A6A6A6',
        cinnabar: '#C94A4A',
        indigo: '#3A5F8A',
        bamboo: '#5B8C5A',
        amber: '#D98C2E',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'SimSun', 'Songti SC', 'serif'],
        sans: ['"Noto Sans SC"', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
