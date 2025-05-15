/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  "#0073e6",   // 健保藍
        accent:   "#19a974",   // 疾管綠
        surface:  "#f8fafc",
      },
      fontFamily: {
        heading: ["'Poppins'", "sans-serif"],
        body:    ["'Noto Sans TC'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
