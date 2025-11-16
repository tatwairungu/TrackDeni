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
    showUpgradePrompt: false,
    error: null,
    isLoading: false,
  })
}

describe('useDebtStore - Adding Data (Customers & Debts)', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('Adding Customers', () => {
    it('should create a customer with correct structure', async () => {
      const { addCustomer } = useDebtStore.getState()

      const customerId = await addCustomer({ 
        name: 'Mama Mboga', 
        phone: '0712345678' 
      })

      const { customers } = useDebtStore.getState()
      const customer = customers[0]

      // Verify customer structure
      expect(customer).toBeDefined()
      expect(customer.id).toBeTruthy()
      expect(customer.name).toBe('Mama Mboga')
      expect(customer.phone).toBe('0712345678')
      expect(customer.debts).toEqual([]) // Should start with empty debts array
      expect(customer.createdAt).toBeTruthy()
    })

    it('should generate unique IDs for each customer', async () => {
      const { addCustomer } = useDebtStore.getState()

      const id1 = await addCustomer({ name: 'Customer 1', phone: '0711111111' })
      const id2 = await addCustomer({ name: 'Customer 2', phone: '0722222222' })
      const id3 = await addCustomer({ name: 'Customer 3', phone: '0733333333' })

      // IDs should be unique
      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)

      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(3)
    })

    it('should add customer to the customers array', async () => {
      const { addCustomer } = useDebtStore.getState()

      await addCustomer({ name: 'Customer 1', phone: '0711111111' })
      
      let { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(1)

      await addCustomer({ name: 'Customer 2', phone: '0722222222' })
      
      customers = useDebtStore.getState().customers
      expect(customers).toHaveLength(2)
    })

    it('should return the customer ID on successful creation', async () => {
      const { addCustomer } = useDebtStore.getState()

      const customerId = await addCustomer({ 
        name: 'Test Customer', 
        phone: '0700000000' 
      })

      expect(customerId).toBeTruthy()
      expect(typeof customerId).toBe('string')

      const { customers } = useDebtStore.getState()
      expect(customers[0].id).toBe(customerId)
    })

    it('should handle customers with empty phone numbers', async () => {
      const { addCustomer } = useDebtStore.getState()

      const customerId = await addCustomer({ 
        name: 'No Phone Customer', 
        phone: '' 
      })

      expect(customerId).toBeTruthy()

      const { customers } = useDebtStore.getState()
      expect(customers[0].phone).toBe('')
    })

    it('should set createdAt timestamp in ISO format', async () => {
      const { addCustomer } = useDebtStore.getState()

      const beforeTime = new Date().toISOString()
      await addCustomer({ name: 'Test Customer', phone: '0700000000' })
      const afterTime = new Date().toISOString()

      const { customers } = useDebtStore.getState()
      const customer = customers[0]

      expect(customer.createdAt).toBeTruthy()
      expect(customer.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      
      // CreatedAt should be between before and after
      expect(customer.createdAt >= beforeTime).toBe(true)
      expect(customer.createdAt <= afterTime).toBe(true)
    })
  })

  describe('Adding Debts', () => {
    it('should create a debt with correct structure', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      // First create a customer
      const customerId = await addCustomer({ 
        name: 'Test Customer', 
        phone: '0700000000' 
      })

      // Then add a debt
      const debtId = await addDebt(customerId, {
        amount: 1000,
        reason: 'Groceries',
        dateBorrowed: '2024-01-15',
        dueDate: '2024-02-15'
      })

      const { customers } = useDebtStore.getState()
      const customer = customers[0]
      const debt = customer.debts[0]

      // Verify debt structure
      expect(debt).toBeDefined()
      expect(debt.id).toBeTruthy()
      expect(debt.amount).toBe(1000)
      expect(debt.reason).toBe('Groceries')
      expect(debt.dateBorrowed).toBe('2024-01-15')
      expect(debt.dueDate).toBe('2024-02-15')
      expect(debt.paid).toBe(false) // Should default to false
      expect(debt.payments).toEqual([]) // Should start with empty payments array
      expect(debt.createdAt).toBeTruthy()
    })

    it('should generate unique IDs for each debt', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test Customer', phone: '' })

      const debtId1 = await addDebt(customerId, {
        amount: 100,
        reason: 'Debt 1',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const debtId2 = await addDebt(customerId, {
        amount: 200,
        reason: 'Debt 2',
        dateBorrowed: '2024-01-02',
        dueDate: '2024-02-02'
      })

      // IDs should be unique
      expect(debtId1).not.toBe(debtId2)

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts).toHaveLength(2)
    })

    it('should add debt to the correct customer', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customer1Id = await addCustomer({ name: 'Customer 1', phone: '' })
      const customer2Id = await addCustomer({ name: 'Customer 2', phone: '' })

      // Add debt to customer 1
      await addDebt(customer1Id, {
        amount: 500,
        reason: 'Purchase',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      // Add debt to customer 2
      await addDebt(customer2Id, {
        amount: 300,
        reason: 'Service',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      
      // Customer 1 should have 1 debt
      const customer1 = customers.find(c => c.id === customer1Id)
      expect(customer1.debts).toHaveLength(1)
      expect(customer1.debts[0].amount).toBe(500)

      // Customer 2 should have 1 debt
      const customer2 = customers.find(c => c.id === customer2Id)
      expect(customer2.debts).toHaveLength(1)
      expect(customer2.debts[0].amount).toBe(300)
    })

    it('should allow multiple debts for the same customer', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test Customer', phone: '' })

      // Add 3 debts
      await addDebt(customerId, {
        amount: 100,
        reason: 'Debt 1',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      await addDebt(customerId, {
        amount: 200,
        reason: 'Debt 2',
        dateBorrowed: '2024-01-02',
        dueDate: '2024-02-02'
      })

      await addDebt(customerId, {
        amount: 300,
        reason: 'Debt 3',
        dateBorrowed: '2024-01-03',
        dueDate: '2024-02-03'
      })

      const { customers } = useDebtStore.getState()
      const customer = customers[0]

      expect(customer.debts).toHaveLength(3)
      expect(customer.debts[0].amount).toBe(100)
      expect(customer.debts[1].amount).toBe(200)
      expect(customer.debts[2].amount).toBe(300)
    })

    it('should return the debt ID on successful creation', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test Customer', phone: '' })

      const debtId = await addDebt(customerId, {
        amount: 500,
        reason: 'Test Debt',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      expect(debtId).toBeTruthy()
      expect(typeof debtId).toBe('string')

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts[0].id).toBe(debtId)
    })
  })

  describe('Monetary Amount Parsing', () => {
    it('should parse integer amounts correctly', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      await addDebt(customerId, {
        amount: 1000,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts[0].amount).toBe(1000)
    })

    it('should parse decimal amounts correctly', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      await addDebt(customerId, {
        amount: 1234.56,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts[0].amount).toBe(1234.56)
    })

    it('should round amounts to 2 decimal places', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      // Amount with more than 2 decimal places
      await addDebt(customerId, {
        amount: 99.999,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      // Should be rounded to 100.00
      expect(customers[0].debts[0].amount).toBe(100)
    })

    it('should handle floating point precision issues', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      // Classic floating point issue: 0.1 + 0.2 = 0.30000000000000004
      await addDebt(customerId, {
        amount: 0.1 + 0.2,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      // Should be exactly 0.3, not 0.30000000000000004
      expect(customers[0].debts[0].amount).toBe(0.3)
    })

    it('should handle string amounts by parsing them', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      await addDebt(customerId, {
        amount: '500.75',
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts[0].amount).toBe(500.75)
    })

    it('should handle zero amounts', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      await addDebt(customerId, {
        amount: 0,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      expect(customers[0].debts[0].amount).toBe(0)
    })
  })

  describe('Data Integrity', () => {
    it('should not mutate existing customers when adding new ones', async () => {
      const { addCustomer } = useDebtStore.getState()

      await addCustomer({ name: 'Customer 1', phone: '0711111111' })
      
      const { customers: customersAfterFirst } = useDebtStore.getState()
      const firstCustomer = customersAfterFirst[0]

      await addCustomer({ name: 'Customer 2', phone: '0722222222' })

      const { customers: customersAfterSecond } = useDebtStore.getState()
      
      // First customer should still have the same data
      expect(customersAfterSecond[0]).toEqual(firstCustomer)
      expect(customersAfterSecond).toHaveLength(2)
    })

    it('should not mutate existing debts when adding new ones', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customerId = await addCustomer({ name: 'Test', phone: '' })
      
      await addDebt(customerId, {
        amount: 100,
        reason: 'First Debt',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers: customersAfterFirst } = useDebtStore.getState()
      const firstDebt = customersAfterFirst[0].debts[0]

      await addDebt(customerId, {
        amount: 200,
        reason: 'Second Debt',
        dateBorrowed: '2024-01-02',
        dueDate: '2024-02-02'
      })

      const { customers: customersAfterSecond } = useDebtStore.getState()
      
      // First debt should still have the same data
      expect(customersAfterSecond[0].debts[0]).toEqual(firstDebt)
      expect(customersAfterSecond[0].debts).toHaveLength(2)
    })

    it('should maintain independent customer data', async () => {
      const { addCustomer, addDebt } = useDebtStore.getState()

      const customer1Id = await addCustomer({ name: 'Customer 1', phone: '' })
      const customer2Id = await addCustomer({ name: 'Customer 2', phone: '' })

      // Add debt only to customer 1
      await addDebt(customer1Id, {
        amount: 500,
        reason: 'Test',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01'
      })

      const { customers } = useDebtStore.getState()
      const customer1 = customers.find(c => c.id === customer1Id)
      const customer2 = customers.find(c => c.id === customer2Id)

      // Customer 1 should have 1 debt
      expect(customer1.debts).toHaveLength(1)
      
      // Customer 2 should still have 0 debts
      expect(customer2.debts).toHaveLength(0)
    })
  })
})

