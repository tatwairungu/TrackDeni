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
          amount: parseFloat(debtData.amount),
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
          amount: parseFloat(paymentAmount),
          date: new Date().toISOString(),
        }

        set((state) => ({
          customers: state.customers.map(customer => 
            customer.id === customerId 
              ? {
                  ...customer,
                  debts: customer.debts.map(debt => 
                    debt.id === debtId 
                      ? {
                          ...debt,
                          payments: [...debt.payments, payment],
                          paid: getTotalPaid(debt.payments.concat(payment)) >= debt.amount
                        }
                      : debt
                  )
                }
              : customer
          ),
          error: null
        }))
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
            if (!debt.paid) {
              const totalPaid = getTotalPaid(debt.payments)
              return customerTotal + (debt.amount - totalPaid)
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
        if (!customer) return { totalOwed: 0, totalPaid: 0, activeDebts: 0 }

        const summary = customer.debts.reduce((acc, debt) => {
          const totalPaid = getTotalPaid(debt.payments)
          const remaining = debt.amount - totalPaid
          
          acc.totalPaid += totalPaid
          if (!debt.paid && remaining > 0) {
            acc.totalOwed += remaining
            acc.activeDebts += 1
          }
          return acc
        }, { totalOwed: 0, totalPaid: 0, activeDebts: 0 })

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

// Helper function to calculate total payments for a debt
const getTotalPaid = (payments) => {
  return payments.reduce((total, payment) => total + payment.amount, 0)
}

export default useDebtStore 