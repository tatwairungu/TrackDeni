# TrackDeni - Smart Debt Tracker

A modern Progressive Web App (PWA) designed to help small business owners and shopkeepers easily track customer debts and payments. Built with React, Firebase, and optimized for offline use.

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Academic Review](https://img.shields.io/badge/status-Academic%20Review%20Only-orange.svg)](SETUP.md)

---

## ⚠️ IMPORTANT: PROPRIETARY SOFTWARE

**This repository is made public for academic purposes only.**

- ✅ You **CAN** view the code, tests, and architecture
- ❌ You **CANNOT** run, deploy, or use this application
- ❌ Firebase credentials are **INTENTIONALLY EXCLUDED**
- 🔒 All rights reserved - See [LICENSE](LICENSE) for details



---

## 🌟 Features

### Core Functionality
- **Customer Management** - Add, edit, and manage customer profiles with contact information
- **Debt Tracking** - Record debts with amounts, dates, due dates, and reasons
- **Payment Recording** - Track partial and full payments with detailed history
- **Smart Summaries** - Real-time calculations of total owed, paid, and outstanding amounts
- **Status Indicators** - Visual alerts for overdue, due soon, and paid debts

### Progressive Web App (PWA)
- **Offline First** - Full functionality without internet connection
- **Install Anywhere** - Works on mobile, tablet, and desktop
- **Auto-Sync** - Seamlessly syncs data when connection is restored
- **Push Notifications** - Get reminders for upcoming due dates (coming soon)

### Performance Optimizations
- **Lite Mode** - Automatic detection and optimization for low-end devices
- **IndexedDB Storage** - Fast, efficient local data storage
- **Smart Pagination** - Handles large customer lists efficiently
- **Device Detection** - Adapts UI based on device capabilities

### User Experience
- **Interactive Tutorial** - Step-by-step onboarding for new users
- **Dark Mode Support** - Easy on the eyes (coming soon)
- **Multi-language** - Supports multiple languages (coming soon)
- **Print Ready** - Export customer statements and reports

### Security & Authentication
- **Firebase Auth** - Secure user authentication with phone verification
- **Data Encryption** - All data encrypted in transit and at rest
- **Free & Pro Tiers** - Flexible pricing for different business sizes
  - **Free**: Up to 5 customers, unlimited debts per customer
  - **Pro**: Up to 10,000 customers, 50,000 total debts

## 🚀 Quick Start

### ⚠️ Setup Not Available

**This application cannot be run from this repository.**

The Firebase configuration file (`src/firebase/config.js`) and other required credentials are intentionally excluded to protect intellectual property.

**For Academic Reviewers:**
- Review the code structure in the `/src` directory
- Examine test files in `/src/tests`
- Check component architecture in `/src/components`
- See `SETUP.md` for more details

**Why can't I run this?**
- Firebase credentials are not included in the repository
- The backend configuration is proprietary
- This ensures the app cannot be copied or misused
- See the [LICENSE](LICENSE) file for terms

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analyzer
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Run tests with coverage report

# Deployment
npm run deploy           # Deploy to Firebase (hosting + firestore)
npm run deploy:hosting   # Deploy hosting only
npm run deploy:rules     # Deploy Firestore rules only

# Code Quality
npm run lint             # Check for linting errors
npm run lint:fix         # Fix linting errors automatically
```

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Day.js** - Date/time manipulation

### Backend & Services
- **Firebase Authentication** - User authentication
- **Firestore** - NoSQL cloud database
- **Firebase Hosting** - Web hosting
- **Firebase Cloud Functions** - Serverless functions (optional)

### Development Tools
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing
- **ESLint** - Code linting
- **PostCSS** - CSS processing

### PWA Features
- **Workbox** - Service worker management
- **IndexedDB** - Local data storage
- **vite-plugin-pwa** - PWA plugin for Vite

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS 12+)
- Chrome Mobile (Android 5+)

## 🎯 Use Cases

TrackDeni is perfect for:
- **Small shops** tracking customer credit/tabs
- **Freelancers** managing client invoices
- **Service providers** tracking outstanding payments
- **Market vendors** keeping records of credit customers
- **Community lending** among groups/cooperatives

## 📊 Project Structure

```
TrackDeni/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Main page components
│   ├── firebase/        # Firebase config and utilities
│   ├── store/           # Zustand state management
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   └── tests/           # Test files
├── public/              # Static assets
├── functions/           # Firebase Cloud Functions
└── dist/               # Production build output
```

## 🔐 Security

- All data is encrypted in transit (HTTPS)
- Firebase security rules enforce data access control
- Phone verification prevents unauthorized access
- Rate limiting prevents abuse
- Document size limits prevent storage abuse

## 🤝 Contributing

**Contributions are NOT accepted at this time.**

This is proprietary software made public for academic review only. Pull requests will not be accepted.

For licensing or partnership inquiries, please contact the author.

## 📄 License

**PROPRIETARY LICENSE - All Rights Reserved**

This software is protected by copyright law. It is made publicly available solely for academic review and evaluation purposes.

**You may NOT:**
- Run, deploy, or use this software
- Copy or modify the code for other projects
- Distribute or sublicense this software

See the [LICENSE](LICENSE) file for complete terms.

**Violation of these terms may result in legal action.**

## 👨‍💻 Author

**Tatwa**

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the needs of small business owners
- Special thanks to the open-source community

## 📧 Contact & Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Email: tatwairungu@icloud.com

---

**Made with ❤️ for small businesses everywhere**
