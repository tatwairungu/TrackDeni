import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddDebt from './pages/AddDebt'
import CustomerDetail from './pages/CustomerDetail'
import OnboardingFlow from './components/OnboardingFlow'
import InteractiveTutorial from './components/InteractiveTutorial'
import AuthGuard from './components/AuthGuard'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import { useTutorial } from './hooks/useTutorial'
import useDebtStore from './store/useDebtStore'
import { initBundleOptimization } from './utils/bundleOptimization'
import { initLiteModeStyles } from './utils/liteModeStyles'
import { initVisualEffects } from './utils/liteModeVisualEffects'
import { initPerformanceMonitoring } from './utils/performanceMonitoring'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Interactive tutorial hook
  const tutorial = useTutorial()

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro')
    setShowOnboarding(!hasSeenIntro)
    setIsLoading(false)
  }, [])

  // Initialize performance optimizations (only once)
  useEffect(() => {
    // Prevent duplicate initialization
    if (window.trackDeniOptimizationsInitialized) return
    window.trackDeniOptimizationsInitialized = true
    
    initBundleOptimization()
    initLiteModeStyles()
    initVisualEffects()
    initPerformanceMonitoring()
  }, [])

  // Development tools for testing (only once)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !window.trackDeniDevInitialized) {
      window.trackDeniDevInitialized = true
      const store = useDebtStore.getState()
      
      window.trackDeniDev = {
        // Show upgrade prompt
        showUpgrade: () => {
          store.showUpgradeModal()
          console.log('🔄 Upgrade prompt shown')
        },
        
        // Add test customers
        addTestCustomers: async (count = 5) => {
          const testCustomers = [
            { name: 'John Doe', phone: '0712345678', location: 'Nairobi CBD' },
            { name: 'Jane Smith', phone: '0723456789', location: 'Westlands' },
            { name: 'Peter Kimani', phone: '0734567890', location: 'Kasarani' },
            { name: 'Mary Wanjiku', phone: '0745678901', location: 'Thika Road' },
            { name: 'David Mwangi', phone: '0756789012', location: 'Kiambu' },
            { name: 'Grace Achieng', phone: '0767890123', location: 'South B' },
            { name: 'Samuel Kiptoo', phone: '0778901234', location: 'Ngong' },
            { name: 'Rose Nyambura', phone: '0789012345', location: 'Ruaka' }
          ]
          
          for (let i = 0; i < Math.min(count, testCustomers.length); i++) {
            await store.addCustomer(testCustomers[i])
          }
          console.log(`➕ Added ${Math.min(count, testCustomers.length)} test customers`)
        },
        
        // Complete test scenario
        testUpgradeFlow: async () => {
          // Add 5 customers to hit the limit
          await window.trackDeniDev.addTestCustomers(5)
          // Show upgrade prompt
          setTimeout(() => {
            store.showUpgradeModal()
            console.log('🧪 Test flow: 5 customers added, upgrade prompt shown')
          }, 500)
        },
        
        // Direct upgrade to Pro
        upgradeToPro: async () => {
          await store.upgradeToProTier()
          console.log('⬆️ Upgraded to Pro tier')
        },
        
        // Reset to free tier
        resetToFree: () => {
          store.resetToFreeTier()
          console.log('🔄 Reset to free tier')
        },
        
        // Show current state
        showState: () => {
          console.log('📊 Current state:', {
            customers: store.customers.length,
            userTier: store.userTier,
            canAddMore: store.canAddCustomer(),
            dismissedCustomerCounts: store.dismissedCustomerCounts,
            showSignupEncouragement: store.showSignupEncouragement
          })
        },
        
        // Reset signup encouragement for testing
        resetSignupEncouragement: () => {
          store.resetSignupEncouragement()
          console.log('🔄 Signup encouragement reset - you can test modals again')
        },
        
        // Test signup encouragement flow
        testSignupFlow: () => {
          store.resetSignupEncouragement()
          store.clearAllData()
          console.log('🧪 Test setup complete - add customers to see encouragement modals')
        }
      }
      
      // Log available dev tools
      console.log('🛠️ TrackDeni Dev Tools Available:')
      console.log('Use trackDeniDev.showState() to see current state')
      console.log('Use trackDeniDev.addTestCustomers(10) to add test data')
      console.log('Use trackDeniPerf.getReport() for performance data')
    }
  }, [])

  const navigateToHome = () => {
    setCurrentPage('home')
    setSelectedCustomerId(null)
  }

  const navigateToAddDebt = (customerId = null) => {
    setSelectedCustomerId(customerId)
    setCurrentPage('add-debt')
    // Handle tutorial progression
    tutorial.onAddButtonClicked()
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
    // Handle tutorial progression
    tutorial.onCustomerFormSubmitted(customerId)
    // Navigate back to home after successful debt creation
    navigateToHome()
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Check if tutorial should be shown after onboarding
    const shouldShowTutorial = localStorage.getItem('shouldShowTutorial')
    if (shouldShowTutorial) {
      tutorial.startTutorial()
    }
  }

  const renderCurrentPage = (user, signIn, signOut) => {
    switch (currentPage) {
      case 'add-debt':
        return (
          <AddDebt
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onSuccess={handleDebtSuccess}
            tutorial={tutorial}
            user={user}
            signIn={signIn}
            signOut={signOut}
          />
        )
      case 'customer-detail':
        return (
          <CustomerDetail
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onNavigateToAddDebt={navigateToAddDebt}
            tutorial={tutorial}
            user={user}
            signIn={signIn}
            signOut={signOut}
          />
        )
      case 'home':
      default:
        return (
          <Home
            onNavigateToAddDebt={navigateToAddDebt}
            onNavigateToCustomer={navigateToCustomer}
            tutorial={tutorial}
            user={user}
            signIn={signIn}
            signOut={signOut}
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

  // Show main app with interactive tutorial if needed
  return (
    <AuthGuard requireAuth={false}>
      {({ user, signIn, signOut }) => (
    <div className="relative">
          <OfflineIndicator />
          {renderCurrentPage(user, signIn, signOut)}
      {tutorial.isActive && (
        <InteractiveTutorial 
          currentStep={tutorial.currentStep}
          onComplete={tutorial.completeTutorial}
        />
      )}
          <PWAInstallPrompt />
    </div>
      )}
    </AuthGuard>
  )
}

export default App
