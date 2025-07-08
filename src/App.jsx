import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddDebt from './pages/AddDebt'
import CustomerDetail from './pages/CustomerDetail'
import OnboardingFlow from './components/OnboardingFlow'
import TutorialOverlay from './components/TutorialOverlay'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user has seen onboarding and tutorial
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro')
    const shouldShowTutorial = localStorage.getItem('shouldShowTutorial')
    
    setShowOnboarding(!hasSeenIntro)
    setShowTutorial(!!shouldShowTutorial)
    setIsLoading(false)
  }, [])

  const navigateToHome = () => {
    setCurrentPage('home')
    setSelectedCustomerId(null)
  }

  const navigateToAddDebt = (customerId = null) => {
    setSelectedCustomerId(customerId)
    setCurrentPage('add-debt')
  }

  const navigateToCustomer = (customer, action = 'view') => {
    if (action === 'add-debt') {
      // Navigate to add debt for this specific customer
      navigateToAddDebt(customer.id)
    } else {
      // Navigate to customer detail page
      setSelectedCustomerId(customer.id)
      setCurrentPage('customer-detail')
    }
  }

  const handleDebtSuccess = (customerId) => {
    // Navigate back to home after successful debt creation
    navigateToHome()
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Check if tutorial should be shown after onboarding
    const shouldShowTutorial = localStorage.getItem('shouldShowTutorial')
    if (shouldShowTutorial) {
      setShowTutorial(true)
    }
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'add-debt':
        return (
          <AddDebt
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onSuccess={handleDebtSuccess}
          />
        )
      case 'customer-detail':
        return (
          <CustomerDetail
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onNavigateToAddDebt={navigateToAddDebt}
          />
        )
      case 'home':
      default:
        return (
          <Home
            onNavigateToAddDebt={navigateToAddDebt}
            onNavigateToCustomer={navigateToCustomer}
          />
        )
    }
  }

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">TD</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show onboarding if user hasn't seen it
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  // Show main app with tutorial overlay if needed
  return (
    <div className="relative">
      {renderCurrentPage()}
      {showTutorial && (
        <TutorialOverlay onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}

export default App
