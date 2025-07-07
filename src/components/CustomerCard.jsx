import { getDebtStatus, getStatusColor, getStatusText, formatDateShort } from '../utils/dateUtils'
import useDebtStore from '../store/useDebtStore'

const CustomerCard = ({ customer, onClick }) => {
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

  return (
    <div 
      className="card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick && onClick(customer)}
    >
      {/* Header with name and status */}
      <div className="flex items-start justify-between mb-3">
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
      <div className="flex gap-2">
        <button
          onClick={handleSendSMS}
          className="flex-1 bg-accent text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors"
        >
          Send Reminder
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Navigate to add debt for this customer
          }}
          className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Add Debt
        </button>
      </div>
    </div>
  )
}

export default CustomerCard 