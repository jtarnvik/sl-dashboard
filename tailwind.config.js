/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        signage: ['Bitter', 'serif'],
        sans: ['Roboto', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [
  ],
}
