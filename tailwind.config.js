/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#27AE60",      // Pesa Green
        "primary-dark": "#229954", // Darker shade for hover
        accent: "#F39C12",       // Hustle Orange
        bg: "#F9F9F9",          // Light Gray
        text: "#222222",        // Rich Black
        success: "#2ECC71",     // Confirm Green
        danger: "#E74C3C",      // Alert Red
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', '"Open Sans"', '"Helvetica Neue"', 'sans-serif'],
      },
      animation: {
        slideUp: 'slideUp 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.2s ease-in forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { 
            transform: 'translateY(100%)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)', 
            opacity: '1' 
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 