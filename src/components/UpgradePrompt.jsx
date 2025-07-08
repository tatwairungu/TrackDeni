import { useState } from 'react'
import useDebtStore from '../store/useDebtStore'
import { t } from '../utils/localization'

const UpgradePrompt = ({ isOpen, onClose }) => {
  const { upgradeToProTier } = useDebtStore()
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = () => {
    setShowPaymentOptions(true)
  }

  const handleMockUpgrade = () => {
    // For demo purposes, we'll just upgrade the user
    // In production, this would integrate with M-Pesa or other payment systems
    upgradeToProTier()
    onClose()
  }

  const benefits = [
    {
      icon: '👥',
      title: 'Unlimited Customers',
      description: 'Track as many customers as you need'
    },
    {
      icon: '📱',
      title: 'SMS Bundles',
      description: 'Send automatic payment reminders'
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      description: 'Access your data from any device'
    },
    {
      icon: '📊',
      title: 'Advanced Reports',
      description: 'Detailed analytics and insights'
    },
    {
      icon: '💾',
      title: 'Data Backup',
      description: 'Never lose your customer data'
    },
    {
      icon: '🔧',
      title: 'Priority Support',
      description: 'Get help when you need it'
    }
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {!showPaymentOptions ? (
          // Main upgrade screen
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">Upgrade to Pro</h2>
              <p className="text-gray-600">You've reached the free tier limit of 5 customers</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-accent">💰</span>
                <span className="font-semibold text-accent">Special Launch Price</span>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-text">KES 500</span>
                <span className="text-gray-600 ml-2">/ month</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Regular price: KES 1,000/month</p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-text">What you'll get:</h3>
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">{benefit.icon}</span>
                    <div>
                      <h4 className="font-medium text-text">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgrade}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Upgrade Now
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        ) : (
          // Payment options screen
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">Choose Payment Method</h2>
              <p className="text-gray-600">Complete your upgrade to TrackDeni Pro</p>
            </div>

            <div className="space-y-4 mb-6">
              <button
                onClick={handleMockUpgrade}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">M-Pesa</h3>
                    <p className="text-sm text-gray-600">Pay with your M-Pesa account</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleMockUpgrade}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">💳</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Card Payment</h3>
                    <p className="text-sm text-gray-600">Pay with Visa, Mastercard, or other cards</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleMockUpgrade}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏦</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">Bank Transfer</h3>
                    <p className="text-sm text-gray-600">Direct bank transfer</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <span className="font-semibold">Secure Payment</span> • 256-bit SSL encryption
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}

export default UpgradePrompt 