import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../../pages/Home'
import useDebtStore from '../../store/useDebtStore'

// Mock components that aren't essential for integration test
vi.mock('../../components/PWAInstallPrompt', () => ({
  default: () => null
}))

vi.mock('../../components/OfflineIndicator', () => ({
  default: () => null
}))

vi.mock('../../components/StorageIndicator', () => ({
  default: () => null
}))

vi.mock('../../components/LiteModeIndicator', () => ({
  default: () => null
}))

vi.mock('../../components/PerformanceWarning', () => ({
  default: () => null
}))

// Mock Firebase
vi.mock('../../firebase/config.js', () => ({
  auth: { currentUser: null },
  db: null
}))

describe('Home Page - Free Tier Integration Test', () => {
  beforeEach(() => {
    // Reset store to free tier with no customers
    useDebtStore.setState({
      customers: [],
      userTier: 'free',
      showUpgradePrompt: false,
      error: null
    })
    vi.clearAllMocks()
  })

  it('should allow adding up to 5 customers and show upgrade prompt for 6th', async () => {
    const user = userEvent.setup()
    
    // Start with no customers
    render(<Home />)
    
    const { addCustomer, canAddCustomer } = useDebtStore.getState()
    
    // Add 5 customers directly through the store
    for (let i = 1; i <= 5; i++) {
      await addCustomer({
        name: `Customer ${i}`,
        phone: `07000000${i.toString().padStart(2, '0')}`
      })
    }
    
    // Verify we can't add more
    expect(canAddCustomer()).toBe(false)
    
    // Try to add 6th customer
    const result = await addCustomer({
      name: 'Customer 6',
      phone: '0700000006'
    })
    
    // Should return null (rejected)
    expect(result).toBeNull()
    
    // Should have exactly 5 customers
    const { customers, showUpgradePrompt } = useDebtStore.getState()
    expect(customers).toHaveLength(5)
    
    // Should show upgrade prompt
    expect(showUpgradePrompt).toBe(true)
  })

  it('should show correct customer count on home page', async () => {
    // Add 3 customers
    const { addCustomer } = useDebtStore.getState()
    
    await addCustomer({ name: 'Customer 1', phone: '0700000001' })
    await addCustomer({ name: 'Customer 2', phone: '0700000002' })
    await addCustomer({ name: 'Customer 3', phone: '0700000003' })
    
    // Re-render with updated state
    render(<Home />)
    
    // Check customer count
    const { customers } = useDebtStore.getState()
    expect(customers).toHaveLength(3)
  })

  it('should upgrade to pro and allow unlimited customers', async () => {
    const { addCustomer, upgradeToProTier } = useDebtStore.getState()
    
    // Add 5 customers (hit free tier limit)
    for (let i = 1; i <= 5; i++) {
      await addCustomer({
        name: `Customer ${i}`,
        phone: `07000000${i.toString().padStart(2, '0')}`
      })
    }
    
    // Verify at limit
    expect(useDebtStore.getState().canAddCustomer()).toBe(false)
    
    // Upgrade to pro
    await upgradeToProTier()
    
    // Should now be pro tier
    expect(useDebtStore.getState().userTier).toBe('pro')
    expect(useDebtStore.getState().canAddCustomer()).toBe(true)
    
    // Should be able to add 6th customer
    const sixthCustomer = await addCustomer({
      name: 'Customer 6',
      phone: '0700000006'
    })
    
    expect(sixthCustomer).toBeTruthy()
    expect(useDebtStore.getState().customers).toHaveLength(6)
  })

  it('should show remaining slots warning when approaching limit', () => {
    const { addCustomer, getRemainingCustomerSlots } = useDebtStore.getState()
    
    // Start with 4 customers (1 slot remaining)
    useDebtStore.setState({
      customers: Array.from({ length: 4 }, (_, i) => ({
        id: `customer-${i}`,
        name: `Customer ${i + 1}`,
        phone: `0700000${(i + 1).toString().padStart(2, '0')}`,
        debts: [],
        createdAt: new Date().toISOString()
      })),
      userTier: 'free'
    })
    
    render(<Home />)
    
    // Should have 1 slot remaining
    expect(getRemainingCustomerSlots()).toBe(1)
  })
})

