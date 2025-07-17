import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from './config'

// Validation Schema (from the guide)
const ValidationSchema = {
  Customer: {
    name: { type: 'string', required: true, maxLength: 100, minLength: 1 },
    phone: { type: 'string', required: false },
    createdAt: { type: 'string', required: false } // Can be string or date in local data
  },
  
  // Local debt schema (before migration - no customerId yet)
  LocalDebt: {
    amount: { type: 'number', required: true, min: 0 },
    reason: { type: 'string', required: false, maxLength: 200 }, // Optional in local data
    dateBorrowed: { type: 'string', required: false }, // Can be string or date in local data
    paid: { type: 'boolean', required: true }
  },
  
  // Firestore debt schema (after migration - has customerId)
  FirestoreDebt: {
    customerId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 0 },
    reason: { type: 'string', required: true, maxLength: 200 },
    dateBorrowed: { type: 'date', required: true },
    paid: { type: 'boolean', required: true }
  },
  
  LocalData: {
    customers: { type: 'array', required: true }
  }
}

// Data validation function
const validateData = (data, schema) => {
  const errors = []
  
  Object.keys(schema).forEach(field => {
    const fieldSchema = schema[field]
    const value = data[field]
    
    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push(`Field '${field}' is required`)
      return
    }
    
    // Skip validation if field is optional and not provided
    if (!fieldSchema.required && (value === undefined || value === null)) {
      return
    }
    
    // Type validation
    if (fieldSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`Field '${field}' must be a string`)
    }
    
    if (fieldSchema.type === 'number' && typeof value !== 'number') {
      errors.push(`Field '${field}' must be a number`)
    }
    
    if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Field '${field}' must be a boolean`)
    }
    
    if (fieldSchema.type === 'array' && !Array.isArray(value)) {
      errors.push(`Field '${field}' must be an array`)
    }
    
    // Date validation (accepts string dates or Date objects)
    if (fieldSchema.type === 'date' && !(typeof value === 'string' || value instanceof Date)) {
      errors.push(`Field '${field}' must be a date string or Date object`)
    }
    
    // String validations
    if (fieldSchema.type === 'string' && typeof value === 'string') {
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push(`Field '${field}' must be at most ${fieldSchema.maxLength} characters`)
      }
      
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push(`Field '${field}' must be at least ${fieldSchema.minLength} characters`)
      }
    }
    
    // Number validations
    if (fieldSchema.type === 'number' && typeof value === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push(`Field '${field}' must be at least ${fieldSchema.min}`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Migration utilities (following the guide's recommendations)
const migrationUtils = {
  validateMigration: (localData) => {
    // Check data integrity before migration
    console.log('🔍 Validating migration data...')
    
    if (!localData) {
      throw new Error('No local data provided for migration')
    }
    
    // Validate main data structure
    const dataValidation = validateData(localData, ValidationSchema.LocalData)
    if (!dataValidation.isValid) {
      throw new Error(`Invalid local data structure: ${dataValidation.errors.join(', ')}`)
    }
    
    // Validate each customer
    localData.customers.forEach((customer, index) => {
      console.log(`🔍 Validating customer ${index}:`, customer)
      const customerValidation = validateData(customer, ValidationSchema.Customer)
      if (!customerValidation.isValid) {
        console.error(`❌ Customer validation failed:`, customerValidation.errors)
        throw new Error(`Invalid customer data at index ${index}: ${customerValidation.errors.join(', ')}`)
      }
      
      // Validate each debt for this customer (using LocalDebt schema)
      if (customer.debts && customer.debts.length > 0) {
        customer.debts.forEach((debt, debtIndex) => {
          console.log(`🔍 Validating debt ${debtIndex} for customer ${index}:`, debt)
          const debtValidation = validateData(debt, ValidationSchema.LocalDebt)
          if (!debtValidation.isValid) {
            console.error(`❌ Debt validation failed:`, debtValidation.errors)
            throw new Error(`Invalid debt data at customer ${index}, debt ${debtIndex}: ${debtValidation.errors.join(', ')}`)
          }
        })
      }
    })
    
    console.log('✅ Migration data validation passed')
    return true
  },
  
  createBackup: (localData) => {
    // Create backup before migration
    console.log('💾 Creating backup before migration...')
    
    const backup = {
      data: localData,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    try {
      localStorage.setItem('trackdeni-backup', JSON.stringify(backup))
      console.log('✅ Backup created successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to create backup:', error)
      throw new Error('Failed to create backup before migration')
    }
  },
  
  rollbackOnError: () => {
    // Rollback mechanism if migration fails
    console.log('🔄 Rolling back from backup...')
    
    try {
      const backup = localStorage.getItem('trackdeni-backup')
      if (backup) {
        const parsedBackup = JSON.parse(backup)
        
        // Fix rollback: Save data in correct format with state wrapper
        const rollbackData = {
          state: parsedBackup.data,
          version: 1
        }
        
        localStorage.setItem('trackdeni-storage', JSON.stringify(rollbackData))
        console.log('🔄 Data rolled back from backup successfully')
        return true
      } else {
        console.warn('⚠️ No backup found for rollback')
        return false
      }
    } catch (error) {
      console.error('❌ Failed to rollback from backup:', error)
      return false
    }
  },

  // Enhanced debugging utilities
  debugMigration: (localData, step) => {
    console.log(`🔍 Migration Debug - Step: ${step}`)
    console.log('Local Data Structure:', {
      hasData: !!localData,
      hasCustomers: !!(localData && localData.customers),
      customersCount: localData && localData.customers ? localData.customers.length : 0,
      customerSample: localData && localData.customers && localData.customers.length > 0 ? localData.customers[0] : null,
      hasUserTier: !!(localData && localData.userTier),
      userTier: localData && localData.userTier,
      hasError: !!(localData && localData.error)
    })
    
    if (localData && localData.customers) {
      localData.customers.forEach((customer, index) => {
        console.log(`Customer ${index}:`, {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          debtsCount: customer.debts ? customer.debts.length : 0,
          debtsStructure: customer.debts && customer.debts.length > 0 ? customer.debts[0] : null
        })
      })
    }
  },

  // Step-by-step validation
  validateMigrationStep: (localData, step) => {
    console.log(`✅ Migration Step ${step} Validation:`)
    
    switch (step) {
      case 'data-structure':
        const hasValidStructure = localData && localData.customers && Array.isArray(localData.customers)
        console.log('- Data structure valid:', hasValidStructure)
        return hasValidStructure
        
      case 'customers':
        const customersValid = localData.customers.every(customer => 
          customer.id && customer.name && typeof customer.name === 'string'
        )
        console.log('- All customers valid:', customersValid)
        return customersValid
        
      case 'debts':
        let allDebtsValid = true
        localData.customers.forEach(customer => {
          if (customer.debts && customer.debts.length > 0) {
            const customerDebtsValid = customer.debts.every(debt => 
              debt.id && typeof debt.amount === 'number' && debt.amount >= 0
            )
            if (!customerDebtsValid) allDebtsValid = false
          }
        })
        console.log('- All debts valid:', allDebtsValid)
        return allDebtsValid
        
      default:
        return true
    }
  },
  
  calculateCustomerSummary: (customer) => {
    // Calculate denormalized data for customer
    let totalOwed = 0
    let totalPaid = 0
    let activeDebts = 0
    
    if (customer.debts && customer.debts.length > 0) {
      customer.debts.forEach(debt => {
        if (debt.paid) {
          totalPaid += debt.amount
        } else {
          totalOwed += debt.amount
          activeDebts += 1
        }
        
        // Add payments to totalPaid
        if (debt.payments && debt.payments.length > 0) {
          const paymentsTotal = debt.payments.reduce((sum, payment) => sum + payment.amount, 0)
          totalPaid += paymentsTotal
          
          // Adjust totalOwed for partial payments
          if (!debt.paid) {
            totalOwed = Math.max(0, totalOwed - paymentsTotal)
          }
        }
      })
    }
    
    return { totalOwed, totalPaid, activeDebts }
  },
  
  calculateUserSummary: (customers) => {
    // Calculate denormalized data for user
    let totalCustomers = customers.length
    let totalOwed = 0
    let totalPaid = 0
    
    customers.forEach(customer => {
      const summary = migrationUtils.calculateCustomerSummary(customer)
      totalOwed += summary.totalOwed
      totalPaid += summary.totalPaid
    })
    
    return { totalCustomers, totalOwed, totalPaid }
  },
  
  migrateToFirestore: async (localData, userId) => {
    console.log('🔄 Starting migration to Firestore...')
    
    try {
      // Step 1: Enhanced debugging
      migrationUtils.debugMigration(localData, 'pre-validation')
      
      // Step 2: Step-by-step validation
      migrationUtils.validateMigrationStep(localData, 'data-structure')
      migrationUtils.validateMigrationStep(localData, 'customers')
      migrationUtils.validateMigrationStep(localData, 'debts')
      
      // Step 3: Validate data first
      migrationUtils.validateMigration(localData)
      
      // Step 4: Create backup
      migrationUtils.createBackup(localData)
      
      // Step 5: Use batch writes for consistency
      const batch = writeBatch(db)
      const userRef = doc(db, 'users', userId)
      
      // Step 6: Calculate user summary
      const userSummary = migrationUtils.calculateUserSummary(localData.customers)
      
      // Step 7: Migrate user data with denormalized totals
      batch.set(userRef, {
        totalCustomers: userSummary.totalCustomers,
        totalOwed: userSummary.totalOwed,
        totalPaid: userSummary.totalPaid,
        lastActive: serverTimestamp(),
        migratedAt: serverTimestamp()
      }, { merge: true })
      
      let migratedCustomers = 0
      let migratedDebts = 0
      
      // Step 8: Migrate customers and debts
      localData.customers.forEach(customer => {
        migrationUtils.debugMigration(customer, `customer-${migratedCustomers}`)
        
        const customerRef = doc(db, 'users', userId, 'customers', customer.id)
        const customerSummary = migrationUtils.calculateCustomerSummary(customer)
        
        // Migrate customer with denormalized data
        batch.set(customerRef, {
          name: customer.name,
          phone: customer.phone || null,
          createdAt: customer.createdAt ? new Date(customer.createdAt) : serverTimestamp(),
          totalOwed: customerSummary.totalOwed,
          totalPaid: customerSummary.totalPaid,
          activeDebts: customerSummary.activeDebts,
          status: customerSummary.activeDebts > 0 ? 'active' : 'paid_up',
          lastPaymentDate: null, // Will be updated when payments are processed
          migratedAt: serverTimestamp()
        })
        
        migratedCustomers++
        
        // Migrate debts for this customer
        if (customer.debts && customer.debts.length > 0) {
          customer.debts.forEach(debt => {
            const debtRef = doc(db, 'users', userId, 'debts', debt.id)
            
            batch.set(debtRef, {
              customerId: customer.id,
              customerName: customer.name, // Denormalized for search
              amount: debt.amount,
              reason: debt.reason || 'Migrated from local storage',
              dateBorrowed: debt.dateBorrowed ? new Date(debt.dateBorrowed) : serverTimestamp(),
              dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
              status: debt.paid ? 'paid' : 'unpaid',
              payments: debt.payments || [],
              createdAt: debt.createdAt ? new Date(debt.createdAt) : serverTimestamp(),
              migratedAt: serverTimestamp()
            })
            
            migratedDebts++
          })
        }
      })
      
      // Step 9: Commit all changes
      await batch.commit()
      
      // Step 10: Final validation
      console.log(`✅ Migration completed successfully: ${migratedCustomers} customers, ${migratedDebts} debts`)
      
      return { migratedCustomers, migratedDebts }
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      
      // Step 11: Rollback on error
      const rollbackSuccess = migrationUtils.rollbackOnError()
      
      throw new Error(`Migration failed: ${error.message}${rollbackSuccess ? ' (Data restored from backup)' : ' (Rollback also failed)'}`)
    }
  }
}

// Main migration function
const migrateLocalDataToFirestore = async (userId) => {
  try {
    console.log('🔄 Starting local data migration for user:', userId)
    
    // Get local data from localStorage
    const localData = await getLocalData()
    if (!localData || !localData.customers || localData.customers.length === 0) {
      console.log('📭 No local data to migrate')
      return { success: true, migratedCustomers: 0, migratedDebts: 0 }
    }
    
    // Use the enhanced migration utilities
    const result = await migrationUtils.migrateToFirestore(localData, userId)
    
    // Clear local data after successful migration
    await clearLocalData()
    
    return { 
      success: true, 
      migratedCustomers: result.migratedCustomers, 
      migratedDebts: result.migratedDebts 
    }
    
  } catch (error) {
    console.error('❌ Error migrating local data:', error)
    return { 
      success: false, 
      error: error.message,
      migratedCustomers: 0,
      migratedDebts: 0
    }
  }
}

// Sync Firestore data to local store (when user signs in)
const syncFirestoreToLocal = async (userId) => {
  try {
    console.log('🔄 Syncing Firestore data to local for user:', userId)
    
    // Get current local data before sync
    const existingLocalData = await getLocalData()
    const hasLocalData = existingLocalData && existingLocalData.customers && existingLocalData.customers.length > 0
    
    // Get customers from Firestore
    const customersRef = collection(db, 'users', userId, 'customers')
    const customersSnapshot = await getDocs(customersRef)
    
    // Get debts from Firestore
    const debtsRef = collection(db, 'users', userId, 'debts')
    const debtsSnapshot = await getDocs(debtsRef)
    
    // Build cloud data structure
    const cloudCustomers = []
    const debtsMap = new Map()
    
    // Group debts by customer
    debtsSnapshot.forEach(doc => {
      const debt = { id: doc.id, ...doc.data() }
      const customerId = debt.customerId
      
      if (!debtsMap.has(customerId)) {
        debtsMap.set(customerId, [])
      }
      debtsMap.get(customerId).push({
        id: debt.id,
        amount: debt.amount,
        reason: debt.reason,
        dateBorrowed: debt.dateBorrowed?.toDate?.()?.toISOString() || debt.dateBorrowed,
        dueDate: debt.dueDate?.toDate?.()?.toISOString() || debt.dueDate,
        paid: debt.status === 'paid',
        payments: debt.payments || [],
        createdAt: debt.createdAt?.toDate?.()?.toISOString() || debt.createdAt
      })
    })
    
    // Build customers array
    customersSnapshot.forEach(doc => {
      const customer = { id: doc.id, ...doc.data() }
      cloudCustomers.push({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        debts: debtsMap.get(customer.id) || [],
        createdAt: customer.createdAt?.toDate?.()?.toISOString() || customer.createdAt
      })
    })
    
    const hasCloudData = cloudCustomers.length > 0
    
    console.log('📊 Data sync check:', {
      hasLocalData,
      localCustomers: hasLocalData ? existingLocalData.customers.length : 0,
      hasCloudData,
      cloudCustomers: cloudCustomers.length
    })
    
    // SIMPLIFIED LOGIC: Prioritize cloud data when user logs in (expected behavior)
    if (hasCloudData) {
      console.log('☁️ Loading user\'s cloud data')
      
      // If there's conflicting local data, show a quick notification
      if (hasLocalData) {
        console.log('⚠️ Replacing local data with user\'s cloud data')
      }
      
      // Always load the user's cloud data when they log in
      await replaceLocalWithCloud(cloudCustomers)
      return { success: true, customers: cloudCustomers.length, action: 'loaded_cloud' }
    } else if (hasLocalData) {
      console.log('💾 No cloud data, keeping local data for potential migration')
      // No cloud data, keep local data but mark it for potential migration
      return { success: true, customers: existingLocalData.customers.length, action: 'kept_local' }
    } else {
      console.log('📭 No data to sync - fresh start')
      // No data at all - clear everything to ensure clean state
      await clearStoreData()
      return { success: true, customers: 0, action: 'no_data' }
    }
    
  } catch (error) {
    console.error('❌ Error syncing Firestore data:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to replace local data with cloud data
const replaceLocalWithCloud = async (cloudCustomers) => {
  // Update local store data
  const localData = {
    customers: cloudCustomers,
    userTier: 'free', // Default tier
    showUpgradePrompt: false,
    showProWelcome: false
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('trackdeni-storage', JSON.stringify({
    state: localData,
    version: 1
  }))
  
  // Update Zustand store directly so UI reflects the synced data
  const { default: useDebtStore } = await import('../store/useDebtStore.js')
  const store = useDebtStore.getState()
  
  // Update the store with cloud data
  store.loadCustomers(cloudCustomers)
  
  console.log(`✅ Local data replaced with cloud data: ${cloudCustomers.length} customers`)
}

// Helper function to clear store data
const clearStoreData = async () => {
  // Clear localStorage
  localStorage.removeItem('trackdeni-storage')
  
  // Update Zustand store to empty state
  const { default: useDebtStore } = await import('../store/useDebtStore.js')
  const store = useDebtStore.getState()
  
  // Clear the store
  store.loadCustomers([])
  
  console.log('🗑️ Store data cleared for fresh start')
}

// Helper functions
const getLocalData = async () => {
  try {
    // Fix: Use the storage utility instead of directly accessing localStorage
    // This ensures we check both IndexedDB and localStorage properly
    const { storage } = await import('../utils/storage.js')
    const data = await storage.getData()
    
    console.log('🔍 getLocalData() - Raw storage data:', data)
    
    if (data) {
      // Handle both direct data format and Zustand state wrapper format
      if (data.customers) {
        console.log('📊 Found direct data format with customers:', data.customers.length)
        return data // Direct data format
      } else if (data.state && data.state.customers) {
        console.log('📊 Found Zustand state format with customers:', data.state.customers.length)
        return data.state // Zustand persistence format
      }
    }
    
    console.log('📭 No local data found in storage')
    return null
  } catch (error) {
    console.error('❌ Error reading local data:', error)
    return null
  }
}

const clearLocalData = async () => {
  try {
    // Fix: Use the storage utility instead of directly accessing localStorage
    const { storage } = await import('../utils/storage.js')
    await storage.clearData()
    console.log('🗑️ Local data cleared after migration')
  } catch (error) {
    console.error('Error clearing local data:', error)
  }
}

// Comprehensive user data clearing function for logout security
const clearUserData = async () => {
  try {
    console.log('🗑️ Starting comprehensive user data clearing...')
    
    // Clear localStorage
    localStorage.removeItem('trackdeni-storage')
    localStorage.removeItem('trackdeni-backup')
    localStorage.removeItem('trackdeni-lite-mode')
    localStorage.removeItem('trackdeni-onboarding')
    localStorage.removeItem('trackdeni-tutorial')
    
    // Clear IndexedDB
    const { storage } = await import('../utils/storage.js')
    await storage.clearData()
    
    // Clear Zustand store state using the store's own clearUserData method
    const { default: useDebtStore } = await import('../store/useDebtStore.js')
    const store = useDebtStore.getState()
    
    // Use the store's comprehensive clearUserData method
    store.clearUserData()
    
    console.log('✅ User data cleared successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error clearing user data:', error)
    return { success: false, error: error.message }
  }
}

// Firestore user document inspector for debugging
const inspectUserDocument = async (userId) => {
  try {
    console.log('🔍 Inspecting user document for:', userId)
    
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = await import('./config.js')
    
    // Get user document
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log('📄 User Document:', userData)
      
      // Get customers collection
      const { collection, getDocs } = await import('firebase/firestore')
      const customersRef = collection(db, 'users', userId, 'customers')
      const customersSnapshot = await getDocs(customersRef)
      
      const customers = []
      customersSnapshot.forEach(doc => {
        customers.push({ id: doc.id, ...doc.data() })
      })
      
      console.log('👥 Customers Collection:', customers)
      
      // Get debts collection
      const debtsRef = collection(db, 'users', userId, 'debts')
      const debtsSnapshot = await getDocs(debtsRef)
      
      const debts = []
      debtsSnapshot.forEach(doc => {
        debts.push({ id: doc.id, ...doc.data() })
      })
      
      console.log('💰 Debts Collection:', debts)
      
      return {
        user: userData,
        customers: customers,
        debts: debts,
        summary: {
          totalCustomers: customers.length,
          totalDebts: debts.length,
          userDocTotalCustomers: userData.totalCustomers || 0,
          userDocTotalDebts: userData.totalDebts || 0
        }
      }
    } else {
      console.log('❌ User document not found')
      return null
    }
  } catch (error) {
    console.error('❌ Error inspecting user document:', error)
    return { error: error.message }
  }
}

// Comprehensive debug tools for testing migration and logout fixes
const debugTools = {
  // Test migration functionality
  testMigrationFlow: async () => {
    console.log('🧪 Testing Migration Flow...')
    
    // Create test data
    const testData = {
      customers: [
        {
          id: 'test-customer-1',
          name: 'Test Customer 1',
          phone: '0700000001',
          debts: [
            {
              id: 'test-debt-1',
              amount: 1000,
              reason: 'Test debt',
              dateBorrowed: new Date().toISOString(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              paid: false,
              payments: [],
              createdAt: new Date().toISOString(),
            }
          ],
          createdAt: new Date().toISOString(),
        }
      ],
      userTier: 'free',
      showUpgradePrompt: false,
      showProWelcome: false
    }
    
    // Step 1: Save test data to localStorage
    localStorage.setItem('trackdeni-storage', JSON.stringify({ state: testData, version: 1 }))
    console.log('✅ Test data saved to localStorage')
    
    // Step 2: Test data retrieval
    const retrievedData = await getLocalData()
    console.log('📊 Retrieved data:', retrievedData)
    
    // Step 3: Test migration validation
    try {
      migrationUtils.validateMigration(retrievedData)
      console.log('✅ Migration validation passed')
    } catch (error) {
      console.error('❌ Migration validation failed:', error)
    }
    
    // Step 4: Test backup creation
    try {
      migrationUtils.createBackup(retrievedData)
      console.log('✅ Backup creation passed')
    } catch (error) {
      console.error('❌ Backup creation failed:', error)
    }
    
    // Step 5: Test rollback
    try {
      const rollbackSuccess = migrationUtils.rollbackOnError()
      console.log('✅ Rollback test passed:', rollbackSuccess)
    } catch (error) {
      console.error('❌ Rollback test failed:', error)
    }
    
    // Cleanup
    localStorage.removeItem('trackdeni-storage')
    localStorage.removeItem('trackdeni-backup')
    
    console.log('🧪 Migration flow test completed')
  },
  
  // Test logout data clearing
  testLogoutClear: async () => {
    console.log('🧪 Testing Logout Data Clearing...')
    
    // Step 1: Create test data in all storage locations
    const testData = {
      customers: [{ id: 'test', name: 'Test Customer' }],
      userTier: 'pro',
      showUpgradePrompt: true
    }
    
    // Populate localStorage
    localStorage.setItem('trackdeni-storage', JSON.stringify({ state: testData, version: 1 }))
    localStorage.setItem('trackdeni-backup', JSON.stringify({ data: testData, timestamp: new Date().toISOString() }))
    localStorage.setItem('trackdeni-lite-mode', JSON.stringify({ enabled: true }))
    localStorage.setItem('trackdeni-onboarding', JSON.stringify({ completed: true }))
    localStorage.setItem('trackdeni-tutorial', JSON.stringify({ step: 5 }))
    
    // Populate store
    const { default: useDebtStore } = await import('../store/useDebtStore.js')
    const store = useDebtStore.getState()
    store.loadCustomers([{ id: 'test', name: 'Test Customer' }])
    
    console.log('📊 Before clearing - localStorage keys:', Object.keys(localStorage))
    console.log('📊 Before clearing - store customers:', store.customers.length)
    console.log('📊 Before clearing - store userTier:', store.userTier)
    
    // Step 2: Test clearUserData
    const clearResult = await clearUserData()
    console.log('🗑️ Clear result:', clearResult)
    
    // Step 3: Verify clearing
    const afterStore = useDebtStore.getState()
    console.log('📊 After clearing - localStorage keys:', Object.keys(localStorage))
    console.log('📊 After clearing - store customers:', afterStore.customers.length)
    console.log('📊 After clearing - store userTier:', afterStore.userTier)
    
    // Step 4: Verify all data is cleared
    const allCleared = (
      afterStore.customers.length === 0 &&
      afterStore.userTier === 'free' &&
      !afterStore.showUpgradePrompt &&
      !afterStore.showProWelcome &&
      !localStorage.getItem('trackdeni-storage') &&
      !localStorage.getItem('trackdeni-backup') &&
      !localStorage.getItem('trackdeni-lite-mode') &&
      !localStorage.getItem('trackdeni-onboarding') &&
      !localStorage.getItem('trackdeni-tutorial')
    )
    
    if (allCleared) {
      console.log('✅ All user data cleared successfully - no data leakage')
    } else {
      console.error('❌ Data clearing incomplete - potential data leakage')
    }
    
    console.log('🧪 Logout clear test completed')
  },
  
  // Test data structure consistency
  testDataStructure: async () => {
    console.log('🧪 Testing Data Structure Consistency...')
    
    // Test both data formats
    const directFormat = {
      customers: [{ id: 'test', name: 'Test' }],
      userTier: 'free'
    }
    
    const zustandFormat = {
      state: {
        customers: [{ id: 'test', name: 'Test' }],
        userTier: 'free'
      },
      version: 1
    }
    
    // Test direct format
    localStorage.setItem('trackdeni-storage', JSON.stringify(directFormat))
    const directResult = await getLocalData()
    console.log('📊 Direct format result:', directResult)
    
    // Test zustand format
    localStorage.setItem('trackdeni-storage', JSON.stringify(zustandFormat))
    const zustandResult = await getLocalData()
    console.log('📊 Zustand format result:', zustandResult)
    
    // Cleanup
    localStorage.removeItem('trackdeni-storage')
    
    console.log('🧪 Data structure test completed')
  },
  
  // Test full migration flow with real storage system
  testFullMigrationFlow: async () => {
    console.log('🧪 Testing Full Migration Flow with Real Storage...')
    
    try {
      // Step 1: Create test data and save to actual storage system
      const testData = {
        customers: [
          {
            id: 'migration-test-customer',
            name: 'Migration Test Customer',
            phone: '0700123456',
            debts: [
              {
                id: 'migration-test-debt',
                amount: 1500,
                reason: 'Migration test debt',
                dateBorrowed: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                paid: false,
                payments: [
                  {
                    amount: 500,
                    date: new Date().toISOString(),
                    source: 'manual'
                  }
                ],
                createdAt: new Date().toISOString(),
              }
            ],
            createdAt: new Date().toISOString(),
          }
        ],
        userTier: 'free',
        showUpgradePrompt: false,
        showProWelcome: false
      }
      
      // Step 2: Save to actual storage system (IndexedDB/localStorage)
      const { storage } = await import('../utils/storage.js')
      await storage.setData(testData)
      console.log('✅ Test data saved to storage system')
      
      // Step 3: Check storage state
      const storageInfo = await storage.getStorageInfo()
      console.log('📊 Storage system used:', storageInfo.type)
      
      // Step 4: Test getLocalData retrieval
      const retrievedData = await getLocalData()
      console.log('📊 Retrieved data:', retrievedData)
      
      if (retrievedData && retrievedData.customers && retrievedData.customers.length > 0) {
        console.log('✅ Data retrieval successful')
        console.log('👥 Customers found:', retrievedData.customers.length)
        console.log('💰 Debts found:', retrievedData.customers[0].debts.length)
      } else {
        console.error('❌ Data retrieval failed - no customers found')
      }
      
      // Step 5: Test migration validation
      if (retrievedData) {
        try {
          migrationUtils.validateMigration(retrievedData)
          console.log('✅ Migration validation passed')
        } catch (error) {
          console.error('❌ Migration validation failed:', error)
        }
      }
      
      // Step 6: Test backup and rollback
      try {
        migrationUtils.createBackup(retrievedData)
        console.log('✅ Backup creation passed')
        
        const rollbackSuccess = migrationUtils.rollbackOnError()
        console.log('✅ Rollback test passed:', rollbackSuccess)
      } catch (error) {
        console.error('❌ Backup/rollback test failed:', error)
      }
      
      // Step 7: Cleanup
      await storage.clearData()
      localStorage.removeItem('trackdeni-backup')
      
      console.log('🧪 Full migration flow test completed')
      
    } catch (error) {
      console.error('❌ Full migration flow test failed:', error)
    }
  }
}

// Export utility functions and migration utils for testing
export { migrateLocalDataToFirestore, syncFirestoreToLocal, getLocalData, clearLocalData, clearUserData, migrationUtils, debugTools, inspectUserDocument } 