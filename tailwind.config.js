/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/public/**/*.html",
    "./app/public/**/*.js",
    "./app/public/**/*.ts"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
