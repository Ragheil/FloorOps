/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f5f5f5",
        panel: "#ffffff",
        ink: "#0f0f10",
        accent: "#d92d20",
        accentSoft: "#fff0ee",
      },
      boxShadow: {
        panel: "0 20px 40px rgba(15, 15, 16, 0.06)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(to right, rgba(15,15,16,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,15,16,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "hero-grid": "32px 32px",
      },
    },
  },
  plugins: [],
};
