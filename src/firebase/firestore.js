import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import { db } from './config'

// Helper function to calculate customer summary
const calculateCustomerSummary = (debts) => {
  const summary = debts.reduce((acc, debt) => {
    const totalPaid = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    
    if (debt.amount < 0) {
      // This is a credit entry
      acc.storeCredit += Math.abs(debt.amount)
    } else {
      // Regular debt
      const remaining = debt.amount - totalPaid
      acc.totalPaid += totalPaid
      
      if (!debt.paid && remaining > 0) {
        acc.totalOwed += remaining
        acc.activeDebts += 1
      }
    }
    return acc
  }, { totalOwed: 0, totalPaid: 0, activeDebts: 0, storeCredit: 0 })
  
  // Apply store credit to reduce total owed
  summary.netOwed = Math.max(0, summary.totalOwed - summary.storeCredit)
  
  return summary
}

// Customer Operations
export const createCustomer = async (userId, customerData) => {
  try {
    const customerRef = doc(collection(db, 'users', userId, 'customers'))
    
    const newCustomer = {
      ...customerData,
      id: customerRef.id,
      totalOwed: 0,
      totalPaid: 0,
      activeDebts: 0,
      lastPaymentDate: null,
      status: 'active',
      createdAt: serverTimestamp()
    }
    
    await setDoc(customerRef, newCustomer)
    
    // Update user's total customer count
    await updateUserTotals(userId)
    
    return { success: true, id: customerRef.id, data: newCustomer }
  } catch (error) {
    console.error('❌ Error creating customer:', error)
    return { success: false, error: error.message }
  }
}

