import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { 
        brand: { 
          black: "#0B0B0B", 
          green: "#2E7D32", 
          white: "#FFFFFF" 
        } 
      },
      fontFamily: { 
        heebo: ['var(--font-heebo)', 'sans-serif'] 
      }
    }
  },
  plugins: []
};

export default config;