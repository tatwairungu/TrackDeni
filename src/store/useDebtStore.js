import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import storage from '../utils/storage'

// Free tier constants
const FREE_TIER_LIMIT = 5

const useDebtStore = create(
  persist(
    (set, get) => ({
      // Core data
      customers: [],
      
      // UI state
      isLoading: false,
      error: null,
      
      // Pagination state
      currentPage: 1,
      
      // Free tier state
      userTier: 'free', // 'free' or 'pro'
      showUpgradePrompt: false,
      showProWelcome: false,
      
      // Signup encouragement state
      showSignupEncouragement: false,
      dismissedCustomerCounts: [], // Track which customer counts have been dismissed
      lastSignupPromptCustomerCount: 0,

      // Actions
      addCustomer: async (customerData) => {
        const state = get()
        
        // Check free tier limit
        if (state.userTier === 'free' && state.customers.length >= FREE_TIER_LIMIT) {
          set({ 
            error: 'Free tier limit reached. Upgrade to Pro to add more customers.',
            showUpgradePrompt: true 
          })
          return null
        }
        
        const newCustomer = {
          id: uuidv4(),
          name: customerData.name,
          phone: customerData.phone,
          debts: [],
          createdAt: new Date().toISOString(),
        }
        
        // Update local state first
        set((state) => {
          const newCustomerCount = state.customers.length + 1
          
          // Check if we should show signup encouragement
          let shouldShowSignupEncouragement = false
          
          // Only show encouragement if:
          // 1. This customer count hasn't been dismissed before
          // 2. We haven't shown a prompt for this customer count already
          // 3. Customer count is 1, 2, or 3
          if (!state.dismissedCustomerCounts.includes(newCustomerCount) && 
              newCustomerCount !== state.lastSignupPromptCustomerCount &&
              (newCustomerCount === 1 || newCustomerCount === 2 || newCustomerCount === 3)) {
            shouldShowSignupEncouragement = true
          }
          
          return {
            customers: [...state.customers, newCustomer],
            showSignupEncouragement: shouldShowSignupEncouragement,
            lastSignupPromptCustomerCount: shouldShowSignupEncouragement ? newCustomerCount : state.lastSignupPromptCustomerCount,
            error: null
          }
        })
        
        // If user is authenticated, sync to Firestore
        try {
          const { auth } = await import('../firebase/config.js')
          
          if (auth.currentUser) {
            const { db } = await import('../firebase/config.js')
            const { doc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore')
            
            const userId = auth.currentUser.uid
            
            // Add customer to Firestore (only fields that pass security rules)
            const customerRef = doc(db, 'users', userId, 'customers', newCustomer.id)
            await setDoc(customerRef, {
              name: newCustomer.name,
              phone: newCustomer.phone,
              createdAt: serverTimestamp()
            })
            
            // Update user document's totalCustomers count and rate limiting
            const userRef = doc(db, 'users', userId)
            const newState = get()
            
            // Get current rate limit data to increment properly
            const { getDoc } = await import('firebase/firestore')
            const userDoc = await getDoc(userRef)
            const userData = userDoc.data()
            const rateLimits = userData.rateLimits || {}
            const customerCreateData = rateLimits.customer_create || {}
            
            // Calculate new count (increment or reset if >1 minute passed)
            const now = new Date()
            const lastReset = customerCreateData.lastReset?.toDate ? customerCreateData.lastReset.toDate() : new Date(0)
            const minutesSinceReset = (now - lastReset) / 60000
            
            const newCount = minutesSinceReset >= 1.0 ? 1 : (customerCreateData.count || 0) + 1
            
            await updateDoc(userRef, {
              totalCustomers: newState.customers.length,
              'rateLimits.customer_create': {
                lastReset: minutesSinceReset >= 1.0 ? serverTimestamp() : customerCreateData.lastReset,
                count: newCount
              }
            })
            
            console.log('✅ Customer synced to Firestore successfully')
          }
        } catch (error) {
          console.error('❌ Failed to sync customer to Firestore:', error)
          // Don't throw - local storage still works
        }
        
        return newCustomer.id
      },

      addDebt: async (customerId, debtData) => {
        const newDebt = {
          id: uuidv4(),
          amount: parseMonetaryAmount(debtData.amount),
          reason: debtData.reason,
          dateBorrowed: debtData.dateBorrowed,
          dueDate: debtData.dueDate,
          paid: false,
          payments: [],
          createdAt: new Date().toISOString(),
        }

        // Update local state first
        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === customerId 
              ? { ...customer, debts: [...customer.debts, newDebt] }
              : customer
          ),
          error: null
        }))

        // If user is authenticated, sync to Firestore
        try {
          const { auth } = await import('../firebase/config.js')
          
          if (auth.currentUser) {
            const { db } = await import('../firebase/config.js')
            const { doc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore')
            
            const userId = auth.currentUser.uid
            const state = get()
            const customer = state.customers.find(c => c.id === customerId)
            
            if (customer) {
              // Add debt to Firestore (save all fields that are expected by sync)
              const debtRef = doc(db, 'users', userId, 'debts', newDebt.id)
              await setDoc(debtRef, {
                customerId: customerId,
                customerName: customer.name,
                amount: newDebt.amount,
                reason: newDebt.reason,
                dateBorrowed: newDebt.dateBorrowed,
                dueDate: newDebt.dueDate,
                paid: newDebt.paid,
                payments: newDebt.payments,
                status: newDebt.paid ? 'paid' : 'unpaid',
                createdAt: serverTimestamp()
              })

              // Update rate limiting for debt creation
              const userRef = doc(db, 'users', userId)
              
              // Get current rate limit data to increment properly
              const { getDoc } = await import('firebase/firestore')
              const userDoc = await getDoc(userRef)
              const userData = userDoc.data()
              const rateLimits = userData.rateLimits || {}
              const debtCreateData = rateLimits.debt_create || {}
              
              // Calculate new count (increment or reset if >1 minute passed)
              const now = new Date()
              const lastReset = debtCreateData.lastReset?.toDate ? debtCreateData.lastReset.toDate() : new Date(0)
              const minutesSinceReset = (now - lastReset) / 60000
              
              const newCount = minutesSinceReset >= 1.0 ? 1 : (debtCreateData.count || 0) + 1
              
              // Calculate total debts across all customers
              const newState = get()
              const totalDebts = newState.customers.reduce((total, customer) => {
                return total + customer.debts.length
              }, 0)
              
              await updateDoc(userRef, {
                totalDebts: totalDebts,
                'rateLimits.debt_create': {
                  lastReset: minutesSinceReset >= 1.0 ? serverTimestamp() : debtCreateData.lastReset,
                  count: newCount
                }
              })
              
              console.log('✅ Debt synced to Firestore successfully')
            }
          }
        } catch (error) {
          console.error('❌ Failed to sync debt to Firestore:', error)
          // Don't throw - local storage still works
        }

        return newDebt.id
      },

      addPayment: async (customerId, debtId, paymentAmount) => {
        const payment = {
          amount: parseMonetaryAmount(paymentAmount),
          date: new Date().toISOString(),
        }

        // Update local state first
        set((state) => {
          const customer = state.customers.find(c => c.id === customerId)
          if (!customer) return state

          const debt = customer.debts.find(d => d.id === debtId)
          if (!debt) return state

          // Calculate remaining amount needed for this debt
          const totalPaid = getTotalPaid(debt.payments)
          const remainingOnDebt = parseMonetaryAmount(Math.max(0, debt.amount - totalPaid))
          
          // Check if there's an overpayment
          const overpaymentAmount = parseMonetaryAmount(Math.max(0, payment.amount - remainingOnDebt))
          
          // Update the specific debt with payment
          let updatedCustomer = {
            ...customer,
            debts: customer.debts.map(d => 
              d.id === debtId 
                ? {
                    ...d,
                    payments: [...d.payments, payment],
                    paid: getTotalPaid(d.payments.concat(payment)) >= d.amount
                  }
                : d
            )
          }

          // If there's an overpayment, use it to clear other outstanding debts
          if (overpaymentAmount > 0) {
            // Get all outstanding debts (excluding the one we just paid and credit entries)
            const outstandingDebts = updatedCustomer.debts
              .filter(d => d.id !== debtId && d.amount > 0 && !d.paid)
              .map(d => ({
                ...d,
                remaining: parseMonetaryAmount(Math.max(0, d.amount - getTotalPaid(d.payments)))
              }))
              .filter(d => d.remaining > 0)
              .sort((a, b) => {
                // Sort by due date (overdue first)
                const aOverdue = new Date(a.dueDate) < new Date()
                const bOverdue = new Date(b.dueDate) < new Date()
                if (aOverdue && !bOverdue) return -1
                if (!aOverdue && bOverdue) return 1
                return new Date(a.dueDate) - new Date(b.dueDate)
              })

            let remainingOverpayment = overpaymentAmount

            // Clear outstanding debts with the overpayment
            updatedCustomer.debts = updatedCustomer.debts.map(d => {
              if (d.id === debtId || d.amount <= 0 || d.paid) return d
              
              const outstandingDebt = outstandingDebts.find(od => od.id === d.id)
              if (!outstandingDebt || remainingOverpayment <= 0) return d

              const amountToApply = parseMonetaryAmount(Math.min(remainingOverpayment, outstandingDebt.remaining))
              remainingOverpayment = parseMonetaryAmount(remainingOverpayment - amountToApply)

              // Add automatic payment for debt clearing
              const autoPayment = {
                amount: parseMonetaryAmount(amountToApply),
                date: new Date().toISOString(),
                source: 'overpayment_auto_clear'
              }

              const newTotalPaid = getTotalPaid(d.payments.concat(autoPayment))
              
              return {
                ...d,
                payments: [...d.payments, autoPayment],
                paid: newTotalPaid >= d.amount
              }
            })

            // If there's still remaining overpayment, create a credit entry
            if (remainingOverpayment > 0) {
              const creditEntry = {
                id: uuidv4(),
                amount: -parseMonetaryAmount(remainingOverpayment), // Negative amount for credit
                reason: 'Store Credit (Overpayment)',
                dateBorrowed: new Date().toISOString(),
                dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                paid: false,
                payments: [],
                createdAt: new Date().toISOString(),
              }

              updatedCustomer.debts.push(creditEntry)
            }
          }

          return {
            ...state,
            customers: state.customers.map(c => 
              c.id === customerId ? updatedCustomer : c
            ),
            error: null
          }
        })

        // If user is authenticated, sync to Firestore
        try {
          const { auth } = await import('../firebase/config.js')
          
          if (auth.currentUser) {
            const { db } = await import('../firebase/config.js')
            const { doc, updateDoc, serverTimestamp, getDoc } = await import('firebase/firestore')
            
            const userId = auth.currentUser.uid
            
            // Get current debt from Firestore
            const debtRef = doc(db, 'users', userId, 'debts', debtId)
            const debtDoc = await getDoc(debtRef)
            
            if (debtDoc.exists()) {
              const currentDebt = debtDoc.data()
              const currentPayments = currentDebt.payments || []
              const updatedPayments = [...currentPayments, payment]
              
              // Calculate if debt is now fully paid
              const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
              const isFullyPaid = totalPaid >= currentDebt.amount
              
              // Update debt in Firestore
              await updateDoc(debtRef, {
                payments: updatedPayments,
                paid: isFullyPaid,
                status: isFullyPaid ? 'paid' : 'partial',
                updatedAt: serverTimestamp()
              })
              
              console.log('✅ Payment synced to Firestore successfully')
            }
          }
        } catch (error) {
          console.error('❌ Failed to sync payment to Firestore:', error)
          // Don't throw - local storage still works
        }
      },

      markDebtAsPaid: async (customerId, debtId) => {
        // Update local state first
        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === customerId 
              ? {
                  ...customer,
                  debts: customer.debts.map(debt => 
                    debt.id === debtId 
                      ? { ...debt, paid: true }
                      : debt
                  )
                }
              : customer
          ),
          error: null
        }))

        // If user is authenticated, sync to Firestore
        try {
          const { auth } = await import('../firebase/config.js')
          
          if (auth.currentUser) {
            const { db } = await import('../firebase/config.js')
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
            
            const userId = auth.currentUser.uid
            
            // Update debt status in Firestore
            const debtRef = doc(db, 'users', userId, 'debts', debtId)
            await updateDoc(debtRef, {
              paid: true,
              status: 'paid',
              updatedAt: serverTimestamp()
            })
            
            console.log('✅ Debt status synced to Firestore successfully')
          }
        } catch (error) {
          console.error('❌ Failed to sync debt status to Firestore:', error)
          // Don't throw - local storage still works
        }
      },

      deleteCustomer: (customerId) => {
        set((state) => ({
          customers: state.customers.filter(customer => customer.id !== customerId),
          error: null
        }))
      },

      deleteDebt: (customerId, debtId) => {
        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === customerId 
              ? {
                  ...customer,
                  debts: customer.debts.filter(debt => debt.id !== debtId)
                }
              : customer
          ),
          error: null
        }))
      },

      // Computed values
      getTotalOwed: () => {
        const state = get()
        return state.customers.reduce((total, customer) => {
          return total + customer.debts.reduce((customerTotal, debt) => {
            if (!debt.paid && debt.amount > 0) { // Only count positive debts
              const totalPaid = getTotalPaid(debt.payments)
              return customerTotal + Math.max(0, debt.amount - totalPaid)
            }
            return customerTotal
          }, 0)
        }, 0)
      },

      getTotalPaid: () => {
        const state = get()
        return state.customers.reduce((total, customer) => {
          return total + customer.debts.reduce((customerTotal, debt) => {
            // Only count actual customer payments, not auto-clearing redistributions
            const actualCustomerPayments = debt.payments
              .filter(p => p.source !== 'overpayment_auto_clear')
              .reduce((sum, p) => sum + p.amount, 0)
            return customerTotal + actualCustomerPayments
          }, 0)
        }, 0)
      },

      getCustomerDebtSummary: (customerId) => {
        const state = get()
        const customer = state.customers.find(c => c.id === customerId)
        if (!customer) return { totalOwed: 0, totalPaid: 0, activeDebts: 0, storeCredit: 0 }

        const summary = customer.debts.reduce((acc, debt) => {
          const totalPaid = getTotalPaid(debt.payments)
          // Only count actual customer payments, not auto-clearing redistributions
          const actualCustomerPayments = debt.payments
            .filter(p => p.source !== 'overpayment_auto_clear')
            .reduce((sum, p) => sum + p.amount, 0)
          
          if (debt.amount < 0) {
            // This is a credit entry
            acc.storeCredit += Math.abs(debt.amount)
          } else {
            // Regular debt
            const remaining = debt.amount - totalPaid
            acc.totalPaid += actualCustomerPayments // Only count actual payments
            
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
      },

      // Free tier management
      isFreeTier: () => {
        const state = get()
        return state.userTier === 'free'
      },

      canAddCustomer: () => {
        const state = get()
        return state.userTier === 'pro' || state.customers.length < FREE_TIER_LIMIT
      },

      getCustomerLimit: () => {
        const state = get()
        return state.userTier === 'free' ? FREE_TIER_LIMIT : null
      },

      getRemainingCustomerSlots: () => {
        const state = get()
        if (state.userTier === 'pro') return null
        return Math.max(0, FREE_TIER_LIMIT - state.customers.length)
      },

      upgradeToProTier: async () => {
        // Update local state first
        set({ 
          userTier: 'pro',
          showUpgradePrompt: false,
          showProWelcome: true,
          error: null 
        })
        
        // If user is authenticated, sync to Firestore
        try {
          const { auth } = await import('../firebase/config.js')
          
          if (auth.currentUser) {
            const { db } = await import('../firebase/config.js')
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
            
            const userId = auth.currentUser.uid
            
            // Update user document in Firestore
            const userRef = doc(db, 'users', userId)
            
            // Get current rate limit data to increment properly
            const { getDoc } = await import('firebase/firestore')
            const userDoc = await getDoc(userRef)
            const userData = userDoc.data()
            const rateLimits = userData.rateLimits || {}
            const userUpdateData = rateLimits.user_update || {}
            
            // Calculate new count (increment or reset if >1 minute passed)
            const now = new Date()
            const lastReset = userUpdateData.lastReset?.toDate ? userUpdateData.lastReset.toDate() : new Date(0)
            const minutesSinceReset = (now - lastReset) / 60000
            
            const newCount = minutesSinceReset >= 1.0 ? 1 : (userUpdateData.count || 0) + 1
            
            await updateDoc(userRef, {
              isPro: true,
              upgradedAt: serverTimestamp(),
              'rateLimits.user_update': {
                lastReset: minutesSinceReset >= 1.0 ? serverTimestamp() : userUpdateData.lastReset,
                count: newCount
              }
            })
            
            console.log('✅ Pro upgrade synced to Firestore successfully')
          }
        } catch (error) {
          console.error('❌ Failed to sync Pro upgrade to Firestore:', error)
          // Don't throw - local upgrade still works
        }
      },

      // Upgrade prompt management
      showUpgradeModal: () => set({ showUpgradePrompt: true }),
      hideUpgradePrompt: () => set({ showUpgradePrompt: false }),

      // Pro welcome modal management
      showProWelcomeModal: () => set({ showProWelcome: true }),
      hideProWelcomeModal: () => set({ showProWelcome: false }),

      // Signup encouragement management
      showSignupEncouragementModal: () => set({ showSignupEncouragement: true }),
      hideSignupEncouragement: () => {
        const state = get()
        set({ 
          showSignupEncouragement: false,
          dismissedCustomerCounts: [...state.dismissedCustomerCounts, state.customers.length]
        })
      },
      resetSignupEncouragement: () => set({ 
        showSignupEncouragement: false,
        dismissedCustomerCounts: [],
        lastSignupPromptCustomerCount: 0
      }),
      
      // Disable encouragement when user signs up
      disableSignupEncouragement: () => set({ 
        showSignupEncouragement: false,
        dismissedCustomerCounts: [1, 2, 3], // Mark all as dismissed
        lastSignupPromptCustomerCount: 0
      }),

      // Utility actions
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Development helpers
      resetToFreeTier: () => set({ 
        userTier: 'free',
        showUpgradePrompt: false,
        showProWelcome: false,
        error: null 
      }),
      clearAllData: () => set({ customers: [], error: null, userTier: 'free', showUpgradePrompt: false, showProWelcome: false, currentPage: 1 }),

      // Load customers from cloud sync
      loadCustomers: (customers) => {
        console.log('📊 Loading customers from cloud sync:', customers.length)
        set({ 
          customers: customers, 
          error: null,
          isLoading: false 
        })
      },

      // Pagination actions
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // Get items per page based on Lite Mode
      getItemsPerPage: () => {
        // Check if Lite Mode is enabled
        try {
          const liteModeState = localStorage.getItem('trackdeni-lite-mode')
          if (liteModeState) {
            const parsed = JSON.parse(liteModeState)
            if (parsed.enabled) {
              return 15 // Lite Mode: smaller page size
            }
          }
        } catch (e) {
          // If localStorage fails, use default
        }
        return 25 // Normal mode: standard page size
      },

      // Get paginated customers
      getPaginatedCustomers: (allCustomers) => {
        const state = get()
        const itemsPerPage = state.getItemsPerPage()
        const startIndex = (state.currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        
        return {
          customers: allCustomers.slice(startIndex, endIndex),
          totalPages: Math.ceil(allCustomers.length / itemsPerPage),
          currentPage: state.currentPage,
          totalCustomers: allCustomers.length,
          hasNextPage: endIndex < allCustomers.length,
          hasPrevPage: state.currentPage > 1,
          itemsPerPage
        }
      },

      // Navigation actions
      goToNextPage: () => {
        const state = get()
        const itemsPerPage = state.getItemsPerPage()
        const totalPages = Math.ceil(state.customers.length / itemsPerPage)
        
        if (state.currentPage < totalPages) {
          set({ currentPage: state.currentPage + 1 })
        }
      },

      goToPrevPage: () => {
        const state = get()
        if (state.currentPage > 1) {
          set({ currentPage: state.currentPage - 1 })
        }
      },

      // Reset pagination when filter changes
      resetPagination: () => set({ currentPage: 1 }),
    }),
    {
      name: 'trackdeni-storage',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          try {
            const data = await storage.getData()
            return data ? JSON.stringify(data) : null
          } catch (error) {
            console.warn('⚠️ Storage read failed:', error)
            return null
          }
        },
        setItem: async (name, value) => {
          try {
            const data = JSON.parse(value)
            await storage.setData(data)
          } catch (error) {
            console.warn('⚠️ Storage write failed:', error)
            throw error
          }
        },
        removeItem: async (name) => {
          try {
            await storage.clearData()
          } catch (error) {
            console.warn('⚠️ Storage clear failed:', error)
            throw error
          }
        }
      })),
      // Handle hydration for async storage
      skipHydration: false,
    }
  )
)

// Helper function to safely parse monetary amounts (fixes floating point precision)
const parseMonetaryAmount = (amount) => {
  return Math.round(parseFloat(amount) * 100) / 100
}

// Helper function to calculate total payments for a debt
const getTotalPaid = (payments) => {
  return payments.reduce((total, payment) => total + payment.amount, 0)
  }
  
export default useDebtStore 