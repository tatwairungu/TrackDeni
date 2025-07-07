import { useState } from 'react'
import useDebtStore from '../store/useDebtStore'
import { formatDate } from '../utils/dateUtils'

const PaymentModal = ({ customer, debt, isOpen, onClose }) => {
  const { addPayment, markDebtAsPaid } = useDebtStore()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState('partial') // partial or full
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !customer || !debt) return null

  // Calculate remaining amount
  const totalPaid = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  const remainingAmount = debt.amount - totalPaid

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (paymentType === 'full') {
        // Mark entire debt as paid
        markDebtAsPaid(customer.id, debt.id)
      } else {
        // Partial payment
        const amount = parseFloat(paymentAmount)
        
        if (!amount || amount <= 0) {
          setError('Please enter a valid payment amount')
          setIsLoading(false)
          return
        }

        if (amount > remainingAmount) {
          setError(`Payment amount cannot exceed remaining balance of KES ${remainingAmount.toLocaleString()}`)
          setIsLoading(false)
          return
        }

        addPayment(customer.id, debt.id, amount)
      }

      // Reset and close
      setPaymentAmount('')
      setPaymentType('partial')
      onClose()
    } catch (err) {
      setError('Failed to record payment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
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
          <p className="text-sm text-gray-600 mb-2">{debt.reason}</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total:</span>
              <p className="font-medium">KES {debt.amount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Paid:</span>
              <p className="font-medium text-success">KES {totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <p className="font-medium text-danger">KES {remainingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                max={remainingAmount}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={`Max: ${remainingAmount.toLocaleString()}`}
                required
              />
            </div>
          )}

          {/* Full Payment Confirmation */}
          {paymentType === 'full' && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <p className="text-success text-sm">
                This will mark the entire debt as paid in full (KES {remainingAmount.toLocaleString()}).
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
          {debt.payments && debt.payments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment History</h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {debt.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span>{formatDate(payment.date)}</span>
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
}

export default PaymentModal 