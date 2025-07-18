import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddDebt from './pages/AddDebt'
import CustomerDetail from './pages/CustomerDetail'
import OnboardingFlow from './components/OnboardingFlow'
import AuthGuard from './components/AuthGuard'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
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

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro')
    setShowOnboarding(!hasSeenIntro)
    setIsLoading(false)
    
    // Clean up old tutorial localStorage items from previous version
    localStorage.removeItem('shouldShowTutorial')
    localStorage.removeItem('hasSeenTutorial')
    localStorage.removeItem('trackdeni-tutorial')
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
          const result = await store.upgradeToProTier()
          if (result.success) {
            console.log('⬆️ Upgraded to Pro tier')
          } else {
            console.log('❌ Pro upgrade failed:', result.error)
          }
        },
        
        // Test auth-protected upgrade flow
        testAuthProtectedUpgrade: async () => {
          console.log('🧪 Testing auth-protected upgrade flow...')
          
          // First, ensure user is signed out
          const { auth } = await import('./firebase/config.js')
          if (auth.currentUser) {
            console.log('👤 User is signed in, testing upgrade...')
          } else {
            console.log('🔓 User is not signed in, testing blocked upgrade...')
          }
          
          const result = await store.upgradeToProTier()
          
          if (result.success) {
            console.log('✅ Upgrade successful (user was authenticated)')
          } else {
            console.log('❌ Upgrade blocked:', result.error)
          }
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

  // Debug tools for development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Import and expose migration/logout debug tools
    import('./firebase/dataSync.js').then(({ debugTools, migrationUtils, clearUserData, inspectUserDocument }) => {
      if (!window.trackDeniDev) {
        window.trackDeniDev = {}
      }
      
      // Add migration and logout debug tools
      window.trackDeniDev.testMigrationFlow = debugTools.testMigrationFlow
      window.trackDeniDev.testLogoutClear = debugTools.testLogoutClear
      window.trackDeniDev.testDataStructure = debugTools.testDataStructure
      window.trackDeniDev.testFullMigrationFlow = debugTools.testFullMigrationFlow
      window.trackDeniDev.migrationUtils = migrationUtils
      window.trackDeniDev.clearUserData = clearUserData
      
      // Add user document inspector
      window.trackDeniDev.inspectUserDocument = inspectUserDocument
      
      // Add convenience function to get current user and inspect their document
      window.trackDeniDev.inspectCurrentUser = async () => {
        try {
          const { auth } = await import('./firebase/config.js')
          const user = auth.currentUser
          if (user) {
            console.log('🔍 Current user:', user.uid)
            return await inspectUserDocument(user.uid)
          } else {
            console.log('❌ No current user logged in')
            return null
          }
        } catch (error) {
          console.error('❌ Error inspecting current user:', error)
          return null
        }
      }
      
      // Add function to check current storage state
      window.trackDeniDev.checkStorageState = async () => {
        try {
          const { storage } = await import('./utils/storage.js')
          const data = await storage.getData()
          const info = await storage.getStorageInfo()
          
          console.log('📊 Storage Info:', info)
          console.log('📊 Storage Data:', data)
          
          if (data) {
            if (data.customers) {
              console.log('👥 Direct format - Customers:', data.customers.length)
            } else if (data.state && data.state.customers) {
              console.log('👥 Zustand format - Customers:', data.state.customers.length)
            }
          }
          
          return { info, data }
        } catch (error) {
          console.error('❌ Error checking storage state:', error)
          return null
        }
      }
      
      console.log('🧪 Debug tools loaded:')
      console.log('- trackDeniDev.testMigrationFlow() - Test migration functionality')
      console.log('- trackDeniDev.testLogoutClear() - Test logout data clearing')
      console.log('- trackDeniDev.testDataStructure() - Test data structure consistency')
      console.log('- trackDeniDev.testFullMigrationFlow() - Test full migration with real storage')
      console.log('- trackDeniDev.clearUserData() - Clear all user data')
      console.log('- trackDeniDev.inspectUserDocument(userId) - Inspect user document in Firestore')
      console.log('- trackDeniDev.inspectCurrentUser() - Inspect current logged-in user document')
      console.log('- trackDeniDev.checkStorageState() - Check current storage state and data')
      console.log('- trackDeniDev.migrationUtils - Access migration utilities')
    })
  }

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
  }

  const renderCurrentPage = (user, signIn, signOut) => {
    switch (currentPage) {
      case 'add-debt':
        return (
          <AddDebt
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onSuccess={handleDebtSuccess}
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

  // Show main app
  return (
    <AuthGuard requireAuth={false}>
      {({ user, signIn, signOut }) => (
    <div className="relative">
          <OfflineIndicator />
          {renderCurrentPage(user, signIn, signOut)}
          <PWAInstallPrompt />
    </div>
      )}
    </AuthGuard>
  )
}

export default App
