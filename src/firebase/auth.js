import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

// Authentication state management
export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Email Authentication
export const signUpWithEmail = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update user profile
    await updateProfile(user, {
      displayName: userData.name
    })
    
    // Create user document in Firestore
    await createUserDocument(user.uid, {
      name: userData.name,
      email: user.email,
      phoneNumber: userData.phoneNumber || null,
      isPro: false,
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      totalCustomers: 0,
      totalOwed: 0,
      totalPaid: 0
    })
    
    return { success: true, user }
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
    
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Email signin error:', error)
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

// User document management
export const createUserDocument = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), userData)
    console.log('✅ User document created:', userId)
  } catch (error) {
    console.error('❌ Error creating user document:', error)
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
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser
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