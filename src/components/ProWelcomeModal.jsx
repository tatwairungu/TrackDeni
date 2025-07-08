import { useState } from 'react'

const ProWelcomeModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const steps = [
    {
      icon: '🎉',
      title: 'Welcome to TrackDeni Pro!',
      subtitle: 'Your upgrade was successful',
      description: 'You now have access to all Pro features and unlimited customer tracking.',
      color: 'bg-primary'
    },
    {
      icon: '🚀',
      title: 'What\'s New?',
      subtitle: 'Explore your Pro features',
      description: 'Let\'s see what you can do now with your Pro account.',
      color: 'bg-success'
    }
  ]

  const proFeatures = [
    {
      icon: '👥',
      title: 'Unlimited Customers',
      description: 'Add as many customers as your business needs',
      status: 'unlocked'
    },
    {
      icon: '📱',
      title: 'SMS Bundles',
      description: 'Send automatic payment reminders',
      status: 'coming-soon'
    },
    {
      icon: '☁️',
      title: 'Cloud Sync',
      description: 'Access your data from any device',
      status: 'coming-soon'
    },
    {
      icon: '📊',
      title: 'Advanced Reports',
      description: 'Detailed analytics and insights',
      status: 'coming-soon'
    },
    {
      icon: '💾',
      title: 'Data Backup',
      description: 'Never lose your customer data',
      status: 'coming-soon'
    },
    {
      icon: '🔧',
      title: 'Priority Support',
      description: 'Get help when you need it',
      status: 'unlocked'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {currentStep === 0 ? (
          // Welcome Screen
          <div className="p-6 text-center">
            <div className={`w-20 h-20 ${currentStepData.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <span className="text-3xl">{currentStepData.icon}</span>
            </div>
            
            <h2 className="text-2xl font-bold text-text mb-2">{currentStepData.title}</h2>
            <p className="text-lg font-medium text-primary mb-3">{currentStepData.subtitle}</p>
            <p className="text-gray-600 mb-6">{currentStepData.description}</p>

            {/* Pro Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-success px-4 py-2 rounded-full mb-6">
              <span className="text-white font-semibold">✨ PRO MEMBER</span>
            </div>

            {/* Quick Benefits */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What's unlocked:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-success">✅</span>
                  <span className="text-sm text-gray-700">Unlimited customer tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-success">✅</span>
                  <span className="text-sm text-gray-700">Priority customer support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-accent">⏳</span>
                  <span className="text-sm text-gray-600">More features coming soon</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Start Using Pro
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                See All Features
              </button>
            </div>
          </div>
        ) : (
          // Features Overview Screen
          <div className="p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 ${currentStepData.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-2xl">{currentStepData.icon}</span>
              </div>
              <h2 className="text-xl font-bold text-text mb-2">{currentStepData.title}</h2>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                  <span className="text-lg flex-shrink-0">{feature.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-text">{feature.title}</h4>
                      {feature.status === 'unlocked' ? (
                        <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium">
                          ✅ Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                          🚧 Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-primary">📢</span>
                <span className="font-semibold text-primary">Coming Soon</span>
              </div>
              <p className="text-sm text-gray-700">
                We're actively developing more Pro features including SMS automation, cloud sync, and advanced analytics. 
                Stay tuned for updates!
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Start Building Your Business 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProWelcomeModal 