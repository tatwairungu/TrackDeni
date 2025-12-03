import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

// Firebase configuration
// NOTE: This is an example file. The actual config.js is not included in the repository.
// To run this app, you need to:
// 1. Create your own Firebase project at https://firebase.google.com
// 2. Copy this file to config.js
// 3. Replace the values below with your Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize Analytics and Performance (only in production)
export const analytics = typeof window !== 'undefined' && !import.meta.env.DEV ? getAnalytics(app) : null
export const perf = typeof window !== 'undefined' && !import.meta.env.DEV ? getPerformance(app) : null

// Development mode: Connect to emulators (disabled for testing)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  // Connect to Auth emulator (try-catch handles if already connected)
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  } catch (error) {
    // Emulator connection failed or already connected - this is fine
    console.log('Auth emulator connection skipped:', error.message)
  }
  
  // Connect to Firestore emulator (try-catch handles if already connected)
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (error) {
    // Emulator connection failed or already connected - this is fine
    console.log('Firestore emulator connection skipped:', error.message)
  }
}

// Network control utilities
export const goOffline = () => disableNetwork(db)
export const goOnline = () => enableNetwork(db)

// Export the app for other Firebase services
export default app

