import { useState } from 'react'
import Header from '../components/Header'
import PaymentModal from '../components/PaymentModal'
import ConfirmationDialog from '../components/ConfirmationDialog'
import useDebtStore from '../store/useDebtStore'
import { getDebtStatus, getStatusColor, getStatusText, formatDateShort, formatDate } from '../utils/dateUtils'

const CustomerDetail = ({ customerId, onBack, onNavigateToAddDebt, tutorial }) => {
  const { customers, getCustomerDebtSummary, clearAllData, deleteDebt } = useDebtStore()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [paymentMode, setPaymentMode] = useState('single') // single or multiple
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [debtToDelete, setDebtToDelete] = useState(null)
  
  const customer = customers.find(c => c.id === customerId)
  
  if (!customer) {
    return (
      <div className="min-h-screen bg-bg">
        <Header title="Customer Not Found" showBack={true} onBack={onBack} />
        <div className="max-w-md lg:max-w-2xl mx-auto p-4">
          <div className="card text-center">
            <p className="text-gray-600">Customer not found.</p>
            <button onClick={onBack} className="btn-primary mt-4">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const summary = getCustomerDebtSummary(customerId)
  const activeDebts = customer.debts.filter(debt => !debt.paid)
  const paidDebts = customer.debts.filter(debt => debt.paid)

  const handleSendSMS = () => {
    if (!customer.phone) {
      alert('No phone number available for this customer')
      return
    }
    
    const totalOwed = summary.totalOwed
    const message = totalOwed > 0 
      ? `Hi ${customer.name}, you have a total outstanding balance of KES ${totalOwed.toLocaleString()} across ${summary.activeDebts} debt${summary.activeDebts > 1 ? 's' : ''}. Please arrange payment. Thank you!`
      : `Hi ${customer.name}, thank you for keeping your account current!`
    
    const encodedMessage = encodeURIComponent(message)
    const smsUrl = `sms:${customer.phone}?body=${encodedMessage}`
    window.open(smsUrl)
  }

  const handlePayDebt = (debt) => {
    setSelectedDebt(debt)
    setPaymentMode('single')
    setShowPaymentModal(true)
  }

  const handlePayAll = () => {
    setSelectedDebt(null) // null means pay all
    setPaymentMode('multiple')
    setShowPaymentModal(true)
  }

  const handleDeleteDebt = (debt) => {
    setDebtToDelete(debt)
    setShowDeleteDialog(true)
  }

  const confirmDeleteDebt = () => {
    if (debtToDelete) {
      deleteDebt(customerId, debtToDelete.id)
      setShowDeleteDialog(false)
      setDebtToDelete(null)
    }
  }

  const cancelDeleteDebt = () => {
    setShowDeleteDialog(false)
    setDebtToDelete(null)
  }

  // Menu action handlers
  const handleSettings = () => {
    alert('Settings functionality coming soon!')
  }

  const handleExportData = () => {
    try {
      const data = {
        customers,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trackdeni-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export data. Please try again.')
    }
  }

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.\n\n' +
      'This will delete:\n' +
      '• All customers\n' +
      '• All debts\n' +
      '• All payment history\n\n' +
      'Consider exporting your data first.'
    )
    
    if (confirmed) {
      clearAllData()
      alert('All data has been cleared successfully.')
    }
  }

  const headerActions = [
    {
      label: 'Add Debt',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      variant: 'primary',
      onClick: () => onNavigateToAddDebt(customerId)
    }
  ]

  return (
    <div className="min-h-screen bg-bg">
      <Header 
        title={customer.name} 
        showBack={true} 
        onBack={onBack}
        actions={headerActions}
        onSettings={handleSettings}
        onExportData={handleExportData}
        onClearAllData={handleClearAllData}
      />
      
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto p-4 space-y-6">
        {/* Customer Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text">{customer.name}</h2>
              {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
              <p className="text-xs text-gray-500">
                Customer since {formatDate(customer.createdAt)}
              </p>
            </div>
            <button
              onClick={handleSendSMS}
              className="bg-accent text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              Send SMS
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-danger/10 rounded-lg">
              <p className="text-xl font-bold text-danger">
                KES {summary.totalOwed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Owed</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xl font-bold text-success">
                KES {summary.totalPaid.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Paid</p>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-xl font-bold text-primary">
                {summary.activeDebts}
              </p>
              <p className="text-xs text-gray-600">Active Debts</p>
            </div>
          </div>

          {/* Pay All Button */}
          {summary.totalOwed > 0 && (
            <button
              onClick={handlePayAll}
              className="w-full mt-4 bg-success text-white py-3 rounded-lg font-medium hover:bg-success/90 transition-colors"
            >
              Pay All Outstanding (KES {summary.totalOwed.toLocaleString()})
            </button>
          )}
        </div>

        {/* Active Debts */}
        {activeDebts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-text">Outstanding Debts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeDebts.map(debt => {
              const totalPaid = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
              const remaining = debt.amount - totalPaid
              const status = getDebtStatus(debt.dueDate, debt.paid)
              const statusColor = getStatusColor(status)

              return (
                <div key={debt.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-text">{debt.reason}</h4>
                      <p className="text-sm text-gray-600">
                        Borrowed: {formatDate(debt.dateBorrowed)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-${statusColor} shrink-0`}>
                        {getStatusText(debt.dueDate, debt.paid)}
                      </span>
                      <button
                        onClick={() => handleDeleteDebt(debt)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete debt"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="font-bold text-text">KES {debt.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Original</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-success">KES {totalPaid.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-danger">KES {remaining.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Remaining</p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {debt.payments && debt.payments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Payment History:</p>
                      <div className="space-y-1">
                        {debt.payments.slice(-2).map((payment, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <span>{formatDateShort(payment.date)}</span>
                              {payment.source === 'overpayment_auto_clear' && (
                                <span className="text-blue-600 font-medium">(Auto-cleared)</span>
                              )}
                            </div>
                            <span>KES {payment.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        {debt.payments.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{debt.payments.length - 2} more payment{debt.payments.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handlePayDebt(debt)}
                    data-tutorial="record-payment-button"
                    className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
              )
              })}
            </div>
          </div>
        )}

        {/* Paid Debts */}
        {paidDebts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600">Paid Debts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paidDebts.slice(-3).map(debt => (
              <div key={debt.id} className="card bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700">{debt.reason}</h4>
                    <p className="text-sm text-gray-600">
                      KES {debt.amount.toLocaleString()} • {formatDate(debt.dateBorrowed)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-success">Paid</span>
                    <button
                      onClick={() => handleDeleteDebt(debt)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete debt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
            {paidDebts.length > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{paidDebts.length - 3} more paid debt{paidDebts.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* No Debts State */}
        {customer.debts.length === 0 && (
          <div className="card text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">No debts recorded</h4>
            <p className="text-gray-600 mb-4">This customer hasn't borrowed anything yet.</p>
            <button
              onClick={() => onNavigateToAddDebt(customerId)}
              className="btn-primary"
            >
              Add First Debt
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        customer={customer}
        debt={selectedDebt}
        allDebts={paymentMode === 'multiple' ? activeDebts : null}
        isOpen={showPaymentModal}
        tutorial={tutorial}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedDebt(null)
          setPaymentMode('single')
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={cancelDeleteDebt}
        onConfirm={confirmDeleteDebt}
        title="Delete Debt"
        message="Are you sure you want to delete this debt? This will remove all payment history associated with it."
        details={debtToDelete ? [
          { label: "Debt", value: debtToDelete.reason },
          { label: "Amount", value: `KES ${debtToDelete.amount.toLocaleString()}` },
          { label: "Date", value: formatDate(debtToDelete.dateBorrowed) },
          ...(debtToDelete.payments && debtToDelete.payments.length > 0 ? [
            { label: "Payments", value: `KES ${debtToDelete.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} (${debtToDelete.payments.length} payment${debtToDelete.payments.length > 1 ? 's' : ''})` }
          ] : [])
        ] : []}
        confirmText="Delete Debt"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

export default CustomerDetail 