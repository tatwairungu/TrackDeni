import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerCard from '../../components/CustomerCard'

// Mock the store with a simple implementation
vi.mock('../../store/useDebtStore', () => ({
  default: () => ({
    getCustomerDebtSummary: () => ({
      totalOwed: 1000,
      totalPaid: 500,
      activeDebts: 2,
      storeCredit: 0,
      netOwed: 1000
    })
  })
}))

// Mock PaymentModal
vi.mock('../../components/PaymentModal', () => ({
  default: () => null
}))

// Mock date utils
vi.mock('../../utils/dateUtils', () => ({
  getDebtStatus: () => 'active',
  getStatusColor: () => 'primary',
  getStatusText: () => 'Active',
  formatDateShort: () => 'Jan 15'
}))

describe('CustomerCard Component - Simplified Tests', () => {
  const mockCustomer = {
    id: 'customer-1',
    name: 'Mama Mboga',
    phone: '0712345678',
    debts: [
      {
        id: 'debt-1',
        amount: 1000,
        reason: 'Groceries',
        dateBorrowed: '2024-01-01',
        dueDate: '2024-02-01',
        paid: false,
        payments: []
      }
    ]
  }

  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render customer name', () => {
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    expect(screen.getByText('Mama Mboga')).toBeInTheDocument()
  })

  it('should render customer phone number when provided', () => {
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    expect(screen.getByText('0712345678')).toBeInTheDocument()
  })

  it('should display debt summary information', () => {
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    // Check for labels
    expect(screen.getByText('Owed')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('should render action buttons', () => {
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    expect(screen.getByText('Pay')).toBeInTheDocument()
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('should call onClick when customer name is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    await user.click(screen.getByText('Mama Mboga'))
    
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('should display urgent debt details', () => {
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('should not render Pay button when customer has no debts', () => {
    const customerNoDebts = { ...mockCustomer, debts: [] }
    render(<CustomerCard customer={customerNoDebts} onClick={mockOnClick} />)
    
    expect(screen.queryByText('Pay')).not.toBeInTheDocument()
  })
})

