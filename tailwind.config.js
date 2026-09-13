/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1F1C",
        paper: "#F5F3EC",
        teal: {
          50: "#EAF4F1",
          100: "#CFE6DF",
          400: "#2E8B7C",
          500: "#0F6E63",
          600: "#0B5750",
          700: "#08423D",
        },
        amber: {
          400: "#E8A33D",
          500: "#D98D22",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
