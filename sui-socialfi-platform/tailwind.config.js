/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // If you have a root index.html (common with Vite)
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all .js, .jsx, .ts, .tsx files in src
  ],
  darkMode: 'class', // This was in your App.jsx, so keep it if you want class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
}