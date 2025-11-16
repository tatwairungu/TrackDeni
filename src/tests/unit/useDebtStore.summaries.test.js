import { describe, it, expect, beforeEach, vi } from 'vitest'
import useDebtStore from '../../store/useDebtStore'

// Mock Firebase imports to prevent actual Firebase calls during tests
vi.mock('../../firebase/config.js', () => ({
  auth: { currentUser: null },
  db: null
}))

// Helper to reset store to a clean state
const resetStore = () => {
  useDebtStore.setState({
    customers: [],
    userTier: 'free',
    error: null,
    isLoading: false,
  })
}

// Helper to create a customer with debts
const createCustomerWithDebts = async (name, debts) => {
  const { addCustomer, addDebt } = useDebtStore.getState()
  
  const customerId = await addCustomer({ 
    name: name, 
    phone: '0700000000' 
  })
  
  for (const debtData of debts) {
    await addDebt(customerId, {
      amount: debtData.amount,
      reason: debtData.reason || 'Test debt',
      dateBorrowed: debtData.dateBorrowed || '2024-01-01',
      dueDate: debtData.dueDate || '2024-02-01'
    })
  }
  
  return customerId
}

describe('useDebtStore - Summary Calculations', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('getTotalOwed() - Global Totals', () => {
    it('should return 0 when no customers exist', () => {
      const { getTotalOwed } = useDebtStore.getState()
      expect(getTotalOwed()).toBe(0)
    })

    it('should return 0 when customers have no debts', async () => {
      const { addCustomer, getTotalOwed } = useDebtStore.getState()
      
      await addCustomer({ name: 'Customer 1', phone: '' })
      await addCustomer({ name: 'Customer 2', phone: '' })

      expect(getTotalOwed()).toBe(0)
    })

    it('should calculate total owed for single customer with single debt', async () => {
      await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { getTotalOwed } = useDebtStore.getState()
      expect(getTotalOwed()).toBe(1000)
    })

    it('should calculate total owed for single customer with multiple debts', async () => {
      await createCustomerWithDebts('Customer 1', [
        { amount: 500 },
        { amount: 300 },
        { amount: 200 }
      ])

      const { getTotalOwed } = useDebtStore.getState()
      expect(getTotalOwed()).toBe(1000)
    })

    it('should calculate total owed across multiple customers', async () => {
      await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 }
      ])
      
      await createCustomerWithDebts('Customer 2', [
        { amount: 300 },
        { amount: 200 }
      ])
      
      await createCustomerWithDebts('Customer 3', [
        { amount: 750 }
      ])

      const { getTotalOwed } = useDebtStore.getState()
      // 1000 + 500 + 300 + 200 + 750 = 2750
      expect(getTotalOwed()).toBe(2750)
    })

    it('should exclude paid debts from total owed', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 }
      ])

      const { customers, addPayment, getTotalOwed } = useDebtStore.getState()
      const customer = customers[0]
      const firstDebtId = customer.debts[0].id

      // Pay off the first debt completely
      await addPayment(customerId, firstDebtId, 1000)

      // Should only count the unpaid 500
      expect(getTotalOwed()).toBe(500)
    })

    it('should account for partial payments in total owed', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalOwed } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      // Make partial payment
      await addPayment(customerId, debtId, 400)

      // Should show remaining balance: 1000 - 400 = 600
      expect(getTotalOwed()).toBe(600)
    })

    it('should handle multiple partial payments correctly', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalOwed } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 300)
      await addPayment(customerId, debtId, 200)

      // Remaining: 1000 - 300 - 200 = 500
      expect(getTotalOwed()).toBe(500)
    })

    it('should not include store credit (negative amounts) in total owed', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalOwed } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      // Overpay to create store credit
      await addPayment(customerId, debtId, 1500)

      // Should be 0 (debt paid, credit not counted as owed)
      expect(getTotalOwed()).toBe(0)
    })

    it('should handle decimal amounts correctly', async () => {
      await createCustomerWithDebts('Customer 1', [
        { amount: 123.45 },
        { amount: 678.90 }
      ])

      const { getTotalOwed } = useDebtStore.getState()
      expect(getTotalOwed()).toBe(802.35)
    })
  })

  describe('getTotalPaid() - Global Totals', () => {
    it('should return 0 when no payments have been made', async () => {
      await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { getTotalPaid } = useDebtStore.getState()
      expect(getTotalPaid()).toBe(0)
    })

    it('should calculate total paid for single payment', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 500)

      expect(getTotalPaid()).toBe(500)
    })

    it('should calculate total paid across multiple payments', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 300)
      await addPayment(customerId, debtId, 200)
      await addPayment(customerId, debtId, 100)

      expect(getTotalPaid()).toBe(600)
    })

    it('should calculate total paid across multiple customers', async () => {
      const customer1Id = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])
      
      const customer2Id = await createCustomerWithDebts('Customer 2', [
        { amount: 500 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      
      const customer1 = customers.find(c => c.id === customer1Id)
      const customer2 = customers.find(c => c.id === customer2Id)

      await addPayment(customer1Id, customer1.debts[0].id, 600)
      await addPayment(customer2Id, customer2.debts[0].id, 300)

      expect(getTotalPaid()).toBe(900)
    })

    it('should include full payment amounts', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 1000)

      expect(getTotalPaid()).toBe(1000)
    })

    it('should include overpayments in total paid', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 1500)

      expect(getTotalPaid()).toBe(1500)
    })

    it('should not count auto-clearing payments in total paid', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const firstDebtId = customers[0].debts[0].id

      // Overpay first debt, which will auto-clear second debt
      await addPayment(customerId, firstDebtId, 1200)

      // Should only count the actual payment (1200), not the auto-clearing (200)
      expect(getTotalPaid()).toBe(1200)
    })

    it('should handle decimal payment amounts', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getTotalPaid } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 123.45)
      await addPayment(customerId, debtId, 678.90)

      expect(getTotalPaid()).toBe(802.35)
    })
  })

  describe('getCustomerDebtSummary() - Individual Customer', () => {
    it('should return zeros for customer with no debts', async () => {
      const { addCustomer, getCustomerDebtSummary } = useDebtStore.getState()
      
      const customerId = await addCustomer({ name: 'Test', phone: '' })
      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(0)
      expect(summary.totalPaid).toBe(0)
      expect(summary.activeDebts).toBe(0)
      expect(summary.storeCredit).toBe(0)
    })

    it('should return zeros for non-existent customer', () => {
      const { getCustomerDebtSummary } = useDebtStore.getState()
      
      const summary = getCustomerDebtSummary('non-existent-id')

      expect(summary.totalOwed).toBe(0)
      expect(summary.totalPaid).toBe(0)
      expect(summary.activeDebts).toBe(0)
      expect(summary.storeCredit).toBe(0)
    })

    it('should calculate summary for single unpaid debt', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { getCustomerDebtSummary } = useDebtStore.getState()
      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(1000)
      expect(summary.totalPaid).toBe(0)
      expect(summary.activeDebts).toBe(1)
      expect(summary.storeCredit).toBe(0)
    })

    it('should calculate summary for multiple unpaid debts', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 500 },
        { amount: 300 },
        { amount: 200 }
      ])

      const { getCustomerDebtSummary } = useDebtStore.getState()
      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(1000)
      expect(summary.totalPaid).toBe(0)
      expect(summary.activeDebts).toBe(3)
    })

    it('should calculate summary with partial payments', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 400)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(600) // Remaining
      expect(summary.totalPaid).toBe(400)
      expect(summary.activeDebts).toBe(1)
    })

    it('should exclude paid debts from active debts count', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const firstDebtId = customers[0].debts[0].id

      // Pay off first debt
      await addPayment(customerId, firstDebtId, 1000)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(500) // Only second debt
      expect(summary.activeDebts).toBe(1) // Only one active
    })

    it('should include store credit in summary', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      // Overpay to create store credit
      await addPayment(customerId, debtId, 1500)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.storeCredit).toBe(500)
      expect(summary.totalOwed).toBe(0)
    })

    it('should calculate netOwed with store credit applied', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 1000 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const firstDebtId = customers[0].debts[0].id

      // Overpay first debt by 500
      await addPayment(customerId, firstDebtId, 1500)

      const summary = getCustomerDebtSummary(customerId)

      // First debt paid (1000), second debt auto-cleared with 500 
      // Second debt remaining: 1000 - 500 = 500
      // No store credit (all overpayment went to second debt)
      expect(summary.totalOwed).toBe(500)
      expect(summary.storeCredit).toBe(0) // All overpayment went to second debt
      expect(summary.netOwed).toBe(500)
    })

    it('should ensure netOwed does not go negative', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 500 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      // Overpay significantly
      await addPayment(customerId, debtId, 2000)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.netOwed).toBe(0) // Should not be negative
      expect(summary.storeCredit).toBe(1500)
    })

    it('should not count auto-clearing payments in totalPaid', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const firstDebtId = customers[0].debts[0].id

      // Overpay first debt, which auto-clears second debt
      await addPayment(customerId, firstDebtId, 1200)

      const summary = getCustomerDebtSummary(customerId)

      // Should only count the actual customer payment (1200)
      expect(summary.totalPaid).toBe(1200)
    })

    it('should handle mixed paid and unpaid debts', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 },
        { amount: 500 },
        { amount: 300 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const customer = customers[0]
      const debt1Id = customer.debts[0].id
      const debt2Id = customer.debts[1].id

      // Pay first debt fully
      await addPayment(customerId, debt1Id, 1000)
      
      // Pay second debt partially
      await addPayment(customerId, debt2Id, 300)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(500) // 200 from debt2 + 300 from debt3
      expect(summary.totalPaid).toBe(1300)
      expect(summary.activeDebts).toBe(2) // debt2 and debt3
    })

    it('should handle decimal amounts in summary', async () => {
      const customerId = await createCustomerWithDebts('Customer 1', [
        { amount: 123.45 },
        { amount: 678.90 }
      ])

      const { customers, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
      const debtId = customers[0].debts[0].id

      await addPayment(customerId, debtId, 50.25)

      const summary = getCustomerDebtSummary(customerId)

      expect(summary.totalOwed).toBe(752.10) // (123.45 - 50.25) + 678.90
      expect(summary.totalPaid).toBe(50.25)
    })
  })

  describe('Summary Consistency', () => {
    it('getTotalOwed should equal sum of all customer summaries totalOwed', async () => {
      const customer1Id = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])
      
      const customer2Id = await createCustomerWithDebts('Customer 2', [
        { amount: 500 }
      ])
      
      const customer3Id = await createCustomerWithDebts('Customer 3', [
        { amount: 300 }
      ])

      const { getTotalOwed, getCustomerDebtSummary } = useDebtStore.getState()

      const summary1 = getCustomerDebtSummary(customer1Id)
      const summary2 = getCustomerDebtSummary(customer2Id)
      const summary3 = getCustomerDebtSummary(customer3Id)

      const sumOfCustomerOwed = summary1.totalOwed + summary2.totalOwed + summary3.totalOwed
      const globalTotalOwed = getTotalOwed()

      expect(globalTotalOwed).toBe(sumOfCustomerOwed)
    })

    it('getTotalPaid should equal sum of all customer summaries totalPaid', async () => {
      const customer1Id = await createCustomerWithDebts('Customer 1', [
        { amount: 1000 }
      ])
      
      const customer2Id = await createCustomerWithDebts('Customer 2', [
        { amount: 500 }
      ])

      const { customers, addPayment, getTotalPaid, getCustomerDebtSummary } = useDebtStore.getState()
      
      const customer1 = customers.find(c => c.id === customer1Id)
      const customer2 = customers.find(c => c.id === customer2Id)

      await addPayment(customer1Id, customer1.debts[0].id, 400)
      await addPayment(customer2Id, customer2.debts[0].id, 300)

      const summary1 = getCustomerDebtSummary(customer1Id)
      const summary2 = getCustomerDebtSummary(customer2Id)

      const sumOfCustomerPaid = summary1.totalPaid + summary2.totalPaid
      const globalTotalPaid = getTotalPaid()

      expect(globalTotalPaid).toBe(sumOfCustomerPaid)
    })
  })
})

