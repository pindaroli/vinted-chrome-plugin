/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vinted: {
          DEFAULT: '#09b1ba',
          dark: '#019299',
          light: '#e0f7f8',
        }
      }
    },
  },
  plugins: [],
};
