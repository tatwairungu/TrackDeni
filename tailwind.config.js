/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TrackDeni Design System - Culturally Grounded Palette
        primary: '#27AE60',        // Pesa Green - represents money, growth, trust
        'primary-dark': '#229954',  // Darker shade of Pesa Green
        'primary-light': '#2ECC71', // Lighter shade of Pesa Green
        accent: '#F39C12',         // Hustle Orange - represents energy, reminders, activity
        success: '#2ECC71',        // Confirm Green - payment received / positive feedback
        danger: '#E74C3C',         // Alert Red - late debt / error indicators
        warning: '#F39C12',        // Same as accent for consistency
        info: '#3498DB',           // Complementary blue for info states
        bg: '#F9F9F9',            // Light Gray - clean and minimal base background
        text: '#222222',           // Rich Black - high contrast for readability
        'text-light': '#666666',   // Medium gray for secondary text
        'text-muted': '#999999',   // Light gray for muted text
        border: '#E0E0E0',         // Light border color
        card: '#FFFFFF',           // Pure white for cards
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ensure Inter is the primary font
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