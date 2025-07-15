import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { migrateLocalDataToFirestore, syncFirestoreToLocal } from './dataSync'

// Authentication state management
export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Email Authentication
export const signUpWithEmail = async (email, password, userData) => {
  try {
    // Validate required data
    if (!userData || !userData.name || userData.name.trim().length === 0) {
      throw new Error('Name is required for signup')
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update user profile
    await updateProfile(user, {
      displayName: userData.name.trim()
    })
    
    // Create user document in Firestore
    await createUserDocument(user.uid, {
      name: userData.name.trim(),
      email: user.email,
      phoneNumber: userData.phoneNumber || null,
      isPro: false,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      totalCustomers: 0,
      totalDebts: 0,
      totalOwed: 0,
      totalPaid: 0
    })
    
    // Migrate local data to Firestore for new users
    const migrationResult = await migrateLocalDataToFirestore(user.uid)
    console.log('📊 Migration result:', migrationResult)
    
    // Enable real-time sync AFTER migration is complete
    try {
      const { default: useDebtStore } = await import('../store/useDebtStore.js')
      const { enableRealtimeSync } = useDebtStore.getState()
      await enableRealtimeSync(user.uid)
      console.log('✅ Real-time sync enabled after migration')
    } catch (error) {
      console.error('❌ Failed to enable real-time sync after migration:', error)
    }
    
    return { 
      success: true, 
      user,
      isNewUser: true,
      migrationResult 
    }
  } catch (error) {
    console.error('Email signup error:', error)
    return { success: false, error: error.message }
  }
}

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Update last active timestamp
    await updateUserDocument(userCredential.user.uid, {
      lastActive: serverTimestamp()
    })
    
    // Sync Firestore data to local storage
    const syncResult = await syncFirestoreToLocal(userCredential.user.uid)
    console.log('📊 Sync result:', syncResult)
    
    return { 
      success: true, 
      user: userCredential.user,
      syncResult 
    }
  } catch (error) {
    console.error('Email signin error:', error)
    return { success: false, error: error.message }
  }
}

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user
    
    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    const isNewUser = !userDoc.exists()
    
    if (isNewUser) {
      // Create new user document
      await createUserDocument(user.uid, {
        name: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        isPro: false,
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        totalCustomers: 0,
        totalDebts: 0,
        totalOwed: 0,
        totalPaid: 0
      })
      
      // Migrate local data for new users
      const migrationResult = await migrateLocalDataToFirestore(user.uid)
      console.log('📊 Google signup migration result:', migrationResult)
      
      // Enable real-time sync AFTER migration is complete
      try {
        const { default: useDebtStore } = await import('../store/useDebtStore.js')
        const { enableRealtimeSync } = useDebtStore.getState()
        await enableRealtimeSync(user.uid)
        console.log('✅ Real-time sync enabled after Google signup migration')
      } catch (error) {
        console.error('❌ Failed to enable real-time sync after Google signup migration:', error)
      }
      
      return { 
        success: true, 
        user, 
        isNewUser: true,
        migrationResult 
      }
    } else {
      // Update existing user's last active
      await updateUserDocument(user.uid, {
        lastActive: serverTimestamp()
      })
      
      // Sync Firestore data for existing users
      const syncResult = await syncFirestoreToLocal(user.uid)
      console.log('📊 Google signin sync result:', syncResult)
      
      return { 
        success: true, 
        user, 
        isNewUser: false,
        syncResult 
      }
    }
  } catch (error) {
    console.error('Google signin error:', error)
    return { success: false, error: error.message }
  }
}

// Phone Authentication
export const setupRecaptcha = (elementId) => {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved')
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired')
      }
    })
    
    return recaptchaVerifier
  } catch (error) {
    console.error('reCAPTCHA setup error:', error)
    throw error
  }
}

export const sendPhoneVerification = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    return { success: true, confirmationResult }
  } catch (error) {
    console.error('Phone verification error:', error)
    return { success: false, error: error.message }
  }
}

export const verifyPhoneCode = async (confirmationResult, code, userData = null) => {
  try {
    const userCredential = await confirmationResult.confirm(code)
    const user = userCredential.user
    
    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists() && userData) {
      // Create new user document
      await createUserDocument(user.uid, {
        name: userData.name,
        phoneNumber: user.phoneNumber,
        email: null,
        isPro: false,
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        totalCustomers: 0,
        totalDebts: 0,
        totalOwed: 0,
        totalPaid: 0
      })
    } else {
      // Update existing user's last active
      await updateUserDocument(user.uid, {
        lastActive: serverTimestamp()
      })
    }
    
    return { success: true, user, isNewUser: !userDoc.exists() }
  } catch (error) {
    console.error('Phone code verification error:', error)
    return { success: false, error: error.message }
  }
}

// Convenience functions for components
export const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
  return await sendPhoneVerification(phoneNumber, recaptchaVerifier)
}

export const signUpWithPhone = async (phoneNumber, recaptchaVerifier) => {
  return await sendPhoneVerification(phoneNumber, recaptchaVerifier)
}

export const resendPhoneCode = async (phoneNumber, recaptchaVerifier) => {
  return await sendPhoneVerification(phoneNumber, recaptchaVerifier)
}

// User document management
export const createUserDocument = async (userId, userData) => {
  try {
    console.log('📝 Creating user document for:', userId, 'with data:', userData)
    await setDoc(doc(db, 'users', userId), userData)
    console.log('✅ User document created successfully:', userId)
  } catch (error) {
    console.error('❌ Error creating user document:', error)
    console.error('❌ User ID:', userId)
    console.error('❌ User data:', userData)
    throw error
  }
}

export const updateUserDocument = async (userId, updates) => {
  try {
    await setDoc(doc(db, 'users', userId), updates, { merge: true })
    console.log('✅ User document updated:', userId)
  } catch (error) {
    console.error('❌ Error updating user document:', error)
    throw error
  }
}

export const getUserDocument = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() }
    } else {
      return { success: false, error: 'User document not found' }
    }
  } catch (error) {
    console.error('❌ Error getting user document:', error)
    return { success: false, error: error.message }
  }
}

// Sign out
export const signOutUser = async () => {
  try {
    // Clear user data from store BEFORE signing out
    const { default: useDebtStore } = await import('../store/useDebtStore.js')
    const { clearUserData } = useDebtStore.getState()
    clearUserData()
    
    // Sign out from Firebase
    await signOut(auth)
    
    // Clear local storage to prevent data from remaining
    localStorage.removeItem('trackdeni-storage')
    localStorage.removeItem('trackdeni-backup')
    
    // Also clear IndexedDB data
    try {
      const { default: storage } = await import('../utils/storage.js')
      await storage.clearData()
    } catch (error) {
      console.warn('⚠️ Could not clear IndexedDB data:', error)
    }
    
    // Force page reload to ensure clean state
    window.location.reload()
    
    return { success: true, message: 'Successfully logged out' }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser
}

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() }
    } else {
      return { success: false, error: 'User profile not found' }
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { success: false, error: error.message }
  }
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser
}

// Format phone number for Firebase (ensure +254 format)
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`
  } else if (cleaned.length === 9) {
    return `+254${cleaned}`
  }
  
  return phoneNumber // Return as-is if format is unclear
} 