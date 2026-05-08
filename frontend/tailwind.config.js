/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#050508',
        surface: '#0d0d14',
        'surface-alt': '#111118',
        elevated: '#16161f',
        accent: '#00FF88',
        'accent-dim': '#00cc6a',
        danger: '#ff3366',
        warning: '#ffaa00',
        info: '#00aaff',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        label: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
      },
    },
  },
  plugins: [],
};
