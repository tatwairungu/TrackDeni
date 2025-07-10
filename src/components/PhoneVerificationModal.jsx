import { useState, useEffect, useRef } from 'react'
import { verifyPhoneCode, resendPhoneCode } from '../firebase/auth'

const PhoneVerificationModal = ({ isOpen, onClose, phoneNumber, onVerificationSuccess }) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])

  // Handle countdown for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (resendCountdown === 0 && isOpen) {
      setCanResend(true)
    }
  }, [resendCountdown, isOpen])

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setResendCountdown(60) // 60 seconds
      setCanResend(false)
      setError('')
      setVerificationCode(['', '', '', '', '', ''])
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
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

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (value && index === 5) {
      const completeCode = newCode.join('')
      if (completeCode.length === 6) {
        handleVerification(completeCode)
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newCode = [...verificationCode]
      for (let i = 0; i < digits.length && i < 6; i++) {
        newCode[i] = digits[i]
      }
      setVerificationCode(newCode)
      
      // Focus next empty input or submit if complete
      if (digits.length === 6) {
        handleVerification(digits)
      } else {
        const nextIndex = Math.min(digits.length, 5)
        inputRefs.current[nextIndex]?.focus()
      }
    }
  }

  const handleVerification = async (code) => {
    setError('')
    setIsLoading(true)

    try {
      const result = await verifyPhoneCode(code)
      onVerificationSuccess(result.user)
      onClose()
    } catch (error) {
      console.error('Verification error:', error)
      setError(getErrorMessage(error))
      // Clear the code on error
      setVerificationCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return
    
    setError('')
    setIsLoading(true)

    try {
      await resendPhoneCode(phoneNumber)
      setResendCountdown(60)
      setCanResend(false)
      setVerificationCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      console.error('Resend error:', error)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const code = verificationCode.join('')
    if (code.length === 6) {
      handleVerification(code)
    }
  }

  const getErrorMessage = (error) => {
    const errorCode = error.code
    switch (errorCode) {
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again.'
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.'
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      default:
        return 'Verification failed. Please try again.'
    }
  }

  const formatPhoneNumber = (phone) => {
    // Format +254712345678 to +254 712 345 678
    if (phone.startsWith('+254')) {
      const number = phone.slice(4)
      return `+254 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
    }
    return phone
  }

  const isCodeComplete = verificationCode.every(digit => digit !== '')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">Verify Phone Number</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-semibold text-text">
              {formatPhoneNumber(phoneNumber)}
            </p>
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

          {/* Verification Code Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex gap-2 justify-center">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-semibold text-lg"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isCodeComplete || isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isCodeComplete && !isLoading
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
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            {canResend ? (
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-primary hover:text-primary/80 font-medium text-sm disabled:opacity-50"
              >
                Resend code
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend in {resendCountdown}s
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-6">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-800 text-sm font-medium">Tips:</p>
                <ul className="text-blue-700 text-xs mt-1 space-y-1">
                  <li>• Check your SMS messages</li>
                  <li>• Make sure you have network signal</li>
                  <li>• The code expires in 10 minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhoneVerificationModal 