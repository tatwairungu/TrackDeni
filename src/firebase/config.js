import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'

// Firebase configuration
// Note: Firebase web API keys are public by design and safe to include in client code
// Security comes from Firestore security rules, not from hiding these keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1hpmGX2RT8dZQOrtFY3GnRTd50g9zw4Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trackdeni-prod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trackdeni-prod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trackdeni-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "122292055518",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:122292055518:web:fa0e665c885f21c48d814f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-K191DP0XGN"
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