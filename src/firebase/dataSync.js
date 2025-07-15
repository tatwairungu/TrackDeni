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
        // Save data in the correct format with state wrapper
        localStorage.setItem('trackdeni-storage', JSON.stringify({
          state: parsedBackup.data,
          version: 1
        }))
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
      // Step 1: Validate data first
      migrationUtils.validateMigration(localData)
      
      // Step 2: Create backup
      migrationUtils.createBackup(localData)
      
      // Step 3: Use batch writes for consistency
      const batch = writeBatch(db)
      const userRef = doc(db, 'users', userId)
      
      // Step 4: Calculate user summary
      const userSummary = migrationUtils.calculateUserSummary(localData.customers)
      
      // Step 5: Migrate user data with denormalized totals
      batch.set(userRef, {
        totalCustomers: userSummary.totalCustomers,
        totalOwed: userSummary.totalOwed,
        totalPaid: userSummary.totalPaid,
        lastActive: serverTimestamp(),
        migratedAt: serverTimestamp()
      }, { merge: true })
      
      let migratedCustomers = 0
      let migratedDebts = 0
      
      // Step 6: Migrate customers and debts
      localData.customers.forEach(customer => {
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
      
      // Step 7: Commit all changes
      await batch.commit()
      
      console.log(`✅ Migration completed successfully: ${migratedCustomers} customers, ${migratedDebts} debts`)
      
      return { migratedCustomers, migratedDebts }
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      
      // Step 8: Rollback on error
      const rollbackSuccess = migrationUtils.rollbackOnError()
      
      throw new Error(`Migration failed: ${error.message}${rollbackSuccess ? ' (Data restored from backup)' : ' (Rollback also failed)'}`)
    }
  }
}

// Main migration function
const migrateLocalDataToFirestore = async (userId) => {
  try {
    console.log('🔄 Starting local data migration for user:', userId)
    
    // Get local data from storage system
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

// Manual migration function for users whose data wasn't migrated during account creation
const manualMigrateLocalDataToFirestore = async (userId) => {
  try {
    console.log('🔄 Starting manual local data migration for user:', userId)
    
    // Get local data from storage system
    const localData = await getLocalData()
    if (!localData || !localData.customers || localData.customers.length === 0) {
      console.log('📭 No local data to migrate')
      return { success: true, migratedCustomers: 0, migratedDebts: 0, message: 'No local data found to migrate' }
    }
    
    // Check if user already has data in Firestore
    const customersRef = collection(db, 'users', userId, 'customers')
    const existingCustomers = await getDocs(customersRef)
    
    if (existingCustomers.size > 0) {
      console.log('⚠️ User already has cloud data, skipping migration to avoid duplicates')
      return { 
        success: false, 
        migratedCustomers: 0, 
        migratedDebts: 0,
        message: 'User already has cloud data. Migration skipped to avoid duplicates.'
      }
    }
    
    // Use the enhanced migration utilities
    const result = await migrationUtils.migrateToFirestore(localData, userId)
    
    // Don't clear local data in manual migration - let user verify first
    console.log('✅ Manual migration completed, local data preserved for verification')
    
    return { 
      success: true, 
      migratedCustomers: result.migratedCustomers, 
      migratedDebts: result.migratedDebts,
      message: `Successfully migrated ${result.migratedCustomers} customers and ${result.migratedDebts} debts. Local data preserved for verification.`
    }
    
  } catch (error) {
    console.error('❌ Error in manual migration:', error)
    return { 
      success: false, 
      error: error.message,
      migratedCustomers: 0,
      migratedDebts: 0,
      message: `Manual migration failed: ${error.message}`
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
    // Use the same storage system as the app
    const { default: storage } = await import('../utils/storage.js')
    
    // getData() automatically ensures storage is ready
    const data = await storage.getData()
    
    if (data) {
      // The storage system returns data wrapped in state
      const actualData = data.state || data
      console.log('📊 Found local data:', { customers: actualData.customers?.length || 0 })
      return actualData
    }
    
    // Fallback to old localStorage format if needed
    const stored = localStorage.getItem('trackdeni-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      const actualData = parsed.state || parsed
      console.log('📊 Found fallback localStorage data:', { customers: actualData.customers?.length || 0 })
      return actualData
    }
    
    console.log('📊 No local data found')
    return null
  } catch (error) {
    console.error('❌ Error reading local data:', error)
    return null
  }
}

const clearLocalData = async () => {
  try {
    // Use the same storage system as the app for cleanup
    const { default: storage } = await import('../utils/storage.js')
    
    // clearData() automatically ensures storage is ready
    await storage.clearData()
    
    // Also clear old localStorage for safety
    localStorage.removeItem('trackdeni-storage')
    localStorage.removeItem('trackdeni-backup')
    
    console.log('🗑️ Local data cleared after migration')
  } catch (error) {
    console.error('❌ Error clearing local data:', error)
  }
}

// Export utility functions and migration utils for testing
export { migrateLocalDataToFirestore, manualMigrateLocalDataToFirestore, syncFirestoreToLocal, getLocalData, clearLocalData, migrationUtils } 