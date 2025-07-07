import { useState } from 'react'
import { getDebtStatus, getStatusColor, getStatusText, formatDateShort } from '../utils/dateUtils'
import useDebtStore from '../store/useDebtStore'
import PaymentModal from './PaymentModal'

const CustomerCard = ({ customer, onClick }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  const { getCustomerDebtSummary } = useDebtStore()
  const summary = getCustomerDebtSummary(customer.id)
  
  // Get the most urgent debt for status display
  const getMostUrgentDebt = () => {
    const activeDebts = customer.debts.filter(debt => !debt.paid)
    if (activeDebts.length === 0) return null
    
    return activeDebts.reduce((mostUrgent, debt) => {
      const currentStatus = getDebtStatus(debt.dueDate, debt.paid)
      const urgentStatus = mostUrgent ? getDebtStatus(mostUrgent.dueDate, mostUrgent.paid) : null
      
      // Priority: overdue > due-soon > active
      if (currentStatus === 'overdue') return debt
      if (urgentStatus !== 'overdue' && currentStatus === 'due-soon') return debt
      if (!mostUrgent) return debt
      
      return mostUrgent
    }, null)
  }

  const urgentDebt = getMostUrgentDebt()
  const status = urgentDebt ? getDebtStatus(urgentDebt.dueDate, urgentDebt.paid) : 'paid'
  const statusColor = getStatusColor(status)

  const handleSendSMS = (e) => {
    e.stopPropagation() // Prevent card click
    
    if (!customer.phone) {
      alert('No phone number available for this customer')
      return
    }
    
    const message = urgentDebt 
      ? `Hi ${customer.name}, this is a reminder about your debt of KES ${urgentDebt.amount} for ${urgentDebt.reason}. Due date: ${formatDateShort(urgentDebt.dueDate)}. Thank you!`
      : `Hi ${customer.name}, thank you for paying your debts on time!`
    
    const encodedMessage = encodeURIComponent(message)
    const smsUrl = `sms:${customer.phone}?body=${encodedMessage}`
    window.open(smsUrl)
  }

  const handleRecordPayment = (e) => {
    e.stopPropagation() // Prevent card click
    
    if (urgentDebt) {
      setSelectedDebt(urgentDebt)
      setShowPaymentModal(true)
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Header with name and status - Clickable area */}
      <div 
        className="flex items-start justify-between mb-3 cursor-pointer rounded-lg p-2 -m-2 hover:bg-gray-50 transition-colors"
        onClick={() => onClick && onClick(customer)}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-text mb-1">{customer.name}</h3>
          {customer.phone && (
            <p className="text-sm text-gray-600">{customer.phone}</p>
          )}
        </div>
        
        {/* Status badge */}
        {urgentDebt && (
          <span className={`badge-${statusColor} shrink-0`}>
            {getStatusText(urgentDebt.dueDate, urgentDebt.paid)}
          </span>
        )}
        {!urgentDebt && summary.activeDebts === 0 && (
          <span className="badge-success">All Paid</span>
        )}
      </div>

      {/* Debt summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-danger">
            KES {summary.totalOwed.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Owed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-success">
            KES {summary.totalPaid.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Paid</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-primary">
            {summary.activeDebts}
          </p>
          <p className="text-xs text-gray-600">Active</p>
        </div>
      </div>

      {/* Most urgent debt details */}
      {urgentDebt && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-gray-800">
            {urgentDebt.reason}
          </p>
          <p className="text-sm text-gray-600">
            KES {urgentDebt.amount.toLocaleString()} • Due {formatDateShort(urgentDebt.dueDate)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        {urgentDebt && (
          <button
            onClick={handleRecordPayment}
            className="bg-success text-white py-2 px-2 rounded-lg font-medium text-xs hover:bg-success/90 transition-colors"
          >
            Pay
          </button>
        )}
        <button
          onClick={handleSendSMS}
          className={`bg-accent text-white py-2 px-2 rounded-lg font-medium text-xs hover:bg-accent/90 transition-colors ${
            !urgentDebt ? 'col-span-2' : ''
          }`}
        >
          SMS
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Navigate to add debt for this customer
            if (onClick) {
              onClick(customer, 'add-debt')
            }
          }}
          className="bg-gray-100 text-gray-700 py-2 px-2 rounded-lg font-medium text-xs hover:bg-gray-200 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        customer={customer}
        debt={selectedDebt}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedDebt(null)
        }}
      />
    </div>
  )
}

export default CustomerCard 