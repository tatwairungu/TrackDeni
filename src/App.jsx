import { useState, useEffect, Suspense } from 'react'
import { 
  Home, 
  AddDebt, 
  CustomerDetail, 
  OnboardingFlow, 
  PaymentModal,
  ProWelcomeModal,
  UpgradePrompt,
  LoadingFallback,
  PageLoadingFallback,
  ModalLoadingFallback 
} from './utils/lazyComponents.jsx'
import AuthGuard from './components/AuthGuard'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import useDebtStore from './store/useDebtStore'
import { initializePerformanceOptimizations } from './utils/performanceOptimizations'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [isNewCustomerFlow, setIsNewCustomerFlow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Initialize app and check if user has seen intro
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('trackdeni-has-seen-intro') === 'true'
    setShowOnboarding(!hasSeenIntro)
    setIsLoading(false)
    
    // Clean up old tutorial-related localStorage items
    localStorage.removeItem('hasSeenTutorial')
    localStorage.removeItem('shouldShowTutorial')
    localStorage.removeItem('tutorialStep')
  }, [])

  // Initialize performance optimizations
  useEffect(() => {
    initializePerformanceOptimizations()
  }, [])

  // Development tools for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const store = useDebtStore.getState()
      
      window.trackDeniDev = {
        // Show upgrade prompt
        showUpgrade: () => {
          store.showUpgradeModal()
          console.log('🚀 Upgrade modal shown')
        },
        
        // Add test customers for testing limits
        addTestCustomers: async (count = 5) => {
          const testCustomers = [
            { name: 'John Mwangi', phone: '+254701234567' },
            { name: 'Grace Wanjiku', phone: '+254702345678' },
            { name: 'Peter Kimani', phone: '+254703456789' },
            { name: 'Mary Nyambura', phone: '+254704567890' },
            { name: 'David Kariuki', phone: '+254705678901' },
            { name: 'Sarah Wanjiru', phone: '+254706789012' },
            { name: 'Joseph Maina', phone: '+254707890123' },
            { name: 'Nancy Njeri', phone: '+254708901234' },
            { name: 'Samuel Kiprotich', phone: '+254709012345' },
            { name: 'Ruth Akinyi', phone: '+254710123456' }
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
          
          if (result.requiresAuth) {
            console.log('⚠️ Cannot upgrade: Authentication required')
            console.log('💡 User must create an account first to upgrade to Pro')
          } else if (result.success) {
            console.log('⬆️ Upgraded to Pro tier')
          } else {
            console.log('❌ Upgrade failed')
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
          console.log('🔄 Signup encouragement reset')
        },
        
        // Test signup flow from scratch
        testSignupFlow: () => {
          store.resetSignupEncouragement()
          store.clearAllData()
          console.log('🧪 Fresh start for signup flow testing')
        },

        // Test malicious user simulation (bypassing frontend validation)
        bypassFrontendAndAddCustomer: async (customerData) => {
          console.log('🔓 Testing security: Bypassing frontend validation...')
          
          try {
            // This simulates a malicious user directly calling Firebase
            const { addDoc, collection } = await import('firebase/firestore')
            const { db, auth } = await import('./firebase/config')
            const { onAuthStateChanged } = await import('firebase/auth')
            
            return new Promise((resolve) => {
              onAuthStateChanged(auth, async (user) => {
                if (user) {
                  try {
                    const userDocRef = collection(db, 'users', user.uid, 'customers')
                    const docRef = await addDoc(userDocRef, {
                      ...customerData,
                      createdAt: new Date(),
                      debts: []
                    })
                    console.log('⚠️ Security test: Document added with ID:', docRef.id)
                    console.log('💡 If this succeeds, security rules need attention!')
                    resolve(docRef.id)
                  } catch (error) {
                    console.log('✅ Security test: Properly blocked by rules:', error.message)
                    resolve(null)
                  }
                } else {
                  console.log('👤 Security test: No authenticated user')
                  resolve(null)
                }
              })
            })
          } catch (error) {
            console.error('❌ Security test failed:', error)
            return null
          }
        },

        // Test security rules with edge cases
        testSecurityRules: async () => {
          console.log('🔒 Testing security rules...')
          console.log('─'.repeat(50))
          
          // Test 1: Exceed customer limit via direct API
          await trackDeniDev.bypassFrontendAndAddCustomer({
            name: 'Malicious Customer 6',
            phone: '+254799999999'
          })
          
          // Test 2: Add customer with invalid data
          await trackDeniDev.bypassFrontendAndAddCustomer({
            name: '', // Invalid: empty name
            phone: 'invalid-phone',
            maliciousField: 'should be rejected'
          })
          
          // Test 3: Try to add enormous customer count
          await trackDeniDev.bypassFrontendAndAddCustomer({
            name: 'A'.repeat(1000), // Very long name
            phone: '+254700000000'
          })
          
          console.log('─'.repeat(50))
          console.log('🔒 Security rule testing complete!')
          console.log('💡 Check above for any successful bypasses that need fixing')
        },

        // Debug user document for security testing
        debugUserDocument: async () => {
          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const { db, auth } = await import('./firebase/config')
            const { onAuthStateChanged } = await import('firebase/auth')
            
            onAuthStateChanged(auth, async (user) => {
              if (user) {
                try {
                  const userDocRef = doc(db, 'users', user.uid)
                  const userDocSnap = await getDoc(userDocRef)
                  
                  if (userDocSnap.exists()) {
                    console.log('👤 User document:', userDocSnap.data())
                  } else {
                    console.log('👤 No user document found')
                  }
                } catch (error) {
                  console.error('❌ Failed to read user document:', error)
                }
              } else {
                console.log('👤 No authenticated user')
              }
            })
          } catch (error) {
            console.error('❌ Debug failed:', error)
          }
        },

        // Test rate limiting
        testRateLimit: async () => {
          console.log('⏱️ Testing rate limiting with rapid requests...')
          
          const promises = []
          for (let i = 0; i < 10; i++) {
            promises.push(
              trackDeniDev.bypassFrontendAndAddCustomer({
                name: `Rate Test ${i}`,
                phone: `+25470000${String(i).padStart(4, '0')}`
              })
            )
          }
          
          try {
            const results = await Promise.all(promises)
            const successful = results.filter(r => r !== null).length
            console.log(`⏱️ Rate limit test: ${successful}/10 requests succeeded`)
            
            if (successful > 5) {
              console.log('⚠️ High success rate may indicate insufficient rate limiting')
            } else {
              console.log('✅ Rate limiting appears to be working')
            }
          } catch (error) {
            console.log('✅ Rate limiting blocked requests:', error.message)
          }
        },

        // Test document size limits
        testDocumentSizeLimits: async () => {
          console.log('📏 Testing document size limits...')
          
          // Create a large customer object
          const largeDebts = Array.from({ length: 100 }, (_, i) => ({
            id: `debt-${i}`,
            amount: 1000,
            reason: 'A'.repeat(100), // Long reason
            dateBorrowed: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            paid: false,
            payments: Array.from({ length: 10 }, (_, j) => ({
              id: `payment-${i}-${j}`,
              amount: 100,
              date: new Date().toISOString(),
              method: 'cash'
            }))
          }))
          
          await trackDeniDev.bypassFrontendAndAddCustomer({
            name: 'Large Data Customer',
            phone: '+254700000000',
            debts: largeDebts,
            notes: 'N'.repeat(10000) // Very long notes
          })
          
          console.log('📏 Document size test complete')
        },

        // Test Pro tier document limits
        testProTierLimits: async () => {
          console.log('💎 Testing Pro tier limits...')
          
          try {
            // First upgrade to Pro
            const result = await store.upgradeToProTier()
            
            if (result.requiresAuth) {
              console.log('⚠️ Cannot test Pro tier limits: Authentication required')
              console.log('💡 User must create an account first to upgrade to Pro')
              return
            } else if (!result.success) {
              console.log('❌ Failed to upgrade to Pro for testing')
              return
            }
            
            console.log('💎 Upgraded to Pro tier for testing')
            
            // Try to add many customers rapidly
            for (let i = 0; i < 20; i++) {
              await trackDeniDev.bypassFrontendAndAddCustomer({
                name: `Pro Test Customer ${i}`,
                phone: `+25470100${String(i).padStart(4, '0')}`
              })
            }
            
            console.log('💎 Pro tier limit testing complete')
            
            // Add many debts to test limits
            const manyDebts = Array.from({ length: 50 }, (_, i) => ({
              id: `debt-${i}`,
              amount: 1000 + i,
              reason: `Large debt ${i}`,
              dateBorrowed: new Date().toISOString(),
              dueDate: new Date().toISOString(),
              paid: false,
              payments: []
            }))
             
             await trackDeniDev.bypassFrontendAndAddCustomer({
               name: 'Pro Customer with Many Debts',
               phone: '+254701999999',
               debts: manyDebts
             })
             
             // Restore user to Pro status for continued testing
             const { updateDoc } = await import('firebase/firestore')
             const userRef = doc(db, 'users', auth.currentUser.uid)
             await updateDoc(userRef, {
               isPro: true,
               totalCustomers: 15, // Reasonable number for testing
               totalDebts: 25
             })
             
             console.log('\n🎯 Pro tier caps testing complete!')
             console.log('📊 User restored to Pro status with 15 customers, 25 debts')
             console.log('─'.repeat(60))
             
           } catch (error) {
             console.error('❌ Pro tier caps test failed:', error)
           }
        },

        // Device Detection Testing
        testDeviceDetection: async () => {
          const { logDeviceProfile } = await import('./utils/deviceDetection.js')
          logDeviceProfile()
        },
        
        // Simulate low-end device
        simulateLowEndDevice: () => {
          console.log('🔧 Simulating low-end device...')
          
          // Override device detection functions for testing
          Object.defineProperty(navigator, 'deviceMemory', {
            value: 1, // 1GB RAM
            writable: true
          })
          
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            value: 2, // 2 CPU cores
            writable: true
          })
          
          // Mock slow network
          if (navigator.connection) {
            Object.defineProperty(navigator.connection, 'effectiveType', {
              value: '2g',
              writable: true
            })
          }
          
          console.log('✅ Low-end device simulation active')
          console.log('💡 Refresh page to see performance warnings')
        },
        
        // Reset device simulation
        resetDeviceSimulation: () => {
          console.log('🔄 Resetting device simulation...')
          // Note: This requires a page refresh to fully reset
          localStorage.removeItem('trackdeni-dismissed-warnings')
          console.log('✅ Device simulation reset')
          console.log('💡 Refresh page to see normal device detection')
        },
        
        // Test performance warnings
        testPerformanceWarnings: () => {
          console.log('⚠️ Testing performance warnings...')
          localStorage.removeItem('trackdeni-dismissed-warnings')
          console.log('✅ Performance warnings reset')
          console.log('💡 Refresh page to see warnings again')
        },

        // Lite Mode Testing
        testLiteMode: async () => {
          const { logLiteModeStatus } = await import('./utils/deviceDetection.js')
          logLiteModeStatus()
        },
        
        simulateLiteModeDevice: () => {
          console.log('🔧 Simulating device that needs Lite Mode...')
          
          // Override device detection for Lite Mode testing
          Object.defineProperty(navigator, 'deviceMemory', {
            value: 1, // Very low memory
            writable: true
          })
          
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            value: 2, // Low CPU cores
            writable: true
          })
          
          // Clear existing lite mode preference to trigger auto-detection
          localStorage.removeItem('trackdeni-lite-mode')
          
          console.log('✅ Lite Mode device simulation active')
          console.log('💡 Refresh page to see Lite Mode auto-enable')
        },
        
        forceLiteMode: async () => {
          const { enableLiteMode } = await import('./utils/deviceDetection.js')
          enableLiteMode('Force enabled via dev tools')
          console.log('💡 Lite Mode force enabled')
          console.log('💡 Refresh page to see changes')
        },
        
        disableLiteMode: async () => {
          const { disableLiteMode } = await import('./utils/deviceDetection.js')
          disableLiteMode('Force disabled via dev tools')
          console.log('💡 Lite Mode force disabled')
          console.log('💡 Refresh page to see changes')
        },
        
        resetLiteMode: async () => {
          const { resetLiteModePreference } = await import('./utils/deviceDetection.js')
          resetLiteModePreference()
          console.log('🔄 Lite Mode preference reset')
          console.log('💡 Refresh page for auto-detection')
        },
        
        testLiteModeFlow: () => {
          console.log('🧪 Testing complete Lite Mode flow...')
          
          // Step 1: Reset everything
          localStorage.removeItem('trackdeni-lite-mode')
          localStorage.removeItem('trackdeni-dismissed-warnings')
          
          // Step 2: Simulate low-end device
          Object.defineProperty(navigator, 'deviceMemory', {
            value: 1,
            writable: true
          })
          
          console.log('✅ Test setup complete')
          console.log('💡 Refresh page to see:')
          console.log('   • Auto Lite Mode enablement')
          console.log('   • Lite Mode indicator')
          console.log('   • Performance optimizations')
        },

        // Pagination Testing
        addPaginationTestData: async (count = 30) => {
          const { addTestCustomersToStore } = await import('./utils/testData.js')
          const addedCount = await addTestCustomersToStore(count)
          console.log(`📄 Attempted to add ${count} test customers, successfully added ${addedCount}`)
          console.log('💡 Check customer list to see pagination controls')
        },
        
        testPagination: async () => {
          console.log('📄 Testing pagination...')
          
          // Clear existing customers to start fresh
          store.clearAllData()
          
          // Add enough customers to trigger pagination
          await window.trackDeniDev.addPaginationTestData(50)
          
          console.log('✅ Pagination test setup complete')
          console.log('💡 You should see:')
          console.log('   • 25 customers per page (normal mode)')
          console.log('   • 15 customers per page (Lite Mode)')
          console.log('   • Previous/Next buttons')
          console.log('   • Page indicator')
        },

        testLiteModeWithPagination: async () => {
          console.log('📄 Testing Lite Mode with pagination...')
          
          // Enable Lite Mode
          await window.trackDeniDev.forceLiteMode()
          
          // Add test data
          await window.trackDeniDev.addPaginationTestData(40)
          
          console.log('✅ Lite Mode pagination test setup complete')
          console.log('💡 You should see:')
          console.log('   • Lite Mode indicator active')
          console.log('   • 15 customers per page (smaller page size)')
          console.log('   • Pagination controls')
          console.log('💡 Refresh page to see changes')
        },

        // Storage Testing
        testStorageSystem: async () => {
          try {
            const { storage } = await import('./utils/storage.js')
            
            console.log('🗄️ Testing storage system...')
            
            // Get storage info
            const info = await storage.getStorageInfo()
            console.log('📊 Storage Info:', info)
            
            // Test simple write/read
            const testData = { test: 'data', timestamp: Date.now() }
            console.log('📝 Writing test data...')
            await storage.setData(testData)
            
            console.log('📖 Reading test data...')
            const readData = await storage.getData()
            console.log('📊 Read data:', readData)
            
            console.log('✅ Storage test complete')
          } catch (error) {
            console.error('❌ Storage test failed:', error)
          }
        },
        
        showStorageInfo: async () => {
          try {
            console.log('🗄️ Getting storage information...')
            const { storage } = await import('./utils/storage.js')
            
            console.log('📊 Waiting for storage initialization...')
            const info = await storage.getStorageInfo()
            
            console.log('🗄️ Storage System Information:')
            console.log(`  Type: ${info.type}`)
            console.log(`  Available: ${info.available}`)
            console.log(`  Capacity: ${info.capacity}`)
            console.log(`  Performance: ${info.performance}`)
            console.log(`  Features: ${info.features.join(', ')}`)
            
            if (info.type === 'IndexedDB') {
              console.log('✅ Using IndexedDB - Optimal performance!')
            } else {
              console.log('⚠️ Fallback to localStorage - Limited capacity')
            }
          } catch (error) {
            console.error('❌ Failed to get storage info:', error)
          }
        },

        migrateToIndexedDB: async () => {
          console.log('📦 Testing IndexedDB migration...')
          
          // Force re-initialization to test migration
          const { storage } = await import('./utils/storage.js')
          await storage.manager.migrateFromLocalStorage()
          
          console.log('✅ Migration test complete')
          console.log('💡 Check console for migration results')
        },

        testStoragePerformance: async () => {
          const { storage } = await import('./utils/storage.js')
          
          console.log('⚡ Testing storage performance with large dataset...')
          
          // Generate large test data
          const largeData = {
            customers: Array.from({ length: 100 }, (_, i) => ({
              id: `perf-test-${i}`,
              name: `Test Customer ${i}`,
              phone: `+254${700000000 + i}`,
              debts: Array.from({ length: 5 }, (_, j) => ({
                id: `debt-${i}-${j}`,
                amount: 1000 + (i * 100) + (j * 10),
                reason: `Test debt ${j}`,
                dateBorrowed: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                paid: false,
                payments: []
              }))
            })),
            userTier: 'pro',
            createdAt: new Date().toISOString()
          }
          
          console.log(`📊 Testing with ${largeData.customers.length} customers, ${largeData.customers.length * 5} debts`)
          
          // Test write performance
          const writeTime = await storage.measurePerformance(
            async (data) => await storage.setData(data),
            largeData
          )
          
          // Test read performance
          const readTime = await storage.measurePerformance(
            async () => await storage.getData(),
            null
          )
          
          console.log('✅ Performance test complete')
          console.log(`📊 Large dataset: Write ${writeTime.toFixed(2)}ms, Read ${readTime.toFixed(2)}ms`)
          
          // Clean up test data
          await storage.clearData()
          console.log('🧹 Test data cleared')
        },

        // Simple debug function
        debugStorage: async () => {
          console.log('🐛 Debug: Starting storage debug...')
          
          try {
            console.log('🐛 Debug: Checking IndexedDB availability...')
            console.log('IndexedDB available:', !!window.indexedDB)
            
            console.log('🐛 Debug: Importing storage module...')
            const storageModule = await import('./utils/storage.js')
            console.log('🐛 Debug: Storage module imported:', !!storageModule.storage)
            
            console.log('🐛 Debug: Accessing storage manager...')
            const manager = storageModule.storage.manager
            console.log('🐛 Debug: Manager available:', !!manager)
            console.log('🐛 Debug: Manager initialized:', manager.isIndexedDBAvailable)
            
            console.log('🐛 Debug: Testing basic operations...')
            await manager.ensureReady()
            console.log('🐛 Debug: Manager ready!')
            
            const info = await storageModule.storage.getStorageInfo()
            console.log('🐛 Debug: Storage info retrieved:', info)
            
          } catch (error) {
            console.error('🐛 Debug: Error occurred:', error)
            console.error('🐛 Debug: Error stack:', error.stack)
          }
        },

        // Performance Optimization Testing
        testPerformanceOptimizations: async () => {
          const { 
            getPerformancePreferences, 
            shouldReduceAnimations, 
            shouldSimplifyVisuals,
            getBundleOptimizationInfo 
          } = await import('./utils/performanceOptimizations.js')
          
          console.log('🚀 Performance Optimization Status:')
          console.log('📊 Preferences:', getPerformancePreferences())
          console.log('🎭 Reduce Animations:', shouldReduceAnimations())
          console.log('🎨 Simplify Visuals:', shouldSimplifyVisuals())
          console.log('📦 Bundle Optimizations:', getBundleOptimizationInfo())
        },

        toggleAnimations: async (setting = 'auto') => {
          const { setPerformancePreferences } = await import('./utils/performanceOptimizations.js')
          const prefs = setPerformancePreferences({ animations: setting })
          console.log(`🎭 Animations set to: ${setting}`)
          console.log('💡 New preferences:', prefs)
        },

        toggleVisualComplexity: async (setting = 'auto') => {
          const { setPerformancePreferences } = await import('./utils/performanceOptimizations.js')
          const prefs = setPerformancePreferences({ visualComplexity: setting })
          console.log(`🎨 Visual complexity set to: ${setting}`)
          console.log('💡 New preferences:', prefs)
        },

        testAnimationSettings: async () => {
          console.log('🎭 Testing animation settings...')
          
          await window.trackDeniDev.toggleAnimations('none')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await window.trackDeniDev.toggleAnimations('reduced')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await window.trackDeniDev.toggleAnimations('full')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await window.trackDeniDev.toggleAnimations('auto')
          console.log('✅ Animation settings test complete')
        }
      }
      
      // Add manual migration function for users whose data wasn't migrated during account creation
      window.trackDeniDev.manualMigrateToFirestore = async () => {
        try {
          const { manualMigrateToFirestore } = useDebtStore.getState()
          console.log('🔄 Starting manual migration...')
          const result = await manualMigrateToFirestore()
          
          if (result.success) {
            console.log('✅ Manual migration completed successfully!')
            console.log(`📊 Migration result: ${result.migratedCustomers} customers, ${result.migratedDebts} debts`)
            console.log(`💬 Message: ${result.message}`)
            
            // Refresh the page to show the updated data
            window.location.reload()
          } else {
            console.error('❌ Manual migration failed:', result.message)
          }
          
          return result
        } catch (error) {
          console.error('❌ Error during manual migration:', error)
          return { success: false, message: error.message }
        }
      }
      
      // Add debug function to check current local data
      window.trackDeniDev.debugLocalData = async () => {
        try {
          const { getLocalData } = await import('./firebase/dataSync.js')
          const localData = await getLocalData()
          
          if (localData && localData.customers) {
            console.log('📊 Local data found:', {
              customers: localData.customers.length,
              totalDebts: localData.customers.reduce((total, customer) => total + (customer.debts?.length || 0), 0)
            })
            console.log('📊 Detailed data:', localData)
          } else {
            console.log('📊 No local data found')
          }
          
          return localData
        } catch (error) {
          console.error('❌ Error checking local data:', error)
          return null
        }
      }

      // Add debug function to test real-time sync
      window.trackDeniDev.debugRealtimeSync = () => {
        const { isRealtimeSyncEnabled } = useDebtStore.getState()
        console.log('🔄 Real-time sync status:', {
          enabled: isRealtimeSyncEnabled,
          listeners: isRealtimeSyncEnabled ? 'Active' : 'Inactive'
        })
        return isRealtimeSyncEnabled
      }

      // Add enhanced migration function with better debugging
      window.trackDeniDev.debugMigration = async () => {
        try {
          // First check if user is authenticated
          const { auth } = await import('./firebase/config.js')
          if (!auth.currentUser) {
            console.log('❌ User not authenticated. Please log in first.')
            return { success: false, message: 'User not authenticated' }
          }

          // Check local data
          console.log('🔍 Step 1: Checking local data...')
          const localData = await window.trackDeniDev.debugLocalData()
          
          if (!localData || !localData.customers || localData.customers.length === 0) {
            console.log('📭 No local data to migrate')
            return { success: true, message: 'No local data to migrate' }
          }

          // Check cloud data
          console.log('🔍 Step 2: Checking cloud data...')
          const { collection, getDocs } = await import('firebase/firestore')
          const { db } = await import('./firebase/config.js')
          
          const customersRef = collection(db, 'users', auth.currentUser.uid, 'customers')
          const existingCustomers = await getDocs(customersRef)
          
          console.log('☁️ Cloud data found:', existingCustomers.size, 'customers')
          
          if (existingCustomers.size > 0) {
            console.log('⚠️ User already has cloud data, migration may not be needed')
            return { success: false, message: 'User already has cloud data' }
          }

          // Perform migration
          console.log('🔄 Step 3: Starting migration...')
          const result = await window.trackDeniDev.manualMigrateToFirestore()
          
          return result
        } catch (error) {
          console.error('❌ Debug migration error:', error)
          return { success: false, message: error.message }
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
      console.log('  trackDeniDev.testRateLimit() - ⏱️ Test rate limiting (rapid requests)')
      console.log('  trackDeniDev.testDocumentSizeLimits() - 📏 Test document size limits')
      console.log('  trackDeniDev.testDeviceDetection() - 📱 Test device detection and logging')
      console.log('  trackDeniDev.simulateLowEndDevice() - 🔧 Simulate low-end device')
      console.log('  trackDeniDev.resetDeviceSimulation() - 🔄 Reset device simulation')
      console.log('  trackDeniDev.testPerformanceWarnings() - ⚠️ Test performance warnings')
      console.log('  trackDeniDev.testLiteMode() - 📊 Test Lite Mode status')
      console.log('  trackDeniDev.simulateLiteModeDevice() - 🔧 Simulate Lite Mode device')
      console.log('  trackDeniDev.forceLiteMode() - 💡 Force Lite Mode on')
      console.log('  trackDeniDev.disableLiteMode() - 💡 Force Lite Mode off')
      console.log('  trackDeniDev.resetLiteMode() - 🔄 Reset Lite Mode preference')
      console.log('  trackDeniDev.testLiteModeFlow() - 🧪 Test complete Lite Mode flow')
      console.log('  trackDeniDev.addPaginationTestData(30) - 📄 Add test customers for pagination')
      console.log('  trackDeniDev.testPagination() - 📄 Test pagination with 50 customers')
      console.log('  trackDeniDev.testLiteModeWithPagination() - 📄 Test Lite Mode pagination')
      console.log('  trackDeniDev.testStorageSystem() - 🗄️ Test IndexedDB storage system')
      console.log('  trackDeniDev.showStorageInfo() - 🗄️ Show storage system information')
      console.log('  trackDeniDev.migrateToIndexedDB() - 📦 Test data migration')
      console.log('  trackDeniDev.testStoragePerformance() - ⚡ Test storage performance')
      console.log('  trackDeniDev.debugStorage() - 🐛 Debug storage system issues')
      console.log('  trackDeniDev.testPerformanceOptimizations() - 🚀 Test performance optimizations')
      console.log('  trackDeniDev.toggleAnimations("none"|"reduced"|"full"|"auto") - 🎭 Test animation settings')
      console.log('  trackDeniDev.toggleVisualComplexity("simple"|"standard"|"rich"|"auto") - 🎨 Test visual settings')
      console.log('  trackDeniDev.testAnimationSettings() - 🎭 Test all animation settings')
      console.log('  trackDeniDev.debugLocalData() - 📊 Debug local data')
      console.log('  trackDeniDev.debugRealtimeSync() - 🔄 Test real-time sync status')
      console.log('  trackDeniDev.debugMigration() - 🔄 Enhanced debug migration')
    }
  }, [])

  const navigateToHome = () => {
    setCurrentPage('home')
    setSelectedCustomerId(null)
    setIsNewCustomerFlow(false)
  }

  const navigateToAddDebt = (customerId = null, isNewCustomer = false) => {
    setSelectedCustomerId(customerId)
    setIsNewCustomerFlow(isNewCustomer)
    setCurrentPage('add-debt')
  }

  const navigateToCustomer = (customer, action = 'view') => {
    if (action === 'add-debt') {
      navigateToAddDebt(customer.id, false)
    } else {
      setSelectedCustomerId(customer.id)
      setCurrentPage('customer-detail')
    }
  }

  const handleDebtSuccess = (customerId) => {
    // Navigate based on the flow type
    if (customerId && !isNewCustomerFlow) {
      // Existing customer + debt → go to customer detail page
      setSelectedCustomerId(customerId)
      setCurrentPage('customer-detail')
    } else {
      // New customer + debt OR no customer → go to home page
    navigateToHome()
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('trackdeni-has-seen-intro', 'true')
  }

  const renderCurrentPage = (user, signIn, signOut) => {
    switch (currentPage) {
      case 'home':
        return (
          <Suspense fallback={<PageLoadingFallback message="Loading dashboard..." />}>
            <Home 
              onNavigateToAddDebt={navigateToAddDebt}
              onNavigateToCustomer={navigateToCustomer}
              user={user}
              signIn={signIn}
              signOut={signOut}
            />
          </Suspense>
        )
      case 'add-debt':
        return (
          <Suspense fallback={<PageLoadingFallback message="Loading form..." />}>
          <AddDebt
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onSuccess={handleDebtSuccess}
              user={user}
              signIn={signIn}
              signOut={signOut}
          />
          </Suspense>
        )
      case 'customer-detail':
        return (
          <Suspense fallback={<PageLoadingFallback message="Loading customer..." />}>
          <CustomerDetail
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onNavigateToAddDebt={navigateToAddDebt}
              user={user}
              signIn={signIn}
              signOut={signOut}
          />
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<PageLoadingFallback message="Loading..." />}>
          <Home
            onNavigateToAddDebt={navigateToAddDebt}
            onNavigateToCustomer={navigateToCustomer}
              user={user}
              signIn={signIn}
              signOut={signOut}
          />
          </Suspense>
        )
    }
  }

  if (isLoading) {
    return <LoadingFallback message="Initializing TrackDeni..." />
  }

  if (showOnboarding) {
    return (
      <Suspense fallback={<LoadingFallback message="Loading onboarding..." />}>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </Suspense>
    )
  }

  return (
    <AuthGuard>
      {({ user, signIn, signOut }) => (
        <>
          {renderCurrentPage(user, signIn, signOut)}
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
          
          {/* Offline Indicator */}
          <OfflineIndicator />
        </>
      )}
    </AuthGuard>
  )
}

export default App