export const updateCustomer = async (userId, customerId, updates) => {
  try {
    const customerRef = doc(db, 'users', userId, 'customers', customerId)
    await updateDoc(customerRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error updating customer:', error)
    return { success: false, error: error.message }
  }
}

export const deleteCustomer = async (userId, customerId) => {
  try {
    const batch = writeBatch(db)
    
    // Delete customer
    const customerRef = doc(db, 'users', userId, 'customers', customerId)
    batch.delete(customerRef)
    
    // Delete all debts for this customer
    const debtsQuery = query(
      collection(db, 'users', userId, 'debts'),
      where('customerId', '==', customerId)
    )
    const debtsSnapshot = await getDocs(debtsQuery)
    
    debtsSnapshot.docs.forEach(debtDoc => {
      batch.delete(debtDoc.ref)
    })
    
    await batch.commit()
    
    // Update user totals
    await updateUserTotals(userId)
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting customer:', error)
    return { success: false, error: error.message }
  }
}

export const getCustomer = async (userId, customerId) => {
  try {
    const customerDoc = await getDoc(doc(db, 'users', userId, 'customers', customerId))
    
    if (customerDoc.exists()) {
      return { success: true, data: { id: customerDoc.id, ...customerDoc.data() } }
    } else {
      return { success: false, error: 'Customer not found' }
    }
  } catch (error) {
    console.error('❌ Error getting customer:', error)
    return { success: false, error: error.message }
  }
}

// Debt Operations
export const createDebt = async (userId, debtData) => {
  try {
    const batch = writeBatch(db)
    
    // Create debt
    const debtRef = doc(collection(db, 'users', userId, 'debts'))
    const newDebt = {
      ...debtData,
      id: debtRef.id,
      status: 'unpaid',
      payments: [],
      createdAt: serverTimestamp()
    }
    
    batch.set(debtRef, newDebt)
    
    // Update customer summary
    const customerRef = doc(db, 'users', userId, 'customers', debtData.customerId)
    const customerDoc = await getDoc(customerRef)
    
    if (customerDoc.exists()) {
      const customerData = customerDoc.data()
      batch.update(customerRef, {
        totalOwed: (customerData.totalOwed || 0) + debtData.amount,
        activeDebts: (customerData.activeDebts || 0) + 1,
        updatedAt: serverTimestamp()
      })
    }
    
    await batch.commit()
    
    // Update user totals
    await updateUserTotals(userId)
    
    return { success: true, id: debtRef.id, data: newDebt }
  } catch (error) {
    console.error('❌ Error creating debt:', error)
    return { success: false, error: error.message }
  }
}

export const updateDebt = async (userId, debtId, updates) => {
  try {
    const debtRef = doc(db, 'users', userId, 'debts', debtId)
    await updateDoc(debtRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error updating debt:', error)
    return { success: false, error: error.message }
  }
}

export const addPayment = async (userId, debtId, paymentData) => {
  try {
    const batch = writeBatch(db)
    
    // Get current debt
    const debtRef = doc(db, 'users', userId, 'debts', debtId)
    const debtDoc = await getDoc(debtRef)
    
    if (!debtDoc.exists()) {
      return { success: false, error: 'Debt not found' }
    }
    
    const debt = debtDoc.data()
    const currentPayments = debt.payments || []
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0)
    const newTotalPaid = totalPaid + paymentData.amount
    
    // Update debt with new payment
    const updatedPayments = [...currentPayments, {
      ...paymentData,
      date: serverTimestamp(),
      id: `payment-${Date.now()}`
    }]
    
    const isFullyPaid = newTotalPaid >= debt.amount
    
    batch.update(debtRef, {
      payments: updatedPayments,
      status: isFullyPaid ? 'paid' : 'partial',
      paid: isFullyPaid,
      updatedAt: serverTimestamp()
    })
    
    // Update customer summary
    const customerRef = doc(db, 'users', userId, 'customers', debt.customerId)
    const customerDoc = await getDoc(customerRef)
    
    if (customerDoc.exists()) {
      const customerData = customerDoc.data()
      const updates = {
        totalPaid: (customerData.totalPaid || 0) + paymentData.amount,
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      if (isFullyPaid) {
        updates.totalOwed = Math.max(0, (customerData.totalOwed || 0) - debt.amount)
        updates.activeDebts = Math.max(0, (customerData.activeDebts || 0) - 1)
      }
      
      batch.update(customerRef, updates)
    }
    
    await batch.commit()
    
    // Update user totals
    await updateUserTotals(userId)
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error adding payment:', error)
    return { success: false, error: error.message }
  }
}

// Optimized Query Operations (from our scalable guide)
export const getDashboardData = async (userId) => {
  try {
    const [customersSnapshot, overdueDebtsSnapshot, recentPaymentsSnapshot] = await Promise.all([
      // Get customers with highest debt first
      getDocs(query(
        collection(db, 'users', userId, 'customers'),
        where('totalOwed', '>', 0),
        orderBy('totalOwed', 'desc'),
        limit(20)
      )),
      
      // Get overdue debts
      getDocs(query(
        collection(db, 'users', userId, 'debts'),
        where('status', '==', 'unpaid'),
        where('dueDate', '<', new Date()),
        orderBy('dueDate', 'asc'),
        limit(10)
      )),
      
      // Get recent payments
      getDocs(query(
        collection(db, 'users', userId, 'debts'),
        where('status', 'in', ['partial', 'paid']),
        orderBy('createdAt', 'desc'),
        limit(5)
      ))
    ])
    
    return {
      success: true,
      data: {
        customers: customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        overdueDebts: overdueDebtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        recentPayments: recentPaymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
    }
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error)
    return { success: false, error: error.message }
  }
}

export const searchCustomers = async (userId, searchTerm) => {
  try {
    // Note: For production, consider using Algolia or similar for full-text search
    const q = query(
      collection(db, 'users', userId, 'customers'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      orderBy('name'),
      limit(20)
    )
    
    const snapshot = await getDocs(q)
    return {
      success: true,
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (error) {
    console.error('❌ Error searching customers:', error)
    return { success: false, error: error.message }
  }
}

export const getCustomersPaginated = async (userId, lastDoc = null, pageSize = 20) => {
  try {
    let q = query(
      collection(db, 'users', userId, 'customers'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const snapshot = await getDocs(q)
    return {
      success: true,
      data: {
        customers: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      }
    }
  } catch (error) {
    console.error('❌ Error getting paginated customers:', error)
    return { success: false, error: error.message }
  }
}

export const getCustomerDebts = async (userId, customerId) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'debts'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return {
      success: true,
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
  } catch (error) {
    console.error('❌ Error getting customer debts:', error)
    return { success: false, error: error.message }
  }
}

// Real-time listeners
export const subscribeToCustomers = (userId, callback) => {
  const q = query(
    collection(db, 'users', userId, 'customers'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, 
    (snapshot) => {
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback({ success: true, data: customers })
    },
    (error) => {
      console.error('❌ Error in customers subscription:', error)
      callback({ success: false, error: error.message })
    }
  )
}

export const subscribeToDebts = (userId, callback) => {
  const q = query(
    collection(db, 'users', userId, 'debts'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q,
    (snapshot) => {
      const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback({ success: true, data: debts })
    },
    (error) => {
      console.error('❌ Error in debts subscription:', error)
      callback({ success: false, error: error.message })
    }
  )
}

// Helper function to update user totals (denormalized data)
const updateUserTotals = async (userId) => {
  try {
    // Get all customers and debts to calculate totals
    const [customersSnapshot, debtsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'customers')),
      getDocs(collection(db, 'users', userId, 'debts'))
    ])
    
    const customers = customersSnapshot.docs.map(doc => doc.data())
    const debts = debtsSnapshot.docs.map(doc => doc.data())
    
    const totals = {
      totalCustomers: customers.length,
      totalOwed: customers.reduce((sum, customer) => sum + (customer.totalOwed || 0), 0),
      totalPaid: customers.reduce((sum, customer) => sum + (customer.totalPaid || 0), 0),
      lastActive: serverTimestamp()
    }
    
    await updateDoc(doc(db, 'users', userId), totals)
  } catch (error) {
    console.error('❌ Error updating user totals:', error)
  }
}

// Network control
export const goOffline = () => disableNetwork(db)
export const goOnline = () => enableNetwork(db) 