import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpgradePrompt from '../../components/UpgradePrompt'

// Mock the store
vi.mock('../../store/useDebtStore', () => ({
  default: () => ({
    upgradeToProTier: vi.fn()
  })
}))

// Mock localization
vi.mock('../../utils/localization', () => ({
  t: (key) => key
}))

describe('UpgradePrompt Component - Simplified Tests', () => {
  it('should not render when isOpen is false', () => {
    render(<UpgradePrompt isOpen={false} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
  })

  it('should display pricing information', () => {
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText(/KES 500/)).toBeInTheDocument()
    // Check for any occurrence of "month" in the document
    const monthElements = screen.getAllByText(/month/)
    expect(monthElements.length).toBeGreaterThan(0)
  })

  it('should display pro benefits', () => {
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Unlimited Customers')).toBeInTheDocument()
    expect(screen.getByText('Cloud Sync')).toBeInTheDocument()
  })

  it('should have "Upgrade Now" button', () => {
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
  })

  it('should have "Maybe Later" button', () => {
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Maybe Later')).toBeInTheDocument()
  })

  it('should call onClose when "Maybe Later" is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    render(<UpgradePrompt isOpen={true} onClose={mockOnClose} />)
    
    await user.click(screen.getByText('Maybe Later'))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show payment options when "Upgrade Now" is clicked', async () => {
    const user = userEvent.setup()
    render(<UpgradePrompt isOpen={true} onClose={vi.fn()} />)
    
    await user.click(screen.getByText('Upgrade Now'))
    
    expect(screen.getByText('Choose Payment Method')).toBeInTheDocument()
    expect(screen.getByText('M-Pesa')).toBeInTheDocument()
  })
})

