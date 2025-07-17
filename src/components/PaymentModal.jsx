import { useState, useEffect, memo } from 'react'
import useDebtStore from '../store/useDebtStore'
import { formatDate } from '../utils/dateUtils'

// Helper function to safely parse monetary amounts (fixes floating point precision)
const parseMonetaryAmount = (amount) => {
  return Math.round(parseFloat(amount) * 100) / 100
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  // Compare basic props
  if (prevProps.isOpen !== nextProps.isOpen) return false
  if (prevProps.onClose !== nextProps.onClose) return false
  if (prevProps.tutorial !== nextProps.tutorial) return false
  
  // Compare customer object
  if (prevProps.customer !== nextProps.customer) {
    if (!prevProps.customer || !nextProps.customer) return false
    if (prevProps.customer.id !== nextProps.customer.id) return false
    if (prevProps.customer.name !== nextProps.customer.name) return false
  }
  
  // Compare debt object
  if (prevProps.debt !== nextProps.debt) {
    if (!prevProps.debt || !nextProps.debt) return false
    if (prevProps.debt.id !== nextProps.debt.id) return false
    if (prevProps.debt.amount !== nextProps.debt.amount) return false
    if (prevProps.debt.paid !== nextProps.debt.paid) return false
    
    // Compare payments array length (indicates payment changes)
    const prevPayments = prevProps.debt.payments || []
    const nextPayments = nextProps.debt.payments || []
    if (prevPayments.length !== nextPayments.length) return false
  }
  
  // Compare allDebts array
  if (prevProps.allDebts !== nextProps.allDebts) {
    if (!prevProps.allDebts || !nextProps.allDebts) return false
    if (prevProps.allDebts.length !== nextProps.allDebts.length) return false
    
    // Basic comparison of debt IDs
    for (let i = 0; i < prevProps.allDebts.length; i++) {
      if (prevProps.allDebts[i].id !== nextProps.allDebts[i].id) return false
    }
  }
  
  return true
}

