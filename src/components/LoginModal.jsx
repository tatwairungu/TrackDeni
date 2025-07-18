import { useState, useEffect } from 'react'
import { signInWithEmail, signInWithPhone, signInWithGoogle } from '../firebase/auth'

const LoginModal = ({ isOpen, onClose, onSignupClick, onLoginSuccess }) => {
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Toast notification function
  const showSuccessToast = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setPhone('')
      setError('')
      setShowPassword(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signInWithEmail(email, password)
      
      // Show appropriate success message based on sync result
      if (result.syncResult && result.syncResult.success) {
        const { customers, action } = result.syncResult
        
        switch (action) {
          case 'loaded_cloud':
            if (customers > 0) {
              showSuccessToast(`✅ Welcome back! Your ${customers} customers have been loaded from the cloud.`)
            } else {
              showSuccessToast('✅ Welcome back! Ready to add your first customer.')
            }
            break
          case 'kept_local':
            showSuccessToast(`✅ Successfully logged in! Your ${customers} customers are ready.`)
            break
          case 'no_data':
            showSuccessToast('✅ Successfully logged in! Ready to add your first customer.')
            break
          default:
            showSuccessToast('✅ Successfully logged in!')
        }
        
        console.log('📊 Sync result:', result.syncResult)
      } else {
        showSuccessToast('✅ Successfully logged in!')
      }
      
      onLoginSuccess(result.user)
      onClose()
    } catch (error) {
      console.error('Email login error:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Format phone number for Kenya (+254)
      const formattedPhone = formatPhoneNumber(phone)
      const result = await signInWithPhone(formattedPhone)
      
      // Phone auth will require verification, so we handle it differently
      if (result.needsVerification) {
        // Close this modal and let parent handle verification
        onClose()
        // You might want to show a verification modal here
      } else {
        onLoginSuccess(result.user)
        onClose()
      }
    } catch (error) {
      console.error('Phone login error:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      const result = await signInWithGoogle()
      
      // Show appropriate success message based on sync result
      if (result.syncResult && result.syncResult.success) {
        const { customers, action } = result.syncResult
        
        switch (action) {
          case 'loaded_cloud':
            if (customers > 0) {
              showSuccessToast(`✅ Welcome back! Your ${customers} customers have been loaded from the cloud.`)
            } else {
              showSuccessToast('✅ Welcome back! Ready to add your first customer.')
            }
            break
          case 'kept_local':
            showSuccessToast(`✅ Successfully logged in! Your ${customers} customers are ready.`)
            break
          case 'no_data':
            showSuccessToast('✅ Successfully logged in! Ready to add your first customer.')
            break
          default:
            showSuccessToast('✅ Successfully logged in!')
        }
      } else if (result.migrationResult && result.migrationResult.migratedCustomers > 0) {
        showSuccessToast(`✅ Account created! Your ${result.migrationResult.migratedCustomers} customers have been backed up to the cloud.`)
      } else {
        showSuccessToast('✅ Successfully logged in!')
      }
      
      onLoginSuccess(result.user)
      onClose()
    } catch (error) {
      console.error('Google login error:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Handle different formats
    if (cleanPhone.startsWith('254')) {
      return `+${cleanPhone}`
    } else if (cleanPhone.startsWith('0')) {
      return `+254${cleanPhone.slice(1)}`
    } else if (cleanPhone.length === 9) {
      return `+254${cleanPhone}`
    }
    
    return `+254${cleanPhone}`
  }

  const getErrorMessage = (error) => {
    const errorCode = error.code
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled. Please try again.'
      default:
        return 'Login failed. Please try again.'
    }
  }

  const isEmailValid = email.includes('@') && email.includes('.')
  const isPhoneValid = phone.length >= 9
  const isFormValid = loginMethod === 'email' 
    ? isEmailValid && password.length >= 6
    : isPhoneValid

  return (
    <>
      {/* Modal Content */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">Welcome Back</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'phone'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Phone
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.88-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                      placeholder="Enter your password"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isFormValid && !isLoading
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Phone Login Form */}
            {loginMethod === 'phone' && (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <span className="text-gray-500 text-sm">+254</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="712345678"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send you a verification code
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isFormValid && !isLoading
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </div>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onSignupClick}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideDown max-w-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  )
}

export default LoginModal 