import { useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserProfile } from '../firebase/auth'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import PhoneVerificationModal from './PhoneVerificationModal'
import SignupEncouragementModal from './SignupEncouragementModal'
import useDebtStore from '../store/useDebtStore'

const AuthGuard = ({ children, requireAuth = false }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authModalState, setAuthModalState] = useState({
    showLogin: false,
    showSignup: false,
    showPhoneVerification: false,
    showSignupEncouragement: false,
    phoneNumber: ''
  })
  
  // Get store state for signup encouragement
  const { customers, showSignupEncouragement, hideSignupEncouragement, disableSignupEncouragement } = useDebtStore()

  // Show signup encouragement modal when store indicates (only for non-authenticated users)
  useEffect(() => {
    if (showSignupEncouragement && !user) {
      setAuthModalState(prev => ({
        ...prev,
        showSignupEncouragement: true
      }))
    } else if (showSignupEncouragement && user) {
      // User is authenticated, hide the encouragement immediately
      hideSignupEncouragement()
    }
  }, [showSignupEncouragement, user, hideSignupEncouragement])

  // Disable signup encouragement when user becomes authenticated
  useEffect(() => {
    if (user) {
      disableSignupEncouragement()
    }
  }, [user, disableSignupEncouragement])

  useEffect(() => {
    // Listen for custom signup trigger event from upgrade process
    const handleTriggerSignup = () => {
      setAuthModalState(prev => ({
        ...prev,
        showSignup: true
      }))
    }
    
    window.addEventListener('triggerSignup', handleTriggerSignup)
    
    return () => {
      window.removeEventListener('triggerSignup', handleTriggerSignup)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user profile data
          const userProfile = await getUserProfile(firebaseUser.uid)
          const authenticatedUser = {
            ...firebaseUser,
            profile: userProfile
          }
          
          setUser(authenticatedUser)
          
          // Check if user was just created (migration might be in progress)
          // We'll let the auth functions handle enabling real-time sync after migration
          const isNewUser = authenticatedUser.metadata?.creationTime === authenticatedUser.metadata?.lastSignInTime
          
          if (!isNewUser) {
            // For existing users, enable real-time sync immediately
            const { enableRealtimeSync } = useDebtStore.getState()
            await enableRealtimeSync(firebaseUser.uid)
          }
          // For new users, real-time sync will be enabled after migration in auth functions
          
        } else {
          // Disable real-time sync when user logs out
          const { disableRealtimeSync } = useDebtStore.getState()
          disableRealtimeSync()
          
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setUser(firebaseUser)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLoginSuccess = (user) => {
    setUser(user)
    closeAllModals()
  }

  const handleSignupSuccess = (user) => {
    setUser(user)
    closeAllModals()
  }

  const handlePhoneVerificationSuccess = (user) => {
    setUser(user)
    closeAllModals()
  }

  const showLoginModal = () => {
    setAuthModalState({
      showLogin: true,
      showSignup: false,
      showPhoneVerification: false,
      phoneNumber: ''
    })
  }

  const showSignupModal = () => {
    setAuthModalState({
      showLogin: false,
      showSignup: true,
      showPhoneVerification: false,
      phoneNumber: ''
    })
  }

  const showPhoneVerificationModal = (phoneNumber) => {
    setAuthModalState({
      showLogin: false,
      showSignup: false,
      showPhoneVerification: true,
      phoneNumber
    })
  }

  const closeAllModals = () => {
    setAuthModalState({
      showLogin: false,
      showSignup: false,
      showPhoneVerification: false,
      showSignupEncouragement: false,
      phoneNumber: ''
    })
  }

  const handleSignupEncouragementClose = () => {
    hideSignupEncouragement()
    setAuthModalState(prev => ({
      ...prev,
      showSignupEncouragement: false
    }))
  }

  const handleSignupEncouragementSignup = () => {
    setAuthModalState({
      showLogin: false,
      showSignup: true,
      showPhoneVerification: false,
      showSignupEncouragement: false,
      phoneNumber: ''
    })
  }

  const handleSignOut = async () => {
    try {
      const { signOutUser } = await import('../firebase/auth')
      const result = await signOutUser()
      
      if (result.success) {
        console.log('✅ User signed out successfully')
        // Note: signOutUser handles page reload and data clearing
      } else {
        console.error('❌ Sign out failed:', result.error)
      }
      
      closeAllModals()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">TD</span>
          </div>
          <div className="flex items-center justify-center mb-2">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication screen if user is not logged in AND auth is required
  if (!user && requireAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-white font-bold text-2xl">TD</span>
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">Welcome to TrackDeni</h1>
            <p className="text-gray-600 mb-8">
              Your trusted companion for managing business debts and payments
            </p>
          </div>

          {/* Features Preview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-text mb-4">What you can do:</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m3 0h.003v.008H21V4.5z" />
                  </svg>
                </div>
                <span className="text-gray-700">Track customer debts and payments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-gray-700">Get insights on your business</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-700">Send payment reminders via SMS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-gray-700">Sync across all your devices</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={showSignupModal}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started - It's Free
            </button>
            <button
              onClick={showLoginModal}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500 mb-2">
              Trusted by Kenyan businesses
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600">Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600">Privacy Protected</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600">Always Free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modals */}
        <LoginModal
          isOpen={authModalState.showLogin}
          onClose={closeAllModals}
          onSignupClick={showSignupModal}
          onLoginSuccess={handleLoginSuccess}
        />

        <SignupModal
          isOpen={authModalState.showSignup}
          onClose={closeAllModals}
          onLoginClick={showLoginModal}
          onSignupSuccess={handleSignupSuccess}
        />

        <PhoneVerificationModal
          isOpen={authModalState.showPhoneVerification}
          onClose={closeAllModals}
          phoneNumber={authModalState.phoneNumber}
          onVerificationSuccess={handlePhoneVerificationSuccess}
        />
      </div>
    )
  }

  // User is authenticated OR auth not required, render the protected content with modals
  return (
    <>
      {typeof children === 'function' ? children({ 
        user, 
        signIn: showLoginModal, 
        signOut: handleSignOut 
      }) : children}
      
      {/* Auth Modals - Available even when not requiring auth */}
      <LoginModal
        isOpen={authModalState.showLogin}
        onClose={closeAllModals}
        onSignupClick={showSignupModal}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupModal
        isOpen={authModalState.showSignup}
        onClose={closeAllModals}
        onLoginClick={showLoginModal}
        onSignupSuccess={handleSignupSuccess}
      />

      <PhoneVerificationModal
        isOpen={authModalState.showPhoneVerification}
        onClose={closeAllModals}
        phoneNumber={authModalState.phoneNumber}
        onVerificationSuccess={handlePhoneVerificationSuccess}
      />

      <SignupEncouragementModal
        isOpen={authModalState.showSignupEncouragement}
        onClose={handleSignupEncouragementClose}
        onSignupClick={handleSignupEncouragementSignup}
        customerCount={customers.length}
      />
    </>
  )
}

export default AuthGuard 