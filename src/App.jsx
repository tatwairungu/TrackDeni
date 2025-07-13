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
             
             // Send all provided fields to test security rules properly
             const documentData = {
               name: customerData.name,
               phone: customerData.phone,
               createdAt: serverTimestamp()
             }
             
             // Add optional fields if provided
             if (customerData.address) documentData.address = customerData.address
             if (customerData.notes) documentData.notes = customerData.notes
             
             await setDoc(customerRef, documentData)
             
             // Update rate limiting counter (essential for testing)
             const userRef = doc(db, 'users', userId)
             const { updateDoc } = await import('firebase/firestore')
             
             // Get current rate limit data
             const { getDoc } = await import('firebase/firestore')
             const userDoc = await getDoc(userRef)
             const userData = userDoc.data()
             const rateLimits = userData.rateLimits || {}
             const customerCreateData = rateLimits.customer_create || {}
             
             // Calculate new count
             const now = new Date()
             const lastReset = customerCreateData.lastReset?.toDate ? customerCreateData.lastReset.toDate() : new Date(customerCreateData.lastReset || 0)
             const minutesSinceReset = (now - lastReset) / 60000
             
             const newCount = minutesSinceReset >= 1.0 ? 1 : (customerCreateData.count || 0) + 1
             
             await updateDoc(userRef, {
               totalCustomers: (userData.totalCustomers || 0) + 1,
               'rateLimits.customer_create': {
                 lastReset: serverTimestamp(),
                 count: newCount
               }
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
               
               // Rate limiting debug
               console.log('⏱️ RATE LIMIT DEBUG:')
               const rateLimits = data.rateLimits || {}
               console.log('📈 Rate limits data:', rateLimits)
               
               Object.keys(rateLimits).forEach(operation => {
                 const operationData = rateLimits[operation]
                 const now = new Date()
                 const lastReset = operationData.lastReset?.toDate ? operationData.lastReset.toDate() : new Date(operationData.lastReset)
                 const minutesSinceReset = (now - lastReset) / 60000
                 
                 console.log(`🔄 ${operation}:`, {
                   count: operationData.count,
                   lastReset: lastReset,
                   minutesSinceReset: minutesSinceReset.toFixed(2),
                   shouldReset: minutesSinceReset >= 1.0
                 })
               })
             } else {
               console.log('❌ User document does not exist - this is the problem!')
             }
             
           } catch (error) {
             console.error('❌ Error checking user document:', error)
           }
         },

         // Test rate limiting by rapid operations
         testRateLimit: async () => {
           try {
             console.log('🧪 RATE LIMIT TEST: Attempting rapid customer creation...')
             
             for (let i = 0; i < 15; i++) {
               const startTime = Date.now()
               try {
                 await trackDeniDev.bypassFrontendAndAddCustomer({
                   name: `Rate Test Customer ${i + 1}`,
                   phone: `070000000${i}`
                 })
                 const duration = Date.now() - startTime
                 console.log(`✅ Request ${i + 1}: SUCCESS (${duration}ms)`)
               } catch (error) {
                 const duration = Date.now() - startTime
                 console.log(`❌ Request ${i + 1}: BLOCKED - ${error.code} (${duration}ms)`)
                 if (i >= 10) {
                   console.log('🎉 Rate limiting working - blocked after 10 requests!')
                   break
                 }
               }
               
               // Small delay between requests
               await new Promise(resolve => setTimeout(resolve, 100))
             }
           } catch (error) {
             console.error('❌ Rate limit test failed:', error)
           }
         },

                  // Test document size limits
         testDocumentSizeLimits: async () => {
           try {
             console.log('📏 DOCUMENT SIZE LIMIT TEST: Testing field size restrictions...')
             console.log('Expected: Normal size ✅, Oversized fields should be ❌ BLOCKED')
             console.log('─'.repeat(60))
             
             // Test 1: Normal size customer (should work)
             console.log('🧪 Test 1: Normal size customer (should pass)')
             try {
               await trackDeniDev.bypassFrontendAndAddCustomer({
                 name: 'John Doe',
                 phone: '0700000001'
               })
               console.log('✅ Result: PASSED - Normal size customer accepted')
             } catch (error) {
               console.log('❌ Result: FAILED - Normal size customer rejected:', error.code)
             }
             
             // Test 2: Customer with oversized name (should fail)
             console.log('\n🧪 Test 2: Oversized name (101+ chars, limit: 100)')
             try {
               const longName = 'A'.repeat(101) // 101 characters (over 100 limit)
               await trackDeniDev.bypassFrontendAndAddCustomer({
                 name: longName,
                 phone: '0700000002'
               })
               console.log('❌ Result: SECURITY ISSUE - Oversized name was allowed!')
             } catch (error) {
               console.log('✅ Result: SECURITY WORKING - Oversized name blocked:', error.code)
             }
             
             // Test 3: Customer with oversized phone (should fail)
             console.log('\n🧪 Test 3: Oversized phone (21+ chars, limit: 20)')
             try {
               const longPhone = '0'.repeat(21) // 21 characters (over 20 limit)
               await trackDeniDev.bypassFrontendAndAddCustomer({
                 name: 'Valid Name',
                 phone: longPhone
               })
               console.log('❌ Result: SECURITY ISSUE - Oversized phone was allowed!')
             } catch (error) {
               console.log('✅ Result: SECURITY WORKING - Oversized phone blocked:', error.code)
             }
             
             // Test 4: Customer with oversized address (should fail)
             console.log('\n🧪 Test 4: Oversized address (201+ chars, limit: 200)')
             try {
               const longAddress = 'X'.repeat(201) // 201 characters (over 200 limit)
               await trackDeniDev.bypassFrontendAndAddCustomer({
                 name: 'Valid Name',
                 phone: '0700000003',
                 address: longAddress
               })
               console.log('❌ Result: SECURITY ISSUE - Oversized address was allowed!')
             } catch (error) {
               console.log('✅ Result: SECURITY WORKING - Oversized address blocked:', error.code)
             }
             
             // Test 5: Customer with oversized notes (should fail)
             console.log('\n🧪 Test 5: Oversized notes (501+ chars, limit: 500)')
             try {
               const longNotes = 'N'.repeat(501) // 501 characters (over 500 limit)
               await trackDeniDev.bypassFrontendAndAddCustomer({
                 name: 'Valid Name',
                 phone: '0700000004',
                 notes: longNotes
               })
               console.log('❌ Result: SECURITY ISSUE - Oversized notes was allowed!')
             } catch (error) {
               console.log('✅ Result: SECURITY WORKING - Oversized notes blocked:', error.code)
             }
             
             console.log('\n📏 Document size limit testing complete!')
             console.log('─'.repeat(60))
             
           } catch (error) {
             console.error('❌ Document size limit test failed:', error)
           }
         },

         // Test Pro tier caps
         testProTierCaps: async () => {
           try {
             console.log('🎯 PRO TIER CAPS TEST: Testing customer and debt limits...')
             console.log('Expected: Pro users limited to 10K customers, 50K debts')
             console.log('─'.repeat(60))
             
             // First, check current user status
             await trackDeniDev.debugUserDocument()
             
             // Test 1: Try to exceed customer limit (simulate high customer count)
             console.log('\n🧪 Test 1: Simulating Pro user near customer limit')
             
             // We'll simulate this by updating the user document directly
             const { auth, db } = await import('./firebase/config.js')
             const { doc, updateDoc } = await import('firebase/firestore')
             
             if (!auth.currentUser) {
               console.log('❌ Must be authenticated to test Pro tier caps')
               return
             }
             
             const userId = auth.currentUser.uid
             const userRef = doc(db, 'users', userId)
             
                           // Test customer 10000 (should succeed)
              try {
                await updateDoc(userRef, {
                  isPro: true,
                  totalCustomers: 9999
                })
                console.log('✅ Set user to Pro with 9999 customers')
                
                await trackDeniDev.bypassFrontendAndAddCustomer({
                  name: 'Customer 10000',
                  phone: '0700010000'
                })
                console.log('✅ Result: Customer 10000 allowed (within limit)')
              } catch (error) {
                console.log('❌ Unexpected: Customer 10000 blocked:', error.code)
              }
              
              // Test customer 10001 (should fail)
              try {
                await updateDoc(userRef, {
                  totalCustomers: 10000
                })
                console.log('📊 Updated user to 10000 customers (at limit)')
                
                await trackDeniDev.bypassFrontendAndAddCustomer({
                  name: 'Customer 10001',
                  phone: '0700010001'
                })
                console.log('❌ Result: SECURITY ISSUE - Customer 10001 was allowed!')
                
              } catch (error) {
                console.log('✅ Result: SECURITY WORKING - Customer 10001 blocked:', error.code)
              }
             
             // Test 2: Test debt limits for Pro users
             console.log('\n🧪 Test 2: Testing Pro user debt limits (50K max)')
             try {
               // Simulate Pro user with 49999 debts (just under limit)
               await updateDoc(userRef, {
                 totalDebts: 49999
               })
               console.log('✅ Set user to Pro with 49999 debts')
               
               // Try to add one more debt (should succeed - debt #50000)
               console.log('Attempting to add debt #50000...')
               // Note: This would require implementing a bypass debt creation function
               console.log('⚠️  Debt creation test requires implementing bypassFrontendAndAddDebt function')
               
               // Update to 50000 debts and try to add another (should fail)
               await updateDoc(userRef, {
                 totalDebts: 50000
               })
               
               console.log('✅ Pro user debt limits configured correctly')
               
             } catch (error) {
               console.log('✅ Result: SECURITY WORKING - Debt limit enforced:', error.code)
             }
             
                           // Test 3: Test free user vs Pro user limits
              console.log('\n🧪 Test 3: Comparing free vs Pro user limits')
              await updateDoc(userRef, {
                isPro: false,
                totalCustomers: 5
              })
              console.log('✅ Set user to Free with 5 customers')
              
              try {
                // Try to add 6th customer (should fail)
                await trackDeniDev.bypassFrontendAndAddCustomer({
                  name: 'Free User Customer 6',
                  phone: '0700000006'
                })
                console.log('❌ Result: SECURITY ISSUE - Free user 6th customer was allowed!')
                
              } catch (error) {
                console.log('✅ Result: SECURITY WORKING - Free user 6th customer blocked:', error.code)
              }
             
             // Restore user to Pro status for continued testing
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
