import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const useDebtStore = create(
  persist(
    (set, get) => ({
      // Core data
      customers: [],
      
      // UI state
      isLoading: false,
      error: null,

      // Actions
      addCustomer: (customerData) => {
        const newCustomer = {
          id: uuidv4(),
          name: customerData.name,
          phone: customerData.phone,
          debts: [],
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({
          customers: [...state.customers, newCustomer],
          error: null
        }))
        
        return newCustomer.id
      },

      addDebt: (customerId, debtData) => {
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

        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === customerId 
              ? { ...customer, debts: [...customer.debts, newDebt] }
              : customer
          ),
          error: null
        }))

        return newDebt.id
      },

      addPayment: (customerId, debtId, paymentAmount) => {
        const payment = {
          amount: parseMonetaryAmount(paymentAmount),
          date: new Date().toISOString(),
        }

        set((state) => {
          const customer = state.customers.find(c => c.id === customerId)
          if (!customer) return state

          const debt = customer.debts.find(d => d.id === debtId)
          if (!debt) return state

          // Calculate remaining amount needed for this debt
          const totalPaid = getTotalPaid(debt.payments)
          const remainingOnDebt = Math.max(0, debt.amount - totalPaid)
          
          // Check if there's an overpayment
          const overpaymentAmount = Math.max(0, payment.amount - remainingOnDebt)
          
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
                remaining: Math.max(0, d.amount - getTotalPaid(d.payments))
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

              const amountToApply = Math.min(remainingOverpayment, outstandingDebt.remaining)
              remainingOverpayment -= amountToApply

              // Add automatic payment for debt clearing
              const autoPayment = {
                amount: amountToApply,
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
                amount: -remainingOverpayment, // Negative amount for credit
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
      },

      markDebtAsPaid: (customerId, debtId) => {
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
            return customerTotal + getTotalPaid(debt.payments)
          }, 0)
        }, 0)
      },

      getCustomerDebtSummary: (customerId) => {
        const state = get()
        const customer = state.customers.find(c => c.id === customerId)
        if (!customer) return { totalOwed: 0, totalPaid: 0, activeDebts: 0, storeCredit: 0 }

        const summary = customer.debts.reduce((acc, debt) => {
          const totalPaid = getTotalPaid(debt.payments)
          
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
      },

      // Utility actions
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Development helper
      clearAllData: () => set({ customers: [], error: null }),
    }),
    {
      name: 'trackdeni-storage', // localStorage key
      version: 1,
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