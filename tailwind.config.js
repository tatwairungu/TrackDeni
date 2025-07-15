/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#27AE60',        // Pesa Green
        'primary-dark': '#219A52',  // Darker shade of Pesa Green
        'primary-light': '#2ECC71', // Lighter shade (same as success)
        accent: '#F39C12',         // Hustle Orange
        success: '#2ECC71',        // Confirm Green
        danger: '#E74C3C',         // Alert Red  
        warning: '#F39C12',        // Same as accent (Hustle Orange)
        info: '#3b82f6',          // Keep info blue
        bg: '#F9F9F9',            // Light Gray
        text: '#222222',          // Rich Black
        'text-light': '#6b7280',  // Keep existing
        'text-muted': '#9ca3af',  // Keep existing
        border: '#e5e7eb',        // Keep existing
        card: '#ffffff',          // Keep existing
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.3s ease-out',
        slideDown: 'slideDown 0.3s ease-out',
        fadeIn: 'fadeIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
} 