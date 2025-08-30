/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e1e9fe",
          200: "#c3d3fe",
          300: "#a5b4fc",
          400: "#8b95fa",
          500: "#667eea",
          600: "#5a67d8",
          700: "#4c51bf",
          800: "#434190",
          900: "#3a3768",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
          800: "#6b21a8",
          900: "#581c87",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s infinite",
        "bounce-slow": "bounce 2s infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(102, 126, 234, 0.3)",
        "glow-lg": "0 0 40px rgba(102, 126, 234, 0.4)",
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)",
      },
      backdropBlur: {
        "4xl": "72px",
      },
      screens: {
        xs: "475px",
        "3xl": "1920px",
      },
      gridTemplateColumns: {
        "auto-fit": "repeat(auto-fit, minmax(280px, 1fr))",
        "auto-fill": "repeat(auto-fill, minmax(280px, 1fr))",
      },
      aspectRatio: {
        product: "4/3",
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        },
        ".text-shadow-lg": {
          textShadow: "4px 4px 8px rgba(0,0,0,0.2)",
        },
        ".backdrop-blur-safari": {
          "-webkit-backdrop-filter": "blur(10px)",
          "backdrop-filter": "blur(10px)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
  // Dark mode configuration
  darkMode: "class",
};
