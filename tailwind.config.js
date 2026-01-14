/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d8ff",
          300: "#a4bdff",
          400: "#8199ff",
          500: "#5e75ff",
          600: "#3b4bd8",
          700: "#2d3aa3",
          800: "#1f2970",
          900: "#141b4a",
        },
      },
      fontFamily: {
        sans: ["Lora", "Georgia", "serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
    },
  },
  plugins: [],
};