const PaymentModal = memo(({ customer, debt, allDebts, isOpen, onClose, tutorial }) => {
  const { addPayment, markDebtAsPaid } = useDebtStore()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState('partial') // partial or full
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle tutorial progression when modal opens
  useEffect(() => {
    if (isOpen && tutorial?.onRecordPaymentClicked) {
      console.log('PaymentModal: Advancing tutorial step')
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        tutorial.onRecordPaymentClicked()
        console.log('PaymentModal: Called onRecordPaymentClicked')
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, tutorial])

  if (!isOpen || !customer) return null

  // Determine if this is single debt or multiple debts payment
  const isMultipleMode = allDebts && allDebts.length > 0
  const targetDebts = isMultipleMode ? allDebts : [debt].filter(Boolean)
  
  if (targetDebts.length === 0) return null

  // Calculate amounts for single debt
  const singleDebtPaid = debt ? (debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0) : 0
  const singleDebtRemaining = debt ? debt.amount - singleDebtPaid : 0

  // Calculate total amounts for multiple debts
  const totalOwedAcrossDebts = targetDebts.reduce((sum, d) => {
    const paid = d.payments?.reduce((s, p) => s + p.amount, 0) || 0
    return sum + (d.amount - paid)
  }, 0)

  const remainingAmount = isMultipleMode ? totalOwedAcrossDebts : singleDebtRemaining

  // Check if customer has other outstanding debts (for overpayment info)
  const allCustomerDebts = customer.debts || []
  const otherOutstandingDebts = allCustomerDebts.filter(d => {
    if (isMultipleMode) {
      return !targetDebts.some(td => td.id === d.id) && d.amount > 0 && !d.paid
    } else {
      return d.id !== debt.id && d.amount > 0 && !d.paid
    }
  })
  const hasOtherDebts = otherOutstandingDebts.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (paymentType === 'full') {
        // Mark all target debts as paid
        for (const targetDebt of targetDebts) {
          markDebtAsPaid(customer.id, targetDebt.id)
        }
      } else {
        // Partial payment
        let amount = parseMonetaryAmount(paymentAmount)
        
        if (!amount || amount <= 0) {
          setError('Please enter a valid payment amount')
          setIsLoading(false)
          return
        }

        if (isMultipleMode) {
          // For multiple debts, pay the first one and let the store handle distribution
          // This is a simplified approach - the store will handle smart clearing
          const firstDebt = targetDebts[0]
          addPayment(customer.id, firstDebt.id, amount)
        } else {
          // Single debt payment - the store will handle overpayment and auto-clearing
          addPayment(customer.id, debt.id, amount)
        }
      }

      // Reset and close
      setPaymentAmount('')
      setPaymentType('partial')
      onClose()
      
      // Handle tutorial progression
      tutorial?.onPaymentSubmitted()
    } catch (err) {
      setError('Failed to record payment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) {
          onClose() // Close when clicking backdrop
        }
      }}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Record Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Debt Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-1">{customer.name}</h3>
          {isMultipleMode ? (
            <p className="text-sm text-gray-600 mb-2">
              {targetDebts.length} outstanding debt{targetDebts.length > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-2">{debt.reason}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{isMultipleMode ? 'Total Owed:' : 'Original:'}</span>
              <p className="font-medium">
                KES {isMultipleMode ? totalOwedAcrossDebts.toLocaleString() : debt.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Paid:</span>
              <p className="font-medium text-success">
                KES {isMultipleMode ? 
                  (targetDebts.reduce((sum, d) => sum + (d.payments?.reduce((s, p) => s + p.amount, 0) || 0), 0)).toLocaleString() :
                  singleDebtPaid.toLocaleString()
                }
              </p>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <p className="font-medium text-danger">KES {remainingAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Show debt breakdown for multiple mode */}
          {isMultipleMode && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Debt Breakdown:</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {targetDebts.map(d => {
                  const paid = d.payments?.reduce((s, p) => s + p.amount, 0) || 0
                  const remaining = d.amount - paid
                  return (
                    <div key={d.id} className="flex justify-between text-xs">
                      <span className="truncate">{d.reason}</span>
                      <span className="font-medium">KES {remaining.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Smart Payment Info */}
        {hasOtherDebts && paymentType === 'partial' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-800 text-sm font-medium">Smart Payment System</p>
                <p className="text-blue-700 text-xs">
                  If you pay more than owed, excess will automatically clear other outstanding debts first, then create store credit.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} data-tutorial="payment-modal" className="space-y-4">
          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('partial')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentType === 'partial'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Partial Payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('full')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentType === 'full'
                    ? 'bg-success text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pay in Full
              </button>
            </div>
          </div>

          {/* Payment Amount (only for partial) */}
          {paymentType === 'partial' && (
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (KES) *
              </label>
              <input
                type="number"
                id="paymentAmount"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onWheel={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onKeyDown={(e) => {
                  // Prevent arrow keys from changing the value
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
                style={{
                  MozAppearance: 'textfield' // Firefox
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={`Owed: ${remainingAmount.toLocaleString()} ${hasOtherDebts ? '(overpayment clears other debts)' : '(overpayment creates credit)'}`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 {hasOtherDebts ? 
                  'Overpayments will automatically clear other outstanding debts first' : 
                  'You can pay more than owed - excess will be stored as credit'
                }
              </p>
            </div>
          )}

          {/* Full Payment Confirmation */}
          {paymentType === 'full' && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <p className="text-success text-sm">
                {isMultipleMode ? 
                  `This will mark all ${targetDebts.length} outstanding debts as paid in full (KES ${remainingAmount.toLocaleString()}).` :
                  `This will mark the entire debt as paid in full (KES ${remainingAmount.toLocaleString()}).`
                }
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Payment History */}
          {!isMultipleMode && debt && debt.payments && debt.payments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment History</h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {debt.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <span>{formatDate(payment.date)}</span>
                      {payment.source === 'overpayment_auto_clear' && (
                        <span className="text-blue-600 font-medium">(Auto-cleared)</span>
                      )}
                    </div>
                    <span className="font-medium">KES {payment.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              data-tutorial="record-payment-button"
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                paymentType === 'full'
                  ? 'bg-success text-white hover:bg-success/90'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isLoading ? 'Recording...' : 
               paymentType === 'full' ? 'Mark as Paid' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}, arePropsEqual)

export default PaymentModal 