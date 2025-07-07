import Header from '../components/Header'
import DebtForm from '../components/DebtForm'

const AddDebt = ({ customerId, onBack, onSuccess }) => {
  const handleSuccess = (newCustomerId) => {
    // Show success feedback
    const customerName = customerId ? 'existing customer' : 'new customer'
    
    // You could add a toast notification here in the future
    console.log(`Debt added successfully for ${customerName}`)
    
    if (onSuccess) {
      onSuccess(newCustomerId)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header 
        title="Add Debt" 
        showBack={true} 
        onBack={onBack}
      />
      
      <div className="max-w-md lg:max-w-2xl mx-auto p-4">
        <DebtForm
          customerId={customerId}
          onSuccess={handleSuccess}
          onCancel={onBack}
        />
      </div>
    </div>
  )
}

export default AddDebt 