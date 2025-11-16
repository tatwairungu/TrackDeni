import { describe, it, expect, beforeEach, vi } from 'vitest'
import useDebtStore from '../../store/useDebtStore'

// Mock Firebase
vi.mock('../../firebase/config.js', () => ({
  auth: { currentUser: null },
  db: null
}))

describe('Payment Flow Integration Test', () => {
  beforeEach(() => {
    // Reset store
    useDebtStore.setState({
      customers: [],
      userTier: 'free',
      error: null
    })
    vi.clearAllMocks()
  })

  it('should handle complete payment workflow from customer creation to payment', async () => {
    const { addCustomer, addDebt, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
    
    // Step 1: Create customer
    const customerId = await addCustomer({
      name: 'Test Customer',
      phone: '0712345678'
    })
    
    expect(customerId).toBeTruthy()
    
    // Step 2: Add debt
    const debtId = await addDebt(customerId, {
      amount: 1000,
      reason: 'Groceries',
      dateBorrowed: '2024-01-01',
      dueDate: '2024-02-01'
    })
    
    expect(debtId).toBeTruthy()
    
    // Step 3: Verify initial state
    let summary = getCustomerDebtSummary(customerId)
    expect(summary.totalOwed).toBe(1000)
    expect(summary.totalPaid).toBe(0)
    expect(summary.activeDebts).toBe(1)
    
    // Step 4: Make partial payment
    await addPayment(customerId, debtId, 400)
    
    // Verify partial payment state
    summary = getCustomerDebtSummary(customerId)
    expect(summary.totalOwed).toBe(600) // 1000 - 400
    expect(summary.totalPaid).toBe(400)
    expect(summary.activeDebts).toBe(1) // Still active
    
    // Step 5: Make final payment
    await addPayment(customerId, debtId, 600)
    
    // Verify full payment state
    summary = getCustomerDebtSummary(customerId)
    expect(summary.totalOwed).toBe(0)
    expect(summary.totalPaid).toBe(1000)
    expect(summary.activeDebts).toBe(0) // Now paid
    
    // Verify debt is marked as paid
    const { customers } = useDebtStore.getState()
    const customer = customers.find(c => c.id === customerId)
    const debt = customer.debts.find(d => d.id === debtId)
    expect(debt.paid).toBe(true)
  })

  it('should handle overpayment workflow with auto-clearing', async () => {
    const { addCustomer, addDebt, addPayment, getCustomerDebtSummary } = useDebtStore.getState()
    
    // Create customer
    const customerId = await addCustomer({
      name: 'Overpayment Customer',
      phone: '0700000000'
    })
    
    // Add two debts
    const debt1Id = await addDebt(customerId, {
      amount: 1000,
      reason: 'Debt 1',
      dateBorrowed: '2024-01-01',
      dueDate: '2024-02-01'
    })
    
    const debt2Id = await addDebt(customerId, {
      amount: 500,
      reason: 'Debt 2',
      dateBorrowed: '2024-01-01',
      dueDate: '2024-02-15'
    })
    
    // Initial state: 1500 total owed
    let summary = getCustomerDebtSummary(customerId)
    expect(summary.totalOwed).toBe(1500)
    
    // Overpay first debt by 200
    await addPayment(customerId, debt1Id, 1200)
    
    // First debt should be paid
    let customer = useDebtStore.getState().customers.find(c => c.id === customerId)
    let debt1 = customer.debts.find(d => d.id === debt1Id)
    let debt2 = customer.debts.find(d => d.id === debt2Id)
    
    expect(debt1.paid).toBe(true)
    
    // Second debt should have automatic payment applied
    const autoPayment = debt2.payments.find(p => p.source === 'overpayment_auto_clear')
    expect(autoPayment).toBeDefined()
    expect(autoPayment.amount).toBe(200)
    
    // Summary should show reduced total
    summary = getCustomerDebtSummary(customerId)
    expect(summary.totalOwed).toBe(300) // 500 - 200 auto-payment
    expect(summary.totalPaid).toBe(1200) // Only actual customer payment
  })

  it('should handle multiple customers with independent payment flows', async () => {
    const { addCustomer, addDebt, addPayment, getTotalOwed, getTotalPaid } = useDebtStore.getState()
    
    // Create two customers
    const customer1Id = await addCustomer({ name: 'Customer 1', phone: '0711111111' })
    const customer2Id = await addCustomer({ name: 'Customer 2', phone: '0722222222' })
    
    // Add debts to both
    const debt1Id = await addDebt(customer1Id, {
      amount: 1000,
      reason: 'Debt 1',
      dateBorrowed: '2024-01-01',
      dueDate: '2024-02-01'
    })
    
    const debt2Id = await addDebt(customer2Id, {
      amount: 500,
      reason: 'Debt 2',
      dateBorrowed: '2024-01-01',
      dueDate: '2024-02-01'
    })
    
    // Initial total: 1500
    expect(getTotalOwed()).toBe(1500)
    expect(getTotalPaid()).toBe(0)
    
    // Customer 1 pays partially
    await addPayment(customer1Id, debt1Id, 600)
    
    // Totals should update correctly
    expect(getTotalOwed()).toBe(900) // 400 remaining from customer 1 + 500 from customer 2
    expect(getTotalPaid()).toBe(600)
    
    // Customer 2 pays fully
    await addPayment(customer2Id, debt2Id, 500)
    
    // Final totals
    expect(getTotalOwed()).toBe(400) // Only customer 1's remaining 400
    expect(getTotalPaid()).toBe(1100) // 600 + 500
  })

  it('should maintain data integrity across the complete customer lifecycle', async () => {
    const { 
      addCustomer, 
      addDebt, 
      addPayment, 
      getCustomerDebtSummary,
      getTotalOwed,
      getTotalPaid
    } = useDebtStore.getState()
    
    // Create customer
    const customerId = await addCustomer({
      name: 'Lifecycle Customer',
      phone: '0700000000'
    })
    
    // Add multiple debts
    const debts = []
    for (let i = 1; i <= 3; i++) {
      const debtId = await addDebt(customerId, {
        amount: 1000 * i, // 1000, 2000, 3000
        reason: `Debt ${i}`,
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })
      debts.push(debtId)
    }
    
    // Total owed should be 6000
    expect(getTotalOwed()).toBe(6000)
    
    // Pay first debt fully
    await addPayment(customerId, debts[0], 1000)
    
    // Pay second debt partially
    await addPayment(customerId, debts[1], 800)
    
    // Check consistency
    const summary = getCustomerDebtSummary(customerId)
    const globalOwed = getTotalOwed()
    const globalPaid = getTotalPaid()
    
    // Customer summary should match global totals (single customer)
    expect(summary.totalOwed).toBe(globalOwed) // 1200 + 3000 = 4200
    expect(summary.totalPaid).toBe(globalPaid) // 1000 + 800 = 1800
    
    // Verify calculations
    expect(globalOwed).toBe(4200) // (2000 - 800) + 3000
    expect(globalPaid).toBe(1800) // 1000 + 800
  })
})

