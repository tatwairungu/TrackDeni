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

// Helper to create a customer with debts for testing
const createCustomerWithDebts = async (debts) => {
  const { addCustomer, addDebt } = useDebtStore.getState()
  
  const customerId = await addCustomer({ 
    name: 'Test Customer', 
    phone: '0700000000' 
  })
  
  const debtIds = []
  for (const debtData of debts) {
    const debtId = await addDebt(customerId, {
      amount: debtData.amount,
      reason: debtData.reason || 'Test debt',
      dateBorrowed: debtData.dateBorrowed || '2024-01-01',
      dueDate: debtData.dueDate || '2024-02-01'
    })
    debtIds.push(debtId)
  }
  
  return { customerId, debtIds }
}

// Helper to get debt by ID from state
const getDebt = (customerId, debtId) => {
  const { customers } = useDebtStore.getState()
  const customer = customers.find(c => c.id === customerId)
  return customer?.debts.find(d => d.id === debtId)
}

// Helper to calculate total paid for a debt
const getTotalPaid = (payments) => {
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

describe('useDebtStore - Payment Logic', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('Partial Payments', () => {
    it('should apply partial payment to debt', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Test Debt' }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      // Pay 400 out of 1000
      await addPayment(customerId, debtId, 400)

      const debt = getDebt(customerId, debtId)
      
      expect(debt.payments).toHaveLength(1)
      expect(debt.payments[0].amount).toBe(400)
      expect(debt.paid).toBe(false) // Still not fully paid
    })

    it('should calculate remaining balance correctly after partial payment', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 400)

      const debt = getDebt(customerId, debtId)
      const totalPaid = getTotalPaid(debt.payments)
      const remaining = debt.amount - totalPaid

      expect(totalPaid).toBe(400)
      expect(remaining).toBe(600)
    })

    it('should allow multiple partial payments', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      await addPayment(customerId, debtId, 300)
      await addPayment(customerId, debtId, 200)
      await addPayment(customerId, debtId, 100)

      const debt = getDebt(customerId, debtId)
      const totalPaid = getTotalPaid(debt.payments)

      expect(debt.payments).toHaveLength(3)
      expect(totalPaid).toBe(600)
      expect(debt.paid).toBe(false)
    })

    it('should add timestamp to each payment', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      const beforeTime = new Date().toISOString()
      await addPayment(customerId, debtId, 500)
      const afterTime = new Date().toISOString()

      const debt = getDebt(customerId, debtId)
      const payment = debt.payments[0]

      expect(payment.date).toBeTruthy()
      expect(payment.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(payment.date >= beforeTime).toBe(true)
      expect(payment.date <= afterTime).toBe(true)
    })
  })

  describe('Full Payments', () => {
    it('should mark debt as paid when fully paid', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      // Pay full amount
      await addPayment(customerId, debtId, 1000)

      const debt = getDebt(customerId, debtId)
      
      expect(debt.paid).toBe(true)
      expect(getTotalPaid(debt.payments)).toBe(1000)
    })

    it('should mark debt as paid with multiple payments totaling the amount', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      await addPayment(customerId, debtId, 600)
      await addPayment(customerId, debtId, 400)

      const debt = getDebt(customerId, debtId)
      
      expect(debt.paid).toBe(true)
      expect(getTotalPaid(debt.payments)).toBe(1000)
    })

    it('should handle exact payment amount', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1234.56 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 1234.56)

      const debt = getDebt(customerId, debtId)
      
      expect(debt.paid).toBe(true)
    })
  })

  describe('Overpayment - Single Debt', () => {
    it('should create store credit when overpayment occurs on single debt', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Original Debt' }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1500 when only 1000 is owed
      await addPayment(customerId, debtId, 1500)

      const { customers } = useDebtStore.getState()
      const customer = customers.find(c => c.id === customerId)

      // Should have 2 debts now: original + credit
      expect(customer.debts).toHaveLength(2)

      // Find the credit entry (negative amount)
      const creditEntry = customer.debts.find(d => d.amount < 0)
      
      expect(creditEntry).toBeDefined()
      expect(creditEntry.amount).toBe(-500) // Negative 500
      expect(creditEntry.reason).toContain('Store Credit')
    })

    it('should mark original debt as paid after overpayment', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 1500)

      const originalDebt = getDebt(customerId, debtId)
      
      expect(originalDebt.paid).toBe(true)
      expect(getTotalPaid(originalDebt.payments)).toBe(1500)
    })

    it('should prevent negative balances on debts', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 2000)

      const debt = getDebt(customerId, debtId)
      const remaining = debt.amount - getTotalPaid(debt.payments)

      // Remaining should not go below 0 (debt is paid)
      expect(remaining).toBeLessThanOrEqual(0)
      expect(debt.paid).toBe(true)
    })
  })

  describe('Overpayment - Multiple Debts Auto-Clearing', () => {
    it('should auto-clear other outstanding debts with overpayment', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Debt 1', dueDate: '2024-02-01' },
        { amount: 500, reason: 'Debt 2', dueDate: '2024-02-15' }
      ])
      const [debt1Id, debt2Id] = debtIds

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1200 on debt 1 (overpayment of 200)
      await addPayment(customerId, debt1Id, 1200)

      const debt1 = getDebt(customerId, debt1Id)
      const debt2 = getDebt(customerId, debt2Id)

      // Debt 1 should be paid
      expect(debt1.paid).toBe(true)

      // Debt 2 should have automatic payment of 200 applied
      const autoPayment = debt2.payments.find(p => p.source === 'overpayment_auto_clear')
      expect(autoPayment).toBeDefined()
      expect(autoPayment.amount).toBe(200)

      // Debt 2 remaining should be 300 (500 - 200)
      const debt2Remaining = debt2.amount - getTotalPaid(debt2.payments)
      expect(debt2Remaining).toBe(300)
    })

    it('should fully clear second debt if overpayment is enough', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Debt 1' },
        { amount: 300, reason: 'Debt 2' }
      ])
      const [debt1Id, debt2Id] = debtIds

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1300 on debt 1 (overpayment of 300, exactly enough for debt 2)
      await addPayment(customerId, debt1Id, 1300)

      const debt1 = getDebt(customerId, debt1Id)
      const debt2 = getDebt(customerId, debt2Id)

      expect(debt1.paid).toBe(true)
      expect(debt2.paid).toBe(true)
    })

    it('should clear multiple debts with large overpayment', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Debt 1', dueDate: '2024-02-01' },
        { amount: 300, reason: 'Debt 2', dueDate: '2024-02-10' },
        { amount: 500, reason: 'Debt 3', dueDate: '2024-02-20' }
      ])
      const [debt1Id, debt2Id, debt3Id] = debtIds

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1900 on debt 1 (overpayment of 900, enough for debts 2 and 3)
      await addPayment(customerId, debt1Id, 1900)

      const debt1 = getDebt(customerId, debt1Id)
      const debt2 = getDebt(customerId, debt2Id)
      const debt3 = getDebt(customerId, debt3Id)

      expect(debt1.paid).toBe(true)
      expect(debt2.paid).toBe(true)
      expect(debt3.paid).toBe(true)
    })

    it('should create store credit after clearing all other debts', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Debt 1' },
        { amount: 300, reason: 'Debt 2' }
      ])
      const [debt1Id, debt2Id] = debtIds

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1500 on debt 1 (overpayment of 500)
      // 300 goes to debt 2, leaving 200 as store credit
      await addPayment(customerId, debt1Id, 1500)

      const { customers } = useDebtStore.getState()
      const customer = customers.find(c => c.id === customerId)

      // Should have 3 items: 2 original debts + 1 credit
      expect(customer.debts).toHaveLength(3)

      // Find the credit entry
      const creditEntry = customer.debts.find(d => d.amount < 0)
      
      expect(creditEntry).toBeDefined()
      expect(creditEntry.amount).toBe(-200)
    })

    it('should prioritize overdue debts when auto-clearing', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000, reason: 'Debt 1', dueDate: '2024-12-31' },
        { amount: 500, reason: 'Overdue Debt', dueDate: '2020-01-01' }, // Overdue
        { amount: 300, reason: 'Future Debt', dueDate: '2025-12-31' }
      ])
      const [debt1Id, debt2Id, debt3Id] = debtIds

      const { addPayment } = useDebtStore.getState()
      
      // Pay 1600 on debt 1 (overpayment of 600)
      await addPayment(customerId, debt1Id, 1600)

      const debt2 = getDebt(customerId, debt2Id) // Overdue
      const debt3 = getDebt(customerId, debt3Id) // Future

      // Overdue debt should be fully cleared (500)
      expect(debt2.paid).toBe(true)

      // Future debt should get remaining 100
      const debt3AutoPayment = debt3.payments.find(p => p.source === 'overpayment_auto_clear')
      expect(debt3AutoPayment?.amount).toBe(100)
    })
  })

  describe('Payment Amount Parsing', () => {
    it('should parse integer payment amounts', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 500)

      const debt = getDebt(customerId, debtId)
      expect(debt.payments[0].amount).toBe(500)
    })

    it('should parse decimal payment amounts', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 123.45)

      const debt = getDebt(customerId, debtId)
      expect(debt.payments[0].amount).toBe(123.45)
    })

    it('should round payment amounts to 2 decimal places', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 99.999)

      const debt = getDebt(customerId, debtId)
      expect(debt.payments[0].amount).toBe(100)
    })

    it('should handle string payment amounts', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, '250.50')

      const debt = getDebt(customerId, debtId)
      expect(debt.payments[0].amount).toBe(250.5)
    })
  })

  describe('Mark Debt as Paid', () => {
    it('should mark debt as paid manually', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { markDebtAsPaid } = useDebtStore.getState()
      await markDebtAsPaid(customerId, debtId)

      const debt = getDebt(customerId, debtId)
      expect(debt.paid).toBe(true)
    })

    it('should mark debt as paid without requiring payments', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { markDebtAsPaid } = useDebtStore.getState()
      await markDebtAsPaid(customerId, debtId)

      const debt = getDebt(customerId, debtId)
      
      expect(debt.paid).toBe(true)
      expect(debt.payments).toHaveLength(0) // No payments required
    })
  })

  describe('Edge Cases', () => {
    it('should handle payment when customer has no debts', async () => {
      const { addCustomer, addPayment } = useDebtStore.getState()
      
      const customerId = await addCustomer({ name: 'Test', phone: '' })

      // Try to pay a non-existent debt (should not crash)
      await addPayment(customerId, 'non-existent-debt-id', 100)

      // Customer should still exist
      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(1)
    })

    it('should handle payment for non-existent customer gracefully', async () => {
      const { addPayment } = useDebtStore.getState()

      // Try to pay for non-existent customer (should not crash)
      await addPayment('non-existent-customer-id', 'debt-id', 100)

      // State should be unchanged
      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(0)
    })

    it('should handle zero payment amount', async () => {
      const { customerId, debtIds } = await createCustomerWithDebts([
        { amount: 1000 }
      ])
      const debtId = debtIds[0]

      const { addPayment } = useDebtStore.getState()
      await addPayment(customerId, debtId, 0)

      const debt = getDebt(customerId, debtId)
      
      // Payment should be recorded even if amount is 0
      expect(debt.payments).toHaveLength(1)
      expect(debt.payments[0].amount).toBe(0)
    })

    it('should not affect other customers when making payment', async () => {
      const { addCustomer, addDebt, addPayment } = useDebtStore.getState()

      // Create 2 customers with debts
      const customer1Id = await addCustomer({ name: 'Customer 1', phone: '' })
      const debt1Id = await addDebt(customer1Id, {
        amount: 1000,
        reason: 'Debt 1',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const customer2Id = await addCustomer({ name: 'Customer 2', phone: '' })
      await addDebt(customer2Id, {
        amount: 500,
        reason: 'Debt 2',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      // Make payment for customer 1
      await addPayment(customer1Id, debt1Id, 400)

      const { customers } = useDebtStore.getState()
      const customer1 = customers.find(c => c.id === customer1Id)
      const customer2 = customers.find(c => c.id === customer2Id)

      // Customer 1 should have payment
      expect(customer1.debts[0].payments).toHaveLength(1)

      // Customer 2 should be unaffected
      expect(customer2.debts[0].payments).toHaveLength(0)
    })
  })
})

