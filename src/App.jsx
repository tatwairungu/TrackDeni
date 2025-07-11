import { useState, useEffect } from 'react'
import Home from './pages/Home'
import AddDebt from './pages/AddDebt'
import CustomerDetail from './pages/CustomerDetail'
import OnboardingFlow from './components/OnboardingFlow'
import InteractiveTutorial from './components/InteractiveTutorial'
import AuthGuard from './components/AuthGuard'
import { useTutorial } from './hooks/useTutorial'
import useDebtStore from './store/useDebtStore'

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

  // Development tools for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
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
          const state = store.getState()
          console.log('📊 Current state:', {
            customers: state.customers.length,
            userTier: state.userTier,
            canAddMore: state.canAddCustomer(),
            dismissedCustomerCounts: state.dismissedCustomerCounts,
            showSignupEncouragement: state.showSignupEncouragement
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
        },

        // SECURITY TESTING: Bypass frontend validation and hit Firestore directly
        bypassFrontendAndAddCustomer: async (customerData = { name: 'Malicious Customer', phone: '0700000000' }) => {
          try {
            const { auth, db } = await import('./firebase/config.js')
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
            
            if (!auth.currentUser) {
              console.error('❌ Must be authenticated to test security rules')
              return
            }
            
            const userId = auth.currentUser.uid
            const customerId = crypto.randomUUID()
            
            console.log('🔓 BYPASS ATTEMPT: Adding customer directly to Firestore, bypassing frontend validation...')
            console.log('👤 User ID:', userId)
            console.log('🎯 Customer data:', customerData)
            
            // Directly call Firestore API (bypassing frontend checks)
            const customerRef = doc(db, 'users', userId, 'customers', customerId)
            await setDoc(customerRef, {
              id: customerId,
              name: customerData.name,
              phone: customerData.phone,
              createdAt: serverTimestamp(),
              totalOwed: 0,
              totalPaid: 0,
              activeDebts: 0
            })
            
            console.log('✅ SUCCESS: Backend allowed customer creation - security rules may need hardening!')
            
          } catch (error) {
            console.log('🛡️ BLOCKED: Backend security rules prevented customer creation')
            console.log('Error code:', error.code)
            console.log('Error message:', error.message)
            
                         if (error.code === 'permission-denied') {
               console.log('🎉 SECURITY RULES WORKING: Permission denied as expected!')
             }
           }
         },

         // DEBUG: Check user document state for security rules debugging
         debugUserDocument: async () => {
           try {
             const { auth, db } = await import('./firebase/config.js')
             const { doc, getDoc } = await import('firebase/firestore')
             
             if (!auth.currentUser) {
               console.error('❌ Must be authenticated to debug user document')
               return
             }
             
             const userId = auth.currentUser.uid
             const userRef = doc(db, 'users', userId)
             const userDoc = await getDoc(userRef)
             
             console.log('🔍 USER DOCUMENT DEBUG:')
             console.log('👤 User ID:', userId)
             console.log('📄 Document exists:', userDoc.exists())
             
             if (userDoc.exists()) {
               const data = userDoc.data()
               console.log('📊 User data:', data)
               console.log('🔢 totalCustomers:', data.totalCustomers)
               console.log('⭐ isPro:', data.isPro)
               console.log('🧮 Security check: totalCustomers < 5?', data.totalCustomers < 5)
               console.log('🔐 Should allow creation?', data.isPro || data.totalCustomers < 5)
             } else {
               console.log('❌ User document does not exist - this is the problem!')
             }
             
           } catch (error) {
             console.error('❌ Error checking user document:', error)
           }
         }
      }
      
      console.log('🛠️ TrackDeni Dev Tools Available:')
      console.log('  trackDeniDev.showUpgrade() - Show upgrade prompt')
      console.log('  trackDeniDev.addTestCustomers(5) - Add test customers')
      console.log('  trackDeniDev.testUpgradeFlow() - Complete test scenario')
      console.log('  trackDeniDev.upgradeToPro() - Direct upgrade')
      console.log('  trackDeniDev.resetToFree() - Reset for testing')
      console.log('  trackDeniDev.showState() - Show current state')
      console.log('  trackDeniDev.resetSignupEncouragement() - Reset signup modals for testing')
      console.log('  trackDeniDev.testSignupFlow() - Fresh start for testing signup flow')
      console.log('  trackDeniDev.bypassFrontendAndAddCustomer() - 🔓 Test security rules (malicious user simulation)')
      console.log('  trackDeniDev.debugUserDocument() - 🔍 Debug user document for security rules')
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
          {renderCurrentPage(user, signIn, signOut)}
          {tutorial.isActive && (
            <InteractiveTutorial 
              currentStep={tutorial.currentStep}
              onComplete={tutorial.completeTutorial}
            />
          )}
        </div>
      )}
    </AuthGuard>
  )
}

export default App
