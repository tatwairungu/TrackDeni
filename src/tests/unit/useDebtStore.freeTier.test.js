import { describe, it, expect, beforeEach, vi } from 'vitest'
import useDebtStore from '../../store/useDebtStore'

// Mock Firebase imports to prevent actual Firebase calls during tests
vi.mock('../../firebase/config.js', () => ({
  auth: { currentUser: null },
  db: null
}))

// Helper to reset store to a clean free tier state
const resetStore = () => {
  useDebtStore.setState({
    customers: [],
    userTier: 'free',
    showUpgradePrompt: false,
    showProWelcome: false,
    error: null,
    isLoading: false,
    showSignupEncouragement: false,
    dismissedCustomerCounts: [],
    lastSignupPromptCustomerCount: 0,
  })
}

describe('useDebtStore - Free Tier Logic', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  describe('Adding Customers - Free Tier Limit', () => {
    it('should allow adding up to 5 customers on free tier', async () => {
      const { addCustomer } = useDebtStore.getState()

      // Add 5 customers
      for (let i = 1; i <= 5; i++) {
        const customerId = await addCustomer({ 
          name: `Customer ${i}`, 
          phone: `070000000${i}` 
        })
        expect(customerId).toBeTruthy() // Should return a valid ID
      }

      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(5)
    })

    it('should block adding a 6th customer on free tier', async () => {
      const { addCustomer } = useDebtStore.getState()

      // Add 5 customers first
      for (let i = 1; i <= 5; i++) {
        await addCustomer({ name: `Customer ${i}`, phone: `070000000${i}` })
      }

      // Try to add 6th customer
      const sixthCustomerId = await addCustomer({ 
        name: 'Customer 6', 
        phone: '0700000006' 
      })

      // Should return null (rejected)
      expect(sixthCustomerId).toBeNull()

      // Should still have only 5 customers
      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(5)
    })

    it('should show upgrade prompt when trying to add 6th customer', async () => {
      const { addCustomer } = useDebtStore.getState()

      // Add 5 customers
      for (let i = 1; i <= 5; i++) {
        await addCustomer({ name: `Customer ${i}`, phone: `070000000${i}` })
      }

      // Try to add 6th customer
      await addCustomer({ name: 'Customer 6', phone: '0700000006' })

      // Should show upgrade prompt
      const { showUpgradePrompt } = useDebtStore.getState()
      expect(showUpgradePrompt).toBe(true)
    })

    it('should set error message when free tier limit is reached', async () => {
      const { addCustomer } = useDebtStore.getState()

      // Add 5 customers
      for (let i = 1; i <= 5; i++) {
        await addCustomer({ name: `Customer ${i}`, phone: `070000000${i}` })
      }

      // Try to add 6th customer
      await addCustomer({ name: 'Customer 6', phone: '0700000006' })

      // Should have error message
      const { error } = useDebtStore.getState()
      expect(error).toContain('Free tier limit reached')
      expect(error).toContain('Upgrade to Pro')
    })
  })

  describe('Free Tier Helper Functions', () => {
    it('canAddCustomer() should return true when under limit', () => {
      const { addCustomer, canAddCustomer } = useDebtStore.getState()

      // Add 3 customers
      useDebtStore.setState({
        customers: [
          { id: '1', name: 'Customer 1', phone: '', debts: [], createdAt: new Date().toISOString() },
          { id: '2', name: 'Customer 2', phone: '', debts: [], createdAt: new Date().toISOString() },
          { id: '3', name: 'Customer 3', phone: '', debts: [], createdAt: new Date().toISOString() },
        ]
      })

      expect(canAddCustomer()).toBe(true)
    })

    it('canAddCustomer() should return false when at limit', () => {
      const { canAddCustomer } = useDebtStore.getState()

      // Add 5 customers
      useDebtStore.setState({
        customers: Array.from({ length: 5 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Customer ${i + 1}`,
          phone: '',
          debts: [],
          createdAt: new Date().toISOString()
        }))
      })

      expect(canAddCustomer()).toBe(false)
    })

    it('getCustomerLimit() should return 5 for free tier', () => {
      const { getCustomerLimit } = useDebtStore.getState()
      expect(getCustomerLimit()).toBe(5)
    })

    it('getRemainingCustomerSlots() should return correct count', () => {
      const { getRemainingCustomerSlots } = useDebtStore.getState()

      // With 0 customers
      expect(getRemainingCustomerSlots()).toBe(5)

      // Add 2 customers
      useDebtStore.setState({
        customers: Array.from({ length: 2 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Customer ${i + 1}`,
          phone: '',
          debts: [],
          createdAt: new Date().toISOString()
        }))
      })

      expect(getRemainingCustomerSlots()).toBe(3)

      // Add 3 more (total 5)
      useDebtStore.setState({
        customers: Array.from({ length: 5 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Customer ${i + 1}`,
          phone: '',
          debts: [],
          createdAt: new Date().toISOString()
        }))
      })

      expect(getRemainingCustomerSlots()).toBe(0)
    })

    it('isFreeTier() should return true for free tier users', () => {
      const { isFreeTier } = useDebtStore.getState()
      expect(isFreeTier()).toBe(true)
    })
  })

  describe('Upgrading to Pro Tier', () => {
    it('should upgrade to pro tier successfully', async () => {
      const { upgradeToProTier } = useDebtStore.getState()

      await upgradeToProTier()

      const { userTier, showProWelcome } = useDebtStore.getState()
      expect(userTier).toBe('pro')
      expect(showProWelcome).toBe(true)
    })

    it('should hide upgrade prompt when upgrading to pro', async () => {
      const { upgradeToProTier } = useDebtStore.getState()

      // Set upgrade prompt to true first
      useDebtStore.setState({ showUpgradePrompt: true })

      await upgradeToProTier()

      const { showUpgradePrompt } = useDebtStore.getState()
      expect(showUpgradePrompt).toBe(false)
    })

    it('should allow unlimited customers after upgrading to pro', async () => {
      const { upgradeToProTier, addCustomer } = useDebtStore.getState()

      // Add 5 customers on free tier
      for (let i = 1; i <= 5; i++) {
        await addCustomer({ name: `Customer ${i}`, phone: `070000000${i}` })
      }

      // Upgrade to pro
      await upgradeToProTier()

      // Should now be able to add more customers
      const sixthCustomerId = await addCustomer({ 
        name: 'Customer 6', 
        phone: '0700000006' 
      })
      
      expect(sixthCustomerId).toBeTruthy() // Should succeed

      const { customers } = useDebtStore.getState()
      expect(customers).toHaveLength(6)
    })

    it('canAddCustomer() should return true for pro tier regardless of count', () => {
      const { canAddCustomer } = useDebtStore.getState()

      // Set to pro tier with 10 customers
      useDebtStore.setState({
        userTier: 'pro',
        customers: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Customer ${i + 1}`,
          phone: '',
          debts: [],
          createdAt: new Date().toISOString()
        }))
      })

      expect(canAddCustomer()).toBe(true)
    })

    it('getCustomerLimit() should return null for pro tier', () => {
      const { getCustomerLimit } = useDebtStore.getState()

      useDebtStore.setState({ userTier: 'pro' })

      expect(getCustomerLimit()).toBeNull()
    })

    it('getRemainingCustomerSlots() should return null for pro tier', () => {
      const { getRemainingCustomerSlots } = useDebtStore.getState()

      useDebtStore.setState({ userTier: 'pro' })

      expect(getRemainingCustomerSlots()).toBeNull()
    })

    it('isFreeTier() should return false for pro tier users', () => {
      const { isFreeTier } = useDebtStore.getState()

      useDebtStore.setState({ userTier: 'pro' })

      expect(isFreeTier()).toBe(false)
    })
  })

  describe('Upgrade Prompt Management', () => {
    it('showUpgradeModal() should set showUpgradePrompt to true', () => {
      const { showUpgradeModal } = useDebtStore.getState()

      showUpgradeModal()

      const { showUpgradePrompt } = useDebtStore.getState()
      expect(showUpgradePrompt).toBe(true)
    })

    it('hideUpgradePrompt() should set showUpgradePrompt to false', () => {
      const { hideUpgradePrompt } = useDebtStore.getState()

      // Set to true first
      useDebtStore.setState({ showUpgradePrompt: true })

      hideUpgradePrompt()

      const { showUpgradePrompt } = useDebtStore.getState()
      expect(showUpgradePrompt).toBe(false)
    })
  })

  describe('Pro Welcome Modal Management', () => {
    it('showProWelcomeModal() should set showProWelcome to true', () => {
      const { showProWelcomeModal } = useDebtStore.getState()

      showProWelcomeModal()

      const { showProWelcome } = useDebtStore.getState()
      expect(showProWelcome).toBe(true)
    })

    it('hideProWelcomeModal() should set showProWelcome to false', () => {
      const { hideProWelcomeModal } = useDebtStore.getState()

      // Set to true first
      useDebtStore.setState({ showProWelcome: true })

      hideProWelcomeModal()

      const { showProWelcome } = useDebtStore.getState()
      expect(showProWelcome).toBe(false)
    })
  })

  describe('Development Helpers', () => {
    it('resetToFreeTier() should reset user back to free tier', () => {
      const { resetToFreeTier } = useDebtStore.getState()

      // Set to pro tier first
      useDebtStore.setState({ 
        userTier: 'pro',
        showUpgradePrompt: true,
        showProWelcome: true
      })

      resetToFreeTier()

      const { userTier, showUpgradePrompt, showProWelcome } = useDebtStore.getState()
      expect(userTier).toBe('free')
      expect(showUpgradePrompt).toBe(false)
      expect(showProWelcome).toBe(false)
    })
  })
})

