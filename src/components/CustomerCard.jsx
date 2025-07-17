import { useState, memo } from 'react'
import { getDebtStatus, getStatusColor, getStatusText, formatDateShort } from '../utils/dateUtils'
import useDebtStore from '../store/useDebtStore'
import { createPreloadableLazyComponent } from '../utils/LazyComponent'
import { useAnimationClasses } from '../utils/liteModeStyles'

// Lazy load PaymentModal since it's only needed when user clicks "Pay"
const PaymentModal = createPreloadableLazyComponent(
  () => import('./PaymentModal'),
  { inline: true, size: 'small' }
)

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  // Compare customer object by ID and key properties
  if (prevProps.customer.id !== nextProps.customer.id) return false
  if (prevProps.customer.name !== nextProps.customer.name) return false
  if (prevProps.customer.phone !== nextProps.customer.phone) return false
  
  // Compare debts array length and basic properties
  if (prevProps.customer.debts.length !== nextProps.customer.debts.length) return false
  
  // For performance, compare debts by their essential properties
  for (let i = 0; i < prevProps.customer.debts.length; i++) {
    const prevDebt = prevProps.customer.debts[i]
    const nextDebt = nextProps.customer.debts[i]
    
    if (prevDebt.id !== nextDebt.id) return false
    if (prevDebt.amount !== nextDebt.amount) return false
    if (prevDebt.paid !== nextDebt.paid) return false
    if (prevDebt.dueDate !== nextDebt.dueDate) return false
    
    // Compare payments array length (indicates payment changes)
    const prevPayments = prevDebt.payments || []
    const nextPayments = nextDebt.payments || []
    if (prevPayments.length !== nextPayments.length) return false
  }
  
  // Compare onClick function (should be stable)
  if (prevProps.onClick !== nextProps.onClick) return false
  
  // Compare tutorial object (basic comparison)
  if (prevProps.tutorial !== nextProps.tutorial) return false
  
  return true
}

const CustomerCard = memo(({ customer, onClick, tutorial }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  const { getCustomerDebtSummary } = useDebtStore()
  const summary = getCustomerDebtSummary(customer.id)
  const animationClasses = useAnimationClasses()
  
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

  // Preload PaymentModal when user hovers over Pay button
  const handlePayButtonHover = () => {
    PaymentModal.preload()
  }

  return (
    <div className={`card ${animationClasses.transition} ${animationClasses.hoverShadow} ${animationClasses.hover}`}>
      {/* Header with name and status - Clickable area */}
      <div 
        className={`flex items-start justify-between mb-3 cursor-pointer rounded-lg p-2 -m-2 hover:bg-gray-50 ${animationClasses.transition}`}
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
            onMouseEnter={handlePayButtonHover}
            data-tutorial="pay-button"
            className={`bg-success text-white py-2 px-2 rounded-lg font-medium text-xs hover:bg-success/90 ${animationClasses.transition} ${animationClasses.focus}`}
          >
            Pay
          </button>
        )}
        <button
          onClick={handleSendSMS}
          className={`bg-accent text-white py-2 px-2 rounded-lg font-medium text-xs hover:bg-accent/90 ${animationClasses.transition} ${animationClasses.focus} ${
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
          className={`bg-gray-100 text-gray-700 py-2 px-2 rounded-lg font-medium text-xs hover:bg-gray-200 ${animationClasses.transition} ${animationClasses.focus}`}
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
        tutorial={tutorial}
      />
    </div>
  )
}, arePropsEqual)

export default CustomerCard 