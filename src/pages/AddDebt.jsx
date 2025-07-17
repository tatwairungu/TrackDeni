import Header from '../components/Header'
import useDebtStore from '../store/useDebtStore'
import createLazyComponent from '../utils/LazyComponent'

// Lazy load DebtForm since it's only needed on this page
const DebtForm = createLazyComponent(
  () => import('../components/DebtForm'),
  { size: 'medium' }
)

const AddDebt = ({ customerId, onBack, onSuccess, tutorial, user, signIn, signOut }) => {
  const { customers, clearAllData } = useDebtStore()
  const handleSuccess = (newCustomerId) => {
    // Show success feedback
    const customerName = customerId ? 'existing customer' : 'new customer'
    
    // You could add a toast notification here in the future
    console.log(`Debt added successfully for ${customerName}`)
    
    if (onSuccess) {
      onSuccess(newCustomerId)
    }
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

  return (
    <div className="min-h-screen bg-bg">
      <Header 
        title="Add Debt" 
        showBack={true} 
        onBack={onBack}
        onSettings={handleSettings}
        onExportData={handleExportData}
        onClearAllData={handleClearAllData}
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
      />
      
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto p-4">
        <DebtForm
          customerId={customerId}
          onSuccess={handleSuccess}
          onCancel={onBack}
          tutorial={tutorial}
        />
      </div>
    </div>
  )
}

export default AddDebt 