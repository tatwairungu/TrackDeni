import { useState } from 'react'

const SignupEncouragementModal = ({ isOpen, onClose, onSignupClick, customerCount = 1 }) => {
  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen) return null

  const getTitle = () => {
    if (customerCount === 1) return "Great Start! 🎉"
    if (customerCount === 2) return "You're Building Something! 📈"
    return "You're Really Growing! 🚀"
  }

  const getMessage = () => {
    if (customerCount === 1) {
      return "You've added your first customer! To keep your valuable business data safe, we recommend creating a free account."
    }
    if (customerCount === 2) {
      return "You're tracking multiple customers now! Don't risk losing this important data - secure it with a free account."
    }
    return "Your business is growing! Make sure all this valuable data is safely backed up with a free account."
  }

  const benefits = [
    {
      icon: "🔐",
      title: "Never Lose Your Data",
      description: "Your customers and debts are safely stored in the cloud"
    },
    {
      icon: "📱",
      title: "Access Anywhere",
      description: "Use TrackDeni on any device, anytime"
    },
    {
      icon: "⚡",
      title: "Instant Backup",
      description: "Every change is automatically saved"
    },
    {
      icon: "🎯",
      title: "Unlock Pro Features",
      description: "Get ready for SMS reminders and advanced analytics"
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-text mb-2">{getTitle()}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {getMessage()}
            </p>
          </div>

          {/* Current Progress */}
          <div className="bg-bg rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Your Progress</span>
              <span className="text-xs text-gray-500">Free Account</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-success h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(customerCount / 5) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {customerCount}/5
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {customerCount === 1 ? "1 customer added" : `${customerCount} customers added`}
              {customerCount < 5 && ` • ${5 - customerCount} more available`}
            </p>
          </div>

          {/* Benefits Preview */}
          <div className="space-y-3 mb-6">
            {benefits.slice(0, showDetails ? 4 : 2).map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-lg">{benefit.icon}</span>
                <div>
                  <h4 className="font-medium text-text text-sm">{benefit.title}</h4>
                  <p className="text-xs text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
            
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
              >
                See all benefits →
              </button>
            )}
          </div>

          {/* Data Safety Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.88-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-yellow-800 text-sm font-medium">Important!</p>
                <p className="text-yellow-700 text-xs mt-1">
                  Without an account, your data is only saved on this device. 
                  If you clear your browser or switch devices, all your customer data will be lost.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onSignupClick}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-success text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Protect My Data - It's Free! 🔐
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Forever
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No Credit Card
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30sec Setup
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupEncouragementModal 