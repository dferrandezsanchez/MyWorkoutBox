import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ED702D',
          hover: '#D96424',
          soft: '#F29A6A',
        },
        text: {
          primary: '#808080',
          secondary: '#A6A6A6',
          muted: '#C7C7C7',
        },
        background: '#FFFFFF',
        surface: '#F5F5F5',
        border: '#DDDDDD',
      },
    },
  },
  plugins: [],
};

export default config;
